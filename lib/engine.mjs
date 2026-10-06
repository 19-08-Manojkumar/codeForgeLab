import { expandedPythonMethods, buildExpandedPythonTrace } from "./python-engine.mjs";

export function format(value, language = "javascript") {
  if (value === undefined) return "undefined";
  if (value === null) return language === "python" ? "None" : "null";
  if (typeof value === "boolean") return language === "python" ? (value ? "True" : "False") : String(value);
  if (Array.isArray(value)) return language === "python" && value.pythonTuple ? `(${value.map(v => format(v, language)).join(", ")}${value.length === 1 ? "," : ""})` : `[${value.map(v => format(v, language)).join(", ")}]`;
  if (typeof value === "object") return `{${Object.entries(value).map(([k,v]) => `${JSON.stringify(k)}: ${format(v,language)}`).join(", ")}}`;
  return JSON.stringify(value);
}

function scalar(text) {
  let v;
  try { v = JSON.parse(text); }
  catch { if (/^\s*[\[{]/u.test(text)) throw new Error("Use a number, quoted string, boolean, or null for this value."); if (text.length > 100) throw new Error("Keep strings under 100 characters."); return text; }
  if (v !== null && typeof v === "object") throw new Error("Use a number, quoted string, boolean, or null for this value.");
  if (typeof v === "number" && (!Number.isFinite(v) || Math.abs(v) > 10000)) throw new Error("Keep numbers between -10000 and 10000.");
  if (typeof v === "string" && v.length > 100) throw new Error("Keep strings under 100 characters.");
  return v;
}
function number(text, label = "Value", integer = false) {
  const n = Number(text);
  if (!String(text).trim() || !Number.isFinite(n) || Math.abs(n) > 10000 || (integer && !Number.isInteger(n))) throw new Error(`${label} must be ${integer ? "an integer" : "a number"} between -10000 and 10000.`);
  return n;
}
function array(text, type) {
  let data; try { data = JSON.parse(text); } catch { throw new Error('Use a valid JSON array, such as [1, 2, 3] or ["a", "b"].'); }
  if (!Array.isArray(data)) throw new Error("Please enter an array inside square brackets.");
  if (data.length > 12) throw new Error("Use up to 12 items so every step stays easy to follow.");
  if (data.some(v => v !== null && !["number", "string", "boolean"].includes(typeof v))) throw new Error("This lesson supports numbers, strings, booleans, and null as array items.");
  if (data.some(v => typeof v === "number" && (!Number.isFinite(v) || Math.abs(v) > 10000))) throw new Error("Keep numbers between -10000 and 10000.");
  if (data.some(v => typeof v === "string" && v.length > 100)) throw new Error("Keep each string under 100 characters.");
  if (type && data.some(v => typeof v !== type)) throw new Error(`Use only ${type === "number" ? "numbers" : "strings"} for this operation.`);
  return data;
}
function dictionary(text) {
  let value; try { value = JSON.parse(text); } catch { throw new Error('Use a JSON object, such as {"name": "Ada"}.'); }
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Use an object with keys and values inside curly braces.");
  if (Object.keys(value).length > 12) throw new Error("Use up to 12 keys for this visualization.");
  const visit = v => {
    if (typeof v === "number" && (!Number.isFinite(v) || Math.abs(v) > 10000)) throw new Error("Keep numbers between -10000 and 10000.");
    if (typeof v === "string" && v.length > 100) throw new Error("Keep strings under 100 characters.");
    if (v && typeof v === "object") Object.values(v).forEach(visit);
  };
  visit(value);
  return value;
}
function shortText(value) {
  if (value.length > 100) throw new Error("Use text with up to 100 characters.");
  return value;
}
function relativeIndex(index, length) {
  return index < 0 ? Math.max(length + index, 0) : Math.min(index, length);
}
function compareText(a, b, python) {
  if (!python) return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
  const aa = Array.from(a), bb = Array.from(b);
  for (let i=0; i<Math.min(aa.length,bb.length);i++) { const d = aa[i].codePointAt(0)-bb[i].codePointAt(0); if(d) return d; }
  return aa.length-bb.length;
}

export function buildTrace(lesson, config) {
  if (!lesson || !config || ![config.input, config.parameter, config.extra].every(v => typeof v === "string") || config.input.length > 1500) throw new Error("Keep your example under 1500 characters and use text for each field.");
  if (config.parameter.length > 500 || config.extra.length > 500 || (config.additions !== undefined && (typeof config.additions !== "string" || config.additions.length > 1500))) throw new Error("Keep parameter fields under 500 characters and insertion lists under 1500 characters.");
  if (lesson.operations && !lesson.operations.some(([id]) => id === config.operation)) throw new Error("Choose one of the available operations.");
  const py = lesson.language === "python", id = lesson.id, op = config.operation;
  const fmt = v => format(v, lesson.language);
  if (py && expandedPythonMethods.has(id)) return buildExpandedPythonTrace(lesson, config, {array, dictionary, scalar, number, shortText, relativeIndex, compareText, fmt});
  const frames = [], add = (active, output, note, expression, working, metadata = {}) => frames.push({ active, output: Array.isArray(output) ? [...output] : output, note, expression, working: working ? [...working] : null, ...metadata });
  let input, items, result, code, operationLabel, mutated = null, sideEffects = null, normalizedIndices = null;
  const p = config.parameter, x = config.extra;
  if (id === "split" && py) {
    if (config.input.length > 100) throw new Error("Use text with up to 100 characters.");
    input = config.input;
    if(op === "separator" && !p) throw new Error("A custom separator cannot be empty.");
    const whitespace = /[\u0009-\u000D\u001C-\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/u;
    result = op === "separator" ? input.split(p) : input.split(whitespace).filter(Boolean);
    if (result.length > 12) throw new Error("Use text that splits into at most 12 pieces.");
    items = result; operationLabel = op === "separator" ? `split(${fmt(p)})` : "split()";
    result.forEach((word,i) => add([i],result.slice(0,i+1),`Piece ${i+1} is ${fmt(word)}${word === "" ? ": an empty piece between separators" : ""}.`,fmt(word)));
    code = `text = ${fmt(input)}\nresult = text.${operationLabel}\n# ${fmt(result)}`;
  } else if (!py && ["split", "replace", "trim", "toLowerCase", "toUpperCase", "substring"].includes(id)) {
    input = shortText(config.input);
    // JavaScript string positions count UTF-16 code units, including surrogate halves.
    items = input.split("");
    if (id === "split") {
      const limit = x.trim() === "" ? undefined : number(x, "Limit", true);
      if (limit !== undefined && limit < 0) throw new Error("Limit must be an integer between 0 and 10000.");
      result = input.split(p, limit);
      if (result.length > 12) throw new Error("Use text that splits into at most 12 pieces, or set a smaller limit.");
      items = result; operationLabel = `split(${fmt(p)}${limit === undefined ? "" : `, ${limit}`})`;
      result.forEach((piece, i) => add([i], result.slice(0, i + 1), `Keep piece ${i + 1}: ${fmt(piece)}.${piece === "" ? " Repeated or edge separators create empty pieces." : ""}${p === "" ? " An empty separator splits UTF-16 code units." : ""}`, fmt(piece)));
    } else if (id === "replace") {
      operationLabel = `replace(${fmt(p)}, ${fmt(x)})`; result = input.replace(p, x);
      const index = input.indexOf(p);
      add(index < 0 ? [] : Array.from({ length: p.length }, (_, i) => index + i), result,
        index < 0 ? "The search text is absent, so return the original text as the result." : `Replace the first match at index ${index}. Later matches remain.${p === "" ? " An empty search matches the beginning of the string." : ""} Replacement patterns such as $& follow JavaScript's normal rules.`, operationLabel);
    } else if (id === "substring") {
      const start = p.trim() === "" ? 0 : number(p, "Start", true), end = x.trim() === "" ? undefined : number(x, "End", true);
      const a = Math.min(Math.max(start, 0), input.length), b = end === undefined ? input.length : Math.min(Math.max(end, 0), input.length);
      normalizedIndices = { start: Math.min(a, b), end: Math.max(a, b), length: input.length };
      result = input.substring(start, end); operationLabel = `substring(${start}${end === undefined ? "" : `, ${end}`})`;
      add(Array.from({ length: normalizedIndices.end - normalizedIndices.start }, (_, i) => normalizedIndices.start + i), result,
        `Clamp indices to 0–${input.length}${a > b ? " and swap start and end" : ""}. Keep UTF-16 indices ${normalizedIndices.start} up to ${normalizedIndices.end}, excluding the end.`, operationLabel);
    } else {
      result = input[id](); operationLabel = `${id}()`;
      const note = id === "trim" ? "Remove whitespace only from both ends. Spaces inside the text stay." : id === "toLowerCase" ? "Convert the whole text to lowercase. Unicode casing may depend on surrounding letters." : "Convert the whole text to uppercase. Some letters expand to more than one character.";
      add(items.map((_, i) => i), result, `${note} The original string is unchanged.`, operationLabel);
    }
    code = `const text = ${fmt(input)};\nconst result = text.${operationLabel};\n// ${fmt(result)}\n// text is still ${fmt(input)}`;
  } else if (!py && ["keys", "values", "entries"].includes(id)) {
    input = dictionary(config.input); const keys = Object.keys(input);
    items = keys.map(k => `${fmt(k)}: ${fmt(input[k])}`); result = Object[id](input); operationLabel = `Object.${id}(profile)`;
    result.forEach((value, i) => add([i], result.slice(0, i + 1),
      id === "keys" ? `Collect key ${fmt(keys[i])} as a string.` : id === "values" ? `Collect the value for key ${fmt(keys[i])}: ${fmt(value)}.` : `Collect a [key, value] pair: ${fmt(value)}.`, fmt(value)));
    code = `const profile = ${fmt(input)};\nconst result = ${operationLabel};\n// ${fmt(result)}`;
  } else if (id === "range") {
    const start = number(p,"Start",true), stop = number(config.input,"Stop",true), step = number(x,"Step",true);
    if(step === 0) throw new Error("Step cannot be 0. Try 1 to count up or -1 to count down.");
    const count = Math.max(0,Math.ceil((stop-start)/step));
    if(count > 12) throw new Error("Choose a range with at most 12 values for this visualization.");
    result = Array.from({length:count},(_,i) => start+i*step); input = [start,stop,step]; items = result;
    operationLabel = `range(${start}, ${stop}, ${step})`;
    result.forEach((v,i) => add([i],result.slice(0,i+1),i === 0 ? `Start at ${v}. The stop value ${stop} is excluded.` : `Move by ${step}: ${result[i-1]} + (${step}) = ${v}.`,String(v)));
    code = `result = list(${operationLabel})\n# ${fmt(result)}`;
  } else if (id === "get") {
    input = dictionary(config.input); const key = p, fallback = scalar(x); items = Object.keys(input).map(k => `${k}: ${fmt(input[k])}`);
    const found = Object.hasOwn(input,key); result = found ? input[key] : fallback; const i = Object.keys(input).indexOf(key);
    operationLabel = `get(${fmt(key)}, ${fmt(fallback)})`;
    add(found ? [i] : [],result,found ? `The key ${fmt(key)} exists. Return its stored value, even if it is None.` : `The key ${fmt(key)} is missing. Return the default ${fmt(fallback)}.`,fmt(result));
    code = `profile = ${fmt(input)}\nresult = profile.${operationLabel}\n# ${fmt(result)}`;
  } else if (id === "len") {
    input = op === "text" ? config.input : op === "dict" ? dictionary(config.input) : array(config.input);
    if (typeof input === "string" && input.length > 100) throw new Error("Use text with up to 100 characters.");
    items = typeof input === "string" ? Array.from(input) : Array.isArray(input) ? input : Object.keys(input); result = items.length;
    if (items.length > 12) throw new Error("Use up to 12 items or characters for this visualization.");
    operationLabel = "len(data)";
    items.forEach((v,i) => add([i],i+1,`${op === "dict" ? "Key" : op === "text" ? "Character" : "Item"} ${i+1} of ${result}. This illustrates the count; len() reads the stored length.`,String(i+1)));
    code = `data = ${fmt(input)}\nresult = len(data)\n# ${result}`;
  } else {
    const text = (id === "join") || (["map", "forEach"].includes(id) && op === "uppercase") || (op === "contains") || (id === "sorted" && op === "text");
    const numeric = ["reduce","sum"].includes(id) || (["map", "forEach"].includes(id) && !text) || (["filter","find","findIndex","some","every"].includes(id) && !text) || (["sort","sorted"].includes(id) && ["ascending","descending"].includes(op));
    input = array(config.input,text ? "string" : numeric ? "number" : null); items = [...input];
    if(id === "map") {
      const n = ["multiply","add"].includes(op) ? number(p) : null;
      const fn = v => op === "multiply" ? v*n : op === "add" ? v+n : op === "square" ? v*v : v.toUpperCase();
      operationLabel = op === "multiply" ? `n => n * ${n}` : op === "add" ? `n => n + ${n}` : op === "square" ? "n => n * n" : "s => s.toUpperCase()";
      result = input.map(fn); input.forEach((v,i) => add([i],result.slice(0,i+1),`${fmt(v)} becomes ${fmt(result[i])}. The original item stays unchanged.`,op === "uppercase" ? `${fmt(v)}.toUpperCase()` : `${v} ${op === "multiply" || op === "square" ? "×" : "+"} ${op === "square" ? v : n} = ${result[i]}`));
      code = `const input = ${fmt(input)};\nconst result = input.map(${operationLabel});\n// ${fmt(result)}`;
    } else if(id === "forEach") {
      const n = ["multiply", "add"].includes(op) ? number(p) : null;
      const fn = v => op === "multiply" ? v*n : op === "add" ? v+n : op === "square" ? v*v : v.toUpperCase();
      const body = op === "multiply" ? `n * ${n}` : op === "add" ? `n + ${n}` : op === "square" ? "n * n" : "s.toUpperCase()";
      operationLabel = `${op === "uppercase" ? "s" : "n"} => effects.push(${body})`;
      sideEffects = [];
      result = input.forEach((value, i) => {
        sideEffects.push(fn(value));
        add([i], undefined, `The callback records ${fmt(sideEffects.at(-1))} in effects. forEach() ignores callback return values and continues.`, `effects.push(${fmt(sideEffects.at(-1))})`, null, { sideEffects: [...sideEffects] });
      });
      code = `const input = ${fmt(input)};\nconst effects = [];\nconst result = input.forEach(${operationLabel});\n// effects: ${fmt(sideEffects)}\n// result: undefined\n// input is unchanged`;
    } else if(["filter","find","findIndex","some","every"].includes(id)) {
      const n = ["greater","less"].includes(op) ? number(p) : null;
      const predicate = v => op === "even" ? v%2 === 0 : op === "greater" ? v>n : op === "less" ? v<n : v.includes(p);
      operationLabel = op === "even" ? "n => n % 2 === 0" : op === "greater" ? `n => n > ${n}` : op === "less" ? `n => n < ${n}` : `s => s.includes(${fmt(p)})`;
      result = id === "filter" ? [] : id === "every";
      if(id === "find") result = undefined;
      if(id === "findIndex") result = -1;
      for(let i=0;i<input.length;i++) {
        const passed = predicate(input[i]);
        if(id === "filter" && passed) result.push(input[i]);
        if(id === "find" && passed) result = input[i];
        if(id === "findIndex" && passed) result = i;
        if(id === "some" && passed) result = true;
        if(id === "every" && !passed) result = false;
        const stop = ["find", "findIndex", "some"].includes(id) && passed || id === "every" && !passed;
        const note = id === "filter" ? (passed ? "Passes: keep this item." : "Does not pass: leave this item out.") : stop ? `The answer is decided${id === "findIndex" ? `: return index ${i}` : ""}. Stop here; later items are not visited.` : i === input.length-1 ? (id === "every" ? "Every item passed. Return true." : `No matching item was found. Return ${id === "find" ? "undefined" : id === "findIndex" ? "-1" : "false"}.`) : "The answer is not decided yet. Continue to the next item.";
        add([i],result,`${fmt(input[i])} ${passed ? "passes" : "fails"} the condition. ${note}`,`${fmt(input[i])} → ${passed}`);
        if(stop) break;
      }
      code = `const input = ${fmt(input)};\nconst result = input.${id}(${operationLabel});\n// ${fmt(result)}`;
    } else if(id === "includes") {
      const search = scalar(p), from = x.trim() === "" ? 0 : number(x, "From index", true); result = input.includes(search, from); operationLabel = `includes(${fmt(search)}${x.trim() ? `, ${from}` : ""})`;
      for(let i=relativeIndex(from, input.length);i<input.length;i++) { const hit = input[i] === search; add([i],hit,hit ? `${fmt(input[i])} matches ${fmt(search)}. Return true and stop.` : `${fmt(input[i])} is not ${fmt(search)}. ${i === input.length-1 ? "No match was found. Return false." : "Keep looking."}`,`${fmt(input[i])} === ${fmt(search)}`); if(hit) break; }
      code = `const input = ${fmt(input)};\nconst result = input.${operationLabel};\n// ${fmt(result)}`;
    } else if(id === "slice") {
      const start = p.trim() === "" ? 0 : number(p, "Start", true), end = x.trim() === "" ? undefined : number(x, "End", true);
      result = input.slice(start, end); normalizedIndices = { start: relativeIndex(start, input.length), end: end === undefined ? input.length : relativeIndex(end, input.length), length: input.length };
      operationLabel = `slice(${start}${end === undefined ? "" : `, ${end}`})`;
      result.forEach((value, i) => add([normalizedIndices.start+i], result.slice(0,i+1), `Copy item at index ${normalizedIndices.start+i}. The end index ${normalizedIndices.end} is excluded; the original array stays unchanged.`, fmt(value)));
      code = `const input = ${fmt(input)};\nconst result = input.${operationLabel};\n// ${fmt(result)}\n// input is still ${fmt(input)}`;
    } else if(id === "splice") {
      const start = p.trim() === "" ? 0 : number(p, "Start", true), deleteCount = x.trim() === "" ? undefined : number(x, "Delete count", true);
      const additions = array(config.additions ?? "[]");
      const normalizedStart = relativeIndex(start, input.length);
      // Positional insertion arguments require an explicit count. Blank means remove to the end.
      const effectiveCount = deleteCount === undefined && additions.length ? input.length-normalizedStart : deleteCount;
      mutated = [...input]; result = effectiveCount === undefined ? mutated.splice(start) : mutated.splice(start, effectiveCount, ...additions);
      normalizedIndices = { start: normalizedStart, deleteCount: result.length, length: input.length };
      operationLabel = `splice(${start}${effectiveCount === undefined ? "" : `, ${effectiveCount}`}${additions.length ? `, ${additions.map(v => fmt(v)).join(", ")}` : ""})`;
      add(Array.from({length: result.length}, (_,i) => normalizedStart+i), result, `Start at index ${normalizedStart}, remove ${result.length} item${result.length === 1 ? "" : "s"}, and insert ${additions.length}. The return value is the removed items; the original array becomes ${fmt(mutated)}.`, operationLabel, mutated);
      code = `const input = ${fmt(input)};\nconst result = input.${operationLabel};\n// removed: ${fmt(result)}\n// input: ${fmt(mutated)}`;
    } else if(["push", "pop", "shift", "unshift"].includes(id)) {
      mutated = [...input]; const addsItem = id === "push" || id === "unshift", value = addsItem ? scalar(p) : undefined;
      result = addsItem ? mutated[id](value) : mutated[id](); operationLabel = `${id}(${addsItem ? fmt(value) : ""})`;
      const edgeIndex = id === "push" ? input.length : id === "pop" ? Math.max(0,input.length-1) : 0;
      add(!addsItem && input.length === 0 ? [] : [edgeIndex], result,
        addsItem ? `Add ${fmt(value)} to the ${id === "push" ? "end" : "beginning"}. Return the new length ${result}, while the array becomes ${fmt(mutated)}.` : input.length ? `Remove and return ${fmt(result)} from the ${id === "pop" ? "end" : "beginning"}. The array becomes ${fmt(mutated)}.` : "The array is empty. Return undefined and keep the array empty.", operationLabel, mutated);
      code = `const input = ${fmt(input)};\nconst result = input.${operationLabel};\n// result: ${fmt(result)}\n// input: ${fmt(mutated)}`;
    } else if(id === "reduce" || id === "sum") {
      let acc = number(p,"Initial value"), compensation = 0; const symbol = op === "product" ? "×" : "+";
      operationLabel = id === "sum" ? `sum(values, ${acc})` : `(total, n) => total ${op === "product" ? "*" : "+"} n`;
      input.forEach((v,i) => {
        const before = acc + compensation;
        if(id === "sum") {
          // Modern Python sums compensate for floating-point rounding errors.
          const next = acc + v;
          compensation += Math.abs(acc) >= Math.abs(v) ? (acc-next)+v : (v-next)+acc;
          acc = next;
        } else acc = op === "product" ? acc*v : acc+v;
        const total = acc + compensation;
        add([i],total,`Carry ${total} forward as the next total.`,`${before} ${symbol} ${v} = ${total}`);
      }); result = acc + compensation;
      code = py ? `values = ${fmt(input)}\nresult = ${operationLabel}\n# ${fmt(result)}` : `const input = ${fmt(input)};\nconst result = input.reduce(${operationLabel}, ${number(p)});\n// ${fmt(result)}`;
    } else if(id === "append") {
      const v = scalar(p); mutated = [...input,v]; result = null; operationLabel = `append(${fmt(v)})`;
      add([input.length],null,`Add ${fmt(v)} to the end of the same list. The return value is None.`,operationLabel,mutated);
      code = `items = ${fmt(input)}\nresult = items.${operationLabel}\n# items: ${fmt(mutated)}\n# result: None`;
    } else if(id === "join") {
      result = input.join(p); operationLabel = `${fmt(p)}.join(parts)`;
      input.forEach((v,i) => add([i],input.slice(0,i+1).join(p),i === 0 ? "Start with the first string. No separator comes before it." : `Insert ${fmt(p)} between the previous text and ${fmt(v)}.`,fmt(input.slice(0,i+1).join(p))));
      code = `parts = ${fmt(input)}\nresult = ${operationLabel}\n# ${fmt(result)}`;
    } else if(id === "sort" || id === "sorted") {
      if(id === "sort" && op === "lexical" && input.some(v=> v === null || typeof v === "boolean")) throw new Error("Use numbers or strings for this sorting visualization.");
      const compare = ["lexical","text"].includes(op) ? (a,b) => compareText(a,b,py) : (a,b) => op === "descending" ? b-a : a-b;
      const working = [...input];
      for(let i=1;i<working.length;i++) { let j=i; while(j>0 && compare(working[j-1],working[j])>0) { const a=working[j-1],b=working[j]; [working[j-1],working[j]]=[b,a]; add([j-1,j],working,`Move ${fmt(b)} before ${fmt(a)} in this illustrative sorting sequence.`,`${fmt(b)} before ${fmt(a)}`,working); j--; } }
      result = working; if(!frames.length) add([],result,"These items are already in the chosen order.","No moves needed",working);
      if(id === "sort") mutated = result;
      operationLabel = id === "sort" ? op === "lexical" ? "sort()" : `sort((a, b) => ${op === "descending" ? "b - a" : "a - b"})` : `sorted(values${op === "descending" ? ", reverse=True" : ""})`;
      code = py ? `values = ${fmt(input)}\nresult = ${operationLabel}\n# ${fmt(result)}\n# values is unchanged` : `const input = ${fmt(input)};\nconst result = input.${operationLabel};\n// ${fmt(result)}\n// input is also ${fmt(result)}`;
    } else throw new Error("This lesson is not supported by the visualizer.");
  }
  if(typeof result === "number" && !Number.isFinite(result)) throw new Error("This example produces a number too large to display. Try smaller values.");
  const initialOutput = ["map","filter","range","split","sort","sorted","keys","values","entries","slice","splice"].includes(id) ? [] : ["reduce","sum"].includes(id) ? number(p) : id === "len" ? 0 : ["join","replace","trim","toLowerCase","toUpperCase","substring"].includes(id) ? "" : id === "findIndex" ? -1 : id === "some" || id === "includes" ? false : id === "every" ? true : undefined;
  const initial = {active:[],output:initialOutput,note:"Ready when you are. Play the animation or move through it one step at a time.",expression:operationLabel,working:null,...(sideEffects ? {sideEffects:[]} : {})};
  if(!frames.length) add([],result,id === "every" ? "No items fail, so the answer is true." : id === "find" ? "No items to visit. Return undefined." : id === "findIndex" ? "No items to visit. Return -1." : id === "slice" ? "The selected interval contains no items. Return an empty array." : `No items are selected to process. The result is ${fmt(result)}.`,fmt(result),null,sideEffects ? {sideEffects:[]} : {});
  const last = frames[frames.length-1];
  // Normalize the last frame to the actual result, including no-match searches.
  frames[frames.length-1] = {...last,output:result,note:`${last.note} Final result: ${fmt(result)}.`};
  return {input,items,result,mutated,sideEffects,normalizedIndices,code,operationLabel,frames:[initial,...frames]};
}
