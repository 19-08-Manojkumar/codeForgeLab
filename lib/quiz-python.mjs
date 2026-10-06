// Dependency-free Python quiz scenarios. All answers are computed without eval.
// ctx: { int(min, max), pick(array), sample(array, count), shuffle(array), word(), seed }
const py = value => {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return `[${value.map(py).join(", ")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${py(item)}`).join(", ")}}`;
  return JSON.stringify(value);
};
const item = (code, value, distractors, explanation) => ({ code, value, distractors, explanation });
const numbers = (ctx, count = ctx.int(3, 6), minimum = 1, maximum = 25) => Array.from({ length: count }, () => ctx.int(minimum, maximum));
const word = ctx => `${ctx.word().replace(/[^a-z]/gi, "") || "code"}${ctx.int(1, 99)}`;
const total = values => values.reduce((sum, value) => sum + Number(value), 0);
const range = (start, stop, step = 1) => {
  const count = Math.max(0, Math.ceil((stop - start) / step));
  return Array.from({ length: count }, (_, index) => start + index * step);
};
const ordered = (values, reverse = false) => [...values].sort((a, b) => a - b).map((_, index, array) => array[reverse ? array.length - index - 1 : index]);
const dictionary = entries => Object.fromEntries(entries);

export const pythonTemplates = {
  len: [
    // A list's items count independently of their values.
    ctx => {
      const values = numbers(ctx);
      return item(`len(${py(values)})`, values.length, [total(values), values.length - 1, values.length + 1, values[0]], "len() counts the list's items, regardless of the numbers stored in them.");
    },
    // ASCII text makes character counts unambiguous.
    ctx => {
      const text = `${word(ctx)} ${word(ctx)}!`;
      return item(`len(${py(text)})`, text.length, [text.length - 2, text.length + 1, 2, text.split(" ").length], "len() counts every character in this ASCII string, including the space, digits, and punctuation.");
    },
    ctx => {
      const count = ctx.int(2, 5), values = dictionary(Array.from({ length: count }, (_, index) => [`${word(ctx)}_${index}`, ctx.int(10, 90)]));
      return item(`len(${py(values)})`, count, [count * 2, total(Object.values(values)), count - 1, count + 1], "A dictionary's length is its number of keys. Keys and values are not counted separately.");
    },
    ctx => {
      const values = [numbers(ctx, ctx.int(2, 4)), numbers(ctx, ctx.int(2, 4)), [word(ctx)]];
      return item(`len(${py(values)})`, values.length, [values.flat().length, values[0].length, values.length + 1, 1], "Each nested list occupies one item in the outer list. len() does not recursively count its contents.");
    },
    ctx => {
      const values = Array.from({ length: ctx.int(2, 5) }, () => word(ctx));
      return item(`len(${py(values)})`, values.length, [total(values.map(value => value.length)), values[0].length, values.length - 1, values.length + 1], "The argument is a list of strings, so len() counts strings rather than the characters inside them.");
    },
    ctx => {
      const first = word(ctx), second = word(ctx);
      return item(`len(${py(first)} + ${py(second)})`, first.length + second.length, [first.length, second.length, first.length + second.length + 1, 2], "String concatenation happens first. len() then counts the characters in the joined string, with no extra separator.");
    },
    ctx => {
      const text = word(ctx), copies = ctx.int(2, 5);
      return item(`len(${py(text)} * ${copies})`, text.length * copies, [text.length + copies, text.length, copies, text.length * (copies - 1)], "Multiplying a string repeats it. Its length is the original character count times the number of copies.");
    },
    ctx => {
      const values = numbers(ctx, ctx.int(4, 7)), stop = ctx.int(2, values.length - 1);
      return item(`values = ${py(values)}\nlen(values[:${stop}])`, stop, [values.length, stop + 1, values.length - stop, total(values.slice(0, stop))], "The slice contains indices 0 through stop - 1. Its length equals stop because this stop is within the list.");
    },
  ],
  sorted: [
    ctx => {
      const base = ctx.int(1, 30), values = [base + ctx.int(15, 25), base, base + ctx.int(3, 9)];
      return item(`sorted(${py(values)})`, ordered(values), [values, ordered(values, true), [values[1], values[0], values[2]], null], "sorted() compares numbers numerically and returns a new list in ascending order.");
    },
    ctx => {
      const base = ctx.int(1, 30), values = [base + ctx.int(3, 9), base, base + ctx.int(15, 25)];
      return item(`sorted(${py(values)}, reverse=True)`, ordered(values, true), [ordered(values), values, [values[2], values[1], values[0]], null], "reverse=True reverses the ordering, so the largest number appears first.");
    },
    ctx => {
      const base = ctx.int(1, 30), values = [base + ctx.int(12, 20), base, base + ctx.int(2, 8)];
      return item(`values = ${py(values)}\nresult = sorted(values)\nvalues`, values, [ordered(values), ordered(values, true), null, []], "sorted() creates result as a separate list. The final expression reads values, whose original order is unchanged.");
    },
    ctx => {
      const suffix = ctx.int(1, 99), values = [`pear${suffix}`, `apple${suffix}`, `mango${suffix}`];
      const value = [...values].sort();
      return item(`sorted(${py(values)})`, value, [values, [...value].reverse(), values.map(value => value.toUpperCase()), null], "For these lowercase ASCII strings, sorted() orders words lexicographically: apple, mango, then pear.");
    },
    ctx => {
      const prefix = word(ctx), letter = ctx.pick(["a", "b", "c", "d", "e"]), size = ctx.int(1, 4);
      const values = [prefix + letter.repeat(size + 4), prefix + letter.repeat(size), prefix + letter.repeat(size + 2)], value = [...values].sort((a, b) => a.length - b.length);
      return item(`sorted(${py(values)}, key=len)`, value, [values, [...value].reverse(), values.map(value => value.length), null], "key=len uses each string's length for comparison while returning the original strings, shortest first.");
    },
    ctx => {
      const base = ctx.int(-20, 20), values = [base + ctx.int(3, 9), base - ctx.int(2, 8), base];
      return item(`sorted((${values.map(py).join(", ")}))`, ordered(values), [values, ordered(values, true), null, [values[0]]], "sorted() accepts a tuple as input and returns a new list in ascending numeric order.");
    },
    ctx => {
      const low = ctx.int(1, 15), high = low + ctx.int(2, 12), values = [high, low, high, low + 1];
      return item(`sorted(${py(values)})`, ordered(values), [[low, low + 1, high], values, ordered(values, true), [low, high]], "Sorting changes order but preserves every occurrence. Both copies of the largest number remain.");
    },
    ctx => {
      const letter = ctx.pick(["b", "d", "g", "m"]), next = String.fromCharCode(letter.charCodeAt(0) + 1), text = `${next}${letter}${next}${letter}${ctx.int(10, 99)}`;
      const value = [...text].sort();
      return item(`sorted(${py(text)})`, value, [value.join(""), [...text], [...value].reverse(), null], "A string is iterable, so sorted() orders its individual characters and returns them as a list.");
    },
  ],
  sum: [
    ctx => {
      const values = numbers(ctx), value = total(values);
      return item(`sum(${py(values)})`, value, [values.length, value + 1, Math.max(...values), values], "sum() starts at 0 and adds all numbers in the list to produce one total.");
    },
    ctx => {
      const values = numbers(ctx, 3), start = ctx.int(10, 40), value = total(values) + start;
      return item(`sum(${py(values)}, ${start})`, value, [total(values), start, total(values) * start, value + start], "The second argument is an initial total. It is added once before the list's numbers.");
    },
    ctx => {
      const positive = ctx.int(5, 25), negative = -ctx.int(2, 15), values = [positive, negative, -ctx.int(1, 8)], value = total(values);
      return item(`sum(${py(values)})`, value, [total(values.map(Math.abs)), positive, value + Math.abs(negative) * 2, values.length], "Negative numbers subtract from the running total. sum() does not ignore them or use their absolute values.");
    },
    ctx => {
      const start = ctx.int(-40, 40);
      return item(`sum([], ${start})`, start, [0, [], null, start + 1, -start], "With no items to add, sum() returns the supplied start value unchanged.");
    },
    ctx => {
      const count = ctx.int(2, 5), values = Array.from({ length: count }, () => true), number = ctx.int(3, 15);
      values.splice(ctx.int(0, values.length), 0, false); values.push(number);
      return item(`sum(${py(values)})`, count + number, [number, values.length, count, count + number + 1], "In numeric calculations, True behaves as 1 and False as 0. Add those contributions to the integer.");
    },
    ctx => {
      const values = numbers(ctx, 3), value = total(values);
      return item(`sum((${values.map(py).join(", ")}))`, value, [values, values.length, value - values[0], Math.max(...values)], "sum() can add a tuple's numbers just as it adds a list's numbers.");
    },
    ctx => {
      const start = ctx.int(1, 25), stop = start + ctx.int(3, 8), values = range(start, stop), value = total(values.map(value => value * value));
      return item(`sum(n * n for n in range(${start}, ${stop}))`, value, [total(values), value + stop * stop, (stop - 1) * (stop - 1), stop], "range includes its start and excludes its stop. The generator squares each included number, and sum() adds those squares.");
    },
    ctx => {
      const values = numbers(ctx, 3);
      return item(`values = ${py(values)}\ntotal = sum(values)\nvalues`, values, [total(values), [total(values)], [], null], "sum() reads the numbers without changing their list. The final expression returns the original values.");
    },
  ],
  range: [
    ctx => {
      const stop = ctx.int(3, 8), offset = ctx.int(10, 99), value = range(0, stop);
      return item(`limit = ${stop + offset}\nlist(range(limit - ${offset}))`, value, [range(1, stop + 1), [...value, stop], range(1, stop), stop], `The argument evaluates to ${stop}. A one-argument range starts at 0 and advances by 1, excluding that stop value.`);
    },
    ctx => {
      const start = ctx.int(2, 15), stop = start + ctx.int(3, 6), value = range(start, stop);
      return item(`list(range(${start}, ${stop}))`, value, [[...value, stop], range(0, stop), range(start + 1, stop), []], "Include start, then count upward by 1. The stop argument itself is excluded.");
    },
    ctx => {
      const start = ctx.int(1, 12), step = ctx.int(2, 4), stop = start + step * ctx.int(3, 5), value = range(start, stop, step);
      return item(`list(range(${start}, ${stop}, ${step}))`, value, [[...value, stop], range(start, stop), value.map(value => value + step), []], "Start at the first argument and add step each time. Even when a step lands exactly on stop, stop is excluded.");
    },
    ctx => {
      const stop = ctx.int(-5, 5), step = -ctx.int(2, 4), start = stop - step * ctx.int(3, 5), value = range(start, stop, step);
      return item(`list(range(${start}, ${stop}, ${step}))`, value, [[...value, stop], [...value].reverse(), range(start, stop), []], "A negative step counts downward. Continue while the value is greater than stop, which remains excluded.");
    },
    ctx => {
      const stop = ctx.int(1, 15), start = stop + ctx.int(2, 8), step = ctx.int(1, 4);
      return item(`list(range(${start}, ${stop}, ${step}))`, [], [[start], [start, stop], range(stop, start, step), null], "This positive step moves upward, but start is already greater than stop. No values satisfy the range, so the list is empty.");
    },
    ctx => {
      const start = -ctx.int(7, 35), stop = start + ctx.int(3, 6), value = range(start, stop);
      return item(`list(range(${start}, ${stop}))`, value, [[...value, stop], value.map(Math.abs), [...value].reverse(), []], "Negative endpoints still follow the usual rules: include start, add 1, and exclude stop.");
    },
    ctx => {
      const start = ctx.int(1, 10), step = ctx.int(2, 4), count = ctx.int(3, 6), stop = start + count * step;
      return item(`len(range(${start}, ${stop}, ${step}))`, count, [stop - start, count + 1, step, stop], "The range contains one value for each step before stop. len() returns the number of values, not the stop value.");
    },
    ctx => {
      const start = ctx.int(1, 15), step = ctx.int(2, 5), stop = start + step * ctx.int(4, 7), index = ctx.int(1, 3), value = start + index * step;
      return item(`range(${start}, ${stop}, ${step})[${index}]`, value, [index, start + (index - 1) * step, start + (index + 1) * step, stop], "A range supports zero-based indexing. The indexed number is start + index * step.");
    },
  ],
  append: [
    ctx => {
      const values = numbers(ctx, 3), added = ctx.int(30, 60), value = [...values, added];
      return item(`items = ${py(values)}\nitems.append(${added})\nitems`, value, [values, [added, ...values], added, null], "append() adds exactly one item at the end and changes items. The final expression reads the changed list.");
    },
    ctx => {
      const values = numbers(ctx, 3), added = ctx.int(30, 60);
      return item(`items = ${py(values)}\nresult = items.append(${added})\nresult`, null, [[...values, added], values, added, values.length + 1], "append() changes the list but returns None. Assigning its return value makes result equal to None.");
    },
    ctx => {
      const values = numbers(ctx, 2), added = numbers(ctx, 2), value = [...values, added];
      return item(`items = ${py(values)}\nitems.append(${py(added)})\nitems`, value, [[...values, ...added], added, values, null], "append() treats the supplied list as one item. It creates a nested final item rather than extending with each number.");
    },
    ctx => {
      const values = [word(ctx), word(ctx)], added = word(ctx), value = [...values, added];
      return item(`items = ${py(values)}\nalias = items\nitems.append(${py(added)})\nalias`, value, [values, [added], null, added], "alias and items refer to the same list. The mutation from append() is visible through either name.");
    },
    ctx => {
      const values = [ctx.int(1, 20)], first = ctx.int(21, 35), second = ctx.int(36, 50), value = [...values, first, second];
      return item(`items = ${py(values)}\nitems.append(${first})\nitems.append(${second})\nitems`, value, [[...values, second, first], [first, second], [...values, second], null], "Each append adds one item after the previous contents. The two new items retain the order of the calls.");
    },
    ctx => {
      const values = numbers(ctx, 3), value = [...values, null];
      return item(`items = ${py(values)}\nitems.append(None)\nitems`, value, [values, null, [], [...values, "None"]], "None is a valid list item. append(None) adds that value; it does not remove items or append the text 'None'.");
    },
    ctx => {
      const values = numbers(ctx, ctx.int(2, 5)), added = word(ctx), value = values.length + 1;
      return item(`items = ${py(values)}\nitems.append(${py(added)})\nlen(items)`, value, [values.length, values.length + added.length, added.length, null], "A string passed to append() is one new item, so the list length increases by exactly 1.");
    },
    ctx => {
      const values = [word(ctx), word(ctx)], added = word(ctx);
      return item(`items = ${py(values)}\nitems.append(${py(added)})\nitems[-1]`, added, [values[values.length - 1], [...values, added], [added], null], "append() places the new string at the end. Index -1 reads that last item, giving the added string itself.");
    },
  ],
  split: [
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], separator = ctx.pick([",", ":", ";", "|"]), text = values.join(separator);
      return item(`${py(text)}.split(${py(separator)})`, values, [[text], text.replaceAll(separator, ""), values.length, [text, ""]], "The explicit separator marks each boundary. split() returns a list containing the text on either side of those boundaries.");
    },
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], text = `  ${values[0]}\t${values[1]}   ${values[2]}  `;
      return item(`${py(text)}.split()`, values, [["", ...values, ""], [text], values.join(""), text.split(" ")], "With no separator, Python groups spaces and tabs as whitespace and omits empty pieces at the edges.");
    },
    ctx => {
      const first = word(ctx), second = word(ctx), separator = ctx.pick([",", ":", "|"]), text = `${first}${separator}${separator}${second}`, value = [first, "", second];
      return item(`${py(text)}.split(${py(separator)})`, value, [[first, second], [first, separator, second], [text], [first, "", "", second]], "Two adjacent explicit separators leave an empty string between them. Python keeps that empty piece.");
    },
    ctx => {
      const first = word(ctx), second = word(ctx), separator = ctx.pick([",", ":", "|"]), text = `${separator}${first}${separator}${second}${separator}`, value = ["", first, second, ""];
      return item(`${py(text)}.split(${py(separator)})`, value, [[first, second], [text], ["", first, second], [first, second, ""]], "An explicit separator at either end creates an empty edge piece. Unlike whitespace splitting, these empties stay in the result.");
    },
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx), word(ctx)], separator = ctx.pick([",", ":", ";"]), limit = ctx.int(1, 2), text = values.join(separator), value = [...values.slice(0, limit), values.slice(limit).join(separator)];
      return item(`${py(text)}.split(${py(separator)}, ${limit})`, value, [values, values.slice(0, limit), [text], [...values.slice(0, limit + 1)]], "maxsplit limits the number of boundaries split. The remaining text, including its separators, becomes the last piece.");
    },
    ctx => {
      const text = `${word(ctx)} ${word(ctx)}`, separator = ctx.pick([",", ":", "|"]);
      return item(`${py(text)}.split(${py(separator)})`, [text], [[], text, text.split(" "), [text, ""]], "The chosen separator does not occur in the text. split() returns a one-item list containing the whole original string.");
    },
    ctx => {
      const values = [word(ctx), word(ctx)], separator = ctx.pick([",", ":", "|"]), text = values.join(separator);
      return item(`text = ${py(text)}\npieces = text.split(${py(separator)})\ntext`, text, [values, values.join(""), separator, null], "split() returns a new list of pieces and leaves the immutable source string unchanged. The final expression reads text.");
    },
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], separator = ctx.pick(["::", "--", "||"]), text = values.join(separator);
      return item(`${py(text)}.split(${py(separator)})`, values, [text.split(separator[0]), [text], values.join(""), [...values, ""]], "A separator can contain multiple characters. Python matches the complete separator rather than each of its characters separately.");
    },
  ],
  join: [
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], separator = ctx.pick([",", "-", ":", "|"]), value = values.join(separator);
      return item(`${py(separator)}.join(${py(values)})`, value, [values, values.join(""), `${separator}${value}${separator}`, `${value}${separator}`], "join() places the separator between strings, with no added separator before the first or after the last.");
    },
    ctx => {
      const separator = `${ctx.pick(["-", ":", "|"])}${ctx.int(1, 99)}`;
      return item(`${py(separator)}.join([])`, "", [separator, [], null, `${separator}${separator}`], "Joining an empty iterable produces an empty string. There are no strings or gaps in which to place the separator.");
    },
    ctx => {
      const value = word(ctx), separator = ctx.pick([",", "-", ":", "|"]);
      return item(`${py(separator)}.join([${py(value)}])`, value, [`${separator}${value}`, `${value}${separator}`, [value], value.split("").join(separator)], "One string has no gap between items, so join() returns that string without adding the separator.");
    },
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], value = values.join("");
      return item(`"".join(${py(values)})`, value, [values.join(" "), values, values.join(","), ""], "An empty separator concatenates all strings directly, without spaces or punctuation between them.");
    },
    ctx => {
      const values = [word(ctx), "", word(ctx)], separator = ctx.pick([",", "-", ":"]), value = values.join(separator);
      return item(`${py(separator)}.join(${py(values)})`, value, [[values[0], values[2]].join(separator), `${separator}${value}${separator}`, values, values.join("")], "The empty string is still an item. There are two gaps, so the result contains two consecutive separators around it.");
    },
    ctx => {
      const text = `${ctx.pick(["abc", "def", "xyz", "jkl"])}${ctx.int(10, 99)}`, separator = ctx.pick(["-", ":", "|"]), value = [...text].join(separator);
      return item(`${py(separator)}.join(${py(text)})`, value, [text, [...text], `${separator}${text}${separator}`, `${value}${separator}`], "A string is an iterable of characters. join() places the separator between each character, including the digits.");
    },
    ctx => {
      const values = [word(ctx), word(ctx)], separator = ctx.pick([",", "-", ":"]);
      return item(`parts = ${py(values)}\ntext = ${py(separator)}.join(parts)\nparts`, values, [values.join(separator), [values.join(separator)], [], null], "join() creates a string without changing its input list. The final expression reads the original parts list.");
    },
    ctx => {
      const values = [word(ctx), word(ctx), word(ctx)], separator = ctx.pick([" / ", " -> ", " :: "]), value = values.join(separator);
      return item(`${py(separator)}.join(${py(values)})`, value, [values.join(separator.trim()), values.join(" "), `${separator}${value}`, values], "The entire separator string is placed between each pair of items. Its spaces and punctuation are preserved exactly.");
    },
  ],
  get: [
    ctx => {
      const key = word(ctx), value = ctx.int(1, 50), fallback = ctx.int(60, 90), data = dictionary([[key, value], ["other", ctx.int(1, 50)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, ${fallback})`, value, [fallback, key, null, data], "The key exists, so get() returns its stored value. The fallback is used only for a missing key.");
    },
    ctx => {
      const key = word(ctx), fallback = ctx.int(20, 80), data = dictionary([[`${key}_present`, ctx.int(1, 15)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, ${fallback})`, fallback, [null, key, data[`${key}_present`], data], "The requested key is absent. get() returns the explicit fallback without adding a new entry to the dictionary.");
    },
    ctx => {
      const key = word(ctx), data = dictionary([[`${key}_present`, ctx.int(1, 50)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)})`, null, [0, key, data[`${key}_present`], data], "With no fallback argument, a missing key makes get() return None.");
    },
    ctx => {
      const key = word(ctx), fallback = ctx.int(10, 80), data = dictionary([[key, null], ["other", ctx.int(1, 50)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, ${fallback})`, null, [fallback, 0, key, data], "The key exists and explicitly stores None. get() returns that None instead of using the fallback.");
    },
    ctx => {
      const key = word(ctx), fallback = word(ctx), data = dictionary([[key, false], ["other", ctx.int(1, 50)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, ${py(fallback)})`, false, [fallback, null, true, key], "False is a stored value, and the key exists. get() tests whether the key is present, rather than whether its value is truthy.");
    },
    ctx => {
      const key = word(ctx), innerKey = word(ctx), value = dictionary([[innerKey, ctx.int(1, 50)]]), data = dictionary([[key, value]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, {})`, value, [{}, data, innerKey, null], "get() returns the value as stored. Here that value is another dictionary, rather than one of its inner fields.");
    },
    ctx => {
      const key = word(ctx), fallback = ctx.int(10, 80), data = dictionary([[key, 0], ["other", ctx.int(1, 50)]]);
      return item(`data = ${py(data)}\ndata.get(${py(key)}, ${fallback})`, 0, [fallback, null, false, key], "A stored zero is still a valid value. Because the key exists, get() returns 0 and ignores the fallback.");
    },
    ctx => {
      const key = word(ctx), data = dictionary([[`${key}_present`, ctx.int(1, 50)]]), fallback = ctx.int(60, 90);
      return item(`data = ${py(data)}\nresult = data.get(${py(key)}, ${fallback})\ndata`, data, [dictionary([...Object.entries(data), [key, fallback]]), fallback, null, {}], "get() reads a missing key safely but does not insert it. The final expression reads the unchanged dictionary.");
    },
  ],
};
