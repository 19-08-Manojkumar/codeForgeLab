import { buildTrace, format } from "./engine.mjs";
import { buildNativeTrace, nativeExperiments } from "./native-animation.mjs";

export function animationFormat(value, language) {
  if (value === undefined && ["java", "c"].includes(language)) return "void";
  return format(value, language);
}

function modeFor(lesson) {
  const id = lesson.id;
  if (id === "filter") return "filter";
  if (["find", "findIndex", "includes", "some", "every", "any", "all"].includes(id)) return "search";
  if (["reduce", "sum", "min", "max"].includes(id)) return "accumulate";
  if (["sort", "sorted", "reverse"].includes(id)) return "sort";
  if (["keys", "values", "entries", "items", "get"].includes(id)) return "lookup";
  if (["len", "range"].includes(id)) return "count";
  if (["slice", "substring"].includes(id)) return "select";
  if (lesson.mutates) return "mutation";
  if (id === "forEach") return "output";
  if (["replace", "trim", "strip", "split", "join", "toLowerCase", "toUpperCase", "lower", "upper"].includes(id)) return "text";
  return "transform";
}

function condition(value, config) {
  return config.operation === "even" ? value % 2 === 0 : config.operation === "greater" ? value > Number(config.parameter) : config.operation === "less" ? value < Number(config.parameter) : String(value).includes(config.parameter);
}
function conditionText(value, config, fmt) {
  return config.operation === "even" ? `${fmt(value)} % 2 === 0` : config.operation === "greater" ? `${fmt(value)} > ${config.parameter}` : config.operation === "less" ? `${fmt(value)} < ${config.parameter}` : `${fmt(value)}.includes(${fmt(config.parameter)})`;
}

function refineText(trace, lesson, config) {
  const id = lesson.id;
  if (typeof trace.input !== "string" || !["trim", "strip", "toLowerCase", "toUpperCase", "lower", "upper", "substring", "split", "replace"].includes(id)) return trace;
  const py = lesson.language === "python", items = py ? Array.from(trace.input) : trace.input.split("");
  const indices = (begin, end) => { const start = py ? Array.from(trace.input.slice(0, begin)).length : begin, stop = py ? Array.from(trace.input.slice(0, end)).length : end; return Array.from({ length: Math.max(0, stop - start) }, (_, i) => start + i); };
  if (id === "split") {
    let cursor = 0;
    const frames = trace.result.map((piece, index) => {
      const start = py && config.operation === "whitespace" ? trace.input.indexOf(piece, cursor) : cursor, end = start + piece.length;
      cursor = end + (py && config.operation === "whitespace" ? 0 : config.parameter.length);
      return { active: indices(start, end), output: trace.result.slice(0, index + 1), working: null, expression: `piece ${index + 1} = ${format(piece, lesson.language)}`, note: `${piece ? "Collect the characters in this piece" : "Two adjacent or edge separators produce an empty piece"}. ${py && config.operation === "whitespace" ? "Runs of whitespace separate pieces; edge whitespace is ignored." : config.parameter === "" ? "An empty separator splits individual UTF-16 units." : `The separator ${format(config.parameter, lesson.language)} separates pieces and is left out of the result.`}` };
    });
    if (!frames.length) frames.push({ active: [], output: [], expression: trace.operationLabel, note: "This input and limit produce no pieces.", working: null });
    return { ...trace, items, secondaryItems: py && config.operation === "whitespace" ? null : Array.from(config.parameter), inputLabel: "Original text before splitting", frames: [trace.frames[0], ...frames] };
  }
  if (id === "replace") {
    const search = config.parameter, frames = []; let cursor = 0, partial = "", replaced = false;
    const emit = (start, end, piece, match) => { partial += piece; frames.push({ active: indices(start, end), output: partial, working: null, decision: match, expression: match ? `match ${format(search, lesson.language)} → ${format(piece, lesson.language)}` : `copy ${format(piece, lesson.language)}`, note: match ? py ? "Replace this literal match. Continue looking because Python replaces all matches in this example." : "Replace the first literal match. Later matches remain unchanged." : "Copy this character unchanged into the new text." }); };
    while (cursor <= trace.input.length) {
      const hit = (!replaced || py) && trace.input.startsWith(search, cursor);
      if (hit) {
        const replacement = py ? config.extra : trace.result.slice(cursor, trace.result.length - (trace.input.length - cursor - search.length));
        emit(cursor, cursor + search.length, replacement, true); replaced = true;
        if (search.length) { cursor += search.length; continue; }
      }
      if (cursor >= trace.input.length) break;
      const character = py ? Array.from(trace.input.slice(cursor))[0] : trace.input[cursor];
      emit(cursor, cursor + character.length, character, false); cursor += character.length;
    }
    if (!frames.length) frames.push({ active: [], output: trace.result, expression: trace.operationLabel, note: "The input is empty and no characters need copying.", working: null });
    frames.at(-1).output = trace.result;
    return { ...trace, items, secondaryItems: Array.from(search), frames: [trace.frames[0], ...frames] };
  }
  // Unicode case mapping may expand a character. Build fragments, then use the
  // complete-language result (which also handles contextual casing) at the end.
  let partial = "", start = 0, end = items.length;
  const selecting = ["trim", "strip", "substring"].includes(id);
  if (id === "substring") { start = trace.normalizedIndices.start; end = trace.normalizedIndices.end; }
  else if (selecting) { start = trace.result ? trace.input.indexOf(trace.result) : trace.input.length; end = start + trace.result.length; if (py) { start = Array.from(trace.input.slice(0, start)).length; end = start + Array.from(trace.result).length; } }
  const frames = items.map((character, index) => {
    const keep = !selecting || index >= start && index < end;
    const piece = selecting ? character : ["lower", "toLowerCase"].includes(id) ? character.toLowerCase() : character.toUpperCase();
    if (keep) partial += piece;
    return { active: [index], output: partial, working: null, decision: selecting ? keep : undefined, expression: selecting ? `${index} ${keep ? "is inside" : "is outside"} the retained interval` : `${format(character, lesson.language)} → ${format(piece, lesson.language)}`, note: selecting ? keep ? "Keep this character in the new string." : "Leave this character out of the new string." : "Convert this character and extend the new string; the original text is unchanged." };
  });
  if (!frames.length) frames.push({ active: [], output: trace.result, expression: trace.operationLabel, note: "The input is empty; there are no characters to process.", working: null });
  frames[frames.length - 1].output = trace.result;
  return { ...trace, items, frames: [trace.frames[0], ...frames] };
}

// Every operation separates observing an input from evaluating and committing it.
// Snapshots make backwards steps and scrubbing deterministic, with no hidden reruns.
export function buildAnimationTrace(lesson, config, language = lesson.language) {
  const native = !!nativeExperiments[lesson.id] && ["java", "c"].includes(language);
  let raw = native ? buildNativeTrace(lesson, config, language) : refineText(buildTrace(lesson, config), lesson, config);
  const mode = raw.mode || modeFor(lesson), fmt = value => animationFormat(value, language);
  const resultFmt = value => raw.resultPresentation === "label" && typeof value === "string" ? value : fmt(value);
  const phases = ["Read", ["filter", "check", "search", "compare"].includes(mode) ? "Check" : "Compute", mode === "filter" ? "Keep / skip" : ["mutation", "memory", "sort"].includes(mode) ? "Update" : "Collect", "Return"];
  const frames = [], records = [], processed = [], rejected = [], accepted = [];
  const initial = raw.frames[0];
  frames.push({ ...initial, stage: "ready", title: "Ready to trace", records: [], processed: [], rejected: [], accepted: [], focus: [], phase: -1, before: initial.output, after: initial.output });
  let prior = initial;
  for (const source of raw.frames.slice(1)) {
    const active = source.active || [], observed = mode === "sort" && prior.working ? prior.working : raw.items, focus = active.map(index => observed[index]).filter(value => value !== undefined);
    const isPredicate = !native && ["filter", "find", "findIndex", "some", "every"].includes(lesson.id);
    const decision = isPredicate && active.length ? condition(raw.items[active[0]], config) : source.decision;
    const evaluation = isPredicate && active.length ? conditionText(raw.items[active[0]], config, fmt) : source.expression;
    const snapshots = { records: [...records], processed: [...processed], rejected: [...rejected], accepted: [...accepted] };
    const shared = { ...source, ...snapshots, focus, evaluation, decision, before: source.before ?? prior.output, after: source.after ?? source.output, active, working: prior.working, output: prior.output, sideEffects: prior.sideEffects, consoleOutput: prior.consoleOutput, destinationActive: [] };
    const where = active.length ? `index ${active.join(", ")}` : "the operation arguments";
    frames.push({ ...shared, stage: "read", phase: 0, decision: undefined, title: `Read ${where}`, note: focus.length ? `Take ${focus.map(fmt).join(" and ")} from ${where}. ${mode === "filter" ? "The result is unchanged until the condition is checked." : "Keep the current result while evaluating this step."}` : "Read the arguments and the current state before applying the operation." });
    frames.push({ ...shared, stage: "evaluate", phase: 1, title: phases[1] === "Check" ? "Evaluate the condition" : "Compute the next state", note: decision === undefined ? source.note.replace(/ Final result:.*$/u, "") : `${evaluation} is ${decision ? "true" : "false"}. ${mode === "filter" ? decision ? "This item qualifies for the result." : "This item will be skipped." : source.note.replace(/ Final result:.*$/u, "")}` });
    active.forEach(index => { if (!processed.includes(index)) processed.push(index); });
    if (mode === "filter" && active.length) (decision ? accepted : rejected).push({ index: active[0], value: raw.items[active[0]] });
    records.push({ indices: [...active], value: focus, expression: evaluation, decision, action: mode === "filter" ? decision ? "Kept" : "Skipped" : mode === "search" && decision === true ? "Matched" : ["memory", "mutation", "sort"].includes(mode) ? "Updated" : "Recorded", result: source.output });
    frames.push({ ...source, focus, evaluation, decision, before: shared.before, after: shared.after, stage: "commit", phase: 2, title: mode === "filter" ? decision ? "Keep this item" : "Skip this item" : ["memory", "mutation", "sort"].includes(mode) ? "Update the state" : "Record the result", records: [...records], processed: [...processed], rejected: [...rejected], accepted: [...accepted] });
    prior = source;
  }
  frames.push({ ...prior, active: [], focus: [], evaluation: raw.operationLabel, decision: undefined, stage: "return", phase: 3, title: "Return the final result", note: `${mode === "search" && processed.length < raw.items.length ? "The answer was decided before visiting every item. " : ""}${raw.result === undefined && native ? "This operation returns void." : `Return ${resultFmt(raw.result)}.`}${raw.mutated !== null ? " The changed input is shown separately below." : " The original input is unchanged."}`, output: raw.result, records: [...records], processed: [...processed], rejected: [...rejected], accepted: [...accepted] });
  return { ...raw, mode, phases, language, frames };
}
