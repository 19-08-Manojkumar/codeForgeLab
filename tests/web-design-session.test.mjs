import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { designChallenges, getDesignChallenge } from "../lib/web-design-challenges.mjs";
import { createDesignRun, designDraftKey, getDesignProgress, validateDesignState, designCodeLimit } from "../lib/web-design-session.mjs";
import { emptyLearningState, normalizeLearningState, applyLearningEvent } from "../lib/learning-state.mjs";
import { validateLearningSnapshot, mergeLearningSnapshot } from "../lib/learning-snapshot.mjs";
import { createLearningApi } from "../server/learning-api.mjs";

let sequence = 0;
const event = data => ({ id: `design-test-event-${++sequence}`, day: "2026-10-12", ...data });
const code = { html: "<h1>My first design</h1>", css: "h1 { color: navy; }", js: "" };
const apply = (state, update) => applyLearningEvent(state, event(update), "2026-10-12T10:00:00.000Z");
function started(level = 1, seed = "first-run") {
  const run = createDesignRun(level, null, seed);
  return { run, state: apply(emptyLearningState(), { type: "design-start", run }), challengeId: run.order[0], variant: run.variants[run.order[0]] };
}

test("each of four levels has a complete shuffled run and fresh reference variants", () => {
  for (let level = 1; level <= 4; level++) {
    let previous = createDesignRun(level, null, "same-seed");
    for (let attempt = 0; attempt < 8; attempt++) {
      const run = createDesignRun(level, previous, "same-seed");
      assert.equal(run.order.length, 15); assert.equal(new Set(run.order).size, 15);
      assert.ok(run.order.every(id => designChallenges.some(item => item.id === id && item.level === level)));
      assert.notDeepEqual(run.order, previous.order); assert.notEqual(run.order[0], previous.order[0]); assert.notEqual(run.id, previous.id);
      for (const id of run.order) { assert.notEqual(run.variants[id], previous.variants[id]); assert.notEqual(getDesignChallenge(id, run.variants[id]).fingerprint, getDesignChallenge(id, previous.variants[id]).fingerprint); }
      previous = run;
    }
  }
});

test("new runs avoid the last eight saved reference variants across reloads", () => {
  let state = emptyLearningState();
  for (let attempt = 0; attempt < 12; attempt++) {
    const previous = state.design.runs[2], history = state.design.recentVariants;
    const run = createDesignRun(2, previous, "saved-history", history);
    for (const id of run.order) {
      assert.ok(!(history[id] || []).includes(run.variants[id]));
      const fingerprint = getDesignChallenge(id, run.variants[id]).fingerprint;
      assert.ok(!(history[id] || []).some(old => getDesignChallenge(id, old).fingerprint === fingerprint), `${id} repeated target at run ${attempt + 1}`);
    }
    state = validateLearningSnapshot(JSON.parse(JSON.stringify(apply(state, { type: "design-start", run }))));
    assert.ok(Object.values(state.design.recentVariants).every(values => values.length <= 8));
  }
});

test("saved run order, current question, draft, and independent progress survive snapshot reload", () => {
  let { state, run, challengeId, variant } = started();
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code, assisted: false });
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 86, passed: true, perfect: false, assisted: false });
  state = apply(state, { type: "design-select", level: 1, index: 4 });
  const restored = validateLearningSnapshot(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.design.runs[1].order, run.order); assert.equal(restored.design.runs[1].index, 4);
  assert.deepEqual(restored.design.drafts[designDraftKey(challengeId, variant)].code, code);
  assert.equal(getDesignProgress(restored, 1).completed, 1); assert.equal(getDesignProgress(restored, 1).points, 86);
});

test("legacy learning snapshots default to empty design progress and visits grant no activity", () => {
  const legacy = emptyLearningState(); delete legacy.design;
  assert.deepEqual(validateLearningSnapshot(legacy).design, { runs: {}, drafts: {}, results: {}, recentVariants: {} });
  assert.equal(getDesignProgress(normalizeLearningState(legacy), 4).completed, 0);
  let { state } = started(); state = apply(state, { type: "design-next", level: 1 }); state = apply(state, { type: "design-select", level: 1, index: 0 });
  assert.deepEqual(state.activity.days, {});
});

test("revealing an answer stays assisted after edits, reload, and draft pruning", () => {
  let { state, challengeId, variant } = started();
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code, assisted: true });
  assert.deepEqual(state.activity.days, {});
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code: { ...code, css: code.css + "\n/* changed */" }, assisted: false });
  state = validateLearningSnapshot(JSON.parse(JSON.stringify(state)));
  assert.equal(state.design.drafts[designDraftKey(challengeId, variant)].assisted, true);
  delete state.design.drafts[designDraftKey(challengeId, variant)];
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 100, passed: true, perfect: true, assisted: false });
  assert.equal(state.design.results[challengeId].assisted, true); assert.equal(getDesignProgress(state, 1).completed, 0); assert.equal(getDesignProgress(state, 1).points, 0);
  assert.equal(state.activity.days["2026-10-12"].actions, 1);
});

test("revealing after earning partial points locks the score against solution-assisted checks", () => {
  let { state, challengeId, variant } = started();
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 60, passed: false, perfect: false, assisted: false });
  assert.equal(getDesignProgress(state, 1).points, 60);
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code, assisted: true });
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 100, passed: true, perfect: true, assisted: true });
  assert.equal(state.design.results[challengeId].bestScore, 60);
  assert.equal(getDesignProgress(state, 1).points, 60);
  assert.equal(state.design.results[challengeId].passed, false);
  assert.equal(state.design.results[challengeId].perfect, false);
});

test("fresh variants permit independent completion and assisted attempts preserve earlier earned scores", () => {
  let { state, run, challengeId, variant } = started();
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code, assisted: true });
  run = createDesignRun(1, run, "try-again"); variant = run.variants[challengeId];
  state = apply(state, { type: "design-start", run });
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 100, passed: true, perfect: true, assisted: false });
  state = apply(state, { type: "design-result", level: 1, challengeId, variant, score: 90, passed: true, perfect: false, assisted: true });
  assert.equal(getDesignProgress(state, 1).completed, 1); assert.equal(getDesignProgress(state, 1).perfect, 1); assert.equal(getDesignProgress(state, 1).points, 100);
  assert.equal(state.design.results[challengeId].attempts, 2);
});

test("duplicate updates and unchanged drafts do not inflate practice activity", () => {
  let { state, challengeId, variant } = started();
  const update = event({ type: "design-draft", level: 1, challengeId, variant, code, assisted: false });
  state = applyLearningEvent(state, update); state = applyLearningEvent(state, update);
  state = apply(state, { type: "design-draft", level: 1, challengeId, variant, code, assisted: false });
  assert.equal(state.activity.days["2026-10-12"].actions, 1);
});

test("guest transfer merges design progress without overwriting account profile or clearing reveals", () => {
  let { state: guest, run, challengeId, variant } = started();
  guest = apply(guest, { type: "design-draft", level: 1, challengeId, variant, code, assisted: false });
  guest = apply(guest, { type: "design-result", level: 1, challengeId, variant, score: 85, passed: true, perfect: false, assisted: false });
  let account = apply(emptyLearningState(), { type: "profile", profile: { name: "Account learner", age: null, role: "student", domain: "CS", goal: "basics" } });
  account = apply(account, { type: "design-start", run });
  account = apply(account, { type: "design-draft", level: 1, challengeId, variant, code, assisted: true });
  const merged = mergeLearningSnapshot(account, guest);
  assert.equal(merged.profile.name, "Account learner"); assert.equal(merged.design.drafts[designDraftKey(challengeId, variant)].assisted, true);
  assert.ok(merged.design.runs[1].revealed.includes(challengeId)); assert.equal(getDesignProgress(merged, 1).completed, 1);
  assert.doesNotThrow(() => validateLearningSnapshot(merged));
});

test("invalid challenges, variant mismatches, navigation, scores, and oversized drafts are rejected", () => {
  const { state, challengeId, variant } = started();
  const draft = { type: "design-draft", level: 1, challengeId, variant, code, assisted: false };
  assert.throws(() => apply(state, { ...draft, challengeId: "missing" }));
  assert.throws(() => apply(state, { ...draft, level: 2 }));
  assert.throws(() => apply(state, { ...draft, variant: (variant + 1) % 1000000 }));
  assert.throws(() => apply(state, { ...draft, code: { ...code, html: "x".repeat(designCodeLimit + 1) } }));
  assert.throws(() => apply(state, { type: "design-select", level: 1, index: 16 }));
  assert.throws(() => apply(state, { type: "design-result", level: 1, challengeId, variant, score: 79, passed: true, perfect: false, assisted: false }));
  const saved = structuredClone(state.design); saved.runs[1].order[0] = saved.runs[1].order[1]; assert.throws(() => validateDesignState(saved));
});

test("large Unicode design drafts stay within the existing database row budget", () => {
  let state = emptyLearningState();
  for (let level = 1; level <= 4; level++) {
    const run = createDesignRun(level, null, `large-${level}`); state = apply(state, { type: "design-start", run });
    for (const challengeId of run.order) state = apply(state, { type: "design-draft", level, challengeId, variant: run.variants[challengeId], code: { html: "字".repeat(12000), css: "字".repeat(12000), js: "字".repeat(12000) }, assisted: false });
  }
  assert.ok(new TextEncoder().encode(JSON.stringify(state)).length <= 750000); assert.ok(Object.keys(state.design.drafts).length > 1);
  assert.doesNotThrow(() => validateLearningSnapshot(state));
});

const request = (update, extra = {}) => new Request("https://example.test/api/learning", { method: update ? "POST" : "GET", headers: { ...(update ? { "Content-Type": "application/json", Origin: "https://example.test" } : {}), ...extra }, ...(update ? { body: JSON.stringify(update) } : {}) });

test("Supabase PostgreSQL persists design in existing JSONB and isolates authenticated accounts", async () => {
  const db = new PGlite(), ownerA = "11111111-1111-4111-8111-111111111111", ownerB = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated; insert into auth.users values ('${ownerA}'), ('${ownerB}');`);
    await db.exec(await readFile(new URL("../supabase/migrations/202610080001_learning.sql", import.meta.url), "utf8"));
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ownerA]);
    let owner = ownerA;
    const rpc = async (name, parameters) => {
      try {
        const result = name === "get_learning_state" ? await db.query("select public.get_learning_state() as data") : await db.query("select public.apply_learning_update($1,$2,$3::jsonb) as data", [parameters.p_event_id, parameters.p_expected_revision, JSON.stringify(parameters.p_state)]);
        return { data: result.rows[0].data, error: null };
      } catch (error) { return { data: null, error }; }
    };
    const api = createLearningApi(async () => ({ client: { rpc }, user: { id: owner } }));
    const run = createDesignRun(3, null, "account-test"), challengeId = run.order[0], variant = run.variants[challengeId];
    for (const update of [{ type: "design-start", run }, { type: "design-draft", level: 3, challengeId, variant, code, assisted: false }, { type: "design-result", level: 3, challengeId, variant, score: 100, passed: true, perfect: true, assisted: false }]) assert.equal((await api(request(event({ ...update, userId: ownerB })))).status, 200);
    const first = await (await api(request())).json();
    assert.equal(first.state.design.runs[3].id, run.id); assert.deepEqual(first.state.design.drafts[designDraftKey(challengeId, variant)].code, code); assert.equal(getDesignProgress(first.state, 3).completed, 1);
    owner = ownerB; await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ownerB]);
    const other = await (await api(request())).json(); assert.deepEqual(other.state.design?.runs || {}, {});
    assert.equal((await api(request(event({ type: "design-start", run }), { "X-Learner-Account": ownerA }))).status, 409);
  } finally { await db.close(); }
});
