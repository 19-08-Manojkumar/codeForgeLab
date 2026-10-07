import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { startLearningPreview } from "./local-learning.mjs";
import { webLessons } from "../lib/web-lessons.mjs";

const runtime = resolve(".sites-runtime");
const mobileOnly = process.argv.includes("--mobile-only");
await mkdir(runtime, { recursive:true });
const preview = await startLearningPreview(), errors = [];
const browserProfile = join(runtime, `web-browser-${process.pid}`);
const browser = spawn("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", [
  "--headless=new", "--no-sandbox", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0",
  "--disable-background-networking", "--disable-component-update", "--disable-sync",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
  `--user-data-dir=${browserProfile}`, "about:blank",
], { windowsHide:true, stdio:["ignore", "ignore", "pipe"] });
let socket, failureShot;

try {
  let endpoint, browserOutput = "";
  browser.stderr.on("data", chunk => { browserOutput = (browserOutput + chunk).slice(-3000); });
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const [port] = (await readFile(join(browserProfile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/);
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      endpoint = targets.find(target => target.type === "page")?.webSocketDebuggerUrl;
      if (endpoint) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!endpoint) throw new Error("Browser startup timed out: " + browserOutput);
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once:true });
    socket.addEventListener("error", reject, { once:true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id);
      if (item) {
        pending.delete(message.id); clearTimeout(item.timeout);
        message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
      }
    }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  });
  const disconnected = () => {
    for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(new Error("Browser debugger disconnected")); }
    pending.clear();
  };
  socket.addEventListener("close", disconnected);
  browser.on("exit", disconnected);
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const current = ++id;
    const timeout = setTimeout(() => { pending.delete(current); reject(new Error("CDP timed out: " + method)); }, 20000);
    pending.set(current, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id:current, method, params }));
  });
  const page = call;
  await page("Runtime.enable");
  await page("Page.enable");
  await page("Page.bringToFront");
  console.log("Web smoke: browser attached");
  const evaluate = async expression => {
    const result = await page("Runtime.evaluate", { expression, awaitPromise:true, returnByValue:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async expression => {
    for (let index = 0; index < 120; index++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Expected state: " + expression);
  };
  const click = async (text, scope = "button") => assert.equal(await evaluate(`(() => {
    const button = [...document.querySelectorAll(${JSON.stringify(scope)})].find(item => item.textContent.trim().startsWith(${JSON.stringify(text)}));
    if (!button) return false; button.click(); return true;
  })()`), true, "Button: " + text);
  const field = async (selector, value) => {
    await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles:true }));
    })()`);
    await wait(`document.querySelector(${JSON.stringify(selector)})?.value === ${JSON.stringify(value)}`);
  };
  const saved = () => wait("document.querySelector('.learning-save-status')?.classList.contains('saved')");
  const data = async () => { await saved(); return (await (await fetch(preview.url + "api/learning")).json()).state; };
  const ready = async () => {
    // Chromium may defer animation frames in an iframe below the mobile fold.
    await evaluate("document.querySelector('.web-preview-panel iframe')?.scrollIntoView({ block:'center' })");
    await wait("document.querySelector('.web-browser-toolbar [role=status]')?.textContent === 'Preview up to date'");
  };
  const fits = async label => assert.equal(await evaluate("document.documentElement.scrollWidth <= window.innerWidth"), true, label + " fits the document");
  const shot = async name => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = await page("Page.captureScreenshot", { format:"png", captureBeyondViewport:true });
    await writeFile(join(runtime, name), Buffer.from(result.data, "base64"));
  };
  failureShot = () => shot("web-failure.png");
  const recordMessages = () => evaluate(`(() => {
    window.__webMessages = [];
    window.addEventListener('message', event => {
      if (event.source === document.querySelector('.web-preview-panel iframe')?.contentWindow)
        window.__webMessages.push(event.data);
    });
  })()`);
  const lastMessage = type => evaluate(`window.__webMessages.filter(item => item.type === ${JSON.stringify(type)}).at(-1)`);
  const home = async () => {
    await evaluate("document.querySelector('.brand').click()");
    await wait("document.querySelector('.learning-dashboard') && document.querySelectorAll('.language-card').length === 6");
  };
  const openWeb = async language => {
    await evaluate(`document.querySelector('.language-card[data-language=${language}]').click()`);
    await wait("document.querySelector('.web-workspace') && document.querySelectorAll('.web-workspace .topic-button').length === 9");
    await ready();
    assert.equal(await evaluate("document.querySelector('.app-scene').dataset.path"), "render");
    assert.equal(await evaluate("document.querySelectorAll('.practice-path-card').length"), 0);
    assert.equal(await evaluate("document.querySelector('.web-preview-panel iframe').getAttribute('sandbox')"), "allow-scripts");
  };
  const edit = async (language, value) => {
    await click(language === "html" ? "index.html" : "styles.css", ".web-file-tabs button");
    await field("#web-code-editor", value);
    await ready();
  };
  const inspectToken = async index => {
    const before = await evaluate("window.__webMessages.filter(item => item.type === 'inspection').length");
    await evaluate(`document.querySelectorAll('.web-token-button')[${index}].click()`);
    await wait(`window.__webMessages.filter(item => item.type === 'inspection').length > ${before}`);
    return lastMessage("inspection");
  };
  const dailyLanguages = async () => assert.deepEqual(await evaluate("[...document.querySelectorAll('.daily-language-label select option')].map(item => item.value)"), ["javascript", "python", "java", "c"]);
  const reload = async () => {
    await saved();
    await page("Page.reload", { ignoreCache:true });
    await wait("document.querySelector('.learning-dashboard') && document.querySelectorAll('.language-card').length === 6");
    await saved();
    await recordMessages();
  };

  await page("Emulation.setDeviceMetricsOverride", { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
  await page("Page.navigate", { url:preview.url });
  await wait("document.querySelector('.learner-dialog')?.open");
  await click("Skip for now");
  await wait("!document.querySelector('.learner-dialog')?.open");
  await saved();
  await recordMessages();
  await dailyLanguages();
  assert.equal(await evaluate("document.querySelectorAll('.language-card').length"), 6);
  console.log("Web smoke: home ready");

  if (!mobileOnly) {
  const htmlLesson = webLessons.html[0], cssLesson = webLessons.css[0];
  const htmlKey = `html:render:${htmlLesson.id}`, cssKey = `css:render:${cssLesson.id}`;
  const customHtml = '<article class="card"><h1>Live HTML works</h1><p>A new paragraph appears in the browser.</p></article>';
  const customCss = htmlLesson.css + "\nh1 { color: #6a28a0; }";
  await openWeb("html");
  assert.ok((await lastMessage("ready")).nodes.some(node => node.tag === "h1" && node.text === "My first web page"));
  await evaluate("document.querySelector('#web-step-1').click()");
  await edit("html", customHtml);
  assert.ok((await lastMessage("ready")).nodes.some(node => node.tag === "h1" && node.text === "Live HTML works"));
  await edit("css", customCss);
  let inspection = await inspectToken(0);
  assert.equal(inspection.inspection.tag, "h1");
  assert.equal(inspection.inspection.styles.color, "rgb(106, 40, 160)");
  assert.ok(inspection.inspection.matchingCss.some(rule => rule.selector === "h1" && rule.declarations.includes("106")));
  await click("Page structure", ".web-inspector-switch button");
  await wait("document.querySelector('.web-dom-tree')");
  const paragraphIndex = (await lastMessage("ready")).nodes.find(node => node.tag === "p").index;
  await evaluate(`document.querySelectorAll('.web-dom-tree button')[${paragraphIndex}].click()`);
  await wait(`document.querySelectorAll('.web-dom-tree button')[${paragraphIndex}]?.getAttribute('aria-pressed') === 'true'`);
  await click("Element", ".web-inspector-switch button");
  await wait("document.querySelector('.web-element-summary > code')?.textContent === '<p>'");
  for (const width of ["375", "768", "1024", "full"]) {
    await field(".web-preview-width select", width);
    await fits("Desktop preview " + width);
    assert.equal(await evaluate("document.querySelector('.web-preview-viewport').style.width"), width === "full" ? "100%" : width + "px");
  }
  await inspectToken(0);
  await click("index.html", ".web-file-tabs button");
  await click("Bookmark topic");
  await shot("web-html-desktop.png");
  console.log("Web smoke: HTML rendering and inspector checked");
  let state = await data();
  assert.deepEqual(JSON.parse(state.drafts[htmlKey].value), { html:customHtml, css:customCss });
  assert.equal(state.lastVisited.mode, "learn");
  assert.equal(state.bookmarks[0].language, "html");

  await home();
  await dailyLanguages();
  await reload();
  await dailyLanguages();
  await click("Continue learning");
  await ready();
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"), customHtml);
  assert.equal(await evaluate("document.querySelector('#web-step-1').getAttribute('aria-selected')"), "true");
  await click("styles.css", ".web-file-tabs button");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"), customCss);
  await evaluate("document.querySelector('#web-step-2').click()");
  await click("Show solution");
  await ready();
  assert.deepEqual(JSON.parse((await data()).drafts[htmlKey].value), { html:customHtml, css:customCss }, "Revealed solution is not saved over learner work");
  assert.equal((await data()).completed["html:render"], undefined);
  assert.equal(await evaluate("document.querySelector('.web-teaching-panel .primary-button').disabled"), true);
  await home();
  await reload();
  await click("Continue learning");
  await ready();
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"), customHtml);
  assert.equal(await evaluate("document.querySelector('#web-step-2').getAttribute('aria-selected')"), "true");

  // Deliver a stale successful check immediately after an edit while the previous
  // iframe channel still exists. It must not complete the lesson's new source.
  await evaluate(`(() => {
    const iframe = document.querySelector('.web-preview-panel iframe');
    const channel = window.__webMessages.filter(item => item.type === 'ready').at(-1).channel;
    document.querySelector('.web-teaching-panel .primary-button').click();
    const editor = document.querySelector('#web-code-editor');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(editor, ${JSON.stringify(customHtml + "\n<!-- still working -->")});
    editor.dispatchEvent(new Event('input', { bubbles:true }));
    window.dispatchEvent(new MessageEvent('message', { source:iframe.contentWindow, data:{ channel, type:'checked', checks:[{ passed:true, message:'Stale result' }] } }));
  })()`);
  await ready();
  assert.equal((await data()).completed["html:render"], undefined, "An edited page rejects a stale successful check");
  await click("Check my page");
  await wait("document.querySelector('.web-teaching-panel .practice-feedback.retry')");
  await edit("html", htmlLesson.challenge.solution.html);
  await edit("css", htmlLesson.challenge.solution.css);
  await click("Check my page");
  await wait("document.querySelector('.web-teaching-panel .practice-feedback.correct')");
  assert.deepEqual((await data()).completed["html:render"], [htmlLesson.id]);
  console.log("Web smoke: HTML persistence and challenge checked");

  await click("CSS session", ".web-session-navigation button");
  await wait("document.querySelector('.app-scene').dataset.language === 'css' && document.querySelectorAll('.web-workspace .topic-button').length === 9");
  await ready();
  assert.equal(await evaluate("document.querySelectorAll('.practice-path-card').length"), 0);
  await evaluate("document.querySelector('#web-step-1').click()");
  const cssHtml = cssLesson.html.replace("Hello, selectors", "CSS changes this page"), cssSource = cssLesson.css + "\n.note { color: #6a28a0; }";
  await edit("html", cssHtml);
  await edit("css", cssSource);
  assert.ok((await lastMessage("ready")).nodes.some(node => node.tag === "h1" && node.text === "CSS changes this page"));
  inspection = await inspectToken(1);
  assert.equal(inspection.inspection.tag, "p");
  assert.equal(inspection.inspection.styles.color, "rgb(106, 40, 160)");
  assert.ok(inspection.inspection.attributes.some(attribute => attribute.name === "class" && attribute.value === "note"));
  await click("Bookmark topic");
  await shot("web-css-desktop.png");
  console.log("Web smoke: CSS rendering and inspector checked");
  await evaluate("document.querySelector('#web-step-2').click()");
  await click("Check my page");
  await wait("document.querySelector('.web-teaching-panel .practice-feedback.retry')");
  await edit("html", cssLesson.challenge.solution.html);
  await edit("css", cssLesson.challenge.solution.css);
  await click("Check my page");
  await wait("document.querySelector('.web-teaching-panel .practice-feedback.correct')");
  state = await data();
  assert.deepEqual(state.completed["html:render"], [htmlLesson.id]);
  assert.deepEqual(state.completed["css:render"], [cssLesson.id]);
  assert.equal(state.bookmarks.length, 2);
  assert.deepEqual(state.stats, { attempts:0, correct:0 });
  assert.deepEqual(state.mistakes, []);
  assert.deepEqual(state.daily, {});
  await home();
  await reload();
  await dailyLanguages();
  await click("Continue learning");
  await ready();
  assert.equal(await evaluate("document.querySelector('.app-scene').dataset.language"), "css");
  assert.equal(await evaluate("document.querySelector('#web-step-2').getAttribute('aria-selected')"), "true");
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"), cssLesson.challenge.solution.css);
  assert.deepEqual(JSON.parse((await data()).drafts[cssKey].value), cssLesson.challenge.solution);
  await home();
  await evaluate("[...document.querySelectorAll('.bookmark-chip')].find(item => item.textContent.includes('Tags, text')).click()");
  await ready();
  assert.equal(await evaluate("document.querySelector('#web-code-editor').value"), htmlLesson.challenge.solution.html);

  for (const name of ["JavaScript", "Python", "Java", "C"]) {
    await evaluate(`[...document.querySelectorAll('.language-switch button')].find(item => item.textContent.trim().endsWith(${JSON.stringify(name)})).click()`);
    await wait("document.querySelectorAll('.practice-path-card').length === 4");
    await fits(name + " programming hub");
  }
  }
  for (const width of [390, 360]) {
    await page("Emulation.setDeviceMetricsOverride", { width, height:844, deviceScaleFactor:1, mobile:true });
    await home();
    await fits(width + " home");
    assert.equal(await evaluate(`(() => {
      const nav = document.querySelector('.language-switch').getBoundingClientRect();
      const actions = document.querySelector('.header-actions').getBoundingClientRect();
      const buttons = [...document.querySelectorAll('.language-switch button')];
      const boxes = buttons.map(button => button.getBoundingClientRect());
      return nav.top >= actions.bottom - 1 && buttons.every((button, index) => {
        const box = boxes[index];
        return box.left >= nav.left - 1 && box.right <= nav.right + 1 && button.scrollWidth <= button.clientWidth + 1 &&
          boxes.every((other, otherIndex) => index === otherIndex || box.right <= other.left + 1 || box.left >= other.right - 1 || box.bottom <= other.top + 1 || box.top >= other.bottom - 1);
      });
    })()`), true, width + " header language buttons fit below actions without overlap");
    for (const language of ["html", "css"]) {
      await openWeb(language);
      await fits(width + " " + language + " session");
      for (const frameWidth of ["375", "768", "1024", "full"]) {
        await field(".web-preview-width select", frameWidth);
        await fits(width + " " + language + " preview " + frameWidth);
      }
      if (width === 390 && language === "html") await shot("web-mobile.png");
      await home();
    }
  }
  console.log("Web smoke: mobile layouts checked");
  assert.equal(errors.length, 0, "No browser runtime exceptions");
  console.log(JSON.stringify({ passed:true, checks:mobileOnly ? ["six home cards", "HTML/CSS open directly with nine lessons", "mobile header language buttons fit without overlap", "mobile390/360 browser previews and width controls", "no runtime exceptions"] : [
    "six home cards and separate HTML/CSS browser sessions", "nine lessons per browser session", "live markup and computed CSS changes",
    "element inspector and rendered DOM tree", "preview width controls", "wrong challenge answers remain incomplete", "independent HTML/CSS completion",
    "stale check responses ignored after edits", "revealed solutions do not save or complete", "bookmarks and drafts survive reload",
    "four programming daily choices and original practice hubs", "desktop and mobile390/360 layouts", "no runtime exceptions",
  ], screenshots:mobileOnly ? ["web-mobile.png"] : ["web-html-desktop.png", "web-css-desktop.png", "web-mobile.png"] }));
  await call("Browser.close").catch(() => {});
} catch (error) {
  try { await failureShot?.(); } catch {}
  throw error;
} finally {
  socket?.close(); browser.kill(); preview.close();
}
