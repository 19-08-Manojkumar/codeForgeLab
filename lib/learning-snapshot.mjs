import { validateProfile } from "./learner.mjs";
import { getWebPracticeEntry } from "./web-practice.mjs";
import { activityFromState, activityDayLimit, mergeCodingActivity, codingMilestones } from "./coding-activity.mjs";
import { validateDesignState, mergeDesignState } from "./web-design-session.mjs";
import { getDesignChallenge } from "./web-design-challenges.mjs";

const languages = new Set(["javascript", "python", "java", "c", "html", "css"]);
const paths = new Set(["methods", "basics", "interviews", "problems", "render", "design"]);
const text = (value, limit = 3000) => typeof value === "string" && value.length <= limit;
const plain = value => value && typeof value === "object" && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000000;
const date = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const timestamp = value => typeof value === "string" && !Number.isNaN(Date.parse(value));
function requireValue(condition) { if (!condition) throw new TypeError("Invalid saved learning data."); }
function topic(value) {
  requireValue(plain(value) && languages.has(value.language) && paths.has(value.path) && /^[\w-]{1,100}$/.test(value.entryId || "") && text(value.title, 180));
  if (value.path === "design") requireValue(value.language === "html" && getDesignChallenge(value.entryId));
  else if (["html", "css"].includes(value.language)) requireValue(getWebPracticeEntry(value.language, value.path, value.entryId));
  else requireValue(value.path !== "render");
}
function list(value, limit, validate) {
  requireValue(Array.isArray(value) && value.length <= limit);
  for (const item of value) validate(item);
}
function config(value) {
  requireValue(value === null || plain(value) && Object.entries(value).every(([key, item]) => ["input", "operation", "parameter", "extra", "additions"].includes(key) && text(item)));
}

// Used for device storage and an explicit legacy-data transfer. Whitelist the
// top-level fields and validate nested data before it can reach the interface.
export function validateLearningSnapshot(value) {
  requireValue(plain(value) && value.version === 1 && new TextEncoder().encode(JSON.stringify(value)).length <= 750000);
  const fields = ["version", "profile", "handled", "completed", "lastVisited", "stats", "attempts", "quizzes", "mistakes", "daily", "bookmarks", "drafts", "eventIds"];
  const state = structuredClone(Object.fromEntries(fields.map(key => [key, value[key]])));
  state.design = validateDesignState(value.design);
  const activity = activityFromState(value);
  requireValue(plain(activity) && plain(activity.days) && count(activity.bestStreak) && activity.bestStreak <= activityDayLimit && (activity.firstDay === null || date(activity.firstDay)));
  const earned = activity.earned || [];
  list(earned, codingMilestones.length, id => requireValue(codingMilestones.some(item=>item.id===id)));
  state.activity = { days: {}, firstDay: activity.firstDay, bestStreak: activity.bestStreak, earned: [...new Set(earned)] };
  for (const [day, record] of Object.entries(activity.days)) state.activity.days[day] = { seconds: record?.seconds, actions: record?.actions };
  requireValue(Object.keys(state.activity.days).length <= activityDayLimit);
  for (const [day, record] of Object.entries(state.activity.days)) {
    requireValue(date(day) && plain(record) && count(record.seconds) && record.seconds <= 86400 && count(record.actions) && record.actions <= 100000 && record.seconds + record.actions > 0 && state.activity.firstDay !== null && day >= state.activity.firstDay);
  }
  requireValue(typeof state.handled === "boolean");
  if (state.profile !== null) { const profile=validateProfile(state.profile).profile; requireValue(profile); state.profile=profile; }
  requireValue(plain(state.stats) && count(state.stats.attempts) && count(state.stats.correct) && state.stats.correct <= state.stats.attempts);
  requireValue(plain(state.completed) && Object.keys(state.completed).length <= 30);
  for (const [key, ids] of Object.entries(state.completed)) {
    const [language, path, extra] = key.split(":");
    requireValue(!extra && languages.has(language) && paths.has(path));
    list(ids, 200, entryId => topic({ language, path, entryId, title: "" }));
  }
  if (state.lastVisited !== null) {
    topic(state.lastVisited);
    requireValue(["teach", "learn", "test", "practice"].includes(state.lastVisited.mode) && timestamp(state.lastVisited.visitedAt));
    config(state.lastVisited.config);
  }
  list(state.bookmarks, 150, topic);
  list(state.eventIds, 200, id => requireValue(/^[\w-]{10,80}$/.test(id)));
  list(state.attempts, 100, item => {
    topic(item); requireValue(text(item.key, 300) && ["quiz", "prediction", "problem"].includes(item.kind) && typeof item.correct === "boolean" && timestamp(item.attemptedAt));
  });
  list(state.quizzes, 30, item => {
    topic(item); requireValue(count(item.score) && count(item.total) && item.total >= 1 && item.total <= 100 && item.score <= item.total && timestamp(item.completedAt));
  });
  list(state.mistakes, 100, item => {
    topic(item);
    requireValue(text(item.key, 300) && text(item.prompt, 1000) && text(item.code, 6000) && text(item.expectedAnswer) && text(item.submittedAnswer) && text(item.explanation, 6000));
    list(item.expectedAnswers, 12, answer => requireValue(text(answer, 1000)));
    requireValue(["quiz", "prediction", "problem"].includes(item.kind) && count(item.misses) && count(item.reviewLevel) && typeof item.mastered === "boolean" && date(item.dueDay));
    requireValue(item.lastReviewDay === null || date(item.lastReviewDay));
  });
  requireValue(plain(state.daily) && Object.keys(state.daily).length <= 120);
  for (const [key, item] of Object.entries(state.daily)) {
    requireValue(plain(item) && date(item.date) && languages.has(item.language) && key === `${item.date}:${item.language}` && timestamp(item.updatedAt));
    list(item.completed, 5, marker => requireValue(["concept", "prediction-0", "prediction-1", "prediction-2", "problem"].includes(marker)));
  }
  requireValue(plain(state.drafts) && Object.keys(state.drafts).length <= 100);
  for (const [key, item] of Object.entries(state.drafts)) {
    const [language, path, entryId, extra] = key.split(":");
    requireValue(!extra); topic({ language, path, entryId, title: "" });
    requireValue(plain(item) && text(item.value, ["html", "css"].includes(language) ? 160000 : 3000) && timestamp(item.updatedAt));
    config(item.config);
    if (["html", "css"].includes(language)) {
      let source; try { source = JSON.parse(item.value); } catch { throw new TypeError("Invalid browser draft."); }
      requireValue(plain(source) && text(source.html, 12000) && text(source.css, 12000));
      requireValue(source.answer === undefined || text(source.answer));
      requireValue(source.explorerId === undefined || /^[\w-]{1,100}$/.test(source.explorerId));
    }
  }
  return state;
}

function unique(items, key) { return [...new Map(items.map(item => [key(item), item])).values()]; }
const topicKey = item => `${item.language}:${item.path}:${item.entryId}`;
export function mergeLearningSnapshot(current, input) {
  const guest = validateLearningSnapshot(input), next = structuredClone(current);
  next.design = mergeDesignState(current.design, guest.design);
  next.activity = mergeCodingActivity(activityFromState(current), guest.activity);
  if (!next.handled) { next.profile = guest.profile; next.handled = guest.handled; }
  for (const [key, ids] of Object.entries(guest.completed)) next.completed[key] = [...new Set([...(next.completed[key] || []), ...ids])].slice(-200);
  next.bookmarks = unique([...next.bookmarks, ...guest.bookmarks], topicKey).slice(-150);
  next.stats.attempts += guest.stats.attempts; next.stats.correct += guest.stats.correct;
  next.attempts = [...next.attempts, ...guest.attempts].sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt)).slice(-100);
  next.quizzes = [...next.quizzes, ...guest.quizzes].sort((a, b) => a.completedAt.localeCompare(b.completedAt)).slice(-30);
  next.mistakes = unique([...guest.mistakes, ...next.mistakes], item => item.key).slice(-100);
  for (const [key, item] of Object.entries(guest.daily)) {
    const old = next.daily[key];
    next.daily[key] = old ? { ...old, completed: [...new Set([...old.completed, ...item.completed])], updatedAt: old.updatedAt > item.updatedAt ? old.updatedAt : item.updatedAt } : item;
  }
  for (const key of Object.keys(next.daily).sort().slice(0, -120)) delete next.daily[key];
  for (const [key, item] of Object.entries(guest.drafts)) if (!next.drafts[key] || next.drafts[key].updatedAt < item.updatedAt) next.drafts[key] = item;
  const draftKeys = Object.keys(next.drafts).sort((a, b) => next.drafts[a].updatedAt.localeCompare(next.drafts[b].updatedAt));
  for (const key of draftKeys.slice(0, -100)) delete next.drafts[key];
  if (guest.lastVisited && (!next.lastVisited || next.lastVisited.visitedAt < guest.lastVisited.visitedAt)) next.lastVisited = guest.lastVisited;
  return next;
}
