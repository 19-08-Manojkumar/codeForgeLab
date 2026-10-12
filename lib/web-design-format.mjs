const htmlVoidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

export function formatDesignHtml(source) {
  const tokens = String(source).match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/gu) || [];
  const lines = [];
  let depth = 0;
  for (const token of tokens) {
    const value = token.trim();
    if (!value) continue;
    if (/^<\//u.test(value)) depth = Math.max(0, depth - 1);
    lines.push(`${"  ".repeat(depth)}${value}`);
    const opening = value.match(/^<([a-z][\w:-]*)\b[^>]*>$/iu);
    if (opening && !/^<\//u.test(value) && !/\/>$/u.test(value) && !htmlVoidElements.has(opening[1].toLowerCase())) depth++;
  }
  return lines.join("\n");
}

function formatBracedCode(source, language) {
  const input = String(source).trim();
  if (!input) return "";
  const lines = [];
  let line = "", indent = 0, quote = "", escaped = false, lineComment = false, blockComment = false, parentheses = 0;
  const pushLine = () => {
    const value = line.trim();
    if (value) lines.push(`${"  ".repeat(indent)}${value}`);
    line = "";
  };
  for (let index = 0; index < input.length; index++) {
    const character = input[index], next = input[index + 1];
    if (lineComment) {
      line += character;
      if (character === "\n") { pushLine(); lineComment = false; }
      continue;
    }
    if (blockComment) {
      line += character;
      if (character === "*" && next === "/") { line += next; index++; blockComment = false; }
      continue;
    }
    if (quote) {
      line += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "/") { line += "//"; index++; lineComment = true; continue; }
    if (character === "/" && next === "*") { line += "/*"; index++; blockComment = true; continue; }
    if (character === "'" || character === '"' || language === "js" && character === "`") { quote = character; line += character; continue; }
    if (language === "js" && character === "(") parentheses++;
    if (language === "js" && character === ")") parentheses = Math.max(0, parentheses - 1);
    if (character === "{") {
      line = `${line.trimEnd()} {`;
      pushLine(); indent++;
    } else if (character === "}") {
      if (language === "css" && line.trim() && !line.trimEnd().endsWith(";")) line = `${line.trimEnd()};`;
      pushLine(); indent = Math.max(0, indent - 1); line = "}";
      if (language === "css") pushLine();
    } else if (character === ";" && language === "css") {
      line = `${line.trimEnd()};`; pushLine();
    } else if (character === ";" && language === "js") {
      line = `${line.trimEnd()};`; pushLine();
    } else if (character === "," && language === "js" && parentheses === 0) {
      line += ", "; 
    } else if (/\s/u.test(character)) {
      if (line && !line.endsWith(" ")) line += " ";
    } else line += character;
  }
  pushLine();
  return lines.join("\n");
}

export function formatDesignCss(source) {
  return formatBracedCode(source, "css");
}

export function formatDesignJavaScript(source) {
  return formatBracedCode(source, "js");
}

export function formatDesignCode(source, language) {
  if (language === "html") return formatDesignHtml(source);
  if (language === "css") return formatDesignCss(source);
  if (language === "js") return formatDesignJavaScript(source);
  throw new TypeError("Unsupported Web Design answer language.");
}
