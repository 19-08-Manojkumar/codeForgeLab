import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { buildDesignPreview, gradeDesignChecks } from "../lib/web-design-preview.mjs";

test("design script data cannot escape its nonce protected bootstrap", () => {
  const attack = '</script><script>parent.compromised = true</script>';
  const source = buildDesignPreview({ html: attack, css: attack, js: attack, channel: attack, checks: [{ message: attack }] });
  assert.equal((source.match(/<script\b/g) || []).length, 1);
  assert.equal((source.match(/<\/script>/g) || []).length, 1);
  assert.ok(!source.includes(attack));
  const nonce = source.match(/<script nonce="([a-f0-9]+)"/)[1];
  assert.ok(nonce.length >= 32);
  assert.ok(source.includes(`script-src 'nonce-${nonce}'`));
  for (const directive of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "frame-src 'none'", "worker-src 'none'", "script-src-elem 'unsafe-inline'", "script-src-attr 'none'"]) assert.ok(source.includes(directive));
  assert.ok(!source.includes("allow-same-origin"));
  assert.notEqual(buildDesignPreview().match(/<script nonce="([a-f0-9]+)"/)[1], nonce);
});

test("grades distinguish complete, close, essential failures, and low scores", () => {
  const complete = Array.from({ length: 5 }, (_, index) => ({ passed: true, message: `Requirement ${index}`, weight: 1 }));
  assert.deepEqual(gradeDesignChecks(complete), { score: 100, passed: true, perfect: true, improvements: [] });
  const close = [...complete.slice(0, 4), { passed: false, message: "Increase the corner radius.", weight: 1 }];
  assert.deepEqual(gradeDesignChecks(close), { score: 80, passed: true, perfect: false, improvements: ["Increase the corner radius."] });
  assert.equal(gradeDesignChecks([...complete.slice(0, 4), { ...close[4], essential: true }]).passed, false);
  assert.equal(gradeDesignChecks([complete[0], ...close.slice(4)]).passed, false);
  assert.equal(gradeDesignChecks([]).passed, false);
  assert.equal(gradeDesignChecks([{ passed: true, weight: 1000 }, { passed: false, weight: 1 }]).score, 99);
});

const browserPath = [process.env.METHODLAB_TEST_BROWSER, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find(candidate => candidate && existsSync(candidate));
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function connectBrowser() {
  const directory = await mkdtemp(path.join(tmpdir(), "methodlab-design-preview-"));
  const browser = spawn(browserPath, ["--headless=new", "--no-sandbox", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-sync", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--remote-debugging-port=0", `--user-data-dir=${directory}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  let errors = "";
  browser.stderr.on("data", data => { errors = (errors + data).slice(-3000); });
  let endpoint;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const [port] = (await readFile(path.join(directory, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/);
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      endpoint = targets.find(target => target.type === "page")?.webSocketDebuggerUrl;
      if (endpoint) break;
    } catch {}
    await pause(100);
  }
  if (!endpoint) { browser.kill(); throw new Error(`Headless browser did not start: ${errors}`); }
  const socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject, timeout } = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(timeout);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  });
  socket.addEventListener("close", () => {
    for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(new Error("Browser debugger disconnected")); }
    pending.clear();
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    const timeout = setTimeout(() => { pending.delete(messageId); reject(new Error(`Browser command timed out: ${method}`)); }, 15000);
    pending.set(messageId, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
  const evaluate = async expression => {
    const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await command("Runtime.enable");
  await command("Page.bringToFront");
  await evaluate(`globalThis.messages = []; globalThis.compromised = false; addEventListener('message', event => { if (event.source === globalThis.preview?.contentWindow && event.data.channel === 'design-preview-test') messages.push(event.data); });`);
  return {
    evaluate,
    async close() {
      socket.close();
      browser.kill();
      // Delete only the unique temporary directory this test created.
      if (path.dirname(path.resolve(directory)) === path.resolve(tmpdir()) && path.basename(directory).startsWith("methodlab-design-preview-")) {
        for (let attempt = 0; attempt < 10; attempt++) { try { await rm(directory, { recursive: true, force: true }); break; } catch { await pause(100); } }
      }
    },
    async preview(options, width = 700) {
      const source = buildDesignPreview({ ...options, channel: "design-preview-test" });
      return evaluate(`(async () => {
        globalThis.preview?.remove(); messages.length = 0;
        globalThis.preview = document.createElement('iframe'); preview.sandbox = 'allow-scripts'; preview.style.width = ${JSON.stringify(`${width}px`)}; preview.style.height = '500px';
        preview.srcdoc = ${JSON.stringify(source)}; document.body.appendChild(preview);
        for (let attempt = 0; attempt < 300; attempt++) { const ready = messages.find(message => message.type === 'ready'); if (ready) return ready; await new Promise(resolve => setTimeout(resolve, 20)); }
        throw new Error('Design preview did not send ready');
      })()`);
    },
    async check(requestId = "design-check-1") {
      return evaluate(`(async () => {
        messages.length = 0; preview.contentWindow.postMessage({channel:'design-preview-test',type:'check',requestId:${JSON.stringify(requestId)}}, '*');
        for (let attempt = 0; attempt < 300; attempt++) { const response = messages.find(message => message.type === 'checked' && message.requestId === ${JSON.stringify(requestId)}); if (response) return response; await new Promise(resolve => setTimeout(resolve, 20)); }
        throw new Error('Design preview did not send checked');
      })()`);
    },
  };
}

test("the isolated browser grades designs and exercises real interactions", { skip: !browserPath && "Install Chromium/Edge or set METHODLAB_TEST_BROWSER for browser verification", timeout: 60000 }, async t => {
  const browser = await connectBrowser();
  try {
    await t.test("static rendered requirements allow equivalent markup and CSS", async () => {
      const checks = [
        { type: "text", selector: "h1", equals: "Build your page", essential: true },
        { type: "exists", selector: "tbody tr", count: 2, essential: true },
        { type: "children", selector: "thead tr", childSelector: "th", count: 2 },
        { type: "attribute", selector: "th", name: "scope", value: "col" },
        { type: "style", selector: "table", property: "background-color", value: "#fff" },
      ];
      await browser.preview({ html: '<main><h1>Build   your page</h1><table><thead><tr><th scope="col">Name</th><th>Score</th></tr></thead><tbody><tr><td>Alex</td><td>8</td></tr><tr><td>Sam</td><td>9</td></tr></tbody></table></main>', css: "table { background: rgb(255, 255, 255); }", checks });
      const result = await browser.check();
      assert.equal(result.requestId, "design-check-1");
      assert.ok(result.checks.every(check => check.passed), JSON.stringify(result));
      assert.equal(gradeDesignChecks(result.checks).perfect, true);
      await browser.preview({ html: '<main><h1>Build your page</h1><table><thead><tr><th scope="col">Name</th><th>Score</th></tr></thead><tbody><tr><td>Alex</td><td>8</td></tr><tr><td>Sam</td><td>9</td></tr></tbody></table></main>', css: "table { background: pink; }", checks });
      const close = gradeDesignChecks((await browser.check()).checks);
      assert.equal(close.score, 80);
      assert.equal(close.passed, true);
      assert.equal(close.perfect, false);
      assert.equal(close.improvements.length, 1);
    });

    await t.test("JavaScript runs after insertion and resets independent behavioral checks", async () => {
      const options = {
        html: '<button id="add">Add</button><output id="count">0</output><input id="name"><p id="greeting">Hello</p><select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select>',
        js: 'const output = document.querySelector("#count"); let count = 0; document.addEventListener("click", event => { if (event.target.id === "add") output.textContent = ++count; }); document.querySelector("#name").addEventListener("input", event => document.querySelector("#greeting").textContent = "Hello " + event.target.value); document.querySelector("#theme").addEventListener("change", event => document.body.dataset.theme = event.target.value);',
        allowJavaScript: true,
        checks: [
          { type: "behavior", actions: [{ type: "click", selector: "#add" }], expect: { type: "text", selector: "#count", equals: "1" }, reset: true },
          { type: "behavior", actions: [{ type: "click", selector: "#add" }, { type: "click", selector: "#add" }], expect: { type: "text", selector: "#count", equals: "2" }, reset: true },
          { type: "behavior", actions: [{ type: "input", selector: "#name", value: "Alex" }], expect: { type: "text", selector: "#greeting", equals: "Hello Alex" }, reset: true },
          { type: "behavior", actions: [{ type: "change", selector: "#theme", value: "dark" }], expect: { type: "attribute", selector: "body", name: "data-theme", value: "dark" }, reset: true },
        ],
      };
      const ready = await browser.preview(options);
      assert.equal(ready.error, undefined);
      const result = await browser.check();
      assert.ok(result.checks.every(check => check.passed), JSON.stringify(result));
      assert.ok((await browser.check("second-check")).checks.every(check => check.passed), "Repeated checks restore the starting state without duplicate document listeners");
      await browser.preview({ ...options, js: `document.addEventListener("DOMContentLoaded", () => { ${options.js} });` });
      assert.ok((await browser.check()).checks.every(check => check.passed), "DOM-ready solutions also attach their handlers after each isolated reset");
      await browser.preview({ html: '<button id="add">Add</button><output id="count">0</output>', allowJavaScript: true, js: 'document.addEventListener("DOMContentLoaded", () => { document.addEventListener("click", () => { const output = document.querySelector("#count"); output.textContent = Number(output.textContent) + 1; }); });', checks: options.checks.slice(0, 2) });
      assert.ok((await browser.check()).checks.every(check => check.passed), "Listeners added inside ready callbacks are removed before the next independent check");
      await browser.preview({ ...options, allowJavaScript: false });
      assert.ok((await browser.check()).checks.every(check => !check.passed), "Levels 1 and 2 cannot execute the JavaScript editor");
    });

    await t.test("responsive requirements grade the value for the actual preview width", async () => {
      const options = { html: '<h1 id="heading">A responsive heading</h1>', css: "h1 { font-size:26px } @media(max-width:520px) { h1 { font-size:23px } }", checks: [{ type: "style", selector: "#heading", property: "font-size", value: "26px", responsive: [{ maxWidth: 520, value: "23px" }] }] };
      for (const width of [700, 320]) {
        await browser.preview(options, width);
        assert.equal((await browser.check()).checks[0].passed, true);
      }
      await browser.preview({ ...options, css: "h1 { font-size:26px }" }, 320);
      assert.equal((await browser.check()).checks[0].passed, false, "A desktop-only value cannot satisfy the mobile requirement");
    });

    await t.test("syntax and runtime errors reach the parent and cannot grant passes", async () => {
      for (const js of ['const = ;', 'throw new Error("Fix this event handler")']) {
        const ready = await browser.preview({ html: "<p>Ready</p>", js, allowJavaScript: true, checks: [{ type: "exists", selector: "p" }] });
        assert.ok(ready.error);
        const checked = await browser.check();
        assert.ok(checked.error);
        assert.equal(checked.checks[0].passed, false);
      }
    });

    await t.test("learner markup remains inert while authorized JS cannot access the app or network", async () => {
      let networkHits = 0;
      const server = createServer((request, response) => { networkHits++; response.end("blocked"); });
      await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
      const remote = `http://127.0.0.1:${server.address().port}/blocked`;
      try {
        await browser.preview({
          html: `<script>parent.compromised=true</script><meta http-equiv="refresh" content="0;url=${remote}"><link rel="stylesheet" href="${remote}"><iframe src="${remote}"></iframe><p id="safe" onclick="parent.compromised=true">Safe</p><img src="${remote}" onerror="parent.compromised=true"><a href="${remote}">Link</a><a id="email" href="mailto:studio@example.com">Email</a><form action="${remote}"><button>Send</button></form><style>@import '${remote}'; #safe { color: blue; background-image:url('${remote}') }</style>`,
          css: `@import '${remote}'; body { background-image: url('${remote}'); }`,
          js: `try { parent.document.body.textContent = 'compromised'; } catch (error) { document.body.dataset.parentBlocked = error.name; } try { top.location.href = '${remote}'; } catch (error) { document.body.dataset.navigationBlocked = error.name; } fetch('${remote}').catch(() => { document.body.dataset.networkBlocked = 'true'; }); const remoteScript = document.createElement('script'); remoteScript.nonce = document.currentScript.nonce; remoteScript.src = '${remote}'; document.head.appendChild(remoteScript);`,
          allowJavaScript: true,
          checks: [
            { type: "exists", selector: "script, iframe, link, meta, object, embed", count: 0 },
            { type: "exists", selector: "[onclick], [onerror], [src]", count: 0 },
            { type: "attribute", selector: "body", name: "data-parent-blocked", value: "SecurityError" },
            { type: "attribute", selector: "body", name: "data-navigation-blocked", value: "SecurityError" },
            { type: "attribute", selector: "body", name: "data-network-blocked", value: "true" },
            { type: "style", selector: "#safe", property: "color", value: "blue" },
            { type: "style", selector: "#safe", property: "background-image", value: "none" },
            { type: "attribute", selector: "#email", name: "href", value: "mailto:studio@example.com" },
            { type: "behavior", actions: [{ type: "click", selector: "a" }, { type: "click", selector: "form button" }], expect: { type: "exists", selector: "#safe" } },
          ],
        });
        await pause(100);
        const result = await browser.check();
        assert.ok(result.checks.every(check => check.passed), JSON.stringify(result));
        assert.equal(await browser.evaluate("compromised"), false);
        assert.equal(await browser.evaluate(`(() => { try { return preview.contentWindow.document.body.textContent; } catch (error) { return error.name; } })()`), "SecurityError");
        assert.equal(networkHits, 0);
      } finally { await new Promise(resolve => server.close(resolve)); }
    });

    await t.test("invalid selectors fail safely and messages require source, channel and request ID", async () => {
      await browser.preview({ html: "<p>Ready</p>", checks: [{ type: "exists", selector: "[" }] });
      assert.equal((await browser.check()).checks[0].passed, false);
      await browser.evaluate("messages.length = 0; preview.contentWindow.postMessage({channel:'another-design',type:'check',requestId:'wrong'}, '*'); preview.contentWindow.postMessage({channel:'design-preview-test',type:'check'}, '*')");
      await pause(80);
      assert.equal(await browser.evaluate("messages.length"), 0);
    });
  } finally { await browser.close(); }
});

test("every Web Design reference works on desktop and mobile and requires real styling", { skip: !browserPath && "Install Chromium/Edge or set METHODLAB_TEST_BROWSER for browser verification", timeout: 240000 }, async () => {
  const { designChallenges, getDesignChallenge } = await import("../lib/web-design-challenges.mjs");
  assert.equal(designChallenges.length, 60);
  const browser = await connectBrowser();
  try {
    for (const template of designChallenges) {
      for (const variant of [0, 1, 2]) {
        const challenge = getDesignChallenge(template.id, variant);
        for (const width of [700, 320]) {
          const ready = await browser.preview({ ...challenge.solution, checks: challenge.checks, allowJavaScript: template.level >= 3 }, width);
          assert.equal(ready.error, undefined, `${template.id} variant ${variant} at ${width}px must initialize without errors`);
          const checked = await browser.check(`${template.id}-${variant}-${width}`);
          assert.equal(checked.error, undefined, `${template.id} must run interaction checks without errors`);
          const failed = checked.checks.filter(check => !check.passed);
          assert.deepEqual(failed, [], `${template.id} variant ${variant} at ${width}px: ${JSON.stringify(failed)}`);
          assert.equal(gradeDesignChecks(checked.checks).perfect, true);
        }
      }
      const challenge = getDesignChallenge(template.id, 0);
      await browser.preview({ checks: challenge.checks, allowJavaScript: template.level >= 3 });
      assert.equal(gradeDesignChecks((await browser.check()).checks).passed, false, `${template.id}: a blank editor needs an implementation`);
      await browser.preview({ html: challenge.solution.html, js: challenge.solution.js, css: "", checks: challenge.checks, allowJavaScript: template.level >= 3 });
      assert.equal(gradeDesignChecks((await browser.check()).checks).passed, false, `${template.id}: correct content and behavior without CSS cannot pass a visual challenge`);
    }
  } finally { await browser.close(); }
});
