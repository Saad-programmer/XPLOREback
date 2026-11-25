-- Run against a local Supabase stack after applying migrations.
begin;
create extension if not exists pgtap;

select plan(4);

insert into public.labs_progress (user_id, game, current_mission_id)
values
  ('00000000-0000-4000-8000-000000000101', 'linux', 'mine'),
  ('00000000-0000-4000-8000-000000000102', 'linux', 'theirs');
insert into public.labs_mission_result (user_id, tenant_id, mission_id, game, status)
values (
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000201',
  'theirs',
  'linux',
  'done'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","xplore_user_id":"00000000-0000-4000-8000-000000000101","tenant_id":"00000000-0000-4000-8000-000000000201"}',
  true
);
select is(
  (select count(*)::integer from public.labs_progress),
  1,
  'a player sees only their own progress'
);
select is(
  (select current_mission_id from public.labs_progress where user_id = '00000000-0000-4000-8000-000000000101'),
  'mine',
  'a player can read their own row'
);
select is(
  (select count(*)::integer from public.labs_mission_result),
  0,
  'a player cannot read another player result'
);
select throws_ok(
  $$insert into public.labs_mission_result (user_id, tenant_id, mission_id, game, status)
    values ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000201', 'theirs', 'linux', 'done')$$,
  '42501',
  null,
  'a player cannot write another player result directly'
);

select * from finish();
rollback;
