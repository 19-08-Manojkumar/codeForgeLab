import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildWebPreview } from "../lib/web-preview.mjs";
import { webLessons } from "../lib/web-lessons.mjs";
import { htmlTags } from "../lib/html-tags.mjs";

test("learner HTML, CSS, channels and challenge messages cannot break out of script data", () => {
  const attack = '</script><script>parent.compromised = true</script><img onerror="alert(1)">';
  const source = buildWebPreview({ html: attack, css: `body::after { content: '${attack}'; }`, channel: attack, lesson: { checks: [{ message: attack }] } });
  assert.equal((source.match(/<script\b/g) || []).length, 1);
  assert.equal((source.match(/<\/script>/g) || []).length, 1);
  assert.ok(!source.includes(attack));
  assert.match(source, /\\u003c\/script\\u003e/);
  const nonce = source.match(/<script nonce="([a-f0-9]+)"/)[1];
  assert.ok(nonce.length >= 32);
  assert.ok(source.includes(`script-src 'nonce-${nonce}'`));
  assert.match(source, /default-src 'none'/);
  assert.match(source, /connect-src 'none'/);
  assert.match(source, /form-action 'none'/);
  assert.match(source, /img-src data:/);
  assert.ok(!source.includes("allow-same-origin"));
  assert.notEqual(buildWebPreview().match(/<script nonce="([a-f0-9]+)"/)[1], nonce);
});

const browserPath = [process.env.METHODLAB_TEST_BROWSER, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find(candidate => candidate && existsSync(candidate));
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function connectBrowser() {
  const directory = await mkdtemp(path.join(tmpdir(), "methodlab-web-preview-"));
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
  const exceptions = [];
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
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
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + " " + (result.exceptionDetails.exception?.description || "") + " " + exceptions.join("; "));
    return result.result.value;
  };
  await command("Runtime.enable");
  await command("Page.bringToFront");
  await evaluate(`globalThis.messages = []; globalThis.compromised = false; addEventListener('message', event => { if (event.source === globalThis.preview?.contentWindow) messages.push(event.data); });`);
  return {
    evaluate, command,
    async close() {
      socket.close();
      browser.kill();
      // This exact temporary directory is created by this test, never user input.
      if (path.dirname(path.resolve(directory)) === path.resolve(tmpdir()) && path.basename(directory).startsWith("methodlab-web-preview-")) {
        for (let attempt = 0; attempt < 10; attempt++) { try { await rm(directory, { recursive: true, force: true }); break; } catch { await pause(100); } }
      }
    },
    async preview(options) {
      const source = buildWebPreview({ ...options, channel: "preview-test" });
      return evaluate(`(async () => {
        globalThis.preview?.remove(); messages.length = 0;
        globalThis.preview = document.createElement('iframe'); preview.sandbox = 'allow-scripts'; preview.style.width = '700px'; preview.style.height = '500px';
        preview.srcdoc = ${JSON.stringify(source)}; document.body.appendChild(preview);
        for (let attempt = 0; attempt < 300; attempt++) { const ready = messages.find(message => message.type === 'ready'); if (ready) return ready; await new Promise(resolve => setTimeout(resolve, 25)); }
        throw new Error('Preview did not send ready');
      })()`);
    },
    async message(message, responseType) {
      return evaluate(`(async () => {
        messages.length = 0; preview.contentWindow.postMessage(${JSON.stringify({ channel: "preview-test", ...message })}, '*');
        for (let attempt = 0; attempt < 100; attempt++) { const response = messages.find(message => message.type === ${JSON.stringify(responseType)}); if (response) return response; await new Promise(resolve => setTimeout(resolve, 20)); }
        throw new Error('Preview did not send ${responseType}');
      })()`);
    },
  };
}

test("the isolated browser renders, inspects and checks learner changes", { skip: !browserPath && "Install Chromium/Edge or set METHODLAB_TEST_BROWSER for browser verification", timeout: 45000 }, async t => {
  const browser = await connectBrowser();
  try {
    await t.test("full HTML documents preserve native semantics and applied CSS", async () => {
      const ready = await browser.preview({ html: '<!doctype html><html lang="en"><head><style>h1 { font-size: 32px; }</style></head><body class="lesson"><main id="card"><h1>Hello browser</h1><p>Change this paragraph.</p></main></body></html>', css: "#card { display: flex; flex-direction: column; padding: 24px; background-color: #f0f0ff; }" });
      assert.deepEqual(ready.nodes.map(node => node.tag), ["body", "main", "h1", "p"]);
      assert.deepEqual(ready.checks, []);
      assert.equal(ready.inspection.tag, "main");
      assert.equal(ready.inspection.styles.display, "flex");
      assert.equal(ready.inspection.styles.padding, "24px");
      assert.equal(ready.inspection.styles["background-color"], "rgb(240, 240, 255)");
      assert.ok(ready.inspection.matchingCss.some(rule => rule.selector === "#card"));
      const inspected = await browser.message({ type: "inspect-selector", selector: "h1" }, "inspection");
      assert.equal(inspected.inspection.styles["font-size"], "32px");
      assert.equal(inspected.inspection.text, "Hello browser");
      assert.equal(inspected.inspection.parentTag, "main");
      assert.ok(inspected.inspection.matchingCss.some(rule => rule.selector === "h1"));
    });

    await t.test("checks are explicit, reflect actual DOM and normalize browser CSS values", async () => {
      const checks = [
        { type: "exists", selector: "li", count: 2, message: "Two list items" },
        { type: "text", selector: "h2", includes: "browser", message: "Heading text" },
        { type: "attribute", selector: "img", name: "alt", value: "A blue square", message: "Image description" },
        { type: "style", selector: ".card", property: "background-color", value: "#0000ff", message: "Blue background" },
        { type: "children", selector: "ul", childSelector: "li", minCount: 2, message: "List children" },
        { type: "exists", selector: "footer", message: "Footer missing" },
        { type: "style", selector: "h2", property: "font-size", value: "50px", message: "Heading size differs" },
      ];
      const ready = await browser.preview({ html: '<section class="card"><h2>Hello browser</h2><ul><li>HTML</li><li>CSS</li></ul><img alt="A blue square"></section>', css: ".card { background-color: blue; }", lesson: { checks } });
      assert.deepEqual(ready.checks, []);
      const result = await browser.message({ type: "check" }, "checked");
      assert.deepEqual(result.checks.map(check => check.passed), [true, true, true, true, true, false, false]);
      assert.equal(result.checks[3].message, "Blue background");
      assert.equal(result.inspection.styles["background-color"], "rgb(0, 0, 255)");
    });

    await t.test("edited markup and CSS produce fresh rendered values", async () => {
      await browser.preview({ html: '<p id="result">First result</p>', css: "p { color: red; padding: 4px; }" });
      const ready = await browser.preview({ html: '<p id="result">Edited result</p>', css: "p { color: green; padding: 16px; }" });
      assert.equal(ready.inspection.text, "Edited result");
      assert.equal(ready.inspection.styles.color, "rgb(0, 128, 0)");
      assert.equal(ready.inspection.styles.padding, "16px");
      const inspected = await browser.message({ type: "inspect", index: ready.inspection.index }, "inspection");
      assert.equal(inspected.inspection.tag, "p");
    });

    await t.test("CSS explorer lessons show the selected property first in the computed inspector", async () => {
      const ready=await browser.preview({html:'<p id="target">See-through text</p>',css:"#target { opacity: 0.45; }",lesson:{property:"opacity"}});
      assert.equal(Object.keys(ready.inspection.styles)[0],"opacity");
      assert.equal(ready.inspection.styles.opacity,"0.45");
      assert.equal(ready.inspection.styles.display,"block");
      const duplicate=await browser.preview({html:"<p>Blue text</p>",css:"p { color: blue; }",lesson:{property:"color"}});
      assert.equal(Object.keys(duplicate.inspection.styles)[0],"color");
      assert.equal(Object.keys(duplicate.inspection.styles).filter(key=>key==="color").length,1);
      const invalid=await browser.preview({html:"<p>Safe property</p>",lesson:{property:"color; opacity"}});
      assert.equal(Object.keys(invalid.inspection.styles)[0],"color");
      assert.equal(Object.hasOwn(invalid.inspection.styles,"color; opacity"),false);
    });

    await t.test("generated content and placeholder demos inspect their own pseudo-element styles", async () => {
      await browser.preview({html:'<p id="demo">Real paragraph</p>',css:'#demo::before { content: "Before text"; color: purple; } #demo::after { content: "After text"; color: orange; }',lesson:{property:"content"}});
      const before=await browser.message({type:"inspect-selector",selector:"#demo::before"},"inspection");
      assert.equal(before.inspection.tag,"p");
      assert.equal(before.inspection.pseudo,"::before");
      assert.equal(before.inspection.selector,"#demo::before");
      assert.equal(before.inspection.styles.content,'"Before text"');
      assert.equal(before.inspection.styles.color,"rgb(128, 0, 128)");
      assert.deepEqual(before.inspection.matchingCss.map(rule=>rule.selector),["#demo::before"]);
      const paragraph=await browser.message({type:"inspect-selector",selector:"#demo"},"inspection");
      assert.equal(paragraph.inspection.pseudo,null);
      assert.equal(paragraph.inspection.styles.content,"normal");
      await browser.preview({html:'<input id="entry" placeholder="Your name">',css:"#entry::placeholder { color: blue; }",lesson:{property:"color"}});
      const placeholder=await browser.message({type:"inspect-selector",selector:"#entry::placeholder"},"inspection");
      assert.equal(placeholder.inspection.pseudo,"::placeholder");
      assert.equal(placeholder.inspection.styles.color,"rgb(0, 0, 255)");
      assert.deepEqual(placeholder.inspection.matchingCss.map(rule=>rule.selector),["#entry::placeholder"]);
    });

    await t.test("script, event handlers, embeds and closing tag attacks remain inert", async () => {
      const ready = await browser.preview({
        html: `<script>parent.compromised=true</script><meta http-equiv="refresh" content="0;url=https://example.com"><base href="https://example.com"><iframe srcdoc="<script>parent.compromised=true</script>"></iframe><object data="https://example.com"></object><embed src="https://example.com"><p id="safe" onclick="parent.compromised=true">Safe text</p><img onerror="parent.compromised=true" src="bad"><a href="java&#x73;cript:parent.compromised=true">Link</a><style>p { color: purple }</style>`,
        css: 'p::after { content: "</style><script>parent.compromised=true</script>"; }',
        lesson: { checks: [{ type: "exists", selector: "script,iframe,object,embed,base,meta[http-equiv=refresh]", count: 0, message: "Active elements removed" }, { type: "attribute", selector: "#safe", name: "onclick", message: "Handler missing" }, { type: "attribute", selector: "a", name: "href", message: "Unsafe link missing" }] },
      });
      assert.deepEqual(ready.nodes.map(node => node.tag), ["body", "p", "img", "a"]);
      assert.equal(await browser.evaluate("compromised"), false);
      const result = await browser.message({ type: "check" }, "checked");
      assert.deepEqual(result.checks.map(check => check.passed), [true, false, false]);
      const inspected = await browser.message({ type: "inspect-selector", selector: "#safe" }, "inspection");
      assert.equal(inspected.inspection.styles.color, "rgb(128, 0, 128)");
      assert.equal(inspected.inspection.attributes.some(attribute => attribute.name.startsWith("on")), false);
      assert.equal(await browser.evaluate(`(() => { try { return preview.contentWindow.document.body.textContent; } catch (error) { return error.name; } })()`), "SecurityError");
    });

    await t.test("outside messages cannot drive the preview and invalid selectors are safe", async () => {
      await browser.preview({ html: "<p>Still here</p>", lesson: { checks: [{ type: "exists", selector: "[", message: "Invalid selector" }] } });
      const checked = await browser.message({ type: "check" }, "checked");
      assert.deepEqual(checked.checks, [{ passed: false, message: "Invalid selector" }]);
      const invalid = await browser.message({ type: "inspect-selector", selector: "[" }, "inspection");
      assert.equal(invalid.inspection, null);
      await browser.evaluate("messages.length = 0; preview.contentWindow.postMessage({channel:'another-preview',type:'check'}, '*')");
      await pause(100);
      assert.equal(await browser.evaluate("messages.length"), 0);
    });

    await t.test("every HTML and CSS starter needs an edit and every solution passes rendered checks", async () => {
      for (const [language, lessons] of Object.entries(webLessons)) {
        for (const lesson of lessons) {
          const ready = await browser.preview({ html: lesson.html, css: lesson.css, lesson });
          assert.deepEqual(ready.checks, [], `${language}:${lesson.id} does not grade on edit`);
          const starter = await browser.message({ type: "check" }, "checked");
          assert.ok(starter.checks.some(check => !check.passed), `${language}:${lesson.id} starter must need a change`);
          await browser.preview({ ...lesson.challenge.solution, lesson });
          const solution = await browser.message({ type: "check" }, "checked");
          assert.equal(solution.checks.length, lesson.challenge.checks.length);
          for (const check of solution.checks) assert.equal(check.passed, true, `${language}:${lesson.id} — ${check.message}`);
        }
      }
    });

    await t.test("all individual tag challenges grade the actual starter and solution", async () => {
      for (const lesson of htmlTags.filter(entry => entry.challenge)) {
        await browser.preview({ html: lesson.html, css: lesson.css, lesson });
        const starter = await browser.message({ type: "check" }, "checked");
        assert.ok(starter.checks.some(check => !check.passed), `${lesson.id} starter needs an edit`);
        await browser.preview({ ...lesson.challenge.solution, lesson });
        const solution = await browser.message({ type: "check" }, "checked");
        assert.equal(solution.checks.length, lesson.challenge.checks.length);
        assert.ok(solution.checks.every(check => check.passed), `${lesson.id}: ${JSON.stringify(solution.checks)}`);
      }
    });

    await t.test("responsive styles and matching media rules follow the preview viewport", async () => {
      const lesson = webLessons.css.find(item => item.id === "responsive");
      assert.ok(lesson);
      await browser.preview({ ...lesson.challenge.solution, lesson });
      const desktop = await browser.message({ type: "inspect-selector", selector: ".responsive-card h1" }, "inspection");
      await browser.evaluate("messages.length = 0; preview.style.width = '350px'");
      await pause(60);
      const pushed = await browser.evaluate("messages.filter(message => message.type === 'inspection').at(-1)");
      assert.ok(pushed, "resizing refreshes the parent inspector automatically");
      assert.notEqual(pushed.inspection.styles["font-size"], desktop.inspection.styles["font-size"]);
      const mobile = await browser.message({ type: "inspect-selector", selector: ".responsive-card h1" }, "inspection");
      assert.notEqual(mobile.inspection.styles["font-size"], desktop.inspection.styles["font-size"]);
      assert.ok(mobile.inspection.matchingCss.length > desktop.inspection.matchingCss.length);
      const result = await browser.message({ type: "check" }, "checked");
      assert.ok(result.checks.every(check => check.passed));
    });
  } finally { await browser.close(); }
});
