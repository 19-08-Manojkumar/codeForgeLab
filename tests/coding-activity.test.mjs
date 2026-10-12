import test from "node:test";
import assert from "node:assert/strict";
import { emptyLearningState, applyLearningEvent } from "../lib/learning-state.mjs";
import { validateLearningSnapshot } from "../lib/learning-snapshot.mjs";
import { codingSummary, activityDayStatus, shiftActivityDay, activityFromState, practiceTimeLabel, codingMilestones, streakFlame } from "../lib/coding-activity.mjs";
import { PracticeClock } from "../lib/practice-clock.mjs";
import { LearningStore } from "../lib/learning-store.mjs";

const topic = { language: "javascript", path: "problems", entryId: "double", title: "Double a number" };
const event = value => ({ id: crypto.randomUUID(), ...value });
const practice = (state, day, seconds = 0) => applyLearningEvent(state, event({ type: seconds ? "practice-time" : "complete", ...topic, day, ...(seconds ? { seconds } : {}) }), `${day}T12:00:00Z`);

test("25 distinct trophies preserve the original rewards and select the highest earned tier", () => {
  assert.equal(codingMilestones.length, 25);
  assert.equal(new Set(codingMilestones.map(item=>item.id)).size, 25);
  for(const id of ["first-day","streak-3","streak-7","time-1","streak-30","time-10","streak-100"]) assert.ok(codingMilestones.some(item=>item.id===id));
  const state = emptyLearningState();
  state.activity.earned = ["streak-30", "time-30m"];
  assert.equal(codingSummary(validateLearningSnapshot(state), "2026-10-12").tier, "gold", "A later bronze reward cannot downgrade an earned gold profile");
  for(const milestone of codingMilestones) {
    const fixture=emptyLearningState();
    fixture.activity.firstDay="2025-01-01";
    if(milestone.kind==="streak") fixture.activity.bestStreak=milestone.target;
    if(milestone.kind==="days") for(let i=0;i<milestone.target;i++) fixture.activity.days[shiftActivityDay("2025-01-01",i*2)]={seconds:0,actions:1};
    if(milestone.kind==="seconds") {
      let seconds=milestone.target,index=0;
      while(seconds){const amount=Math.min(seconds,86400);fixture.activity.days[shiftActivityDay("2025-01-01",index++)]={seconds:amount,actions:1};seconds-=amount;}
    }
    const normalized=validateLearningSnapshot(fixture);
    assert.ok(codingSummary(normalized,"2026-10-12").earned.some(item=>item.id===milestone.id),milestone.id);
  }
});

test("streak flames grow in size and brightness at milestones and remain bounded", () => {
  const levels=[0,1,3,7,14,30,100].map(streakFlame);
  for(let i=1;i<levels.length;i++) { assert.ok(levels[i].size>levels[i-1].size);assert.ok(levels[i].glow>levels[i-1].glow); }
  assert.deepEqual(streakFlame(10000),streakFlame(100));
  assert.ok(streakFlame(100).size<=64);
});

test("actual edits and practice earn a day; visits, profile changes and unchanged drafts do not", () => {
  let state = emptyLearningState();
  state = applyLearningEvent(state, event({ type: "visit", visit: { ...topic, mode: "practice" }, day: "2026-10-10" }));
  state = applyLearningEvent(state, event({ type: "bookmark", ...topic, day: "2026-10-10" }));
  state = applyLearningEvent(state, event({ type: "draft", ...topic, day: "2026-10-10" }));
  assert.equal(codingSummary(state, "2026-10-10").practiceDays, 0);
  state = applyLearningEvent(state, event({ type: "draft", ...topic, value: "return n * 2;", day: "2026-10-10" }));
  assert.equal(codingSummary(state, "2026-10-10").practiceDays, 1);
  const repeat = event({ type: "draft", ...topic, value: "return n * 2;", day: "2026-10-11" });
  state = applyLearningEvent(state, repeat);
  assert.equal(codingSummary(state, "2026-10-11").practiceDays, 1);
  state = applyLearningEvent(state, event({ type: "answer", day: "2026-10-11", answer: { ...topic, kind: "problem", submittedAnswer: "n + 2", correct: false } }));
  assert.equal(codingSummary(state, "2026-10-11").currentStreak, 2, "An honest attempt counts even when the answer is wrong");
});

test("streaks preserve yesterday until today ends and reset after a complete missed day", () => {
  let state = emptyLearningState();
  for (const day of ["2026-10-08", "2026-10-09", "2026-10-10"]) state = practice(state, day);
  assert.equal(codingSummary(state, "2026-10-10").currentStreak, 3);
  assert.equal(codingSummary(state, "2026-10-11").currentStreak, 3);
  assert.equal(codingSummary(state, "2026-10-11").activeToday, false);
  const paused = codingSummary(state, "2026-10-12");
  assert.equal(paused.currentStreak, 0);
  assert.equal(paused.bestStreak, 3);
  assert.equal(paused.missedYesterday, true);
  assert.ok(paused.earned.some(item => item.id === "streak-3"));
  assert.equal(activityDayStatus(paused.activity, "2026-10-11", "2026-10-12"), "missed");
  assert.equal(activityDayStatus(paused.activity, "2026-10-12", "2026-10-12"), "today");
  assert.equal(activityDayStatus(paused.activity, "2026-10-13", "2026-10-12"), "future");
  assert.equal(activityDayStatus(paused.activity, "2026-10-07", "2026-10-12"), "before");
  state = practice(state, "2026-10-12");
  assert.equal(codingSummary(state, "2026-10-12").currentStreak, 1);
  assert.equal(codingSummary(state, "2026-10-12").bestStreak, 3);
});

test("calendar arithmetic handles month ends, years and leap days", () => {
  assert.equal(shiftActivityDay("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftActivityDay("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftActivityDay("2026-12-31", 1), "2027-01-01");
  let state = emptyLearningState();
  for (const day of ["2026-12-31", "2027-01-01", "2027-01-02"]) state = practice(state, day);
  assert.equal(codingSummary(state, "2027-01-02").currentStreak, 3);
});

test("retries count time once, reject invalid increments, and grant persistent time trophies", () => {
  let state = emptyLearningState();
  const timed = event({ type: "practice-time", seconds: 60, day: "2026-10-12" });
  state = applyLearningEvent(state, timed);
  assert.deepEqual(applyLearningEvent(state, timed), state);
  for (let i = 1; i < 60; i++) state = practice(state, "2026-10-12", 60);
  const summary = codingSummary(state, "2026-10-12");
  assert.equal(summary.seconds, 3600);
  assert.equal(summary.practiceDays, 1);
  assert.ok(summary.earned.some(item => item.id === "time-1"));
  assert.ok(state.activity.earned.includes("time-1"));
  assert.ok(codingSummary({ ...state, activity: { ...state.activity, days: {} } }, "2037-01-01").earned.some(item => item.id === "time-1"));
  for (const seconds of [-1, 0, 61, 1.5, "30"]) assert.throws(() => applyLearningEvent(state, event({ type: "practice-time", seconds })));
  assert.equal(practiceTimeLabel(0), "0 minutes"); assert.equal(practiceTimeLabel(30), "Less than a minute"); assert.equal(practiceTimeLabel(3720), "1h 2m");
});

test("legacy records recover dated practice without creating imaginary time or marking mere reading", () => {
  const state = emptyLearningState(); delete state.activity;
  state.attempts = [{ attemptedAt: "2026-10-09T15:00:00Z" }];
  state.daily = { a: { date: "2026-10-10", completed: ["concept"] }, b: { date: "2026-10-11", completed: ["concept", "problem"] } };
  const restored = activityFromState(state);
  assert.deepEqual(Object.keys(restored.days), ["2026-10-09", "2026-10-11"]);
  assert.equal(Object.values(restored.days).reduce((total, day) => total + day.seconds, 0), 0);
  const blank = emptyLearningState(); delete blank.activity;
  assert.deepEqual(validateLearningSnapshot(blank).activity.days, {});
  for (const activity of [null, { days: {}, firstDay: "bad", bestStreak: 1 }, { days: { "2026-02-30": { seconds: 0, actions: 1 } }, firstDay: "2026-01-01", bestStreak: 1 }, { days: {}, firstDay: null, bestStreak: 1, earned: ["admin"] }]) assert.throws(() => validateLearningSnapshot({ ...blank, activity }));
});

test("guest activity imports once, preserves trophies, and stays separate between accounts", async () => {
  const values = new Map(), storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const guest = new LearningStore({ storage }); guest.dispatch({ type: "complete", ...topic, day: "2026-10-12" });
  let state = practice(emptyLearningState(), "2026-10-11", 30);
  const transport = async (method, update) => { if (method === "POST") state = applyLearningEvent(state, update); return { state }; };
  const account = new LearningStore({ owner: "learner-a", storage, transport }); await account.load();
  while (account.busy) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(codingSummary(state, "2026-10-12").currentStreak, 2);
  const imported = Object.values(state.activity.days).reduce((sum, item) => sum + item.actions, 0);
  await account.load(); while (account.busy) await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(Object.values(state.activity.days).reduce((sum, item) => sum + item.actions, 0), imported);
  const other = new LearningStore({ owner: "learner-b", storage, transport: async () => ({ state: emptyLearningState() }) }); await other.load();
  assert.equal(codingSummary(other.state, "2026-10-12").practiceDays, 0);
  account.destroy(); other.destroy(); guest.destroy();
});

test("practice clock excludes idle, hidden and non-owning tabs and caps sleeping-device gaps", () => {
  const clock = new PracticeClock(0);
  assert.deepEqual(clock.tick(30000, "2026-10-12", true), []);
  clock.interact(30000);
  const events = [];
  for (let now = 31000; now <= 60000; now += 1000) events.push(...clock.tick(now, "2026-10-12", true));
  assert.equal(events.reduce((sum, item) => sum + item.seconds, 0), 30);
  assert.deepEqual(clock.tick(61000, "2026-10-12", false), []);
  assert.deepEqual(clock.tick(90000, "2026-10-12", false), []);
  assert.deepEqual(clock.tick(100000, "2026-10-12", true), []);
  clock.interact(100000); clock.tick(200000, "2026-10-12", true);
  assert.equal(clock.flush().reduce((sum, item) => sum + item.seconds, 0), 0, "Sleeping gap may add at most the capped two seconds, already flushed on idle");
  const midnight = new PracticeClock(0); midnight.interact(0); midnight.tick(1000, "2026-10-12", true);
  const beforeMidnight = midnight.tick(2000, "2026-10-13", true);
  assert.deepEqual(beforeMidnight, [{ type: "practice-time", day: "2026-10-12", seconds: 1 }]);
  assert.deepEqual(midnight.flush(), [{ type: "practice-time", day: "2026-10-13", seconds: 1 }]);
});
