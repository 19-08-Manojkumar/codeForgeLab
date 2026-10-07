import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, readdir } from "node:fs/promises";
import worker from "../dist/server/index.js";

// Exercise the actual packaged Worker, including its embedded assets and
// injected curriculum dependencies, rather than the source-server exports.
const sql = new DatabaseSync(":memory:");
const migrationDirectory = new URL("../drizzle/", import.meta.url);
for (const name of (await readdir(migrationDirectory)).filter(name => name.endsWith(".sql")).sort()) {
  sql.exec(await readFile(new URL(name, migrationDirectory), "utf8"));
}

const DB = {
  prepare(query) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async first() { return sql.prepare(query).get(...values) || null; },
      execute() { return { meta: { changes: Number(sql.prepare(query).run(...values).changes) } }; },
      async run() { return this.execute(); },
    };
  },
  async batch(statements) {
    sql.exec("BEGIN");
    try { const results = statements.map(statement => statement.execute()); sql.exec("COMMIT"); return results; }
    catch (error) { sql.exec("ROLLBACK"); throw error; }
  },
};

const origin = "https://methodlab-worker.example";
let sequence = 0;
const event = values => ({ id: `worker-smoke-${String(++sequence).padStart(4, "0")}`, day: "2026-10-07", ...values });
const request = (pathname, { userId, update, method = update ? "POST" : "GET", headers = {} } = {}) => new Request(origin + pathname, {
  method,
  headers: { ...(userId ? { "oai-authenticated-user-id": userId } : {}), ...(update ? { "Content-Type": "application/json", Origin: origin } : {}), ...headers },
  ...(update ? { body: JSON.stringify(update) } : {}),
});
const fetchWorker = options => worker.fetch(options, { DB });
async function state(userId) {
  const response = await fetchWorker(request("/api/learning", { userId }));
  assert.equal(response.status, 200, `GET progress for ${userId}`);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  return (await response.json()).state;
}
async function post(userId, update) {
  const response = await fetchWorker(request("/api/learning", { userId, update }));
  const body = await response.json();
  assert.equal(response.status, 200, `POST ${update.type} ${update.language || update.visit?.language || ""}: ${JSON.stringify(body)}`);
  return body.state;
}

try {
  const home = await fetchWorker(request("/"));
  assert.equal(home.status, 200);
  assert.match(home.headers.get("Content-Type"), /text\/html/);
  const html = await home.text();
  assert.match(html, /HTML/);
  assert.match(html, /CSS/);
  const javascript = html.match(/src="([^" ]+\.js[^" ]*)"/)?.[1];
  const stylesheet = html.match(/href="([^" ]+\.css[^" ]*)"/)?.[1];
  assert.ok(javascript, "Packaged HTML links to a JavaScript asset");
  assert.ok(stylesheet, "Packaged HTML links to a CSS asset");
  for (const [pathname, contentType] of [[javascript, /javascript/], [stylesheet, /text\/css/]]) {
    const response = await fetchWorker(request(pathname));
    assert.equal(response.status, 200, `Embedded asset ${pathname}`);
    assert.match(response.headers.get("Content-Type"), contentType);
    assert.match(response.headers.get("Cache-Control"), /immutable/);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  const head = await fetchWorker(request("/", { method: "HEAD" }));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal((await fetchWorker(request("/missing-worker-smoke-path"))).status, 404);
  assert.equal((await fetchWorker(request("/api/missing"))).status, 404);
  assert.equal((await fetchWorker(request("/api/learning"))).status, 401);

  const learner = "worker-smoke-learner-a", otherLearner = "worker-smoke-learner-b";
  assert.deepEqual((await state(learner)).completed, {});
  const browserTopics = [
    { language: "html", path: "render", entryId: "elements", title: "Tags, text & nesting" },
    { language: "css", path: "render", entryId: "selectors", title: "Choose what to style" },
  ];
  const drafts = [
    { html: '<article><h1>Hello, browser!</h1><p><strong>I built this.</strong></p></article>', css: 'h1 { color: #166534; }\np::after { content: "</style>"; }' },
    { html: '<article><p class="note">My CSS lesson — café</p></article>', css: '.note { color: #166534; background-color: #dcfce7; }' },
  ];
  let latest;
  for (const [index, topic] of browserTopics.entries()) {
    await post(learner, event({ type: "visit", visit: { ...topic, mode: index ? "practice" : "learn" } }));
    await post(learner, event({ type: "draft", ...topic, value: JSON.stringify(drafts[index]) }));
    const bookmark = event({ type: "bookmark", ...topic, userId: otherLearner });
    await post(learner, bookmark);
    await post(learner, bookmark); // A repeated delivery must not toggle it off.
    latest = await post(learner, event({ type: "complete", ...topic }));
  }
  const restored = await state(learner);
  assert.deepEqual(restored, latest, "GET restores the committed production state");
  for (const [index, topic] of browserTopics.entries()) {
    assert.deepEqual(restored.completed[`${topic.language}:render`], [topic.entryId]);
    assert.deepEqual(JSON.parse(restored.drafts[`${topic.language}:render:${topic.entryId}`].value), drafts[index]);
    assert.ok(restored.bookmarks.some(bookmark => bookmark.language === topic.language && bookmark.entryId === topic.entryId));
  }
  assert.equal(restored.bookmarks.length, 2);
  assert.equal(restored.lastVisited.language, "css");
  assert.equal(restored.lastVisited.path, "render");
  assert.equal(restored.lastVisited.mode, "practice");
  assert.deepEqual(restored.stats, { attempts: 0, correct: 0 });
  assert.deepEqual(restored.mistakes, []);
  assert.deepEqual(restored.daily, {});

  const explorers = [
    { language: "html", path: "render", entryId: "tag-explorer", title: "Learn each HTML tag", explorerId: "h6", html: "<h6>My saved heading</h6>", css: "body { padding: 20px; }" },
    { language: "css", path: "render", entryId: "style-explorer", title: "Explore CSS styles", explorerId: "opacity", html: '<div class="demo">My saved style</div>', css: ".demo { opacity: .45; }" },
  ];
  for (const { explorerId, html: sourceHtml, css, ...topic } of explorers) {
    await post(learner, event({ type: "visit", visit: { ...topic, mode: "learn" } }));
    await post(learner, event({ type: "draft", ...topic, value: JSON.stringify({ html: sourceHtml, css, explorerId }) }));
  }
  const explorerState = await state(learner);
  for (const { explorerId, html: sourceHtml, css, ...topic } of explorers) {
    assert.deepEqual(JSON.parse(explorerState.drafts[`${topic.language}:render:${topic.entryId}`].value), { html: sourceHtml, css, explorerId }, "Packaged Worker restores the selected explorer example and source");
  }
  assert.deepEqual(explorerState.completed, restored.completed, "Selecting an example does not complete a lesson");

  for (const language of ["html", "css"]) {
    const entryId = language === "html" ? "elements" : "selectors";
    for (const path of ["basics", "interviews", "problems"]) {
      const topic = { language, path, entryId, title: "Browser practice" }, source = { html: "<p>Saved browser work</p>", css: "p { color: navy; }", ...(path === "interviews" ? { answer: "My explanation and example" } : {}) };
      await post(learner, event({ type:"draft", ...topic, value:JSON.stringify(source) }));
      await post(learner, event({ type:"complete", ...topic }));
      assert.deepEqual(JSON.parse((await state(learner)).drafts[`${language}:${path}:${entryId}`].value), source);
    }
    for (const marker of ["concept", "prediction-0", "prediction-1", "prediction-2", "problem"]) await post(learner, event({ type:"daily", language, date:"2026-10-07", marker }));
    assert.equal((await state(learner)).daily[`2026-10-07:${language}`].completed.length, 5);
  }

  const javascriptTopic = { language: "javascript", path: "methods", entryId: "filter", title: "filter()" };
  await post(learner, event({ type: "visit", visit: { ...javascriptTopic, mode: "test", config: { input: "[2, 6]", parameter: "4" } } }));
  await post(learner, event({ type: "draft", ...javascriptTopic, config: { input: "[2, 6]" } }));
  await post(learner, event({ type: "complete", ...javascriptTopic }));
  await post(learner, event({ type: "answer", answer: { ...javascriptTopic, kind: "quiz", prompt: "Predict the result", code: "[2, 6].filter(n => n > 4)", expectedAnswer: "[6]", submittedAnswer: "[6]", explanation: "Only 6 passes.", correct: true } }));
  await post(learner, event({ type: "daily", language: "javascript", date: "2026-10-07", marker: "concept" }));
  const withJavascript = await state(learner);
  assert.deepEqual(withJavascript.completed["javascript:methods"], ["filter"]);
  assert.deepEqual(withJavascript.stats, { attempts: 1, correct: 1 });
  assert.equal(withJavascript.lastVisited.mode, "test");
  assert.equal(withJavascript.drafts["javascript:methods:filter"].config.input, "[2, 6]");
  assert.deepEqual(withJavascript.daily["2026-10-07:javascript"].completed, ["concept"]);
  assert.deepEqual(withJavascript.completed["html:render"], ["elements"]);
  assert.deepEqual(withJavascript.completed["css:render"], ["selectors"]);

  assert.deepEqual((await state(otherLearner)).completed, {}, "Client userId cannot write another dispatched account");
  assert.deepEqual((await state(otherLearner)).drafts, {});
  await post(otherLearner, event({ type: "complete", ...browserTopics[0] }));
  const other = await state(otherLearner);
  assert.deepEqual(other.completed, { "html:render": ["elements"] });
  assert.deepEqual(other.bookmarks, []);
  assert.deepEqual(await state(learner), withJavascript, "A second account cannot change the first account's progress");
  assert.equal((await fetchWorker(request("/api/learning", { userId: learner, update: event({ type: "welcome" }), headers: { Origin: "https://other.example" } }))).status, 403);
  assert.equal((await fetchWorker(request("/api/learning", { userId: learner, update: event({ type: "complete", language: "html", path: "render", entryId: "missing-lesson" }) }))).status, 400);
  console.log(JSON.stringify({ passed: true, checks: ["built Worker default fetch", "embedded HTML/JS/CSS assets and HEAD/404", "HTML and CSS visits, drafts, bookmarks and completion", "selected explorer examples and source survive production serialization", "duplicate delivery is idempotent", "original JavaScript quiz and daily progress", "dispatched account isolation", "origin and curriculum validation"] }));
} finally { sql.close(); }
