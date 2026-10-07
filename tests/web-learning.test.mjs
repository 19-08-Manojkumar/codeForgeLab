import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { applyLearningEvent, emptyLearningState, learningKey, webEditorLimit } from "../lib/learning-state.mjs";
import { webLessons } from "../lib/web-lessons.mjs";
import { getWebPracticeEntries, getWebPracticeEntry, webPracticePaths } from "../lib/web-practice.mjs";
import { dailyPlan } from "../lib/daily-plan.mjs";
import { learningApi } from "../server/worker.mjs";

let sequence = 0;
const event = data => ({ id:`web-learning-test-${++sequence}`, day:"2026-10-07", ...data });
const topic = language => ({ language, path:"render", entryId:webLessons[language][0].id, title:webLessons[language][0].title });
const update = (state, data) => applyLearningEvent(state, event(data), "2026-10-07T12:00:00.000Z");

test("HTML and CSS sessions save their progress, bookmark, mode, and both editors independently", () => {
  let state = emptyLearningState();
  for (const language of ["html", "css"]) {
    const item = topic(language);
    const source = { html:`<h1>${language} lesson</h1>\n<p>Hello</p>`, css:"h1 { color: navy; }" };
    state = update(state, { type:"visit", visit:{ ...item, mode:"practice" } });
    state = update(state, { type:"complete", ...item });
    state = update(state, { type:"bookmark", ...item });
    state = update(state, { type:"draft", ...item, value:JSON.stringify(source) });
    assert.deepEqual(state.completed[`${language}:render`], [item.entryId]);
    assert.deepEqual(JSON.parse(state.drafts[learningKey(item)].value), source);
  }
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.lastVisited.language, "css");
  assert.equal(restored.lastVisited.mode, "practice");
  assert.equal(restored.bookmarks.length, 2);
  assert.deepEqual(restored.stats, { attempts:0, correct:0 });
  assert.deepEqual(restored.mistakes, []);
  assert.deepEqual(restored.daily, {});
});

test("render sessions accept only real lessons in their own HTML or CSS section", () => {
  for (const item of [
    { ...topic("html"), path:"basics" },
    { ...topic("css"), path:"methods" },
    { ...topic("html"), entryId:"selectors" },
    { ...topic("css"), entryId:"elements" },
    { ...topic("html"), language:"javascript" },
    { ...topic("html"), entryId:"unknown-tag-lesson" },
  ]) assert.throws(() => update(emptyLearningState(), { type:"complete", ...item }), /available learning topic/);
});

test("web sessions preserve teaching, learning, and practice modes and fall back from tests", () => {
  for (const language of ["html", "css"]) {
    for (const mode of ["teach", "learn", "practice"])
      assert.equal(update(emptyLearningState(), { type:"visit", visit:{ ...topic(language), mode } }).lastVisited.mode, mode);
    assert.equal(update(emptyLearningState(), { type:"visit", visit:{ ...topic(language), mode:"test" } }).lastVisited.mode, "teach");
  }
});

test("web drafts retain the full editor bounds and remain valid JSON when trimmed", () => {
  const item = topic("html");
  const source = { html:"\"\n\\字".repeat(3000), css:"\u0000".repeat(webEditorLimit), extra:"discard this field" };
  const state = update(emptyLearningState(), { type:"draft", ...item, value:JSON.stringify(source) });
  assert.deepEqual(JSON.parse(state.drafts[learningKey(item)].value), { html:source.html, css:source.css });
  const long = update(state, { type:"draft", ...item, value:JSON.stringify({ html:"h".repeat(webEditorLimit + 100), css:"c".repeat(webEditorLimit + 100) }) });
  const restored = JSON.parse(long.drafts[learningKey(item)].value);
  assert.equal(restored.html.length, webEditorLimit);
  assert.equal(restored.css.length, webEditorLimit);
});

test("explorer drafts keep their selected example without changing ordinary lesson drafts", () => {
  let state=emptyLearningState();
  for(const [language, entryId, explorerId] of [["html","tag-explorer","h6"],["css","style-explorer","padding"]]) {
    const item={language,path:"render",entryId,title:"Explore"}, source={html:"<p>My draft</p>",css:"p { padding: 20px; }",explorerId};
    state=update(state,{type:"draft",...item,value:JSON.stringify({...source,other:"discard"})});
    assert.deepEqual(JSON.parse(state.drafts[learningKey(item)].value),source);
    for(const invalid of [null, 1, "", "x".repeat(101), "<script>", "not/an/id"]){
      const bounded=update(state,{type:"draft",...item,value:JSON.stringify({...source,explorerId:invalid})});
      assert.deepEqual(JSON.parse(bounded.drafts[learningKey(item)].value),{html:source.html,css:source.css});
    }
    const ordinary={language,path:"render",entryId:language==="html"?"elements":"selectors"};
    state=update(state,{type:"draft",...ordinary,value:JSON.stringify(source)});
    assert.deepEqual(JSON.parse(state.drafts[learningKey(ordinary)].value),{html:source.html,css:source.css});
  }
  const restored=JSON.parse(JSON.stringify(state));
  assert.equal(JSON.parse(restored.drafts["html:render:tag-explorer"].value).explorerId,"h6");
  assert.equal(JSON.parse(restored.drafts["css:render:style-explorer"].value).explorerId,"padding");
});

test("malformed web drafts cannot replace saved editor content", () => {
  const item = topic("css"), state = update(emptyLearningState(), { type:"draft", ...item, value:JSON.stringify({ html:"<p>Hello</p>", css:"p { color: blue; }" }) });
  for (const value of [undefined, "<p>not serialized</p>", "null", "[]", JSON.stringify({ html:"hello" }), JSON.stringify({ html:1, css:"" })])
    assert.throws(() => update(state, { type:"draft", ...item, value }), /Save HTML and CSS together/);
  assert.equal(JSON.parse(state.drafts[learningKey(item)].value).html, "<p>Hello</p>");
});

test("HTML and CSS daily progress uses rendering exercises independently of programming quizzes", () => {
  for (const language of ["html", "css"]) {
    const item = topic(language);
    assert.throws(() => update(emptyLearningState(), { type:"answer", answer:{ ...item, kind:"prediction", correct:false, submittedAnswer:"blue" } }), /rendering HTML and CSS/);
    assert.throws(() => update(emptyLearningState(), { type:"quiz", ...item, score:1, total:1 }), /rendering HTML and CSS/);
    const state = update(emptyLearningState(), { type:"daily", language, date:"2026-10-07", marker:"concept" });
    assert.deepEqual(state.daily[`2026-10-07:${language}`].completed, ["concept"]);
    assert.deepEqual(state.stats, { attempts: 0, correct: 0 });
    assert.throws(() => update(state, { type:"daily", language, date:"2026-02-30", marker:"concept" }), /Invalid daily practice step/);
    const plan = dailyPlan(language, "2026-10-07");
    assert.equal(plan.web, true);
    assert.equal(new Set([...plan.predictions.map(entry => entry.id), plan.problem.id]).size, 4);
    assert.deepEqual(plan, dailyPlan(language, "2026-10-07"));
  }
});

test("all four web paths validate real topics and preserve independent source and interview answers", () => {
  let state = emptyLearningState();
  for (const language of ["html", "css"]) for (const { id: path } of webPracticePaths(language)) {
    const entries = getWebPracticeEntries(language, path);
    assert.equal(entries.length, path === "render" ? 10 : 9);
    const entry = entries[0], item = { language, path, entryId: entry.id, title: entry.title };
    state = update(state, { type:"complete", ...item });
    state = update(state, { type:"draft", ...item, value: JSON.stringify({ html: entry.html, css: entry.css, answer: "A reviewed answer" }) });
    const source = JSON.parse(state.drafts[learningKey(item)].value);
    assert.equal(source.html, entry.html);
    assert.equal(source.answer, path === "interviews" ? "A reviewed answer" : undefined);
    assert.deepEqual(state.completed[`${language}:${path}`], [entry.id]);
    assert.throws(() => update(state, { type:"complete", ...item, entryId:"missing-topic" }), /available learning topic/);
  }
  for (const language of ["html", "css"]) {
    const entry = getWebPracticeEntries(language, "basics")[0];
    assert.equal(getWebPracticeEntry(language, "basics", `daily-2026-10-07-${entry.id}`).id, entry.id);
    assert.equal(getWebPracticeEntry(language, "basics", `daily-2026-02-30-${entry.id}`), undefined);
    const item = { language, path:"basics", entryId:`daily-2026-10-07-${entry.id}` };
    state = update(state, { type:"draft", ...item, value:JSON.stringify({ html:"<p>Daily edit</p>", css:"p { color: green; }" }) });
    assert.equal(JSON.parse(state.drafts[learningKey(item)].value).html, "<p>Daily edit</p>");
  }
});

test("many Unicode browser drafts stay within the existing database state budget", () => {
  let state = emptyLearningState();
  const value = JSON.stringify({ html:"字".repeat(webEditorLimit), css:"字".repeat(webEditorLimit) });
  for (const language of ["html", "css"]) for (const lesson of webLessons[language])
    state = update(state, { type:"draft", language, path:"render", entryId:lesson.id, title:lesson.title, value });
  assert.ok(new TextEncoder().encode(JSON.stringify(state)).length <= 750000);
  assert.ok(Object.keys(state.drafts).length > 1);
  const newest = { language:"css", path:"render", entryId:webLessons.css.at(-1).id };
  assert.equal(JSON.parse(state.drafts[learningKey(newest)].value).css.length, webEditorLimit);
  const oldest = Object.keys(state.drafts)[0], [language, path, entryId] = oldest.split(":");
  state = update(state, { type:"draft", language, path, entryId, value });
  state = update(state, { type:"draft", ...topic("html"), value });
  assert.ok(state.drafts[oldest], "resaving an older draft keeps it among the newest work");
  assert.equal(Object.keys(state.drafts).at(-2), oldest);
});

function database() {
  const sql = new DatabaseSync(":memory:");
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort())
    sql.exec(readFileSync(`drizzle/${file}`, "utf8"));
  const DB = {
    prepare(query) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async first() { return sql.prepare(query).get(...values) || null; },
        execute() { return { meta:{ changes:Number(sql.prepare(query).run(...values).changes) } }; },
        async run() { return this.execute(); },
      };
    },
    async batch(statements) {
      sql.exec("BEGIN");
      try { const results = statements.map(statement => statement.execute()); sql.exec("COMMIT"); return results; }
      catch (error) { sql.exec("ROLLBACK"); throw error; }
    },
  };
  return { sql, DB };
}

test("learning API persists maximum-size escaped browser source for its own learner", async () => {
  const { sql, DB } = database();
  try {
    const item = topic("html"), source = { html:"\u0000".repeat(webEditorLimit), css:"\u0000".repeat(webEditorLimit), explorerId:"h1" };
    const draft = event({ type:"draft", ...item, value:JSON.stringify(source) });
    const request = new Request("https://methodlab.example/api/learning", { method:"POST", headers:{ "oai-authenticated-user-id":"web-learner", "Content-Type":"application/json" }, body:JSON.stringify(draft) });
    assert.equal((await learningApi(request, { DB })).status, 200);
    const restored = await (await learningApi(new Request("https://methodlab.example/api/learning", { headers:{ "oai-authenticated-user-id":"web-learner" } }), { DB })).json();
    assert.deepEqual(JSON.parse(restored.state.drafts[learningKey(item)].value), source);
    const other = await (await learningApi(new Request("https://methodlab.example/api/learning", { headers:{ "oai-authenticated-user-id":"other-learner" } }), { DB })).json();
    assert.deepEqual(other.state.drafts, {});
    const oversized = new Request("https://methodlab.example/api/learning", { method:"POST", headers:{ "oai-authenticated-user-id":"web-learner", "Content-Type":"application/json" }, body:JSON.stringify(event({ type:"welcome", padding:"x".repeat(200001) })) });
    assert.equal((await learningApi(oversized, { DB })).status, 413);
  } finally { sql.close(); }
});
