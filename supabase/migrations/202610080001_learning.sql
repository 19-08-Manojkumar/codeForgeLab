-- Run once in Supabase SQL Editor, or apply with the Supabase CLI.
-- Existing D1 records remain untouched until an explicit, mapped migration.
begin;

create table public.learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"version":1,"profile":null,"handled":false,"completed":{},"lastVisited":null,"stats":{"attempts":0,"correct":0},"attempts":[],"quizzes":[],"mistakes":[],"daily":{},"bookmarks":[],"drafts":{},"eventIds":[]}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  constraint valid_learning_state check (
    jsonb_typeof(state) = 'object' and state->>'version' = '1'
    and state ?& array['version','profile','handled','completed','lastVisited','stats','attempts','quizzes','mistakes','daily','bookmarks','drafts','eventIds']
    and jsonb_typeof(state->'handled') = 'boolean'
    and jsonb_typeof(state->'completed') = 'object'
    and jsonb_typeof(state->'drafts') = 'object'
    and jsonb_typeof(state->'daily') = 'object'
    and jsonb_typeof(state->'stats') = 'object'
    and jsonb_typeof(state->'attempts') = 'array'
    and jsonb_typeof(state->'quizzes') = 'array'
    and jsonb_typeof(state->'mistakes') = 'array'
    and jsonb_typeof(state->'bookmarks') = 'array'
    and jsonb_typeof(state->'eventIds') = 'array'
    and octet_length(state::text) <= 1000000
  )
);

create table public.learning_events (
  user_id uuid not null references public.learning_state(user_id) on delete cascade,
  event_id text not null check (event_id ~ '^[A-Za-z0-9_-]{10,80}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.learning_state enable row level security;
alter table public.learning_events enable row level security;
create policy "Read own learning" on public.learning_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own learning events" on public.learning_events for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.learning_state, public.learning_events from anon, authenticated;
grant select on public.learning_state, public.learning_events to authenticated;

-- Writes use these narrowly scoped functions. Both derive ownership from the
-- verified JWT; neither accepts a caller-supplied user ID. No secret key required.
create function public.get_learning_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid();
  result jsonb;
begin
  if learner is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.learning_state(user_id) values (learner) on conflict (user_id) do nothing;
  select jsonb_build_object('state', state, 'revision', revision) into result
    from public.learning_state where user_id = learner;
  return result;
end;
$$;

create function public.apply_learning_update(p_event_id text, p_expected_revision bigint, p_state jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid();
  current_row public.learning_state%rowtype;
begin
  if learner is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_event_id is null or p_event_id !~ '^[A-Za-z0-9_-]{10,80}$' or p_expected_revision is null or p_state is null then
    raise exception 'Invalid update' using errcode = '22023';
  end if;
  insert into public.learning_state(user_id) values (learner) on conflict (user_id) do nothing;
  select * into current_row from public.learning_state where user_id = learner for update;
  if exists (select 1 from public.learning_events where user_id = learner and event_id = p_event_id) then
    return jsonb_build_object('status', 'duplicate', 'state', current_row.state);
  end if;
  if current_row.revision <> p_expected_revision then return jsonb_build_object('status', 'conflict'); end if;
  update public.learning_state set state = p_state, revision = revision + 1, updated_at = now() where user_id = learner;
  insert into public.learning_events(user_id, event_id) values (learner, p_event_id);
  return jsonb_build_object('status', 'saved', 'state', p_state);
end;
$$;

revoke all on function public.get_learning_state() from public, anon;
revoke all on function public.apply_learning_update(text, bigint, jsonb) from public, anon;
grant execute on function public.get_learning_state() to authenticated;
grant execute on function public.apply_learning_update(text, bigint, jsonb) to authenticated;
commit;
