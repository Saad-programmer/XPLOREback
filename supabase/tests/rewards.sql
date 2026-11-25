-- Run against a local Supabase stack after migrations and seed.sql.
begin;
create extension if not exists pgtap;
select plan(12);

insert into public.labs_badge_catalog (key, game, label, tier, xp, rule)
values
  ('test-thirty-a', 'linux', 'Test A', 'BRONZE', 30, '{"type":"test"}'),
  ('test-thirty-b', 'linux', 'Test B', 'SILVER', 30, '{"type":"test"}'),
  ('test-any-more', 'linux', 'Test C', 'GOLD', 10, '{"type":"test"}'),
  ('test-submit-first', 'linux', 'Test submit first', 'BRONZE', 5,
    '{"type":"first_mission","required_count":1}')
on conflict (key) do update set xp = excluded.xp;

set local role service_role;
create temporary table award_results (sequence integer generated always as identity, result jsonb);
insert into award_results (result) values (public.labs_award_badge(
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000401',
  'test-thirty-a',
  '{}'
));
select is((select (result->>'xp')::integer from award_results where sequence = 1), 30, 'first 30 XP badge');
select is((select (result->>'weekUsed')::integer from award_results where sequence = 1), 30, 'weekly balance at 30');

insert into award_results (result) values (public.labs_award_badge(
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000401',
  'test-thirty-b',
  '{}'
));
select is((select (result->>'xp')::integer from award_results where sequence = 2), 20, 'second 30 XP badge is capped at 20');
select is((select sum(amount)::integer from public.labs_xp_ledger where user_id = '00000000-0000-4000-8000-000000000301'), 50, 'ledger never exceeds 50 XP');

insert into award_results (result) values (public.labs_award_badge(
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000401',
  'test-any-more',
  '{}'
));
select is((select (result->>'xp')::integer from award_results where sequence = 3), 0, 'third badge earns zero XP at cap');
select is((select count(*)::integer from public.labs_badge where user_id = '00000000-0000-4000-8000-000000000301'), 3, 'badge remains awarded after cap');
insert into award_results (result) values (public.labs_award_badge(
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000401',
  'test-thirty-a',
  '{}'
));
select is((select (result->>'awarded')::boolean from award_results where sequence = 4), false, 'repeating a badge does not award it twice');
select throws_ok(
  $$select public.labs_award_badge('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000401', 'unknown-test', '{}')$$,
  '22023',
  null,
  'unknown badge keys fail'
);

create temporary table registered_submission as
select public.labs_register_submission(
  '00000000-0000-4000-8000-000000000302',
  'test-submission'
) as id;
create temporary table mission_results (sequence integer generated always as identity, result jsonb);
insert into mission_results (result)
select public.labs_submit_mission(
  registered_submission.id,
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000401',
  'linux',
  'test-submission',
  '{"hintsUsed":0,"attempts":1,"timeS":10,"shortestCmdLen":1,"score":5,"solution":[]}'::jsonb
)
from registered_submission;
insert into mission_results (result)
select public.labs_submit_mission(
  registered_submission.id,
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000401',
  'linux',
  'test-submission',
  '{"hintsUsed":0,"attempts":1,"timeS":10,"shortestCmdLen":1,"score":5,"solution":[]}'::jsonb
)
from registered_submission;
select is((select (result->>'pointsAwarded')::integer from mission_results where sequence = 1), 5, 'first submission awards badge XP');
select is((select (result->>'pointsAwarded')::integer from mission_results where sequence = 2), 0, 'repeated submission awards no additional XP');
select is((select sum(amount)::integer from public.labs_xp_ledger where user_id = '00000000-0000-4000-8000-000000000302'), 5, 'repeat submission leaves one ledger reward');

select is(
  public.labs_week_start('2026-11-15 12:00:00+00'::timestamptz) + 7,
  public.labs_week_start('2026-11-22 12:00:00+00'::timestamptz),
  'the following ISO week starts a fresh period'
);
select * from finish();
rollback;
