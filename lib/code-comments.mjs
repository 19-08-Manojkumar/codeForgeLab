export function toggleCodeComments(value, selectionStart, selectionEnd, language) {
  const start = selectionStart > 0 ? value.lastIndexOf("\n", selectionStart - 1) + 1 : 0;
  const last = selectionEnd > selectionStart && value[selectionEnd - 1] === "\n" ? selectionEnd - 1 : selectionEnd;
  const nextLine = value.indexOf("\n", last), end = nextLine < 0 ? value.length : nextLine;
  const opening = language === "html" ? "<!-- " : language === "css" ? "/* " : language === "python" ? "# " : "// ";
  const closing = language === "html" ? " -->" : language === "css" ? " */" : "";
  const lines = value.slice(start, end).split("\n");
  const parts = lines.map(line => {
    const cr = line.endsWith("\r") ? "\r" : "", text = cr ? line.slice(0, -1) : line;
    const indent = text.match(/^\s*/)[0], body = text.slice(indent.length);
    const match = language === "html" ? body.match(/^<!--\s?([\s\S]*?)\s?-->$/) : language === "css" ? body.match(/^\/\*\s?([\s\S]*?)\s?\*\/$/) : body.match(language === "python" ? /^# ?([\s\S]*)$/ : /^\/\/ ?([\s\S]*)$/);
    return { indent, body, cr, match };
  });
  const nonempty = parts.filter(part => part.body.trim());
  const removing = nonempty.length > 0 && nonempty.every(part => part.match);
  if (!removing && closing && nonempty.some(part => !part.match && (language === "html" ? /<!--|-->/.test(part.body) : /\/\*|\*\//.test(part.body)))) {
    throw new TypeError("A selected line already contains an embedded comment. Edit that comment directly or select other lines.");
  }
  const changed = parts.map(part => !part.body.trim() ? part.indent + part.body + part.cr : removing ? part.indent + part.match[1] + part.cr : part.match ? part.indent + part.body + part.cr : part.indent + opening + part.body + closing + part.cr).join("\n");
  const result = value.slice(0, start) + changed + value.slice(end);
  const delta = parts[0]?.body.trim() ? removing ? -(parts[0].body.length - parts[0].match[1].length - closing.length) : parts[0].match ? 0 : opening.length : 0;
  const cursor = Math.max(start, Math.min(start + changed.length, selectionStart + delta));
  return { value: result, selectionStart: selectionStart === selectionEnd ? cursor : start, selectionEnd: selectionStart === selectionEnd ? cursor : start + changed.length };
}

// Guided expressions can carry learner notes without treating comment text as code.
// Quotes are preserved, including // in URLs and # inside Python strings.
export function stripCodeComments(value, language = "javascript") {
  let result = "", quote = null;
  for (let index = 0; index < value.length; index++) {
    const char = value[index], next = value[index + 1];
    if (quote) {
      result += char;
      if (char === "\\" && index + 1 < value.length) result += value[++index];
      else if (char === quote) quote = null;
    } else if (["'", '"', "`"].includes(char)) { quote = char; result += char; }
    else if (language === "python" && char === "#" || language !== "python" && char === "/" && next === "/") {
      while (index < value.length && value[index] !== "\n") index++;
      result += "\n";
    } else if (language !== "python" && char === "/" && next === "*") {
      index += 2;
      while (index < value.length && !(value[index] === "*" && value[index + 1] === "/")) index++;
      index++; result += " ";
    } else result += char;
  }
  return result;
}
