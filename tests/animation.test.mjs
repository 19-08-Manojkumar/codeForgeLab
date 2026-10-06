import test from "node:test";
import assert from "node:assert/strict";
import { lessons, defaultConfig } from "../lib/lessons.mjs";
import { curricula } from "../lib/curriculum.mjs";
import { buildTrace } from "../lib/engine.mjs";
import { buildAnimationTrace } from "../lib/animation.mjs";
import { defaultNativeConfig, buildNativeTrace } from "../lib/native-animation.mjs";
import { editedNativeCases } from "./animation-cases.mjs";

const entry = (lang, id) => curricula[lang].references.find(item => item.id === id);
const native = (lang, id, changes = {}) => buildAnimationTrace(entry(lang, id), { ...defaultNativeConfig(entry(lang, id)), ...changes }, lang);

test("detailed snapshots preserve all 50 JS/Python results and source mutations", () => {
  for (const [lang, entries] of Object.entries(lessons)) for (const lesson of entries) {
    const config = defaultConfig(lesson), expected = buildTrace(lesson, config), trace = buildAnimationTrace(lesson, config);
    assert.deepEqual(trace.result, expected.result, `${lang}:${lesson.id}`);
    assert.deepEqual(trace.mutated, expected.mutated);
    assert.deepEqual(trace.frames.at(-1).output, expected.result);
    assert.equal(trace.frames.at(-1).stage, "return");
    assert.equal(trace.frames[1].stage, "read");
  }
});

test("filter reads, evaluates, then commits without leaking future items", () => {
  const lesson = lessons.javascript.find(item => item.id === "filter"), config = { ...defaultConfig(lesson), input: "[2, 7, 4]", operation: "even" };
  const trace = buildAnimationTrace(lesson, config);
  assert.deepEqual(trace.frames.slice(1, 4).map(frame => frame.stage), ["read", "evaluate", "commit"]);
  assert.deepEqual(trace.frames[1].output, []);
  assert.deepEqual(trace.frames[2].output, []);
  assert.equal(trace.frames[2].evaluation, "2 % 2 === 0");
  assert.equal(trace.frames[2].decision, true);
  assert.deepEqual(trace.frames[3].output, [2]);
  assert.deepEqual(trace.frames[6].output, [2]);
  assert.deepEqual(trace.frames[6].rejected, [{ index: 1, value: 7 }]);
  assert.deepEqual(trace.frames.at(-1).output, [2, 4]);
  assert.deepEqual(trace.frames[3].rejected, [], "earlier frames remain immutable");
});

test("search short circuits and accumulator preserves before/after totals", () => {
  const find = lessons.javascript.find(item => item.id === "find"), found = buildAnimationTrace(find, { ...defaultConfig(find), input: "[1, 8, 9]", operation: "greater", parameter: "5" });
  assert.deepEqual(found.frames.at(-1).processed, [0, 1]);
  const reduce = lessons.javascript.find(item => item.id === "reduce"), sum = buildAnimationTrace(reduce, { ...defaultConfig(reduce), input: "[3, 7]", parameter: "10", operation: "sum" });
  assert.equal(sum.frames[2].before, 10); assert.equal(sum.frames[2].after, 13);
  assert.equal(sum.frames[5].before, 13); assert.equal(sum.result, 20);
});

test("all 50 native references have editable models with independent changed-value expectations", () => {
  assert.equal(editedNativeCases.length, 50);
  for (const [lang, id, changes, expected, mutation] of editedNativeCases) {
    const trace = native(lang, id, changes);
    assert.deepEqual(trace.result, expected, id);
    if (mutation) assert.deepEqual(trace.mutated, mutation, id + " mutation");
    assert.deepEqual(trace.frames.at(-1).output, expected);
    assert.ok(trace.code.includes(lang === "c" ? "int main(void)" : "public static void main"), "complete example: " + id);
    const defaultTrace = native(lang, id); assert.ok(defaultTrace.frames.length >= 5);
  }
});

test("memmove protects overlapping bytes and exposes incremental destination writes", () => {
  const trace = native("c", "memmove");
  assert.deepEqual(trace.mutated, [1, 2, 1, 2, 3, 4]);
  const writes = trace.frames.filter(frame => frame.stage === "commit");
  assert.deepEqual(writes.map(frame => frame.destinationActive[0]), [5, 4, 3, 2]);
  assert.deepEqual(writes[0].working, [1, 2, 3, 4, 5, 4]);
  assert.deepEqual(trace.frames[2].working, [1, 2, 3, 4, 5, 6]);
});

test("snprintf models capacity zero, truncation, terminator and full return length", () => {
  assert.deepEqual(native("c", "snprintf", { input: "abc", parameter: "0" }).mutated, []);
  const short = native("c", "snprintf", { input: "abc", parameter: "3" });
  assert.deepEqual(short.mutated, ["a", "b", "\\0"]); assert.equal(short.result, 3);
  assert.equal(native("c", "snprintf", { input: "abc", parameter: "4" }).result, 3);
});

test("native invalid inputs produce operation-specific errors instead of false results", () => {
  for (const [lang, id, changes, pattern] of [
    ["java", "java-char-at", { input: "", parameter: "0" }, /Index/],
    ["java", "java-parse-int", { input: "12x" }, /NumberFormatException/],
    ["java", "java-parse-int", { input: "2147483648" }, /32-bit/],
    ["java", "java-collections-max", { input: "[]" }, /nonempty/],
    ["java", "java-sqrt", { input: "-1" }, /nonnegative/],
    ["c", "memcpy", { parameter: "9" }, /Count/],
    ["c", "memset", { parameter: "256" }, /255/],
    ["c", "strlen", { input: "é" }, /ASCII/],
    ["c", "bsearch", { input: "[3, 1]" }, /sorted/],
  ]) assert.throws(() => native(lang, id, changes), pattern);
});

test("successful output is separate from a C function's return value", () => {
  const puts = native("c", "puts", { input: "hi" });
  assert.equal(puts.result, "nonnegative on success");
  assert.equal(puts.frames.at(-1).consoleOutput, "hi\n");
  const printf = native("c", "printf", { input: "-42" });
  assert.equal(printf.frames.at(-1).consoleOutput, "-42"); assert.equal(printf.result, 3);
});

test("string replacement and splitting show original positions with language-specific behavior", () => {
  for (const lang of ["javascript", "python"]) {
    const lesson = lessons[lang].find(item => item.id === "replace"), trace = buildAnimationTrace(lesson, { ...defaultConfig(lesson), input: "red red", parameter: "red", extra: "blue" });
    assert.equal(trace.result, lang === "javascript" ? "blue red" : "blue blue");
    assert.deepEqual(trace.items, ["r", "e", "d", " ", "r", "e", "d"]);
    assert.equal(trace.frames.filter(frame => frame.stage === "commit" && frame.decision === true).length, lang === "javascript" ? 1 : 2);
  }
  const split = lessons.javascript.find(item => item.id === "split"), trace = buildAnimationTrace(split, { ...defaultConfig(split), input: "a,,b", parameter: ",", extra: "" });
  assert.deepEqual(trace.result, ["a", "", "b"]); assert.deepEqual(trace.items, ["a", ",", ",", "b"]);
});

test("C conversion models preserve integer returns and parsing end boundaries", () => {
  assert.equal(native("c", "toupper", { input: "a" }).result, 65);
  assert.equal(native("c", "isdigit", { input: "7" }).result, "nonzero");
  const trace = native("c", "strtol", { input: "0xG", parameter: "16" });
  assert.equal(trace.result, 0); assert.match(trace.context, /byte 1/);
  assert.match(native("c", "memset", { parameter: "065" }).code, /memset\(buffer, 65,/);
});
