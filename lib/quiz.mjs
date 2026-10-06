import { lessons } from "./lessons.mjs";
import { format } from "./engine.mjs";
import { javascriptTemplates } from "./quiz-javascript.mjs";
import { pythonTemplates } from "./quiz-python.mjs";

export const TOPIC_QUESTION_COUNT = 5;
export const QUIZ_HISTORY_KEY = "methodlab.quiz-history.v1";
const RECENT_QUESTION_LIMIT = 50;
const WORDS = ["apple", "pear", "mango", "peach", "melon", "grape", "plum", "lemon", "kiwi", "berry", "lime", "orange", "banana", "cherry", "fig", "date"];

// A seed makes generation reproducible for checks; each real attempt uses a fresh seed.
export function createQuizContext(seed) {
  let state = Number(seed) >>> 0;
  const random = () => {
    state += 0x6D2B79F5;
    let n = Math.imul(state ^ state >>> 15, 1 | state);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
  const int = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  return { seed, random, int, shuffle, pick: values => values[int(0, values.length - 1)], sample: (values, count) => shuffle(values).slice(0, count), word: () => WORDS[int(0, WORDS.length - 1)] };
}

function makeQuestion(raw, lesson, templateIndex, context) {
  if (!raw?.code || !raw.explanation || !("value" in raw)) throw new Error("Question template is incomplete.");
  const display = value => typeof value === "number" && !Number.isFinite(value) ? String(value) : format(value, lesson.language);
  const correct = display(raw.value);
  const choices = [correct];
  // Compare the displayed answers, so no two options can mean the same output.
  for (const value of [...(raw.distractors || []), [], null, undefined, false, true, 0, 1, "", "missing"]) {
    if (lesson.language === "python" && value === undefined) continue;
    const option = display(value);
    if (!choices.includes(option)) choices.push(option);
    if (choices.length === 4) break;
  }
  if (choices.length !== 4) throw new Error("A question needs four distinct answers.");
  const shuffled = context.shuffle(choices);
  return { code: raw.code, choices: shuffled, answer: shuffled.indexOf(correct), explanation: raw.explanation, templateIndex, lesson };
}

export function createQuizAttempt({ language, topicId, scope = "topic", seed, history = {} }) {
  if (!["topic", "language"].includes(scope) || !lessons[language]) throw new Error("Choose a supported quiz.");
  const topic = lessons[language].find(lesson => lesson.id === topicId);
  if (!topic) throw new Error("Choose an available method.");
  const context = createQuizContext(seed);
  const templates = language === "javascript" ? javascriptTemplates : pythonTemplates;
  const selectedLessons = scope === "topic" ? Array(TOPIC_QUESTION_COUNT).fill(topic) : context.shuffle(lessons[language]);
  const nextHistory = { ...history };
  const questions = [];
  const usedTemplates = new Map();
  const previousQuestions = new Map();

  for (const lesson of selectedLessons) {
    const key = `${language}:${lesson.id}`;
    const recent = Array.isArray(nextHistory[key]) ? nextHistory[key].filter(code => typeof code === "string").slice(-RECENT_QUESTION_LIMIT) : [];
    if (!previousQuestions.has(key)) previousQuestions.set(key, recent.slice(-TOPIC_QUESTION_COUNT));
    const bank = templates[lesson.id];
    if (!bank || bank.length < TOPIC_QUESTION_COUNT) throw new Error("This method needs more question types.");
    const used = usedTemplates.get(key) || new Set();
    const order = context.shuffle(bank.map((_, i) => i)).filter(i => !used.has(i));
    let question;
    for (const templateIndex of order) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const candidate = makeQuestion(bank[templateIndex](context), lesson, templateIndex, context);
        if (!recent.includes(candidate.code) && !questions.some(q => q.lesson.id === lesson.id && q.code === candidate.code)) {
          question = candidate;
          used.add(templateIndex);
          break;
        }
      }
      if (question) break;
    }
    if (!question) {
      // A small edge-case template can exhaust its variants. Keep the previous
      // five questions excluded while allowing older examples back into rotation.
      for (const templateIndex of order) {
        for (let attempt = 0; attempt < 80; attempt++) {
          const candidate = makeQuestion(bank[templateIndex](context), lesson, templateIndex, context);
          if (!previousQuestions.get(key).includes(candidate.code) && !questions.some(q => q.lesson.id === lesson.id && q.code === candidate.code)) {
            question = candidate;
            used.add(templateIndex);
            break;
          }
        }
        if (question) break;
      }
    }
    if (!question) throw new Error("Could not create a fresh set of questions.");
    usedTemplates.set(key, used);
    nextHistory[key] = [...recent, question.code].slice(-RECENT_QUESTION_LIMIT);
    questions.push(question);
  }
  return { questions, history: nextHistory };
}

function freshSeed() {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  return (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
}

const sessionHistory = {};
export function startQuizAttempt(language, topicId, scope = "topic") {
  let savedHistory = {};
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(QUIZ_HISTORY_KEY) || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) savedHistory = parsed;
  } catch { /* Session tracking still works when local storage is unavailable. */ }
  const result = createQuizAttempt({ language, topicId, scope, seed: freshSeed(), history: { ...savedHistory, ...sessionHistory } });
  Object.assign(sessionHistory, result.history);
  try { globalThis.localStorage?.setItem(QUIZ_HISTORY_KEY, JSON.stringify(result.history)); } catch { /* Restricted storage does not block practice. */ }
  return result.questions;
}
