// Bounded teaching models. These describe the shown operations without compiling user code.
const field = (label, value, kind = "text", help = "") => ({ label, value: String(value), kind, help });
const text = (value = "hello") => field("Text", value, "text", "Up to 24 characters. Java positions use UTF-16 units; C examples use ASCII bytes.");
const values = (value = "[3, 1, 4, 2]") => field("Values (JSON array)", value, "array", "Up to 12 integers between -10000 and 10000.");
const num = (label, value) => field(label, value, "number");
const index = (label = "Index", value = 1) => num(label, value);

export const nativeExperiments = {
  "java-length": { input: text(), mode: "count" },
  "java-char-at": { input: text(), parameter: index(), mode: "select" },
  "java-substring": { input: text(), parameter: index("Begin (included)", 1), extra: index("End (excluded)", 4), mode: "select" },
  "java-contains": { input: text("hello world"), parameter: field("Text to find", "world"), mode: "search" },
  "java-max": { input: num("First number", 7), parameter: num("Second number", 12), mode: "compare" },
  "java-abs": { input: num("Integer", -12), mode: "number" },
  "java-sqrt": { input: num("Nonnegative number", 25), mode: "number" },
  "java-round": { input: num("Decimal number", 3.6), mode: "number" },
  "java-arrays-sort": { input: values(), mode: "sort" },
  "java-copy-of": { input: values(), parameter: num("New length", 6), mode: "copy" },
  "java-arrays-equals": { input: values("[1, 2, 3]"), parameter: values("[1, 2, 4]"), mode: "compare" },
  "java-arrays-to-string": { input: values(), mode: "text" },
  "java-list-add": { input: values(), parameter: num("Value to add", 9), mode: "mutation" },
  "java-list-get": { input: values(), parameter: index(), mode: "select" },
  "java-list-set": { input: values(), parameter: index(), extra: num("Replacement value", 9), mode: "mutation" },
  "java-list-remove": { input: values(), parameter: index(), mode: "mutation" },
  "java-parse-int": { input: text("2048"), mode: "parse" },
  "java-integer-to-string": { input: num("Integer", 2048), mode: "text" },
  "java-parse-double": { input: text("3.14"), mode: "parse" },
  "java-builder-append": { input: text("hello"), parameter: field("Text to append", " world"), mode: "mutation" },
  "java-builder-reverse": { input: text("hello"), mode: "sort" },
  "java-builder-to-string": { input: text("hello"), mode: "copy" },
  "java-collections-sort": { input: values(), mode: "sort" },
  "java-collections-max": { input: values(), mode: "accumulate" },
  "java-map-default": { input: field("Map (JSON object)", '{"Ada": 8, "Lin": 12}', "object", "Up to 12 keys with integer values."), parameter: field("Key", "Ada"), extra: num("Fallback value", 0), mode: "lookup" },
  strlen: { input: text("hello"), mode: "count" },
  strcmp: { input: text("apple"), parameter: text("apricot"), mode: "compare" },
  strncmp: { input: text("apple"), parameter: text("apricot"), extra: num("Maximum bytes to compare", 2), mode: "compare" },
  strchr: { input: text("banana"), parameter: field("Character to find", "a"), mode: "search" },
  strrchr: { input: text("banana"), parameter: field("Character to find", "a"), mode: "search" },
  strstr: { input: text("hello world"), parameter: field("Text to find", "world"), mode: "search" },
  strspn: { input: text("123abc"), parameter: field("Accepted characters", "0123456789"), mode: "count" },
  strcspn: { input: text("hello,world"), parameter: field("Stop characters", ","), mode: "count" },
  memcpy: { input: field("Source bytes (JSON array)", "[10, 20, 30, 40]", "bytes"), parameter: num("Bytes to copy", 3), mode: "memory" },
  memmove: { input: field("Buffer bytes (JSON array)", "[1, 2, 3, 4, 5, 6]", "bytes"), parameter: index("Source offset", 0), extra: index("Destination offset", 2), additions: num("Bytes to move", 4), mode: "memory" },
  memset: { input: field("Buffer bytes (JSON array)", "[0, 0, 0, 0]", "bytes"), parameter: num("Fill byte (0–255)", 65), extra: num("Bytes to fill", 3), mode: "memory" },
  memcmp: { input: field("First bytes (JSON array)", "[10, 20, 30]", "bytes"), parameter: field("Second bytes (JSON array)", "[10, 25, 30]", "bytes"), extra: num("Bytes to compare", 3), mode: "compare" },
  snprintf: { input: text("hello world"), parameter: num("Destination capacity (includes terminator)", 6), mode: "memory" },
  printf: { input: num("Integer to print with %d", 42), mode: "output" },
  puts: { input: text("hello"), mode: "output" },
  putchar: { input: field("Character", "A"), mode: "output" },
  isdigit: { input: field("Character", "7"), mode: "check" },
  isalpha: { input: field("Character", "A"), mode: "check" },
  toupper: { input: field("Character", "a"), mode: "transform" },
  tolower: { input: field("Character", "A"), mode: "transform" },
  abs: { input: num("Integer", -12), mode: "number" },
  labs: { input: num("Long integer", -300), mode: "number" },
  strtol: { input: text("2048rest"), parameter: num("Base (2–36)", 10), mode: "parse" },
  qsort: { input: values(), mode: "sort" },
  bsearch: { input: values("[1, 3, 5, 7, 9]"), parameter: num("Key", 7), mode: "search" },
};

export function defaultNativeConfig(entry) {
  return Object.fromEntries(Object.entries(nativeExperiments[entry.id]).filter(([, value]) => typeof value === "object").map(([key, value]) => [key, value.value]));
}

const json = value => JSON.stringify(value);
const int = (value, label, min = -10000, max = 10000) => {
  if (!String(value).trim() || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return Number(value);
};
const decimal = (value, label) => { const n = Number(value); if (!String(value).trim() || !Number.isFinite(n) || Math.abs(n) > 10000) throw new Error(`${label} must be a finite number between -10000 and 10000.`); return n; };
const list = (value, bytes = false) => {
  let result; try { result = JSON.parse(value); } catch { throw new Error("Enter a valid JSON array."); }
  if (!Array.isArray(result) || result.length > 12 || result.some(n => !Number.isInteger(n) || n < (bytes ? 0 : -10000) || n > (bytes ? 255 : 10000))) throw new Error(bytes ? "Use up to 12 byte values, each from 0 to 255." : "Use up to 12 integers, each between -10000 and 10000.");
  return result;
};
function checkedText(value, c) {
  if (value.length > 24) throw new Error("Use at most 24 characters for this animation.");
  if (c && /[^\x20-\x7e]/u.test(value)) throw new Error("This C example uses printable ASCII. The terminating zero byte is added for you.");
  return value;
}

export function buildNativeTrace(entry, config, language) {
  const definition = nativeExperiments[entry.id]; if (!definition) throw new Error("No animation is available for this operation.");
  const c = language === "c", id = entry.id, p = config.parameter, x = config.extra;
  for (const [key, control] of Object.entries(definition)) if (typeof control === "object" && (typeof config[key] !== "string" || config[key].length > 1500)) throw new Error("Keep inputs short and use the displayed fields.");
  let input, items, result, code, operationLabel = entry.name, mutated = null, secondaryItems = null, initialWorking = null, initialOutput, context = "", algorithmNote = "", inputLabel;
  const frames = [];
  const add = (active, output, note, expression = operationLabel, working = null, metadata = {}) => frames.push({ active, output: Array.isArray(output) ? [...output] : output, note, expression, working: working ? [...working] : null, ...metadata });
  const readText = value => checkedText(value, c);
  if (definition.input.kind === "array" || definition.input.kind === "bytes") input = list(config.input, definition.input.kind === "bytes");
  else if (definition.input.kind === "number") input = decimal(config.input, "Input");
  else if (definition.input.kind === "object") {
    try { input = JSON.parse(config.input); } catch { throw new Error("Enter a JSON object with integer values."); }
    if (!input || Array.isArray(input) || typeof input !== "object" || Object.keys(input).length > 12 || Object.values(input).some(v => !Number.isInteger(v) || Math.abs(v) > 10000)) throw new Error("Use up to 12 map keys with integer values.");
  } else input = readText(config.input);
  items = Array.isArray(input) ? [...input] : typeof input === "string" ? input.split("") : typeof input === "number" ? [input] : Object.entries(input).map(([k, v]) => `${json(k)}: ${v}`);
  if (!c) {
    if (id === "java-length") {
      result = input.length; initialOutput = 0; context = "Length counts UTF-16 units. The count is stored; the scan below illustrates the units, not a loop inside length().";
      items.forEach((v, i) => add([i], i + 1, `Unit ${i} contributes one to the length.`, `count = ${i + 1}`));
      code = `String text = ${json(input)};\nint result = text.length();\nSystem.out.println(result);`;
    } else if (id === "java-char-at" || id === "java-substring") {
      const start = int(p, "Index", 0, id === "java-char-at" ? input.length - 1 : input.length), end = id === "java-char-at" ? start + 1 : int(x, "End", start, input.length);
      result = input.slice(start, end); initialOutput = ""; operationLabel = id === "java-char-at" ? `text.charAt(${start})` : `text.substring(${start}, ${end})`;
      for (let i = start; i < end; i++) add([i], input.slice(start, i + 1), `Read UTF-16 unit ${i}. ${id === "java-substring" ? `End ${end} is excluded.` : "Return this char value."}`, `index = ${i}`);
      context = "Java String indices count UTF-16 units; an emoji can occupy two units."; code = `String text = ${json(input)};\n${id === "java-char-at" ? "char" : "String"} result = ${operationLabel};\nSystem.out.println(result);`;
    } else if (id === "java-contains") {
      const needle = readText(p); result = input.includes(needle); initialOutput = false; secondaryItems = needle.split(""); operationLabel = `text.contains(${json(needle)})`;
      if (!needle.length) add([], true, "An empty sequence occurs at the beginning.", 'contains("") = true', null, { decision: true });
      for (let i = 0; needle.length && i <= input.length - needle.length; i++) { const hit = input.slice(i, i + needle.length) === needle; add(Array.from({ length: needle.length }, (_, j) => i + j), hit, hit ? "Every unit in this window matches. Return true; later windows are not needed." : "This window differs. Move to the next starting position.", `${json(input.slice(i, i + needle.length))} == ${json(needle)}`, null, { decision: hit }); if (hit) break; }
      code = `String text = ${json(input)};\nboolean result = ${operationLabel};\nSystem.out.println(result);`;
    } else if (["java-max", "java-abs", "java-sqrt", "java-round"].includes(id)) {
      if (id !== "java-sqrt" && id !== "java-round") input = int(config.input, "Input");
      if (id === "java-max") { const other = int(p, "Second number"); secondaryItems = [other]; result = Math.max(input, other); operationLabel = `Math.max(${input}, ${other})`; }
      if (id === "java-abs") { result = Math.abs(input); operationLabel = `Math.abs(${input})`; }
      if (id === "java-sqrt") { if (input < 0) throw new Error("Use a nonnegative value for this square-root example."); result = Math.sqrt(input); operationLabel = `Math.sqrt(${input})`; }
      if (id === "java-round") { result = Math.floor(input + 0.5); operationLabel = `Math.round(${input})`; }
      add([0], result, id === "java-round" ? "Choose the closest integer. Halfway cases round toward positive infinity." : id === "java-sqrt" ? `The nonnegative square root is ${result}.` : id === "java-abs" ? "Keep the magnitude and remove a negative sign." : "Compare both inputs and return the greater value.", `${operationLabel} = ${result}`);
      code = `${id === "java-round" ? "long" : id === "java-sqrt" ? "double" : "int"} result = ${operationLabel};\nSystem.out.println(result);`;
    } else if (["java-arrays-sort", "java-collections-sort"].includes(id)) {
      mutated = [...input]; initialWorking = [...input];
      for (let i = 1; i < mutated.length; i++) for (let j = i; j > 0; j--) { const left = mutated[j - 1], right = mutated[j]; if (left <= right) { add([j - 1, j], undefined, "These neighbours are already ordered.", `${left} <= ${right}`, mutated, { decision: true }); break; } [mutated[j - 1], mutated[j]] = [right, left]; add([j - 1, j], undefined, "Put the smaller value before the larger one in the same collection.", `${left} > ${right}: swap`, mutated, { before: [left, right], after: [right, left] }); }
      result = undefined; operationLabel = id === "java-arrays-sort" ? "Arrays.sort(values)" : "Collections.sort(values)"; algorithmNote = "These comparison and swap steps explain ordering. The Java library may use a different sorting algorithm.";
      code = id === "java-arrays-sort" ? `int[] values = {${input.join(", ")}};\nArrays.sort(values);\nSystem.out.println(Arrays.toString(values));` : `var values = new ArrayList<Integer>(List.of(${input.join(", ")}));\nCollections.sort(values);\nSystem.out.println(values);`;
    } else if (id === "java-copy-of") {
      const length = int(p, "New length", 0, 12); result = Array.from({ length }, (_, i) => input[i] ?? 0); initialOutput = []; operationLabel = `Arrays.copyOf(values, ${length})`;
      result.forEach((v, i) => add(i < input.length ? [i] : [], result.slice(0, i + 1), i < input.length ? `Copy index ${i} to the new array.` : `There is no source at index ${i}. Pad this int slot with 0.`, `copy[${i}] = ${v}`));
      code = `int[] values = {${input.join(", ")}};\nint[] result = ${operationLabel};\nSystem.out.println(Arrays.toString(result));`;
    } else if (id === "java-arrays-equals") {
      const other = list(p); secondaryItems = other; initialOutput = true; result = input.length === other.length;
      if (!result) add([], false, "The lengths differ. The arrays cannot be equal.", `${input.length} != ${other.length}`, null, { decision: false });
      else for (let i = 0; i < input.length; i++) { const hit = input[i] === other[i]; add([i], hit, hit ? "This pair is equal; continue." : "This pair differs. Return false immediately.", `${input[i]} == ${other[i]}`, null, { decision: hit, secondaryActive: [i] }); if (!hit) { result = false; break; } }
      code = `int[] first = {${input.join(", ")}};\nint[] second = {${other.join(", ")}};\nboolean result = Arrays.equals(first, second);\nSystem.out.println(result);`;
    } else if (id === "java-arrays-to-string") {
      result = `[${input.join(", ")}]`; initialOutput = "["; input.forEach((v, i) => add([i], `[${input.slice(0, i + 1).join(", ")}${i === input.length - 1 ? "]" : ""}`, "Write each number, with a comma between adjacent values and brackets around the array.", `write ${v}`));
      code = `int[] values = {${input.join(", ")}};\nString result = Arrays.toString(values);\nSystem.out.println(result);`;
    } else if (["java-list-add", "java-list-get", "java-list-set", "java-list-remove"].includes(id)) {
      const adding = id === "java-list-add", at = adding ? input.length : int(p, "Index", 0, input.length - 1), v = adding ? int(p, "Value") : id === "java-list-set" ? int(x, "Replacement") : undefined;
      if (adding && input.length === 12) throw new Error("Use at most 11 items before adding one.");
      if (id === "java-list-get") { result = input[at]; operationLabel = `list.get(${at})`; }
      else { mutated = [...input]; initialWorking = [...input]; if (adding) { mutated.push(v); result = true; operationLabel = `list.add(${v})`; } else if (id === "java-list-set") { result = mutated[at]; mutated[at] = v; operationLabel = `list.set(${at}, ${v})`; } else { result = mutated.splice(at, 1)[0]; operationLabel = `list.remove(${at})`; } }
      add([at], result, id === "java-list-set" ? `Replace index ${at}; return its old value ${result}.` : id === "java-list-remove" ? `Remove index ${at}, shift later items left, and return ${result}. This is the int-index overload.` : adding ? "Append to the same list and return true." : "Read this value without changing the list.", operationLabel, mutated);
      code = `var list = new ArrayList<Integer>(List.of(${input.join(", ")}));\n${id === "java-list-add" ? "boolean" : "int"} result = ${operationLabel};\nSystem.out.println(result);\nSystem.out.println(list);`;
    } else if (id === "java-parse-int" || id === "java-parse-double") {
      if (id === "java-parse-int") { if (!/^[+-]?\d+$/u.test(input)) throw new Error("NumberFormatException: enter decimal digits, optionally starting with + or −, without spaces."); result = Number(input); if (!Number.isInteger(result) || result < -2147483648 || result > 2147483647) throw new Error("NumberFormatException: this value is outside the 32-bit int range."); }
      else { if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(input.trim())) throw new Error("This decimal teaching example accepts digits, an optional dot, and an optional exponent."); result = Number(input); if (!Number.isFinite(result) || Math.abs(result) > 10000) throw new Error("Use a finite decimal between -10000 and 10000."); }
      operationLabel = `${id === "java-parse-int" ? "Integer.parseInt" : "Double.parseDouble"}(${json(input)})`; const sign = input.startsWith("-") ? -1 : 1; let partial = 0;
      if (id === "java-parse-int") items.forEach((ch, i) => { if (/\d/u.test(ch)) { const before = partial; partial = partial * 10 + Number(ch); add([i], sign * partial, `Read digit ${ch}. Shift the existing number one decimal place and add the digit.`, `${before} × 10 + ${ch} = ${partial}`); } });
      else add(items.map((_, i) => i), result, "Recognize the decimal and optional exponent, then convert to a double.", `${json(input)} → ${result}`);
      code = `${id === "java-parse-int" ? "int" : "double"} result = ${operationLabel};\nSystem.out.println(result);`;
    } else if (id === "java-integer-to-string") {
      input = int(config.input, "Integer"); items = [input]; result = String(input); add([0], result, "Represent the sign and decimal digits as a new String.", `${input} → ${json(result)}`); code = `String result = Integer.toString(${input});\nSystem.out.println(result);`;
    } else if (id.startsWith("java-builder-")) {
      if (id === "java-builder-append") { const addition = readText(p); if (input.length + addition.length > 24) throw new Error("Keep the combined builder at 24 UTF-16 units or fewer."); mutated = input.split(""); initialWorking = [...mutated]; result = "same builder"; addition.split("").forEach((ch, i) => { mutated.push(ch); add([], result, `Append ${json(ch)} to the same builder. The returned reference points to this builder.`, `append unit ${i}`, mutated); }); operationLabel = `builder.append(${json(addition)})`; }
      else if (id === "java-builder-reverse") { const units = Array.from(input); mutated = [...units]; initialWorking = input.split(""); result = "same builder"; for (let i = 0; i < Math.floor(units.length / 2); i++) { const j = units.length - 1 - i; [mutated[i], mutated[j]] = [mutated[j], mutated[i]]; add([], result, "Exchange the outer characters and move inward; valid surrogate pairs stay together.", `swap ${i} and ${j}`, mutated.join("").split("")); } mutated = mutated.join("").split(""); operationLabel = "builder.reverse()"; }
      else { result = input; initialOutput = ""; items.forEach((ch, i) => add([i], input.slice(0, i + 1), "Copy these units into a String snapshot. Later builder edits will not change it.", `copy unit ${i}`)); operationLabel = "builder.toString()"; }
      code = `StringBuilder builder = new StringBuilder(${json(input)});\n${id === "java-builder-to-string" ? "String result" : "StringBuilder result"} = ${operationLabel};\nSystem.out.println(result);`;
    } else if (id === "java-collections-max") {
      if (!input.length) throw new Error("NoSuchElementException: max needs a nonempty collection."); result = input[0]; input.forEach((v, i) => { const before = result; result = Math.max(result, v); add([i], result, `The largest value so far is ${result}.`, `${v} > ${before}`, null, { before, after: result, decision: v > before }); });
      code = `var values = List.of(${input.join(", ")});\nint result = Collections.max(values);\nSystem.out.println(result);`;
    } else if (id === "java-map-default") {
      const key = readText(p), fallback = int(x, "Fallback"), keys = Object.keys(input), hit = Object.hasOwn(input, key); result = hit ? input[key] : fallback; operationLabel = `map.getOrDefault(${json(key)}, ${fallback})`; context = "A HashMap uses hashing. The highlighted entry shows the lookup outcome, not a sequential scan.";
      add(hit ? [keys.indexOf(key)] : [], result, hit ? "The key exists. Return its mapped value, even when it is zero." : "The key is absent. Return the fallback without inserting the key.", `key ${json(key)} ${hit ? "found" : "absent"}`, null, { decision: hit });
      code = `var map = new HashMap<String, Integer>();\n${Object.entries(input).map(([k, v]) => `map.put(${json(k)}, ${v});`).join("\n")}\nint result = ${operationLabel};\nSystem.out.println(result);`;
    }
  } else {
    if (typeof input === "string") { items = [...input.split(""), "\\0"]; inputLabel = "Source bytes (including terminator)"; }
    if (["strlen", "strspn", "strcspn"].includes(id)) {
      initialOutput = 0; result = 0; const set = id === "strlen" ? "" : readText(p); operationLabel = `${id}(text${id === "strlen" ? "" : `, ${json(set)}`})`;
      for (let i = 0; i <= input.length; i++) { const pass = i < input.length && (id === "strlen" || (id === "strspn" ? set.includes(input[i]) : !set.includes(input[i]))); if (pass) result++; add([i], result, pass ? "This byte belongs to the counted prefix. Increment the count." : i === input.length ? "The terminating zero byte is reached. Stop; do not count it." : "This byte ends the prefix. Stop without counting it.", id === "strlen" ? `${i < input.length ? json(input[i]) : "'\\0'"} != '\\0'` : `${json(input[i] || "\\0")} ${id === "strspn" ? "in" : "not in"} ${json(set)}`, null, { decision: pass }); if (!pass) break; }
      code = `const char *text = ${json(input)};\nsize_t result = ${operationLabel};\nprintf("%zu\\n", result);`;
    } else if (["strcmp", "strncmp", "memcmp"].includes(id)) {
      const memory = id === "memcmp", other = memory ? list(p, true) : readText(p), bound = id === "strcmp" ? Math.max(input.length, other.length) + 1 : int(x, "Count", 0, memory ? Math.min(input.length, other.length) : 24); secondaryItems = memory ? other : [...other.split(""), "\\0"]; result = 0; initialOutput = 0;
      for (let i = 0; i < bound; i++) { const a = memory ? input[i] : input.charCodeAt(i) || 0, b = memory ? other[i] : other.charCodeAt(i) || 0; const sign = Math.sign(a - b); add([i], sign < 0 ? "negative" : sign > 0 ? "positive" : 0, sign ? "The first differing byte decides the sign. Stop here." : "These bytes are equal; continue unless this is the terminating zero.", `${a} ${sign < 0 ? "<" : sign > 0 ? ">" : "="} ${b}`, null, { secondaryActive: [i], decision: !sign }); if (sign || !memory && a === 0) { result = sign < 0 ? "negative" : sign > 0 ? "positive" : 0; break; } }
      context = "C guarantees only a negative, zero, or positive comparison result, not the exact nonzero number.";
      code = memory ? `unsigned char first[] = {${input.join(", ")}};\nunsigned char second[] = {${other.join(", ")}};\nint result = memcmp(first, second, ${bound});\nprintf("%s\\n", result < 0 ? "negative" : result > 0 ? "positive" : "equal");` : `const char *first = ${json(input)};\nconst char *second = ${json(other)};\nint result = ${id}(first, second${id === "strncmp" ? `, ${bound}` : ""});\nprintf("%s\\n", result < 0 ? "negative" : result > 0 ? "positive" : "equal");`;
    } else if (["strchr", "strrchr", "strstr"].includes(id)) {
      const needle = readText(p); if (id !== "strstr" && needle.length !== 1) throw new Error("Enter exactly one printable ASCII character."); secondaryItems = needle.split(""); let at = -1; initialOutput = "NULL";
      for (let i = 0; i <= input.length - needle.length; i++) { const hit = input.slice(i, i + needle.length) === needle; if (hit) at = i; add(Array.from({ length: Math.max(1, needle.length) }, (_, j) => i + j), at < 0 ? "NULL" : `text + ${at}`, hit ? id === "strrchr" ? "Remember this match; continue because a later one may exist." : "The first match is found. Return its address offset and stop." : "This position does not match.", `${json(input.slice(i, i + needle.length))} == ${json(needle)}`, null, { decision: hit }); if (hit && id !== "strrchr") break; }
      result = at < 0 ? "NULL" : `text + ${at}`; context = at < 0 ? "Always check a returned pointer against NULL before dereferencing it." : `The returned pointer starts at byte ${at}; the suffix is ${json(input.slice(at))}.`;
      code = `const char *text = ${json(input)};\nconst char *result = ${id}(text, ${id === "strstr" ? json(needle) : `'${needle.replace(/['\\]/g, "\\$&")}'`});\nif (result != NULL) puts(result);\nelse puts("Not found");`;
    } else if (["memcpy", "memmove", "memset"].includes(id)) {
      let source = [...input], start = 0, dest = 0, count;
      if (id === "memcpy") { count = int(p, "Count", 0, input.length); mutated = Array(input.length).fill(0); secondaryItems = [...mutated]; }
      else { mutated = [...input]; if (id === "memmove") { start = int(p, "Source offset", 0, input.length); dest = int(x, "Destination offset", 0, input.length); count = int(config.additions, "Count", 0, Math.min(input.length - start, input.length - dest)); } else { count = int(x, "Count", 0, input.length); source = Array(count).fill(int(p, "Fill byte", 0, 255)); } }
      initialWorking = [...mutated]; const reverse = id === "memmove" && dest > start && dest < start + count; const offsets = Array.from({ length: count }, (_, i) => reverse ? count - 1 - i : i);
      result = id === "memcpy" ? "dest" : id === "memmove" ? `buffer + ${dest}` : "buffer";
      for (const offset of offsets) { const from = id === "memset" ? offset : start + offset, to = dest + offset; mutated[to] = source[from]; add(id === "memset" ? [] : [from], result, `${id === "memset" ? "Fill" : "Copy"} byte ${source[from]} into destination offset ${to}.${reverse ? " Copy backward so unread overlapping bytes are protected." : ""}`, `dest[${to}] = ${source[from]}`, mutated, { destinationActive: [to], secondaryActive: [to] }); }
      context = id === "memcpy" ? "Source and destination are separate here. Overlapping memcpy ranges are undefined." : id === "memmove" ? "Overlapping ranges are allowed. These moves illustrate one safe strategy, equivalent to preserving the source bytes first." : "memset repeats a byte, not a typed integer value.";
      code = id === "memcpy" ? `unsigned char source[] = {${input.length ? input.join(", ") : "0"}};\nunsigned char dest[${input.length || 1}] = {0};\nmemcpy(dest, source, ${count});` : `unsigned char buffer[] = {${input.length ? input.join(", ") : "0"}};\n${id === "memmove" ? `memmove(buffer + ${dest}, buffer + ${start}, ${count});` : `memset(buffer, ${int(p, "Fill byte", 0, 255)}, ${count});`}`;
    } else if (id === "snprintf") {
      const capacity = int(p, "Capacity", 0, 25), written = input.slice(0, Math.max(0, capacity - 1)); result = input.length; mutated = capacity ? Array(capacity).fill("·") : []; initialWorking = [...mutated]; initialOutput = undefined;
      for (let i = 0; i < written.length; i++) { mutated[i] = written[i]; add([i], undefined, "Write a character while reserving one byte for the terminator.", `dest[${i}] = ${json(written[i])}`, mutated, { destinationActive: [i] }); }
      if (capacity) { mutated[written.length] = "\\0"; add([], result, `Write the terminating zero. Return ${result}, the full length that would have been written, excluding the terminator.`, `dest[${written.length}] = '\\0'`, mutated, { destinationActive: [written.length] }); }
      context = result >= capacity ? "The output was truncated (or capacity is zero). A return value at least equal to capacity signals insufficient room." : "The destination has room for the text and its terminating zero byte.";
      code = `char dest[${Math.max(capacity, 1)}];\nint result = snprintf(dest, ${capacity}, "%s", ${json(input)});\nprintf("%d\\n", result);${capacity ? '\nputs(dest);' : ""}`;
    } else if (["printf", "puts", "putchar"].includes(id)) {
      if (id === "printf") { input = int(config.input, "Integer"); items = [input]; }
      if (id === "putchar" && input.length !== 1) throw new Error("Enter exactly one printable ASCII character.");
      const printed = String(input) + (id === "puts" ? "\n" : ""); initialOutput = ""; result = id === "printf" ? printed.length : id === "putchar" ? input.charCodeAt(0) : "nonnegative on success";
      [...printed].forEach((ch, i) => add(id === "printf" ? [0] : i < input.length ? [i] : [], printed.slice(0, i + 1), ch === "\n" ? "puts also writes a newline." : `Write ${json(ch)} to standard output.`, `stdout: ${json(printed.slice(0, i + 1))}`, null, { consoleOutput: printed.slice(0, i + 1) }));
      context = `Successful return: ${result}. Output functions can report errors; this example models successful output.`;
      code = id === "printf" ? `int result = printf("%d", ${input});` : id === "puts" ? `int result = puts(${json(input)});` : `int result = putchar('${input.replace(/['\\]/g, "\\$&")}');`;
    } else if (["isdigit", "isalpha", "toupper", "tolower"].includes(id)) {
      if (input.length !== 1) throw new Error("Enter exactly one printable ASCII character."); items = [input]; const classification = id === "isdigit" || id === "isalpha";
      const matched = id === "isdigit" ? /^[0-9]$/u.test(input) : /^[a-zA-Z]$/u.test(input), converted = id === "toupper" ? input.toUpperCase() : input.toLowerCase();
      result = classification ? matched ? "nonzero" : 0 : converted.charCodeAt(0);
      add([0], result, classification ? `${json(input)} ${matched ? "belongs" : "does not belong"} to this character class. C returns nonzero for a match and zero otherwise.` : `The converted character is ${json(converted)}. Return its unsigned-byte value ${result} as an int. Characters outside this letter case stay unchanged.`, `${id}(${json(input)})`, null, classification ? { decision: matched } : {});
      context = "These printable ASCII examples use the C locale and pass an unsigned-char value to ctype functions.";
      code = `unsigned char ch = '${input.replace(/['\\]/g, "\\$&")}';\n${classification ? `int result = ${id}(ch);\nprintf("%s\\n", result != 0 ? "nonzero" : "zero");` : `int result = ${id}(ch);\nprintf("%c\\n", result);`}`;
    } else if (id === "abs" || id === "labs") {
      input = int(config.input, "Integer"); items = [input]; result = Math.abs(input); add([0], result, "Return the magnitude. The bounded inputs keep the result representable.", `${id}(${input}) = ${result}`); code = `${id === "labs" ? "long" : "int"} result = ${id}(${input}${id === "labs" ? "L" : ""});\nprintf("${id === "labs" ? "%ld" : "%d"}\\n", result);`;
    } else if (id === "strtol") {
      const base = int(p, "Base", 2, 36); const leading = input.match(/^ */u)[0].length; let at = leading, sign = 1, accumulated = 0, digits = 0; if (input[at] === "+" || input[at] === "-") { if (input[at] === "-") sign = -1; at++; } if (base === 16 && /^0[xX][0-9a-fA-F]/u.test(input.slice(at))) at += 2;
      initialOutput = 0;
      for (; at < input.length; at++) { const digit = parseInt(input[at], 36); if (!Number.isFinite(digit) || digit >= base) { add([at], sign * accumulated, "This byte is not a digit in the chosen base. Stop; end points here.", `digit ${json(input[at])} is invalid in base ${base}`, null, { decision: false }); break; } const before = accumulated; accumulated = accumulated * base + digit; if (accumulated > 2147483647) throw new Error("Keep the parsed magnitude at most 2147483647 for this portable teaching example."); digits++; add([at], sign * accumulated, "Shift the accumulated magnitude by the base, then add this digit.", `${before} × ${base} + ${digit} = ${accumulated}`, null, { before: sign * before, after: sign * accumulated }); }
      result = sign * accumulated; context = digits ? `end points to byte ${at}: ${json(input.slice(at))}. Check errno and whether unconsumed text is acceptable.` : "No digits were consumed. Return 0 and set end to the original start; this is not a successful conversion.";
      code = `const char *text = ${json(input)};\nchar *end;\nerrno = 0;\nlong result = strtol(text, &end, ${base});\nprintf("%ld\\n", result);\n// Check errno, end == text, and *end before accepting input.`;
    } else if (id === "qsort") {
      mutated = [...input]; initialWorking = [...input]; result = undefined;
      for (let i = 1; i < mutated.length; i++) for (let j = i; j > 0; j--) { const a = mutated[j - 1], b = mutated[j]; if (a <= b) { add([j - 1, j], undefined, "The comparator says these neighbours are in order.", `(a > b) - (a < b) = ${Math.sign(a - b)}`, mutated); break; } [mutated[j - 1], mutated[j]] = [b, a]; add([j - 1, j], undefined, "The comparator is positive. Put the smaller item first.", `${a} > ${b}: swap`, mutated, { before: [a, b], after: [b, a] }); }
      algorithmNote = "This comparison sequence illustrates sorting. qsort does not promise this algorithm or preserve equal-element order.";
      code = `int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\nint values[] = {${input.length ? input.join(", ") : "0"}};\nqsort(values, ${input.length}, sizeof values[0], compare_ints);`;
    } else if (id === "bsearch") {
      if (input.some((v, i) => i && v < input[i - 1])) throw new Error("bsearch needs an array already sorted in ascending order for this comparator."); const key = int(p, "Key"); secondaryItems = [key]; let low = 0, high = input.length - 1, found = -1; initialOutput = "NULL";
      while (low <= high) { const middle = Math.floor((low + high) / 2), v = input[middle], hit = key === v; add([middle], hit ? `values + ${middle}` : "NULL", hit ? "The key matches. Return a pointer to this item." : key < v ? "Discard this midpoint and everything to its right." : "Discard this midpoint and everything to its left.", `${key} ${hit ? "=" : key < v ? "<" : ">"} ${v}`, null, { decision: hit, window: [low, high] }); if (hit) { found = middle; break; } if (key < v) high = middle - 1; else low = middle + 1; }
      result = found < 0 ? "NULL" : `values + ${found}`; algorithmNote = "The shrinking interval shows one binary search strategy; the library's probe sequence can differ.";
      code = `int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left, b = *(const int *)right;\n    return (a > b) - (a < b);\n}\nint values[] = {${input.length ? input.join(", ") : "0"}};\nint key = ${key};\nint *result = bsearch(&key, values, ${input.length}, sizeof values[0], compare_ints);\nif (result != NULL) printf("%d\\n", *result);`;
    }
  }
  if (!code) throw new Error("This operation needs a valid example.");
  if (!frames.length) add([], result, `No items need processing. ${mutated ? "The collection remains as shown." : "Return the empty or initial result."}`, operationLabel, mutated);
  // Output operations expose their console separately from the function's return value.
  frames[frames.length - 1] = { ...frames.at(-1), output: result };
  const includes = c ? [...new Set((entry.header || "stdio.h").split(/, */u).concat("stdio.h"))].map(header => `#include <${header}>`).join("\n") : id.includes("arrays") || id.includes("copy-of") || id.includes("list-") || id.includes("collections") || id.includes("map") ? "import java.util.*;" : "";
  if (c && ['qsort', 'bsearch'].includes(id)) { const end = code.indexOf('\n}') + 2; const helper = code.slice(0, end); const body = code.slice(end).trim(); code = helper + '\n\nint main(void) {\n' + body.split('\n').map(line => '    ' + line).join('\n') + '\n    return 0;\n}'; }
  const resultPresentation = ["strcmp", "strncmp", "memcmp", "strchr", "strrchr", "strstr", "memcpy", "memmove", "memset", "puts", "bsearch", "isdigit", "isalpha", "java-builder-append", "java-builder-reverse"].includes(id) ? "label" : "value";
  return { input, items, result, mutated, resultPresentation, code: c ? `${includes}\n${["qsort", "bsearch"].includes(id) ? code : `\nint main(void) {\n${code.split("\n").map(line => `    ${line}`).join("\n")}\n    return 0;\n}`}` : `${includes ? includes + "\n\n" : ""}class Example {\n    public static void main(String[] args) {\n${code.split("\n").map(line => `        ${line}`).join("\n")}\n    }\n}`, operationLabel, mode: definition.mode, context, algorithmNote, inputLabel, secondaryItems, initialWorking, frames: [{ active: [], output: initialOutput, note: "Change the values, then play or step through the operation.", expression: operationLabel, working: initialWorking }, ...frames] };
}
