import { lessons, defaultConfig } from "./lessons.mjs";
import { buildTrace } from "./engine.mjs";
import { expandedPythonMethods } from "./python-engine.mjs";

function generate(lesson, scenario, ctx) {
  const config = defaultConfig(lesson), id = lesson.id;
  const values = Array.from({length: 2 + scenario % 5}, () => ctx.int(1, 50));
  const token = `${ctx.word()}${ctx.int(1, 999)}`;
  let prompt = "result", explanation = lesson.description;
  if (["min", "max"].includes(id)) {
    const variants = [values, values.map(v => -v), [0, ...values], [...values, values[0]], [...values].reverse(), values.map(v => v / 2), [values[0]], values.map((v, i) => i % 2 ? -v : v)];
    config.input = JSON.stringify(variants[scenario]);
  } else if (["any", "all"].includes(id)) {
    const variants = [[0, values[0], 0], [values[0], false, token], [false, null, 0, ""], [token, true, values[0]], [0, "", token], [true, values[0], null], ["", -values[0], false], [values[0], token, true, 0]];
    config.input = JSON.stringify(variants[scenario]);
    explanation = `${lesson.description} Zero, False, None, and the empty string are falsy; nonzero numbers and nonempty strings are truthy.`;
  } else if (lesson.group === "List methods") {
    let input = scenario === 6 ? [token, ctx.word(), token] : scenario === 7 && id !== "sort" ? [true, 1, false, values[0]] : scenario === 3 ? [values[0], ...values, values[0]] : values;
    config.input = JSON.stringify(input);
    if (id === "extend") config.additions = JSON.stringify(scenario === 5 ? [] : scenario === 6 ? [ctx.word(), token] : [ctx.int(51, 99), ctx.int(51, 99)]);
    if (id === "insert") { config.parameter = String([0, 1, -1, input.length, -999, 999, 2, -2][scenario]); config.extra = JSON.stringify(scenario === 6 ? ctx.word() : ctx.int(51, 99)); }
    if (id === "pop") config.parameter = ["", "0", "-1", "1", String(input.length - 1), String(-input.length), "1", "-2"][scenario];
    if (id === "remove") config.parameter = JSON.stringify(input[scenario % input.length]);
    if (id === "sort") { config.operation = scenario === 6 ? "text" : scenario % 2 ? "descending" : "ascending"; }
    prompt = scenario % 3 === 0 ? "result" : scenario % 3 === 1 ? "items" : "[result, items]";
    explanation = `${lesson.description} ${id === "pop" ? "pop() returns the removed item." : "The method returns None."} ${prompt === "items" ? "The final expression asks for the changed list." : prompt === "[result, items]" ? "The final expression includes the return value and the changed list." : "The final expression asks for the return value."}`;
  } else if (lesson.group === "String methods") {
    const variants = [token, ` ${token} `, `${token},${token}`, `${token.toUpperCase()}!`, `__${token}__`, `${token} ${ctx.word()}`, `😀${token}`, `${token}ß`];
    config.input = variants[scenario];
    if (id === "replace") { config.parameter = scenario === 6 ? "" : token; config.extra = scenario === 3 ? "$&" : `${ctx.word()}${ctx.int(1, 99)}`; }
    if (id === "strip") { config.input = scenario % 2 ? `  ${variants[scenario]}\t ` : `__${variants[scenario]}__`; config.parameter = scenario % 2 ? "" : "_"; }
  } else {
    const data = Object.fromEntries(Array.from({length: 2 + scenario % 4}, (_, i) => [`${token}_${i}`, scenario % 3 === 0 ? ctx.int(1, 99) : scenario % 3 === 1 ? `${ctx.word()}${ctx.int(1, 99)}` : i % 2 === 0]));
    config.input = JSON.stringify(data);
    explanation = `${lesson.description} ${id === "keys" ? "Collect only the keys." : id === "values" ? "Collect only the stored values." : "Each entry becomes a (key, value) tuple."} list() displays a snapshot in insertion order.`;
  }
  const trace = buildTrace(lesson, config);
  const value = prompt === "items" ? trace.mutated : prompt === "[result, items]" ? [trace.result, trace.mutated] : trace.result;
  const code = trace.code.split("\n").filter(line => !line.trimStart().startsWith("#")).join("\n");
  return { code: `${code}\n${prompt}`, value, distractors: [trace.input, trace.mutated, values[0], values.length, null, [], true, false, token], explanation };
}

export const expandedPythonTemplates = Object.fromEntries(lessons.python.filter(lesson => expandedPythonMethods.has(lesson.id)).map(lesson => [lesson.id, Array.from({length: 8}, (_, scenario) => ctx => generate(lesson, scenario, ctx))]));
