import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_KEY, HANDLED_KEY, validateProfile, readLearnerSession, saveLearnerSession,
  learnerBackground, learnerGoalMessage, personalizeCelebration, correctFeedback, retryFeedback,
} from "../lib/learner.mjs";

const example = { name: "Manoj", age: 24, role: "working", domain: "Software engineering", goal: "projects" };
const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
};

test("profiles normalize whitespace, preserve Unicode and case, and discard unrelated data", () => {
  const result = validateProfile({ ...example, name: "  Zoë\t李  ", domain: "  Computer\n  Science ", age: " 24 ", secret: "ignored" });
  assert.deepEqual(result, {
    profile: { name: "Zoë 李", age: 24, role: "working", domain: "Computer Science", goal: "projects" },
    errors: {},
  });
  assert.equal(validateProfile({ ...example, name: "<script>hello</script>" }).profile.name, "<script>hello</script>");
});

test("name, background and goal must be valid before a profile can be saved", () => {
  for (const draft of [null, {}, { ...example, name: "  ", domain: "", role: "visitor", goal: "unknown" }]) {
    const { profile, errors } = validateProfile(draft);
    assert.equal(profile, null);
    for (const field of ["name", "domain", "role", "goal"]) assert.ok(errors[field], field);
  }
  assert.ok(validateProfile({ ...example, name: "a".repeat(41) }).errors.name);
  assert.ok(validateProfile({ ...example, domain: "a".repeat(61) }).errors.domain);
  assert.ok(validateProfile({ ...example, name: "😀".repeat(40), domain: "a".repeat(60) }).profile);
});

test("age is optional and accepts only whole numbers in the supported range", () => {
  for (const age of [undefined, null, "", "  "]) assert.equal(validateProfile({ ...example, age }).profile.age, null);
  for (const age of [1, 120, "01", "24"]) assert.equal(validateProfile({ ...example, age }).profile.age, Number(age));
  for (const age of [0, 121, -1, 3.5, "24.0", "1e2", "hello", NaN, Infinity, true]) {
    const result = validateProfile({ ...example, age });
    assert.equal(result.profile, null);
    assert.ok(result.errors.age, String(age));
  }
});

test("session saving, restoring and clearing keeps the dismissal separate from personal details", () => {
  const storage = memoryStorage();
  assert.deepEqual(readLearnerSession(storage), { profile: null, handled: false });
  saveLearnerSession(storage, example);
  assert.deepEqual(readLearnerSession(storage), { profile: example, handled: true });
  assert.deepEqual(JSON.parse(storage.getItem(PROFILE_KEY)), example);
  assert.equal(storage.getItem(HANDLED_KEY), "true");
  saveLearnerSession(storage, null);
  assert.equal(storage.getItem(PROFILE_KEY), null);
  assert.deepEqual(readLearnerSession(storage), { profile: null, handled: true });
});

test("a valid profile is handled even without a marker, while malformed profiles are ignored", () => {
  const storage = memoryStorage();
  storage.setItem(PROFILE_KEY, JSON.stringify(example));
  assert.deepEqual(readLearnerSession(storage), { profile: example, handled: true });
  for (const saved of ["not json", "null", "[]", "123", JSON.stringify({ ...example, age: -1 })]) {
    storage.setItem(PROFILE_KEY, saved);
    assert.deepEqual(readLearnerSession(storage), { profile: null, handled: false });
  }
  storage.setItem(HANDLED_KEY, "true");
  assert.deepEqual(readLearnerSession(storage), { profile: null, handled: true });
});

test("unavailable or blocked storage never interrupts the learner flow", () => {
  const blocked = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  for (const storage of [undefined, null, blocked]) {
    assert.deepEqual(readLearnerSession(storage), { profile: null, handled: false });
    assert.deepEqual(saveLearnerSession(storage, example), { profile: example, handled: true });
    assert.deepEqual(saveLearnerSession(storage, null), { profile: null, handled: true });
  }
});

test("motivation follows the learner's name, role and goal and is independent of age", () => {
  assert.equal(learnerBackground(example), "Working in Software engineering");
  assert.equal(learnerBackground({ ...example, role: "student" }), "Studying Software engineering");
  assert.equal(learnerBackground({ ...example, role: "independent" }), "Exploring Software engineering");
  const messages = new Set();
  for (const goal of ["basics", "projects", "interviews", "work", "course"]) {
    const young = { ...example, age: 12, goal };
    const older = { ...example, age: 70, goal };
    const message = learnerGoalMessage(young);
    assert.equal(message, learnerGoalMessage(older));
    assert.equal(correctFeedback(young, 2), correctFeedback(older, 2));
    messages.add(message);
  }
  assert.equal(messages.size, 5);
  const feedback = [0, 1, 2, 3].map(index => correctFeedback(example, index));
  assert.equal(new Set(feedback).size, 4);
  assert.ok(feedback.every(message => message.includes("Manoj")));
  assert.match(retryFeedback(example), /Manoj.*Trace each step/);
});

test("personalized celebrations retain their lifecycle fields and describe the actual achievement", () => {
  for (const kind of ["first", "retry", "streak", "perfect"]) {
    const celebration = { id: 7, kind, title: "Original", message: "Original message", streak: 3, count: 5 };
    const result = personalizeCelebration(celebration, example);
    assert.equal(result.id, celebration.id);
    assert.equal(result.kind, kind);
    assert.match(result.title, /Manoj/);
    assert.notEqual(result.message, celebration.message);
    assert.equal(celebration.title, "Original");
    assert.equal(result.title, "Well done, Manoj!");
    if (kind === "streak") assert.match(result.message, /3 correct predictions in a row/);
    if (kind === "perfect") assert.match(result.message, /All 5 predictions.*first try/);
  }
});

test("anonymous learners retain the existing generic feedback", () => {
  const celebration = { kind: "first", title: "That clicked!", message: "Nice work." };
  assert.equal(personalizeCelebration(celebration, null).title, "Well done!");
  assert.equal(personalizeCelebration(celebration, null).message, celebration.message);
  assert.equal(personalizeCelebration(null, example), null);
  assert.equal(correctFeedback(null), "That’s right.");
  assert.equal(retryFeedback(null), "Almost. Take another look.");
  assert.equal(learnerBackground(null), "");
});
