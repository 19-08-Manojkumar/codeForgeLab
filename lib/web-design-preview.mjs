// This is a teaching preview, not an examination boundary. Render its result only
// in an iframe with sandbox="allow-scripts" and validate message.source in the UI.
const scriptData = value => JSON.stringify(value)
  .replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function designRuntime(payload) {
  "use strict";
  // Capture the APIs used for checking before a learner's code can replace them.
  const parentWindow = parent;
  const sendMessage = parentWindow.postMessage.bind(parentWindow);
  const queryAll = Document.prototype.querySelectorAll;
  const elementMatches = Element.prototype.matches;
  const createElement = document.createElement.bind(document);
  const importNode = document.importNode.bind(document);
  const appendChild = Node.prototype.appendChild;
  const removeChild = Node.prototype.removeChild;
  const replaceChildren = Element.prototype.replaceChildren;
  const addListener = EventTarget.prototype.addEventListener;
  const removeListener = EventTarget.prototype.removeEventListener;
  const dispatch = EventTarget.prototype.dispatchEvent;
  const getStyle = getComputedStyle.bind(window);
  const NativeEvent = Event;
  const NativeMouseEvent = MouseEvent;
  const nativeClick = HTMLElement.prototype.click;
  const frame = requestAnimationFrame.bind(window);
  const delay = setTimeout.bind(window);
  const Parser = DOMParser;
  const Sheet = CSSStyleSheet;
  const arrayFrom = Array.from.bind(Array);
  const string = String;
  const number = Number;
  const finite = Number.isFinite;
  const valueSetters = [HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement].map(type => [type, Object.getOwnPropertyDescriptor(type.prototype, "value").set]);
  const nonce = document.currentScript.nonce;
  const bootstrap = document.currentScript;
  let runtimeError = "";
  let checking = false;
  let learnerListeners = [];
  let registeringLearner = false;
  const cleanText = value => string(value ?? "").replace(/\s+/g, " ").trim();
  const send = (type, data = {}) => sendMessage({ channel: payload.channel, type, ...data }, "*");
  const describeError = error => cleanText(error?.message || error || "JavaScript could not run.").slice(0, 500);

  addListener.call(window, "error", event => {
    runtimeError = describeError(event.error || event.message);
    send("error", { error: runtimeError });
    event.preventDefault();
  });
  addListener.call(window, "unhandledrejection", event => {
    runtimeError = describeError(event.reason);
    send("error", { error: runtimeError });
    event.preventDefault();
  });
  // Registration tracking prevents document/window listeners accumulating when
  // independent interaction checks restore the starting DOM and run the script.
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!registeringLearner || !listener) return addListener.call(this, type, listener, options);
    const capture = typeof options === "boolean" ? options : options?.capture === true;
    const existing = learnerListeners.find(item => item.target === this && item.type === type && item.listener === listener && item.capture === capture);
    if (existing) return addListener.call(this, type, existing.wrapped, options);
    const wrapped = function (event) {
      const previous = registeringLearner;
      registeringLearner = true;
      try { return typeof listener === "function" ? listener.call(this, event) : listener.handleEvent(event); }
      finally { registeringLearner = previous; }
    };
    learnerListeners.push({ target: this, type, listener, wrapped, options, capture });
    return addListener.call(this, type, wrapped, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const capture = typeof options === "boolean" ? options : options?.capture === true;
    const existing = learnerListeners.find(item => item.target === this && item.type === type && item.listener === listener && item.capture === capture);
    if (existing) {
      learnerListeners = learnerListeners.filter(item => item !== existing);
      return removeListener.call(this, type, existing.wrapped, options);
    }
    return removeListener.call(this, type, listener, options);
  };
  function clearLearnerListeners() {
    for (const { target, type, wrapped, options } of learnerListeners) removeListener.call(target, type, wrapped, options);
    learnerListeners = [];
  }

  const blockedTags = new Set(["SCRIPT", "BASE", "META", "LINK", "IFRAME", "OBJECT", "EMBED", "FRAME", "FRAMESET", "PORTAL"]);
  const urlAttributes = new Set(["href", "src", "xlink:href", "action", "formaction", "poster", "data", "background", "srcset", "ping"]);
  const decodeCss = css => css.replace(/\\([\da-f]{1,6})\s?|\\([^\r\n])/gi, (_, hex, character) => hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : character);
  function cleanCss(source) {
    // Parsing an unattached constructable sheet ignores @import without loading
    // it. CSP remains the browser-enforced guard for all external resources.
    try {
      const sheet = new Sheet();
      sheet.replaceSync(string(source));
      function scrub(rules) {
        for (let index = rules.length - 1; index >= 0; index--) {
          const rule = rules[index];
          if (/^\s*@(import|font-face|namespace)\b/i.test(rule.cssText)) { rule.parentStyleSheet ? (rule.parentRule || sheet).deleteRule(index) : sheet.deleteRule(index); continue; }
          if (rule.style) {
            for (const property of arrayFrom(rule.style)) {
              if (/url\s*\(|expression\s*\(|-moz-binding/i.test(decodeCss(rule.style.getPropertyValue(property)))) rule.style.removeProperty(property);
            }
          }
          if (rule.cssRules) scrub(rule.cssRules);
        }
      }
      scrub(sheet.cssRules);
      return arrayFrom(sheet.cssRules, rule => rule.cssText).join("\n");
    } catch {
      return decodeCss(string(source)).replace(/@import\b[^;]*;?/gi, "").replace(/url\s*\([^)]*\)/gi, "none");
    }
  }
  function cleanElement(element) {
    if (blockedTags.has(element.tagName.toUpperCase())) { element.remove(); return; }
    for (const attribute of arrayFrom(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.replace(/[\u0000-\u0020\u007f]/g, "");
      if (name.startsWith("on") || ["srcdoc", "nonce", "autofocus", "target", "formtarget"].includes(name) ||
        (urlAttributes.has(name) && !(name === "href" && /^(#|mailto:|tel:|https?:\/\/)/i.test(value)) && !(name === "src" && /^data:image\/(png|gif|jpe?g|webp);base64,/i.test(value)))) element.removeAttribute(attribute.name);
    }
    if (element.hasAttribute("style")) {
      for (const property of arrayFrom(element.style)) {
        if (/url\s*\(|expression\s*\(|-moz-binding/i.test(decodeCss(element.style.getPropertyValue(property)))) element.style.removeProperty(property);
      }
    }
    if (element.tagName === "STYLE") element.textContent = cleanCss(element.textContent);
    if (element.tagName === "TEMPLATE") cleanTree(element.content);
  }
  function cleanTree(root) { for (const element of arrayFrom(root.querySelectorAll("*"))) cleanElement(element); }
  const parsed = new Parser().parseFromString(payload.html, "text/html");
  cleanTree(parsed);
  const bodyNodes = arrayFrom(parsed.body.childNodes);
  const headNodes = arrayFrom(parsed.head.children).filter(element => element.tagName === "STYLE");
  const attributes = element => arrayFrom(element.attributes, attribute => [attribute.name, attribute.value]);
  const htmlAttributes = attributes(parsed.documentElement);
  const bodyAttributes = attributes(parsed.body);
  bootstrap.remove();

  const normalizationHost = createElement("design-check-context");
  normalizationHost.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none";
  const normalizationRoot = normalizationHost.attachShadow({ mode: "closed" });
  appendChild.call(document.documentElement, normalizationHost);
  let addedHeadNodes = [];
  function mount() {
    clearLearnerListeners();
    runtimeError = "";
    for (const node of addedHeadNodes) if (node.parentNode) removeChild.call(node.parentNode, node);
    addedHeadNodes = [];
    for (const [element, values] of [[document.documentElement, htmlAttributes], [document.body, bodyAttributes]]) {
      for (const attribute of arrayFrom(element.attributes)) element.removeAttribute(attribute.name);
      for (const [name, value] of values) element.setAttribute(name, value);
    }
    replaceChildren.call(document.body, ...bodyNodes.map(node => importNode(node, true)));
    for (const node of headNodes) {
      const copied = importNode(node, true);
      appendChild.call(document.head, copied);
      addedHeadNodes.push(copied);
    }
    const stylesheet = createElement("style");
    stylesheet.textContent = cleanCss(payload.css);
    appendChild.call(document.head, stylesheet);
    addedHeadNodes.push(stylesheet);
    if (payload.fitContent) {
      const fitStyles = createElement("style");
      fitStyles.textContent = "html,body{height:auto!important;min-height:0!important}";
      appendChild.call(document.head, fitStyles);
      addedHeadNodes.push(fitStyles);
    }
    if (payload.allowJavaScript && payload.js.trim()) {
      const script = createElement("script");
      script.nonce = nonce;
      // A function scope lets a reset execute const/let declarations afresh.
      script.textContent = `(() => { "use strict";\n${payload.js}\n})();\n//# sourceURL=web-design-learner.js`;
      registeringLearner = true;
      try { appendChild.call(document.head, script); }
      catch (error) { runtimeError = describeError(error); send("error", { error: runtimeError }); }
      finally { registeringLearner = false; if (script.parentNode) removeChild.call(script.parentNode, script); }
      // On the first mount the browser will fire its normal ready events. A
      // later isolated check also supports solutions that wait for DOM ready.
      if (document.readyState !== "loading") dispatch.call(document, new NativeEvent("DOMContentLoaded", { bubbles: true }));
      if (document.readyState === "complete") dispatch.call(window, new NativeEvent("load"));
    }
  }
  function query(selector) {
    try { return arrayFrom(queryAll.call(document, selector || "body")).filter(element => element === document.body || document.body.contains(element)); }
    catch { return []; }
  }
  function normalizedStyle(element, property, value) {
    const probe = createElement(element.localName === "svg" ? "div" : element.localName);
    const container = createElement("div");
    const parentStyle = getStyle(element.parentElement || document.body);
    container.style.cssText = `width:${parentStyle.width};height:${parentStyle.height};box-sizing:${parentStyle.boxSizing};padding:${parentStyle.padding};font-size:${parentStyle.fontSize};color:${parentStyle.color};`;
    const actualStyle = getStyle(element);
    for (const name of actualStyle) probe.style.setProperty(name, actualStyle.getPropertyValue(name));
    probe.style.removeProperty(property);
    probe.style.setProperty(property, string(value));
    if (!probe.style.getPropertyValue(property)) return string(value).trim();
    appendChild.call(container, probe);
    appendChild.call(normalizationRoot, container);
    const normalized = getStyle(probe).getPropertyValue(property).trim();
    removeChild.call(normalizationRoot, container);
    return normalized;
  }
  function staticCheck(check) {
    const found = query(check.selector);
    const element = found[0];
    if (check.type === "exists") return check.count === undefined ? found.length >= (check.minCount ?? 1) : found.length === check.count;
    if (check.type === "text") return found.some(match => check.equals === undefined ? cleanText(match.textContent).includes(cleanText(check.includes)) : cleanText(match.textContent) === cleanText(check.equals));
    if (check.type === "attribute") return !!element && (check.value === undefined ? element.hasAttribute(check.name) : element.getAttribute(check.name) === string(check.value));
    if (check.type === "children") {
      if (!element) return false;
      const count = arrayFrom(element.children).filter(child => elementMatches.call(child, check.childSelector || "*")).length;
      return check.count === undefined ? count >= (check.minCount ?? 1) : count === check.count;
    }
    if (check.type === "style" && element && check.property) {
      // A responsive target can declare the value it expects at the current
      // preview width without accepting desktop styles on a narrow screen.
      let expectedValue = check.value;
      for (const breakpoint of Array.isArray(check.responsive) ? check.responsive : []) {
        if ((breakpoint.minWidth === undefined || innerWidth >= breakpoint.minWidth) && (breakpoint.maxWidth === undefined || innerWidth <= breakpoint.maxWidth)) expectedValue = breakpoint.value;
      }
      const property = check.property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      const actualStyle = getStyle(element);
      const actual = actualStyle.getPropertyValue(property).trim();
      if (check.ratioTo) {
        const numerator = parseFloat(actual);
        const denominator = parseFloat(actualStyle.getPropertyValue(check.ratioTo));
        return finite(numerator) && denominator > 0 && Math.abs(numerator / denominator - number(expectedValue)) <= (check.tolerance ?? 0.001);
      }
      return actual !== "" && actual === normalizedStyle(element, property, expectedValue);
    }
    return false;
  }
  function act(action) {
    const element = query(action.selector)[0];
    if (!element) return false;
    if (action.type === "click") {
      if (element instanceof HTMLElement) nativeClick.call(element);
      else dispatch.call(element, new NativeMouseEvent("click", { bubbles: true, cancelable: true }));
      return true;
    }
    if (action.type === "input" || action.type === "change") {
      if (action.value !== undefined) {
        const setter = valueSetters.find(([type]) => element instanceof type)?.[1];
        if (!setter) return false;
        setter.call(element, string(action.value));
      }
      dispatch.call(element, new NativeEvent(action.type, { bubbles: true }));
      return true;
    }
    return false;
  }
  async function runChecks() {
    const results = [];
    for (const check of payload.checks) {
      let passed = false;
      try {
        if (check.type === "behavior") {
          if (check.reset !== false) mount();
          let actionsPassed = true;
          for (const action of check.actions || []) {
            if (!act(action)) { actionsPassed = false; break; }
            // Let synchronous events and promise continuations update the DOM.
            await new Promise(resolve => delay(resolve, 0));
          }
          const expected = Array.isArray(check.expect) ? check.expect : [check.expect];
          passed = actionsPassed && expected.length > 0 && expected.every(expectation => expectation && staticCheck(expectation));
        } else passed = staticCheck(check);
      } catch { passed = false; }
      if (runtimeError) passed = false;
      results.push({ passed, label: string(check.label || check.message || "Page requirement"), message: string(check.message || check.label || "Check this page requirement."), weight: finite(number(check.weight)) && number(check.weight) > 0 ? number(check.weight) : 1, essential: check.essential === true });
    }
    return results;
  }
  addListener.call(document, "click", event => { if (event.target instanceof Element && event.target.closest("a, area")) event.preventDefault(); }, true);
  addListener.call(document, "auxclick", event => { if (event.target instanceof Element && event.target.closest("a, area")) event.preventDefault(); }, true);
  addListener.call(document, "submit", event => event.preventDefault(), true);
  addListener.call(window, "message", async event => {
    if (event.source !== parentWindow || !event.data || event.data.channel !== payload.channel || event.data.type !== "check" || checking) return;
    const requestId = event.data.requestId;
    if (typeof requestId !== "string" && typeof requestId !== "number") return;
    checking = true;
    try {
      const checks = await runChecks();
      send("checked", { requestId, checks, ...(runtimeError ? { error: runtimeError } : {}) });
    } catch (error) { send("checked", { requestId, checks: [], error: describeError(error) }); }
    finally { checking = false; }
  });
  mount();
  // A timer still reports readiness for previews below the viewport, where a
  // browser can defer animation frames indefinitely.
  let announced = false;
  const ready = () => { if (!announced) { announced = true; send("ready", { ...(runtimeError ? { error: runtimeError } : {}) }); } };
  frame(ready);
  delay(ready, 40);
}

/** Render only inside an opaque-origin iframe with sandbox="allow-scripts". */
export function buildDesignPreview({ html = "", css = "", js = "", checks = [], channel = "methodlab-design-preview", reference = false, allowJavaScript = false, fitContent = false } = {}) {
  const bytes = new Uint8Array(18);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  const nonce = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const payload = { html: String(html), css: String(css), js: String(js), checks: Array.isArray(checks) ? checks : [], channel: String(channel), reference: Boolean(reference), allowJavaScript: Boolean(allowJavaScript), fitContent: Boolean(fitContent) };
  // A nonce alone can authorize an external script URL when learner JS copies
  // its current script's nonce. The element directive permits inline execution
  // while denying every external script URL, even one carrying that nonce.
  const policy = `default-src 'none'; script-src 'nonce-${nonce}'; script-src-elem 'unsafe-inline'; script-src-attr 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><title>${reference ? "Target design" : "Your design"}</title></head><body><script nonce="${nonce}">(${designRuntime.toString()})(${scriptData(payload)});</script></body></html>`;
}

/** Grade rendered requirements rather than comparing learners' source code. */
export function gradeDesignChecks(checks = []) {
  if (!Array.isArray(checks) || checks.length === 0) return { score: 0, passed: false, perfect: false, improvements: ["Run the page checks to see what needs improvement."] };
  let possible = 0;
  let earned = 0;
  for (const check of checks) {
    const weight = Number.isFinite(Number(check.weight)) && Number(check.weight) > 0 ? Number(check.weight) : 1;
    possible += weight;
    if (check.passed === true) earned += weight;
  }
  const perfect = checks.every(check => check.passed === true);
  const score = perfect ? 100 : Math.min(99, Math.round(100 * earned / possible));
  const essentialsPassed = checks.every(check => !check.essential || check.passed === true);
  const improvements = checks.filter(check => check.passed !== true).map(check => String(check.message || check.label || "Complete the missing page requirement."));
  return { score, passed: perfect || (score >= 80 && essentialsPassed), perfect, improvements };
}
