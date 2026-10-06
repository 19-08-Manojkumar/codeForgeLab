export const expandedPythonMethods = new Set(["min", "max", "any", "all", "extend", "insert", "pop", "remove", "reverse", "sort", "replace", "strip", "lower", "upper", "keys", "values", "items"]);
export const pythonTuple = values => Object.assign(values, { pythonTuple: true });
const truthy = value => value !== null && value !== false && value !== 0 && value !== "";
const equal = (a, b) => ["number", "boolean"].includes(typeof a) && ["number", "boolean"].includes(typeof b) ? Number(a) === Number(b) : a === b;

// JSON objects retain their textual key order in Python, including numeric-looking keys.
function orderedKeys(text) {
  const keys = []; let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      const start = i++;
      while (i < text.length) { if (text[i] === "\\") i += 2; else if (text[i] === '"') break; else i++; }
      let next = i + 1; while (/\s/u.test(text[next] || "") && next < text.length) next++;
      if (depth === 1 && text[next] === ":") { const key = JSON.parse(text.slice(start, i + 1)); if (!keys.includes(key)) keys.push(key); }
    } else if (text[i] === "{" || text[i] === "[") depth++;
    else if (text[i] === "}" || text[i] === "]") depth--;
  }
  return keys;
}

export function buildExpandedPythonTrace(lesson, config, helpers) {
  const { array, dictionary, scalar, number, shortText, relativeIndex, compareText, fmt } = helpers;
  const id = lesson.id, p = config.parameter, x = config.extra, op = config.operation;
  let input, items, result, mutated = null, code, operationLabel;
  const frames = [];
  const add = (active, output, note, expression, working = null) => frames.push({ active, output: Array.isArray(output) ? [...output] : output, note, expression, working: working ? [...working] : null });
  if (["keys", "values", "items"].includes(id)) {
    input = dictionary(config.input); const keys = orderedKeys(config.input);
    items = keys.map(key => `${fmt(key)}: ${fmt(input[key])}`);
    result = keys.map(key => id === "keys" ? key : id === "values" ? input[key] : pythonTuple([key, input[key]]));
    operationLabel = `list(data.${id}())`;
    result.forEach((value, i) => add([i], result.slice(0, i + 1), `Collect ${id === "items" ? "a (key, value) tuple" : id === "keys" ? "the key" : "the value"}: ${fmt(value)}. Keep dictionary insertion order.`, fmt(value)));
    const literal = `{${keys.map(key => `${fmt(key)}: ${fmt(input[key])}`).join(", ")}}`;
    code = `data = ${literal}\nresult = ${operationLabel}\n# ${fmt(result)}\n# list() makes a snapshot of the dictionary view`;
  } else if (lesson.group === "String methods") {
    input = shortText(config.input); items = Array.from(input);
    if (id === "replace") {
      result = p === "" ? x + items.join(x) + (items.length ? x : "") : input.split(p).join(x);
      operationLabel = `replace(${fmt(p)}, ${fmt(x)})`;
    } else if (id === "strip") {
      const whitespace = /^[\u0009-\u000D\u001C-\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]$/u;
      const chars = new Set(Array.from(p)), trim = character => p ? chars.has(character) : whitespace.test(character);
      let start = 0, end = items.length;
      while (start < end && trim(items[start])) start++;
      while (end > start && trim(items[end - 1])) end--;
      result = items.slice(start, end).join(""); operationLabel = `strip(${p ? fmt(p) : ""})`;
    } else { result = id === "lower" ? input.toLowerCase() : input.toUpperCase(); operationLabel = `${id}()`; }
    add(items.map((_, i) => i), result, id === "strip" ? "Remove matching characters only at the two ends. Keep the middle text unchanged." : id === "replace" ? "Replace every literal match. The original string stays unchanged." : "Convert the cased characters into a new string. The original string stays unchanged.", operationLabel);
    code = `text = ${fmt(input)}\nresult = text.${operationLabel}\n# ${fmt(result)}\n# text is still ${fmt(input)}`;
  } else {
    input = array(config.input, ["min", "max"].includes(id) || id === "sort" && op !== "text" ? "number" : id === "sort" ? "string" : null); items = [...input];
    if (["min", "max"].includes(id)) {
      if (!input.length) throw new Error(`ValueError: ${id}() needs at least one item in this example.`);
      result = input[0]; operationLabel = `${id}(values)`;
      input.forEach((value, i) => { if (id === "min" ? value < result : value > result) result = value; add([i], result, `Compare ${fmt(value)}. The ${id === "min" ? "smallest" : "largest"} value so far is ${fmt(result)}.`, `${id}: ${fmt(result)}`); });
      code = `values = ${fmt(input)}\nresult = ${operationLabel}\n# ${fmt(result)}`;
    } else if (["any", "all"].includes(id)) {
      result = id === "all"; operationLabel = `${id}(values)`;
      for (let i = 0; i < input.length; i++) {
        const passed = truthy(input[i]), stop = id === "any" ? passed : !passed;
        if (stop) result = passed;
        add([i], result, `${fmt(input[i])} is ${passed ? "truthy" : "falsy"}. ${stop ? "The answer is decided; stop without checking later items." : "Continue until the answer is decided or the list ends."}`, `bool(${fmt(input[i])}) = ${fmt(passed)}`);
        if (stop) break;
      }
      code = `values = ${fmt(input)}\nresult = ${operationLabel}\n# ${fmt(result)}`;
    } else {
      mutated = [...input]; result = null;
      if (id === "extend") {
        const additions = array(config.additions || "[]");
        if (input.length + additions.length > 12) throw new Error("Keep the extended list at 12 items or fewer.");
        operationLabel = `extend(${fmt(additions)})`;
        additions.forEach((value, i) => { mutated.push(value); add([input.length + i], null, `Append ${fmt(value)} as an individual item. The return value is None.`, `add ${fmt(value)}`, mutated); });
      } else if (id === "insert") {
        const index = number(p, "Index", true), value = scalar(x), position = relativeIndex(index, input.length);
        if (input.length === 12) throw new Error("Use at most 11 existing items when inserting a new item.");
        mutated.splice(position, 0, value); operationLabel = `insert(${index}, ${fmt(value)})`;
        add([position], null, `Insert ${fmt(value)} before normalized index ${position}. Later items shift right. Return None.`, operationLabel, mutated);
      } else if (id === "pop") {
        const index = p.trim() ? number(p, "Index", true) : -1, position = index < 0 ? input.length + index : index;
        if (position < 0 || position >= input.length) throw new Error("IndexError: pop index is out of range. Choose an existing item in a nonempty list.");
        result = mutated.splice(position, 1)[0]; operationLabel = `pop(${p.trim() ? index : ""})`;
        add([position], result, `Remove and return ${fmt(result)} at index ${position}. The remaining list is ${fmt(mutated)}.`, operationLabel, mutated);
      } else if (id === "remove") {
        const value = scalar(p), position = input.findIndex(item => equal(item, value));
        if (position < 0) throw new Error("ValueError: this value is not in the list. Choose a value that exists.");
        mutated.splice(position, 1); operationLabel = `remove(${fmt(value)})`;
        add([position], null, `Remove the first value equal to ${fmt(value)}, at index ${position}. Keep later duplicates. Return None.`, operationLabel, mutated);
      } else if (id === "reverse") {
        operationLabel = "reverse()";
        for (let i = 0; i < Math.floor(input.length / 2); i++) { const j = input.length - 1 - i; [mutated[i], mutated[j]] = [mutated[j], mutated[i]]; add([i, j], null, `Swap positions ${i} and ${j} to illustrate reversing the same list. Return None.`, `swap ${i} and ${j}`, mutated); }
      } else if (id === "sort") {
        const compare = op === "text" ? (a, b) => compareText(a, b, true) : (a, b) => op === "descending" ? b - a : a - b;
        operationLabel = `sort(${op === "descending" ? "reverse=True" : ""})`;
        for (let i = 1; i < mutated.length; i++) { let j = i; while (j > 0 && compare(mutated[j - 1], mutated[j]) > 0) { [mutated[j - 1], mutated[j]] = [mutated[j], mutated[j - 1]]; add([j - 1, j], null, "Move these items to illustrate ordering the same list. sort() returns None.", operationLabel, mutated); j--; } }
      }
      if (!frames.length) add([], result, "No moves are needed. The list stays as shown.", operationLabel, mutated);
      code = `items = ${fmt(input)}\nresult = items.${operationLabel}\n# result: ${fmt(result)}\n# items: ${fmt(mutated)}`;
    }
  }
  const initialOutput = ["keys", "values", "items"].includes(id) ? [] : lesson.group === "String methods" ? "" : id === "any" ? false : id === "all" ? true : undefined;
  if (!frames.length) add([], result, `There are no items to visit. Return ${fmt(result)}.`, operationLabel, mutated);
  const last = frames.at(-1); frames[frames.length - 1] = { ...last, output: result, note: `${last.note} Final result: ${fmt(result)}.` };
  return { input, items, result, mutated, code, operationLabel, inputLabel: lesson.group === "Dictionary methods" ? "Dictionary entries" : undefined, frames: [{active: [], output: initialOutput, note: "Ready when you are. Play the animation or move through it one step at a time.", expression: operationLabel, working: null}, ...frames] };
}
