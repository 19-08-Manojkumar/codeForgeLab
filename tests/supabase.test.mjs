import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setTimeout as pause } from "node:timers/promises";
import { PGlite } from "@electric-sql/pglite";
import { createLearningApi } from "../server/learning-api.mjs";
import { applyLearningEvent, emptyLearningState } from "../lib/learning-state.mjs";
import { validateLearningSnapshot } from "../lib/learning-snapshot.mjs";
import { LearningStore, GUEST_KEY } from "../lib/learning-store.mjs";
import { legacyMigrationSql } from "../lib/legacy-migration.mjs";
import { authDestination } from "../lib/auth-redirect.mjs";
import { supabaseConfig } from "../lib/supabase/config.mjs";
import { requestOrigin } from "../lib/request-origin.mjs";

const ownerA = "11111111-1111-4111-8111-111111111111", ownerB = "22222222-2222-4222-8222-222222222222";
const topic = { language: "javascript", path: "methods", entryId: "filter", title: ".filter()" };
const event = value => ({ id: crypto.randomUUID(), ...value });
const complete = () => event({ type: "complete", ...topic });
const request = (value, headers = {}) => new Request("https://codeforge-lab.vercel.app/api/learning", { method: value ? "POST" : "GET", headers: { ...(value ? { "Content-Type": "application/json", Origin: "https://codeforge-lab.vercel.app" } : {}), ...headers }, ...(value ? { body: JSON.stringify(value) } : {}) });
function storage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; }
async function idle(store) { for (let i = 0; i < 100 && store.busy; i++) await pause(5); assert.equal(store.busy, false); }

test("PostgreSQL migration enforces ownership, grants, revision checks and permanent duplicate protection", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values ('${ownerA}'), ('${ownerB}');`);
    await db.exec(await readFile(new URL("../supabase/migrations/202610080001_learning.sql", import.meta.url), "utf8"));
    await db.exec("set role anon");
    await assert.rejects(db.query("select public.get_learning_state()"), error => error.code === "42501");
    await assert.rejects(db.query("select * from public.learning_state"), error => error.code === "42501");
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select public.get_learning_state()"), error => error.code === "42501");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ownerA]);
    const rpc = async (name, parameters) => {
      try {
        const result = name === "get_learning_state" ? await db.query("select public.get_learning_state() as data") : await db.query("select public.apply_learning_update($1,$2,$3::jsonb) as data", [parameters.p_event_id, parameters.p_expected_revision, JSON.stringify(parameters.p_state)]);
        return { data: result.rows[0].data, error: null };
      } catch (error) { return { data: null, error }; }
    };
    const api = createLearningApi(async () => ({ client: { rpc }, user: { id: ownerA } }));
    assert.equal((await api(request())).status, 200);
    const bookmark = event({ type: "bookmark", ...topic, userId: ownerB });
    assert.equal((await api(request(bookmark))).status, 200);
    assert.equal((await api(request(complete()))).status, 200);
    const wrongOwner = await api(request(complete(), { "X-Learner-Account": ownerB }));
    assert.equal(wrongOwner.status, 409);
    for (let i = 0; i < 205; i++) assert.equal((await api(request(event({ type: "visit", visit: { ...topic, mode: "learn" } })))).status, 200);
    const before = (await rpc("get_learning_state")).data;
    assert.equal(before.state.eventIds.includes(bookmark.id), false);
    assert.equal((await api(request(bookmark))).status, 200);
    const after = (await rpc("get_learning_state")).data;
    assert.equal(after.revision, before.revision);
    assert.equal(after.state.bookmarks.length, 1);
    const conflict = (await rpc("apply_learning_update", { p_event_id: crypto.randomUUID(), p_expected_revision: 0, p_state: emptyLearningState() })).data;
    assert.equal(conflict.status, "conflict");
    await assert.rejects(db.query("update public.learning_state set revision=0"), error => error.code === "42501");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ownerB]);
    assert.deepEqual((await db.query("select * from public.learning_state")).rows, []);
    const other = (await rpc("get_learning_state")).data;
    assert.deepEqual(other.state.completed, {});
    assert.equal((await db.query("select * from public.learning_events")).rows.length, 0);
    await db.exec("reset role");
    const legacy = applyLearningEvent(emptyLearningState(), complete());
    const oldEvent={user_id:"verified-old-account",event_id:"old-event-beyond-retained-history",created_at:"2026-10-01T00:00:00Z"};
    const sql = legacyMigrationSql([{ user_id: "verified-old-account", state: legacy }], { "verified-old-account": ownerB },[oldEvent]);
    await db.exec(sql);
    assert.deepEqual((await db.query("select state from public.learning_state where user_id=$1", [ownerB])).rows[0].state.completed, {}, "Migration preserves an existing Supabase record");
    await db.query("delete from public.learning_state where user_id=$1", [ownerB]);
    await db.exec(sql);
    assert.deepEqual((await db.query("select state from public.learning_state where user_id=$1", [ownerB])).rows[0].state.completed, legacy.completed);
    assert.equal((await db.query("select count(*)::int as total from public.learning_events where user_id=$1", [ownerB])).rows[0].total, 2);
    await db.query("delete from auth.users where id=$1", [ownerB]);
    assert.equal((await db.query("select count(*)::int as total from public.learning_events where user_id=$1", [ownerB])).rows[0].total, 0);
  } finally { await db.close(); }
});

test("API rejects unsigned, cross-origin, malformed and oversized writes without touching storage", async () => {
  let calls = 0;
  const client = { rpc: async () => { calls++; return { data: { state: emptyLearningState(), revision: 0 } }; } };
  assert.equal((await createLearningApi(async () => ({ user: null }))(request(complete()))).status, 401);
  const api = createLearningApi(async () => ({ user: { id: ownerA }, client }));
  assert.equal((await api(request(complete(), { Origin: "https://other.example" }))).status, 403);
  assert.equal((await api(request(complete(), { "Sec-Fetch-Site": "cross-site" }))).status, 403);
  assert.equal((await api(request(complete(), { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await api(request({ type: "complete", id: "short" }))).status, 400);
  assert.equal((await api(request({ ...complete(), noise: "x".repeat(800001) }))).status, 413);
  assert.equal((await api(new Request("https://codeforge-lab.vercel.app/api/learning", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await api(request(event({ type: "unknown" })))).status, 400);
  assert.equal(calls, 1);
});

test("API retries revision conflicts and returns a recoverable error after repeated conflicts", async () => {
  let writes = 0;
  const client = { rpc: async name => name === "get_learning_state" ? { data: { state: emptyLearningState(), revision: writes } } : { data: ++writes < 3 ? { status: "conflict" } : { status: "saved", state: applyLearningEvent(emptyLearningState(), complete()) } } };
  const api = createLearningApi(async () => ({ user: { id: ownerA }, client }));
  assert.equal((await api(request(complete()))).status, 200); assert.equal(writes, 3);
  client.rpc = async name => ({ data: name === "get_learning_state" ? { state: emptyLearningState(), revision: 1 } : { status: "conflict" } });
  assert.equal((await api(request(complete()))).status, 409);
});

test("guest import combines progress while preserving existing account profile and newer drafts", () => {
  const profile = { name: "Student", age: null, role: "student", domain: "Computer science", goal: "basics" };
  let cloud = applyLearningEvent(emptyLearningState(), event({ type: "profile", profile }));
  cloud = applyLearningEvent(cloud, event({ type: "bookmark", ...topic }));
  cloud = applyLearningEvent(cloud, event({ type: "draft", ...topic, value: "newer" }), "2026-10-08T13:00:00Z");
  let guest = applyLearningEvent(emptyLearningState(), complete());
  guest = applyLearningEvent(guest, event({ type: "bookmark", ...topic }));
  guest = applyLearningEvent(guest, event({ type: "draft", ...topic, value: "older" }), "2026-10-08T12:00:00Z");
  const transfer = event({ type: "import", state: guest });
  const merged = applyLearningEvent(cloud, transfer);
  assert.equal(merged.profile.name, "Student"); assert.equal(merged.bookmarks.length, 1);
  assert.equal(merged.drafts["javascript:methods:filter"].value, "newer");
  assert.deepEqual(merged.completed["javascript:methods"], ["filter"]);
  assert.deepEqual(applyLearningEvent(merged, transfer), merged);
  assert.throws(() => validateLearningSnapshot({ ...guest, bookmarks: [{}] }));
  assert.throws(() => validateLearningSnapshot({ ...guest, drafts: JSON.parse('{"__proto__":{}}') }));
});

test("device progress reloads and account import survives a lost reply without double-counting", async () => {
  const device = storage(), guest = new LearningStore({ storage: device });
  guest.dispatch({ type: "complete", ...topic });
  const restored = new LearningStore({ storage: device });
  assert.deepEqual(restored.state.completed["javascript:methods"], ["filter"]);
  const id = JSON.parse(device.getItem(GUEST_KEY)).importId;
  let state = emptyLearningState(), fail = true;
  const transport = async (method, value) => {
    if (method === "POST") { state = applyLearningEvent(state, value); if (fail) { fail = false; throw new Error("reply lost"); } }
    return { state };
  };
  const first = new LearningStore({ owner: ownerA, storage: device, transport });
  await first.load(); await idle(first);
  assert.equal(first.status, "unavailable"); assert.ok(device.getItem(GUEST_KEY));
  assert.equal(JSON.parse(device.getItem(`codeforge.learning-outbox.v1:${ownerA}`))[0].id, id);
  first.destroy();
  const retry = new LearningStore({ owner: ownerA, storage: device, transport });
  await retry.load(); await idle(retry);
  assert.equal(retry.status, "saved"); assert.equal(device.getItem(GUEST_KEY), null);
  assert.equal(device.getItem(`codeforge.learning-outbox.v1:${ownerA}`), null);
  assert.deepEqual(retry.state.completed["javascript:methods"], ["filter"]);
});

test("account outboxes remain separate and an old in-flight response cannot hydrate another account", async () => {
  const device = storage(); let release;
  const first = new LearningStore({ owner: ownerA, storage: device, transport: async method => method === "GET" ? { state: emptyLearningState() } : new Promise(resolve => { release = resolve; }) });
  await first.load(); first.dispatch({ type: "complete", ...topic });
  first.destroy();
  const second = new LearningStore({ owner: ownerB, storage: device, transport: async () => ({ state: emptyLearningState() }) });
  await second.load();
  release({ state: applyLearningEvent(emptyLearningState(), complete()) }); await pause(5);
  assert.deepEqual(second.state.completed, {});
  assert.ok(device.getItem(`codeforge.learning-outbox.v1:${ownerA}`));
  assert.equal(device.getItem(`codeforge.learning-outbox.v1:${ownerB}`), null);
  assert.equal(second.status, "saved");
});

test("malformed device records and unavailable storage do not prevent guest practice", () => {
  const device = storage(); device.setItem(GUEST_KEY, '{"state":{"version":1},"importId":"long-import-id"}');
  const guest = new LearningStore({ storage: device }); guest.dispatch({ type: "complete", ...topic });
  assert.equal(guest.status, "guest");
  const restricted = new LearningStore(); restricted.dispatch({ type: "complete", ...topic });
  assert.equal(restricted.status, "guest-unsaved"); assert.deepEqual(restricted.state.completed["javascript:methods"], ["filter"]);
});

test("redirects reject external targets, and environment settings reject privileged keys", () => {
  for (const destination of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "/auth/reset-password?next=https://attacker.example"]) assert.equal(authDestination(destination), "/");
  assert.equal(authDestination("/auth/reset-password"), "/auth/reset-password");
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_unsafe"; assert.equal(supabaseConfig(), null);
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test"; assert.ok(supabaseConfig());
  } finally {
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = oldKey;
  }
});

test("same-origin validation retains loopback Host and rejects malformed host values", async()=>{
  const local=new Request("http://localhost:3000/api/learning",{headers:{Host:"127.0.0.1:3000"}});
  assert.equal(requestOrigin(local),"http://127.0.0.1:3000");
  assert.throws(()=>requestOrigin(new Request("https://example.com/",{headers:{Host:"attacker.example/path"}})));
  const client={rpc:async(name,params)=>({data:name==="get_learning_state"?{state:emptyLearningState(),revision:0}:{status:"saved",state:params.p_state}})};
  const api=createLearningApi(async()=>({client,user:{id:ownerA}}));
  const update=new Request("http://localhost:3000/api/learning",{method:"POST",headers:{Host:"127.0.0.1:3000",Origin:"http://127.0.0.1:3000","Content-Type":"application/json"},body:JSON.stringify(complete())});
  assert.equal((await api(update)).status,200);
});

test("legacy migration requires explicit valid mappings and safely escapes learning text", () => {
  const state = applyLearningEvent(emptyLearningState(), event({ type: "draft", ...topic, value: "'); drop table learning_state; --" }));
  const rows = [{ user_id: "old-owner", state_json: JSON.stringify(state) }];
  assert.throws(() => legacyMigrationSql(rows, {}));
  assert.throws(() => legacyMigrationSql(rows, { "old-owner": "display-name" }));
  assert.throws(() => legacyMigrationSql([...rows, { user_id: "other", state }], { "old-owner": ownerA, other: ownerA }));
  const sql = legacyMigrationSql(rows, { "old-owner": ownerA });
  assert.ok(sql.includes("''); drop table")); assert.ok(sql.includes("on conflict (user_id) do nothing"));
});
