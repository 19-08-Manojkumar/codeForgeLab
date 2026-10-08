import { validateLearningSnapshot } from "./learning-snapshot.mjs";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const literal = value => `'${String(value).replace(/'/g, "''")}'`;
export function legacyMigrationSql(rows, mapping, events = []) {
  if (!Array.isArray(rows) || !rows.length || !mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new TypeError("Provide exported learning rows and an explicit account-ID mapping.");
  const owners = new Set(), statements = [], history=new Map();
  if(!Array.isArray(events))throw new TypeError("Provide legacy learning events as JSON rows.");
  for(const event of events){
    if(!rows.some(row=>row.user_id===event.user_id)||typeof event.event_id!=="string"||!/^[\w-]{10,80}$/.test(event.event_id)||!Number.isFinite(Date.parse(event.created_at)))throw new TypeError("Legacy events must belong to an exported account and have valid IDs and timestamps.");
    if(!history.has(event.user_id))history.set(event.user_id,new Map());
    history.get(event.user_id).set(event.event_id,{event_id:event.event_id,created_at:new Date(event.created_at).toISOString()});
  }
  for (const row of rows) {
    const owner = mapping[row.user_id];
    if (!Object.hasOwn(mapping, row.user_id) || !uuid.test(owner || "") || owners.has(owner.toLowerCase())) throw new TypeError("Each legacy account must map to a different, existing Supabase user UUID.");
    owners.add(owner.toLowerCase());
    const state = validateLearningSnapshot(typeof row.state_json === "string" ? JSON.parse(row.state_json) : row.state);
    const eventRows=history.get(row.user_id)||new Map();
    for(const id of state.eventIds)if(!eventRows.has(id))eventRows.set(id,{event_id:id,created_at:null});
    statements.push(`with inserted as (
  insert into public.learning_state(user_id, state)
  values (${literal(owner)}::uuid, ${literal(JSON.stringify(state))}::jsonb)
  on conflict (user_id) do nothing
  returning user_id
)
insert into public.learning_events(user_id, event_id, created_at)
select inserted.user_id, event_id, coalesce(events.created_at,now())
from inserted cross join jsonb_to_recordset(${literal(JSON.stringify([...eventRows.values()]))}::jsonb) as events(event_id text, created_at timestamptz)
on conflict (user_id, event_id) do nothing;`);
  }
  return `-- Review account mappings before running this in Supabase SQL Editor.
-- Existing Supabase records are preserved. Inserts are transactional.
begin;
${statements.join("\n\n")}
commit;
`;
}
