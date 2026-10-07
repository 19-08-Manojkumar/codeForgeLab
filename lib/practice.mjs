import { webSessions } from "./web-lessons.mjs";
import { stripCodeComments } from "./code-comments.mjs";

export const programmingLanguages = {
  javascript: { name: "JavaScript", mark: "JS", extension: "js", description: "Arrays, objects, functions, and the language of the web." },
  python: { name: "Python", mark: "Py", extension: "py", description: "Readable code, lists, dictionaries, and useful built-ins." },
  java: { name: "Java", mark: "Jv", extension: "java", description: "Types, classes, collections, and structured problem solving." },
  c: { name: "C", mark: "C", extension: "c", description: "Functions, arrays, pointers, and how memory works." },
};

export const languages = { ...programmingLanguages, ...webSessions };

export const practicePaths = [
  { id: "methods", number: "01", title: "Methods & functions", icon: "code", description: "Understand everyday operations, follow examples, and check what they return.", action: "Explore the toolbox" },
  { id: "basics", number: "02", title: "Programming basics", icon: "book", description: "Build your foundation, one topic at a time. Read, trace, and practice.", action: "Build your foundation" },
  { id: "interviews", number: "03", title: "Interview preparation", icon: "bulb", description: "Practice explaining your thinking with questions grouped by topic.", action: "Prepare your answers" },
  { id: "problems", number: "04", title: "Coding problems", icon: "flask", description: "Complete guided code exercises with hints, solutions, and worked examples.", action: "Solve a problem" },
];

export function filterPracticeEntries(entries, query = "", group = "all") {
  const terms = query.toLowerCase().trim().split(/\s+/u).filter(Boolean);
  return entries.filter(entry => (group === "all" || entry.group === group) && terms.every(term => [entry.title, entry.name, entry.question, entry.group, entry.summary].filter(Boolean).join(" ").toLowerCase().includes(term)));
}

// Only remove formatting whitespace, preserving spaces and escapes inside literals.
export function normalizeExpression(value) {
  let result = "", quote = null;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) { result += char; if (char === "\\" && i + 1 < value.length) result += value[++i]; else if (char === quote) quote = null; }
    else if (["'", '"', "`"].includes(char)) { quote = char; result += char; }
    else if (!/\s/u.test(char)) result += char;
  }
  result = result.replace(/;$/u, "");
  // Ignore a balanced pair of parentheses around the entire expression.
  while (result.startsWith("(") && result.endsWith(")")) {
    let depth = 0, wraps = true, inQuote = null;
    for (let i = 0; i < result.length; i++) { const char = result[i]; if (inQuote) { if (char === "\\") i++; else if (char === inQuote) inQuote = null; } else if (["'", '"', "`"].includes(char)) inQuote = char; else if (char === "(") depth++; else if (char === ")" && --depth === 0 && i !== result.length - 1) { wraps = false; break; } }
    if (!wraps || depth !== 0) break;
    result = result.slice(1, -1);
  }
  return result;
}

export function checkGuidedExpression(problem, value, language = "javascript") {
  const normalized = normalizeExpression(stripCodeComments(String(value), language));
  if (!normalized) return { correct: false, message: "Enter the missing expression first." };
  if (value.length > 500) return { correct: false, message: "Keep the expression under 500 characters." };
  const correct = problem.answers.some(answer => normalizeExpression(answer) === normalized);
  return { correct, message: correct ? problem.explanation : "That expression does not match this exercise's approach yet. Read the hint and try again." };
}

export function normalizeOutput(value) { return String(value).replace(/\r\n?/gu, "\n").trim(); }
