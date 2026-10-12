import { designLevels, designChallenges, getDesignChallenge } from "./web-design-challenges.mjs";

export const designCodeLimit = 12000;
export const designDraftLimit = 40;
const variantLimit = 999999;
let runSequence = 0;
const plain = value => value && typeof value === "object" && !Array.isArray(value);
const timestamp = value => typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));
const integer = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const validLevel = level => Number.isInteger(level) && designLevels.some(item => item.level === level);
const knownChallenge = (id, level) => typeof id === "string" && designChallenges.some(item => item.id === id && (level === undefined || item.level === level));
const recentValues = values => [...new Set([...values].reverse())].reverse().slice(-8);
function requireValue(condition) { if (!condition) throw new TypeError("Invalid saved Web Design practice."); }

export const designDraftKey = (challengeId, variant) => `${challengeId}:${variant}`;
export function emptyDesignState() { return { runs: {}, drafts: {}, results: {}, recentVariants: {} }; }

export function validateDesignRun(value) {
  requireValue(plain(value) && /^[\w-]{10,80}$/.test(value.id || "") && validLevel(value.level) && timestamp(value.createdAt));
  const ids = designChallenges.filter(item => item.level === value.level).map(item => item.id);
  requireValue(Array.isArray(value.order) && value.order.length === ids.length && new Set(value.order).size === ids.length && value.order.every(id => ids.includes(id)));
  requireValue(integer(value.index, value.order.length) && plain(value.variants) && Object.keys(value.variants).length === ids.length);
  requireValue(ids.every(id => integer(value.variants[id], variantLimit)));
  const revealed = value.revealed ?? [];
  requireValue(Array.isArray(revealed) && revealed.length <= ids.length && revealed.every(id => ids.includes(id)));
  return { id: value.id, level: value.level, order: [...value.order], variants: Object.fromEntries(ids.map(id => [id, value.variants[id]])), index: value.index, createdAt: value.createdAt, revealed: [...new Set(revealed)] };
}

export function validateDesignCode(value) {
  requireValue(plain(value) && ["html", "css", "js"].every(key => typeof value[key] === "string" && value[key].length <= designCodeLimit));
  return { html: value.html, css: value.css, js: value.js };
}

export function validateDesignState(value) {
  if (value === undefined) return emptyDesignState();
  requireValue(plain(value) && ["runs", "drafts", "results", "recentVariants"].every(key => plain(value[key])));
  const state = emptyDesignState();
  requireValue(Object.keys(value.runs).length <= designLevels.length);
  for (const [level, run] of Object.entries(value.runs)) {
    const clean = validateDesignRun(run);
    requireValue(level === String(clean.level)); state.runs[level] = clean;
  }
  requireValue(Object.keys(value.drafts).length <= designDraftLimit);
  for (const [key, item] of Object.entries(value.drafts)) {
    requireValue(plain(item) && validLevel(item.level) && knownChallenge(item.challengeId, item.level) && integer(item.variant, variantLimit) && key === designDraftKey(item.challengeId, item.variant) && typeof item.assisted === "boolean" && timestamp(item.updatedAt));
    state.drafts[key] = { level: item.level, challengeId: item.challengeId, variant: item.variant, code: validateDesignCode(item.code), assisted: item.assisted, updatedAt: item.updatedAt };
  }
  requireValue(Object.keys(value.results).length <= designChallenges.length);
  for (const [key, item] of Object.entries(value.results)) {
    requireValue(plain(item) && validLevel(item.level) && knownChallenge(key, item.level) && key === item.challengeId && integer(item.bestScore, 100) && integer(item.lastScore, 100) && integer(item.attempts, 1000000000) && item.attempts > 0 && timestamp(item.updatedAt));
    requireValue(["passed", "perfect", "assisted"].every(field => typeof item[field] === "boolean") && (!item.passed || item.bestScore >= 80) && (!item.perfect || item.passed && item.bestScore === 100));
    state.results[key] = { level: item.level, challengeId: key, bestScore: item.bestScore, lastScore: item.lastScore, passed: item.passed, perfect: item.perfect, assisted: item.assisted, attempts: item.attempts, updatedAt: item.updatedAt };
  }
  requireValue(Object.keys(value.recentVariants).length <= designChallenges.length);
  for (const [id, variants] of Object.entries(value.recentVariants)) {
    requireValue(knownChallenge(id) && Array.isArray(variants) && variants.length <= 8 && variants.every(variant => integer(variant, variantLimit)));
    state.recentVariants[id] = recentValues(variants);
  }
  return state;
}

export function normalizeDesignState(value) {
  try { return validateDesignState(value); } catch { return emptyDesignState(); }
}

function randomGenerator(seed) {
  let hash = 2166136261;
  for (const letter of String(seed)) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return () => {
    hash += 0x6D2B79F5;
    let value = Math.imul(hash ^ hash >>> 15, 1 | hash);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

// Save this run once and resume it after reload. Requesting a new run changes
// both the task order and the reference data, even with a repeated seed.
export function createDesignRun(level, previousRun = null, seed = null, recentVariants = {}) {
  requireValue(validLevel(level));
  const previous = previousRun?.level === level ? validateDesignRun(previousRun) : null;
  const randomSeed = seed ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const random = randomGenerator(`${randomSeed}:${previous?.id || "first"}`);
  const order = designChallenges.filter(item => item.level === level).map(item => item.id);
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  if (previous && order[0] === previous.order[0]) [order[0], order[1]] = [order[1], order[0]];
  const variants = {};
  for (const id of order) {
    let variant = Math.floor(random() * (variantLimit + 1));
    const history = plain(recentVariants) && Array.isArray(recentVariants[id]) ? recentVariants[id].filter(value => integer(value, variantLimit)).slice(-8) : [];
    if (previous) history.push(previous.variants[id]);
    const used = new Set(history), fingerprints = new Set(history.map(value => getDesignChallenge(id, value)?.fingerprint).filter(Boolean));
    for (let tries = 0; tries < 64 && (used.has(variant) || fingerprints.has(getDesignChallenge(id, variant)?.fingerprint)); tries++) variant = (variant + 1) % (variantLimit + 1);
    // A tiny reference pool may not have nine unique variants. The immediate
    // previous task must still change when the recent pool is exhausted.
    if (previous) for (let tries = 0; tries < 64 && (variant === previous.variants[id] || getDesignChallenge(id, variant)?.fingerprint === getDesignChallenge(id, previous.variants[id])?.fingerprint); tries++) variant = (variant + 1) % (variantLimit + 1);
    variants[id] = variant;
  }
  const createdAt = new Date().toISOString();
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${(++runSequence).toString(36)}-${Math.floor(random() * 4294967296).toString(36)}`;
  return { id: `design-${token}`, level, order, variants, index: 0, createdAt, revealed: [] };
}

export function getDesignProgress(learningState, level) {
  requireValue(validLevel(level));
  const design = normalizeDesignState(learningState?.design);
  const ids = designChallenges.filter(item => item.level === level).map(item => item.id);
  const results = ids.map(id => design.results[id]).filter(Boolean);
  const completed = results.filter(item => item.passed).length;
  return { level, total: ids.length, completed, perfect: results.filter(item => item.perfect).length, attempted: results.length, points: results.reduce((sum, item) => sum + item.bestScore, 0), maxPoints: ids.length * 100, percent: Math.round(completed / ids.length * 100), run: design.runs[level] || null };
}

export function trimDesignDrafts(design, limit = designDraftLimit) {
  const keys = Object.keys(design.drafts).sort((a, b) => design.drafts[a].updatedAt.localeCompare(design.drafts[b].updatedAt));
  for (const key of keys.slice(0, -limit)) delete design.drafts[key];
  return design;
}

export function mergeDesignState(currentValue, guestValue) {
  const current = normalizeDesignState(currentValue), guest = validateDesignState(guestValue);
  for (const [level, run] of Object.entries(guest.runs)) {
    const old = current.runs[level];
    if (old?.id === run.id) { old.index = Math.max(old.index, run.index); old.revealed = [...new Set([...old.revealed, ...run.revealed])]; }
    else if (!old || old.createdAt < run.createdAt) current.runs[level] = run;
  }
  for (const [key, draft] of Object.entries(guest.drafts)) {
    const old = current.drafts[key], winner = !old || old.updatedAt < draft.updatedAt ? draft : old;
    current.drafts[key] = { ...winner, assisted: Boolean(old?.assisted || draft.assisted) };
  }
  trimDesignDrafts(current);
  for (const [id, result] of Object.entries(guest.results)) {
    const old = current.results[id];
    if (!old) current.results[id] = result;
    else current.results[id] = { ...(old.updatedAt < result.updatedAt ? result : old), bestScore: Math.max(old.bestScore, result.bestScore), passed: old.passed || result.passed, perfect: old.perfect || result.perfect, attempts: Math.max(old.attempts, result.attempts) };
  }
  for (const run of Object.values(current.runs)) for (const id of run.order) if (current.drafts[designDraftKey(id, run.variants[id])]?.assisted) run.revealed = [...new Set([...run.revealed, id])];
  for (const [id, variants] of Object.entries(guest.recentVariants)) current.recentVariants[id] = recentValues([...(current.recentVariants[id] || []), ...variants]);
  return current;
}

// Outbox updates must validate on their own: their matching run may already be
// saved remotely, or another device may have started a new run while offline.
export function validateDesignEvent(event) {
  requireValue(plain(event) && /^[\w-]{10,80}$/.test(event.id || ""));
  if (event.type === "design-start") {
    requireValue(validateDesignRun(event.run).index === 0);
    return event;
  }
  requireValue(validLevel(event.level));
  if (event.type === "design-next" || event.type === "design-select") {
    if (event.type === "design-select") requireValue(integer(event.index, designChallenges.filter(item => item.level === event.level).length));
    if (event.runId !== undefined) requireValue(/^[\w-]{10,80}$/.test(event.runId));
    return event;
  }
  requireValue(knownChallenge(event.challengeId, event.level) && integer(event.variant, variantLimit));
  if (event.type === "design-draft") {
    validateDesignCode(event.code); requireValue(typeof event.assisted === "boolean");
    return event;
  }
  requireValue(event.type === "design-result" && integer(event.score, 100) && ["passed", "perfect", "assisted"].every(field => typeof event[field] === "boolean") && (!event.passed || event.score >= 80) && (!event.perfect || event.passed && event.score === 100));
  return event;
}

export function applyDesignEvent(previous, event, now) {
  validateDesignEvent(event);
  const design = normalizeDesignState(previous);
  if (event.type === "design-start") {
    const run = validateDesignRun(event.run);
    requireValue(run.index === 0);
    if (design.runs[run.level]?.id === run.id) return { design, practiced: false };
    design.runs[run.level] = run;
    for (const id of run.order) design.recentVariants[id] = recentValues([...(design.recentVariants[id] || []), run.variants[id]]);
    return { design, practiced: false };
  }
  if (event.type === "design-next" || event.type === "design-select") {
    if (!design.runs[event.level] || event.runId && event.runId !== design.runs[event.level].id) return { design, practiced: false };
    design.runs[event.level].index = event.type === "design-select" ? event.index : Math.min(design.runs[event.level].index + 1, design.runs[event.level].order.length);
    return { design, practiced: false };
  }
  const run = design.runs[event.level]?.variants[event.challengeId] === event.variant ? design.runs[event.level] : null;
  const key = designDraftKey(event.challengeId, event.variant), old = design.drafts[key];
  if (event.type === "design-draft") {
    const code = validateDesignCode(event.code);
    const changed = ["html", "css", "js"].some(field => code[field] !== (old?.code[field] || ""));
    const newlyAssisted = event.assisted && !(old?.assisted || run?.revealed.includes(event.challengeId));
    const assisted = Boolean(old?.assisted || run?.revealed.includes(event.challengeId) || event.assisted);
    if (assisted && run) run.revealed = [...new Set([...run.revealed, event.challengeId])];
    design.drafts[key] = { level: event.level, challengeId: event.challengeId, variant: event.variant, code, assisted, updatedAt: now };
    trimDesignDrafts(design);
    return { design, practiced: changed && !newlyAssisted && [code.html, code.css, code.js].some(value => value.trim()) };
  }
  const assisted = Boolean(old?.assisted || run?.revealed.includes(event.challengeId) || event.assisted), result = design.results[event.challengeId];
  // Persist the reveal marker even when the user has not yet typed a draft.
  if (assisted) { if (run) run.revealed = [...new Set([...run.revealed, event.challengeId])]; design.drafts[key] = { level: event.level, challengeId: event.challengeId, variant: event.variant, code: old?.code || { html: "", css: "", js: "" }, assisted: true, updatedAt: now }; }
  trimDesignDrafts(design);
  design.results[event.challengeId] = { level: event.level, challengeId: event.challengeId, bestScore: Math.max(result?.bestScore || 0, assisted ? 0 : event.score), lastScore: event.score, passed: Boolean(result?.passed || event.passed && !assisted), perfect: Boolean(result?.perfect || event.perfect && !assisted), assisted, attempts: Math.min((result?.attempts || 0) + 1, 1000000000), updatedAt: now };
  return { design, practiced: !assisted && event.passed };
}
