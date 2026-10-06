import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { lessons } from "../lib/lessons.mjs";
import { format } from "../lib/engine.mjs";
import { createQuizAttempt, createQuizContext, startQuizAttempt, QUIZ_HISTORY_KEY } from "../lib/quiz.mjs";
import { javascriptTemplates } from "../lib/quiz-javascript.mjs";
import { pythonTemplates } from "../lib/quiz-python.mjs";
import { expandedPythonTemplates } from "../lib/quiz-python-expanded.mjs";

test("expanded Python quizzes omit worked-example answer comments",()=>{
  for(const templates of Object.values(expandedPythonTemplates)) for(const template of templates){
    const question=template(createQuizContext(779));
    assert.ok(question.code.split("\n").every(line=>!line.trimStart().startsWith("#")));
    assert.ok(["result","items","[result, items]"].includes(question.code.split("\n").at(-1)));
  }
});

test("every method has at least eight generated scenarios with four distinct answers", () => {
  for (const language of Object.keys(lessons)) {
    const templates = language === "javascript" ? javascriptTemplates : pythonTemplates;
    for (const lesson of lessons[language]) {
      assert.ok(templates[lesson.id].length >= 8, `${language}:${lesson.id}`);
      const { questions } = createQuizAttempt({ language, topicId: lesson.id, seed: 730 });
      assert.equal(questions.length, 5);
      assert.equal(new Set(questions.map(q => q.templateIndex)).size, 5);
      for (const q of questions) {
        assert.equal(q.lesson.id, lesson.id);
        assert.equal(q.choices.length, 4);
        assert.equal(new Set(q.choices).size, 4);
        assert.ok(q.answer >= 0 && q.answer < 4);
        assert.ok(q.explanation.length > 15);
      }
    }
  }
});

test("JavaScript template answers match the execution of their displayed code", () => {
  for (const [id, templates] of Object.entries(javascriptTemplates)) {
    for (let i = 0; i < templates.length; i++) {
      for (let seed = 1; seed <= 15; seed++) {
        const q = templates[i](createQuizContext(seed * 977));
        const actual = vm.runInNewContext(q.code, { console: { log() {} } }, { timeout: 100 });
        assert.equal(format(actual), format(q.value), `${id}, scenario ${i}, seed ${seed}: ${q.code}`);
      }
    }
  }
});

test("100 repeated attempts for every method use five different scenarios and avoid the previous set", () => {
  for (const language of Object.keys(lessons)) {
    for (const lesson of lessons[language]) {
      let history = {}, previous = [];
      for (let run = 0; run < 100; run++) {
        const result = createQuizAttempt({ language, topicId: lesson.id, seed: run * 3571 + 1, history });
        const codes = result.questions.map(q => q.code);
        assert.equal(new Set(codes).size, 5, `${language}:${lesson.id} attempt ${run}`);
        assert.equal(new Set(result.questions.map(q => q.templateIndex)).size, 5);
        assert.ok(codes.every(code => !previous.includes(code)), `${language}:${lesson.id} repeated a question on attempt ${run}`);
        assert.ok(result.history[`${language}:${lesson.id}`].length <= 50);
        history = result.history;
        previous = codes;
      }
    }
  }
});

test("mixed quizzes vary their examples and order while covering every method", () => {
  for (const language of Object.keys(lessons)) {
    const first = createQuizAttempt({ language, topicId: lessons[language][0].id, scope: "language", seed: 21 });
    const next = createQuizAttempt({ language, topicId: lessons[language][0].id, scope: "language", seed: 35, history: first.history });
    assert.equal(first.questions.length, lessons[language].length);
    assert.equal(new Set(first.questions.map(q => q.lesson.id)).size, lessons[language].length);
    assert.notDeepEqual(first.questions.map(q => q.lesson.id), next.questions.map(q => q.lesson.id));
    assert.ok(next.questions.every(q => !first.questions.some(p => p.lesson.id === q.lesson.id && p.code === q.code)));
  }
});

test("seeded generation is reproducible and option positions vary", () => {
  const options = { language: "javascript", topicId: "map", seed: 100 };
  assert.deepEqual(createQuizAttempt(options), createQuizAttempt(options));
  const positions = new Set();
  for (let seed = 1; seed < 20; seed++) for (const q of createQuizAttempt({ ...options, seed }).questions) positions.add(q.answer);
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test("recent history persists locally and unavailable or malformed storage does not block practice", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let stored = "{}";
  try {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: key => key === QUIZ_HISTORY_KEY ? stored : null, setItem: (key, value) => { assert.equal(key, QUIZ_HISTORY_KEY); stored = value; } } });
    const first = startQuizAttempt("javascript", "map");
    const next = startQuizAttempt("javascript", "map");
    assert.ok(next.every(q => !first.some(p => p.code === q.code)));
    assert.ok(JSON.parse(stored)["javascript:map"].length >= 10);
    stored = "invalid json";
    assert.equal(startQuizAttempt("javascript", "map").length, 5);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("Storage unavailable"); } });
    assert.equal(startQuizAttempt("python", "len").length, 5);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});

test("invalid lesson and quiz scope are rejected", () => {
  assert.throws(() => createQuizAttempt({ language: "javascript", topicId: "missing", seed: 1 }), /method/);
  assert.throws(() => createQuizAttempt({ language: "javascript", topicId: "map", scope: "missing", seed: 1 }), /quiz/);
});
