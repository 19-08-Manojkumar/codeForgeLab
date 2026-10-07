// Learner markup is data. The only executable script belongs to this preview.
const scriptData = value => JSON.stringify(value)
  .replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function previewRuntime(payload) {
  "use strict";
  const blockedTags = new Set(["SCRIPT", "BASE", "META", "LINK", "IFRAME", "OBJECT", "EMBED", "FRAME", "FRAMESET", "PORTAL"]);
  const omittedTags = new Set(["STYLE", "TITLE", "TEMPLATE"]);
  const urlAttributes = new Set(["href", "src", "xlink:href", "action", "formaction", "poster", "data", "background"]);
  const properties = Array.from(new Set([...(payload.inspectProperties || []), "color", "background-color", "display", "font-size", "font-weight", "padding", "margin", "border-radius", "width", "height", "gap", "grid-template-columns", "flex-direction", "border", "text-align", "align-items", "justify-content", "box-sizing"]));
  const parsed = new DOMParser().parseFromString(payload.html, "text/html");

  function cleanElement(element) {
    if (blockedTags.has(element.tagName.toUpperCase())) {
      element.remove();
      return;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || name === "nonce" || name === "autofocus" ||
        (urlAttributes.has(name) && /^(?:(?:javascript|vbscript):|data:text\/html(?:[;,]|$))/.test(value))) element.removeAttribute(attribute.name);
    }
    // Template contents are a separate DOM tree and must be cleaned too.
    if (element.tagName === "TEMPLATE") cleanTree(element.content);
  }

  function cleanTree(root) {
    for (const element of Array.from(root.querySelectorAll("*"))) cleanElement(element);
  }

  cleanTree(parsed);
  for (const [from, to] of [[parsed.documentElement, document.documentElement], [parsed.body, document.body]]) {
    for (const attribute of Array.from(from.attributes)) to.setAttribute(attribute.name, attribute.value);
  }
  for (const element of Array.from(parsed.head.children)) document.head.appendChild(document.importNode(element, true));
  document.body.replaceChildren(...Array.from(parsed.body.childNodes, node => document.importNode(node, true)));
  const stylesheet = document.createElement("style");
  stylesheet.textContent = payload.css;
  document.head.appendChild(stylesheet);

  // A shadow overlay highlights the selected box without changing its styles.
  const overlayHost = document.createElement("div");
  overlayHost.setAttribute("aria-hidden", "true");
  for (const [property, value] of Object.entries({ all: "initial", position: "fixed", top: "0", left: "0", width: "0", height: "0", margin: "0", padding: "0", border: "0", "pointer-events": "none", "z-index": "2147483647", display: "block" })) overlayHost.style.setProperty(property, value, "important");
  const overlayRoot = overlayHost.attachShadow({ mode: "closed" });
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;box-sizing:border-box;border:2px solid #4f46e5;pointer-events:none;display:none;";
  overlayRoot.appendChild(overlay);
  document.documentElement.appendChild(overlayHost);
  let inspectionEnabled = true;
  let selected = null;
  let selectedPseudo = null;

  const elements = () => [document.body, ...document.body.querySelectorAll("*")].filter(element => !omittedTags.has(element.tagName));
  const shortText = element => (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const escape = value => CSS.escape(value);
  function selectorFor(element) {
    if (element.id && document.querySelectorAll(`#${escape(element.id)}`).length === 1) return `#${escape(element.id)}`;
    if (element === document.body) return "body";
    const parts = [];
    let current = element;
    while (current && current !== document.body && current !== document.documentElement) {
      const siblings = current.parentElement ? Array.from(current.parentElement.children).filter(child => child.tagName === current.tagName) : [current];
      parts.unshift(`${current.localName}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : ""}`);
      current = current.parentElement;
    }
    return `body > ${parts.join(" > ")}`;
  }

  function pseudoSelector(selector) {
    const match = selector.trim().match(/^(.*?)(::?(before|after|marker|placeholder))$/);
    return match ? { selector: match[1] || "*", pseudo: `::${match[3]}` } : { selector, pseudo: null };
  }

  function matchingCss(element, pseudo = null) {
    const matches = [];
    function visit(rules) {
      for (const rule of rules) {
        if (matches.length >= 40) return;
        if (rule.selectorText && rule.style) {
          try {
            const matched = pseudo
              ? rule.selectorText.split(/,(?![^(]*\))/).some(selector => { const target = pseudoSelector(selector); return target.pseudo === pseudo && element.matches(target.selector); })
              : element.matches(rule.selectorText);
            if (matched) matches.push({ selector: rule.selectorText, declarations: rule.style.cssText });
          } catch {}
        } else if (rule.cssRules) {
          if (rule.constructor.name === "CSSMediaRule" && !matchMedia(rule.conditionText).matches) continue;
          if (rule.constructor.name === "CSSSupportsRule" && !CSS.supports(rule.conditionText)) continue;
          visit(rule.cssRules);
        }
      }
    }
    for (const sheet of document.styleSheets) { try { visit(sheet.cssRules); } catch {} }
    if (!pseudo && element.getAttribute("style")) matches.push({ selector: "element.style", declarations: element.style.cssText });
    return matches;
  }

  function describe(element, pseudo = selectedPseudo) {
    if (!element) return null;
    const style = getComputedStyle(element, pseudo);
    return {
      index: elements().indexOf(element), tag: element.localName, pseudo, id: element.id,
      classes: Array.from(element.classList), selector: `${selectorFor(element)}${pseudo || ""}`, text: shortText(element),
      attributes: Array.from(element.attributes, attribute => ({ name: attribute.name, value: attribute.value.slice(0, 400) })),
      parentTag: pseudo ? element.localName : element.parentElement?.localName || null,
      children: pseudo ? [] : Array.from(element.children, child => child.localName),
      styles: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])),
      matchingCss: matchingCss(element, pseudo),
    };
  }

  function updateOverlay() {
    if (!selected || !inspectionEnabled || !selected.isConnected) { overlay.style.display = "none"; return; }
    const box = selected.getBoundingClientRect();
    Object.assign(overlay.style, { display: "block", left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  }

  const send = (type, data = {}) => parent.postMessage({ channel: payload.channel, type, ...data }, "*");
  function select(element, pseudo = null) {
    selected = element; selectedPseudo = pseudo;
    updateOverlay();
    send("inspection", { inspection: describe(element) });
  }

  const nodes = () => elements().slice(0, 250).map((element, index) => ({ index, tag: element.localName, id: element.id, classes: Array.from(element.classList), text: shortText(element), selector: selectorFor(element) }));
  function query(selector) {
    try { return Array.from(document.querySelectorAll(selector)).filter(element => element !== overlayHost && !overlayHost.contains(element)); } catch { return []; }
  }

  function normalizedStyle(element, property, value) {
    const probe = document.createElement(element.localName === "svg" ? "div" : element.localName);
    const container = document.createElement("div");
    const parentStyle = getComputedStyle(element.parentElement || document.body);
    container.style.cssText = `position:fixed;visibility:hidden;width:${parentStyle.width};height:${parentStyle.height};box-sizing:${parentStyle.boxSizing};padding:${parentStyle.padding};font-size:${parentStyle.fontSize};color:${parentStyle.color};`;
    const actualStyle = getComputedStyle(element);
    // Preserve context such as border style and grid dimensions while asking
    // the browser to serialize the expected value in the same way.
    for (const name of actualStyle) probe.style.setProperty(name, actualStyle.getPropertyValue(name));
    probe.style.removeProperty(property);
    probe.style.setProperty(property, String(value));
    if (!probe.style.getPropertyValue(property)) return String(value).trim().toLowerCase();
    container.appendChild(probe);
    overlayRoot.appendChild(container);
    const normalized = getComputedStyle(probe).getPropertyValue(property).trim();
    container.remove();
    return normalized;
  }

  function runChecks() {
    return payload.checks.map(check => {
      const found = query(check.selector || "body");
      const element = found[0];
      let passed = false;
      try {
        if (check.type === "exists") passed = check.count === undefined ? found.length >= (check.minCount ?? 1) : found.length === check.count;
        else if (check.type === "text") passed = found.some(match => check.equals === undefined ? (match.textContent || "").includes(String(check.includes ?? "")) : (match.textContent || "").trim() === String(check.equals));
        else if (check.type === "attribute") passed = !!element && (check.value === undefined ? element.hasAttribute(check.name) : element.getAttribute(check.name) === String(check.value));
        else if (check.type === "children") passed = !!element && Array.from(element.children).filter(child => child.matches(check.childSelector || "*")).length >= (check.minCount ?? 1);
        else if (check.type === "style" && element && check.property) {
          const property = check.property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
          const actualStyle = getComputedStyle(element);
          const actual = actualStyle.getPropertyValue(property).trim();
          if (check.ratioTo) {
            const numerator = parseFloat(actual);
            const denominator = parseFloat(actualStyle.getPropertyValue(check.ratioTo));
            passed = Number.isFinite(numerator) && denominator > 0 && Math.abs(numerator / denominator - Number(check.value)) <= 0.001;
          } else passed = actual !== "" && actual === normalizedStyle(element, property, check.value);
        }
      } catch {}
      return { passed, message: String(check.message || check.label || check.description || `Check ${check.selector || "the page"}`) };
    });
  }

  document.addEventListener("click", event => {
    // Links remain visible and inspectable, but cannot leave the exercise.
    if (event.target instanceof Element && event.target.closest("a, area")) event.preventDefault();
    if (!inspectionEnabled || !(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.target === document.body || document.body.contains(event.target)) select(event.target);
  }, true);
  document.addEventListener("submit", event => event.preventDefault(), true);
  document.addEventListener("auxclick", event => { if (event.target instanceof Element && event.target.closest("a, area")) event.preventDefault(); }, true);
  document.addEventListener("scroll", updateOverlay, true);
  window.addEventListener("resize", () => {
    updateOverlay();
    if (selected) send("inspection", { inspection: describe(selected) });
  });
  window.addEventListener("message", event => {
    if (event.source !== parent || !event.data || event.data.channel !== payload.channel) return;
    const message = event.data;
    if (message.type === "check") send("checked", { checks: runChecks(), nodes: nodes(), inspection: describe(selected) });
    else if (message.type === "inspect") select(elements()[message.index] || null);
    else if (message.type === "inspect-selector") { const target = pseudoSelector(String(message.selector || "")); select(query(target.selector)[0] || null, target.pseudo); }
    else if (message.type === "set-inspect") { inspectionEnabled = Boolean(message.enabled); updateOverlay(); }
  });
  requestAnimationFrame(() => {
    selected = elements().find(element => element !== document.body) || document.body;
    updateOverlay();
    send("ready", { nodes: nodes(), inspection: describe(selected), checks: [] });
  });
}

/** Use the result only in an iframe with sandbox="allow-scripts". */
export function buildWebPreview({ html = "", css = "", lesson = {}, channel = "methodlab-web-preview" } = {}) {
  const bytes = new Uint8Array(18);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  const nonce = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const inspectProperties = typeof lesson.property === "string" && /^[a-z-]{1,100}$/.test(lesson.property) ? [lesson.property] : [];
  const payload = { html: String(html), css: String(css), channel: String(channel), inspectProperties, checks: Array.isArray(lesson.checks) ? lesson.checks : Array.isArray(lesson.challenge?.checks) ? lesson.challenge.checks : [] };
  const policy = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><title>Live browser preview</title></head><body><script nonce="${nonce}">(${previewRuntime.toString()})(${scriptData(payload)});</script></body></html>`;
}
