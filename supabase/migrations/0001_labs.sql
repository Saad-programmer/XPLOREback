create extension if not exists pgcrypto;

create table public.labs_config (
  key text primary key,
  value integer not null check (value > 0)
);

insert into public.labs_config (key, value)
values ('weekly_xp_cap', 50)
on conflict (key) do nothing;

create table public.labs_progress (
  user_id uuid not null,
  game text not null check (game in ('linux', 'sql', 'git', 'network')),
  current_mission_id text,
  total_points integer not null default 0 check (total_points >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

create table public.labs_mission_result (
  user_id uuid not null,
  tenant_id uuid not null,
  mission_id text not null,
  game text not null check (game in ('linux', 'sql', 'git', 'network')),
  status text not null check (status = 'done'),
  best_score integer not null default 0,
  hints_used integer not null default 0 check (hints_used >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  best_time_s integer not null default 0 check (best_time_s >= 0),
  shortest_cmd_len integer check (shortest_cmd_len is null or shortest_cmd_len >= 0),
  solution jsonb,
  first_completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create index labs_mission_result_user_game_idx
  on public.labs_mission_result (user_id, game);
create index labs_mission_result_tenant_idx
  on public.labs_mission_result (tenant_id, user_id);

create table public.labs_checkpoint (
  user_id uuid not null,
  mission_id text not null,
  game text not null check (game in ('linux', 'sql', 'git', 'network')),
  state jsonb not null,
  hints_used integer not null default 0 check (hints_used >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  started_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, mission_id),
  constraint labs_checkpoint_size_check check (octet_length(state::text) <= 200000)
);

create table public.labs_submission (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mission_id text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index labs_submission_rate_limit_idx on public.labs_submission (user_id, created_at desc);

create table public.labs_unlock (
  user_id uuid not null,
  item_type text not null check (item_type in ('sticker', 'sound', 'meme')),
  item_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table public.labs_settings (
  user_id uuid primary key,
  muted boolean not null default true,
  meme_sounds boolean not null default true,
  reduced_motion boolean not null default false,
  crt boolean not null default false,
  language text not null default 'fr' check (language in ('en', 'fr')),
  maximized boolean not null default false,
  classic_cursor boolean not null default false
);

create table public.labs_badge (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  key text not null,
  tier text not null check (tier in ('GOLD', 'SILVER', 'BRONZE')),
  label text not null,
  metadata jsonb,
  awarded_at timestamptz not null default now(),
  synced_at timestamptz,
  sync_attempts integer not null default 0,
  next_sync_at timestamptz not null default now(),
  unique (tenant_id, user_id, key)
);
create index labs_badge_user_idx on public.labs_badge (user_id, awarded_at desc);

create table public.labs_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  week_start date not null,
  amount integer not null check (amount > 0),
  reason text not null,
  label text not null,
  badge_key text not null,
  created_at timestamptz not null default now(),
  synced_at timestamptz,
  sync_attempts integer not null default 0,
  next_sync_at timestamptz not null default now(),
  unique (user_id, reason)
);
create index labs_xp_ledger_user_week_idx on public.labs_xp_ledger (user_id, week_start);
create index labs_xp_ledger_sync_idx on public.labs_xp_ledger (synced_at, created_at);

create table public.labs_badge_catalog (
  key text primary key,
  game text not null check (game in ('linux', 'sql', 'git', 'network')),
  label text not null,
  tier text not null check (tier in ('GOLD', 'SILVER', 'BRONZE')),
  xp integer not null check (xp >= 0),
  rule jsonb not null
);

alter table public.labs_config enable row level security;
alter table public.labs_progress enable row level security;
alter table public.labs_mission_result enable row level security;
alter table public.labs_checkpoint enable row level security;
alter table public.labs_submission enable row level security;
alter table public.labs_unlock enable row level security;
alter table public.labs_settings enable row level security;
alter table public.labs_badge enable row level security;
alter table public.labs_xp_ledger enable row level security;
alter table public.labs_badge_catalog enable row level security;

create policy "players read their own progress"
  on public.labs_progress for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own results"
  on public.labs_mission_result for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own checkpoints"
  on public.labs_checkpoint for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own unlocks"
  on public.labs_unlock for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own settings"
  on public.labs_settings for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own badges"
  on public.labs_badge for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read their own XP"
  on public.labs_xp_ledger for select to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players read badge catalog"
  on public.labs_badge_catalog for select to authenticated
  using (true);
create policy "players read Labs configuration"
  on public.labs_config for select to authenticated
  using (key = 'weekly_xp_cap');
create policy "players create their settings"
  on public.labs_settings for insert to authenticated
  with check (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players update their settings"
  on public.labs_settings for update to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid)
  with check (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players save their checkpoints"
  on public.labs_checkpoint for insert to authenticated
  with check (user_id = (auth.jwt()->>'xplore_user_id')::uuid);
create policy "players update their checkpoints"
  on public.labs_checkpoint for update to authenticated
  using (user_id = (auth.jwt()->>'xplore_user_id')::uuid)
  with check (user_id = (auth.jwt()->>'xplore_user_id')::uuid);

revoke all on public.labs_config from public, anon, authenticated;
revoke all on public.labs_progress, public.labs_mission_result, public.labs_checkpoint,
  public.labs_submission, public.labs_unlock, public.labs_settings, public.labs_badge,
  public.labs_xp_ledger, public.labs_badge_catalog
  from public, anon, authenticated;
revoke insert, update, delete on public.labs_mission_result, public.labs_submission,
  public.labs_badge, public.labs_xp_ledger, public.labs_badge_catalog
  from anon, authenticated;
grant select on public.labs_progress, public.labs_mission_result, public.labs_checkpoint,
  public.labs_unlock, public.labs_settings, public.labs_badge, public.labs_xp_ledger,
  public.labs_badge_catalog, public.labs_config to authenticated;
grant insert, update on public.labs_checkpoint, public.labs_settings to authenticated;

create or replace function public.labs_week_start(p_now timestamptz default now())
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select date_trunc('week', p_now at time zone 'Africa/Nouakchott')::date;
$$;

create or replace function public.labs_award_badge(
  p_user uuid,
  p_tenant uuid,
  p_badge_key text,
  p_metadata jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  badge public.labs_badge_catalog%rowtype;
  awarded_id uuid;
  award_week date;
  weekly_cap integer;
  used_xp integer;
  grant_xp integer;
  inserted_ledger_id uuid;
begin
  select * into badge
  from public.labs_badge_catalog
  where key = p_badge_key;

  if not found then
    raise exception 'Unknown Labs badge key: %', p_badge_key using errcode = '22023';
  end if;

  insert into public.labs_badge (tenant_id, user_id, key, tier, label, metadata)
  values (p_tenant, p_user, badge.key, badge.tier, badge.label, coalesce(p_metadata, '{}'::jsonb))
  on conflict (tenant_id, user_id, key) do nothing
  returning id into awarded_id;

  if awarded_id is null then
    return jsonb_build_object('awarded', false, 'xp', 0);
  end if;

  award_week := public.labs_week_start(now());
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || award_week::text, 0));

  select value into weekly_cap
  from public.labs_config
  where key = 'weekly_xp_cap';
  if weekly_cap is null then
    raise exception 'Missing labs_config.weekly_xp_cap';
  end if;

  select coalesce(sum(amount), 0)::integer into used_xp
  from public.labs_xp_ledger
  where user_id = p_user and week_start = award_week;

  grant_xp := greatest(0, least(badge.xp, weekly_cap - used_xp));
  if grant_xp > 0 then
    insert into public.labs_xp_ledger
      (tenant_id, user_id, week_start, amount, reason, label, badge_key)
    values
      (p_tenant, p_user, award_week, grant_xp, 'LABS_BADGE:' || badge.key, badge.label, badge.key)
    on conflict (user_id, reason) do nothing
    returning id into inserted_ledger_id;

    if inserted_ledger_id is null then
      grant_xp := 0;
    end if;
  end if;

  return jsonb_build_object(
    'awarded', true,
    'xp', grant_xp,
    'capped', grant_xp < badge.xp,
    'weekUsed', used_xp + grant_xp,
    'weekCap', weekly_cap
  );
end;
$$;

revoke all on function public.labs_award_badge(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.labs_award_badge(uuid, uuid, text, jsonb) to service_role;

create or replace function public.labs_register_submission(p_user uuid, p_mission_id text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  submission_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('submission:' || p_user::text, 0));
  if (select count(*) from public.labs_submission
      where user_id = p_user and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Submission rate limit exceeded' using errcode = '54000';
  end if;
  insert into public.labs_submission (user_id, mission_id, success)
  values (p_user, p_mission_id, false)
  returning id into submission_id;
  return submission_id;
end;
$$;
revoke all on function public.labs_register_submission(uuid, text) from public, anon, authenticated;
grant execute on function public.labs_register_submission(uuid, text) to service_role;

create or replace function public.labs_submit_mission(
  p_submission uuid,
  p_user uuid,
  p_tenant uuid,
  p_game text,
  p_mission_id text,
  p_stats jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_result public.labs_mission_result%rowtype;
  first_completion boolean;
  completed_count integer;
  badge_rule record;
  badge_result jsonb;
  earned_xp integer := 0;
  badge_results jsonb := '[]'::jsonb;
  current_week date;
  week_used integer;
begin
  if p_game not in ('linux', 'sql', 'git', 'network') then
    raise exception 'Unknown game' using errcode = '22023';
  end if;

  update public.labs_submission set success = true
  where id = p_submission and user_id = p_user and mission_id = p_mission_id;
  if not found then
    raise exception 'Submission attempt was not registered' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('mission:' || p_user::text || ':' || p_mission_id, 0));
  select * into previous_result
  from public.labs_mission_result
  where user_id = p_user and mission_id = p_mission_id
  for update;
  first_completion := not found;

  if first_completion then
    insert into public.labs_mission_result (
      user_id, tenant_id, mission_id, game, status, best_score,
      hints_used, attempts, best_time_s, shortest_cmd_len, solution
    ) values (
      p_user, p_tenant, p_mission_id, p_game, 'done',
      greatest(0, coalesce((p_stats->>'score')::integer, 0)),
      greatest(0, coalesce((p_stats->>'hintsUsed')::integer, 0)),
      greatest(0, coalesce((p_stats->>'attempts')::integer, 1)),
      greatest(0, coalesce((p_stats->>'timeS')::integer, 0)),
      nullif((p_stats->>'shortestCmdLen')::integer, 0),
      coalesce(p_stats->'solution', '[]'::jsonb)
    );
  else
    update public.labs_mission_result set
      best_score = greatest(best_score, greatest(0, coalesce((p_stats->>'score')::integer, 0))),
      hints_used = least(hints_used, greatest(0, coalesce((p_stats->>'hintsUsed')::integer, 0))),
      attempts = attempts + greatest(0, coalesce((p_stats->>'attempts')::integer, 1)),
      best_time_s = case when best_time_s = 0 then greatest(0, coalesce((p_stats->>'timeS')::integer, 0))
        else least(best_time_s, greatest(0, coalesce((p_stats->>'timeS')::integer, 0))) end,
      shortest_cmd_len = case
        when shortest_cmd_len is null then nullif((p_stats->>'shortestCmdLen')::integer, 0)
        when (p_stats->>'shortestCmdLen') is null then shortest_cmd_len
        else least(shortest_cmd_len, (p_stats->>'shortestCmdLen')::integer)
      end,
      solution = case
        when jsonb_array_length(coalesce(p_stats->'solution', '[]'::jsonb)) > 0
         and (solution is null or jsonb_array_length(p_stats->'solution') < jsonb_array_length(solution))
          then p_stats->'solution'
        else solution
      end
    where user_id = p_user and mission_id = p_mission_id;
  end if;

  insert into public.labs_progress (user_id, game, current_mission_id)
  values (p_user, p_game, p_mission_id)
  on conflict (user_id, game) do update
  set current_mission_id = excluded.current_mission_id, updated_at = now();

  select count(*) into completed_count
  from public.labs_mission_result
  where user_id = p_user and game = p_game;

  for badge_rule in
    select key, rule
    from public.labs_badge_catalog
    where game = p_game
      and ((rule->>'type' = 'first_mission' and completed_count >= 1)
        or (rule->>'type' = 'missions_complete'
          and completed_count >= coalesce((rule->>'required_count')::integer, 2147483647)))
  loop
    badge_result := public.labs_award_badge(
      p_user,
      p_tenant,
      badge_rule.key,
      jsonb_build_object('missionId', p_mission_id, 'game', p_game)
    );
    if coalesce((badge_result->>'awarded')::boolean, false) then
      earned_xp := earned_xp + coalesce((badge_result->>'xp')::integer, 0);
      badge_results := badge_results || jsonb_build_array(
        jsonb_build_object(
          'key', badge_rule.key,
          'xp', coalesce((badge_result->>'xp')::integer, 0),
          'capped', coalesce((badge_result->>'capped')::boolean, false)
        )
      );
    end if;
  end loop;

  current_week := public.labs_week_start(now());
  select coalesce(sum(amount), 0)::integer into week_used
  from public.labs_xp_ledger where user_id = p_user and week_start = current_week;

  update public.labs_progress set total_points = (
    select coalesce(sum(ledger.amount), 0)::integer
    from public.labs_xp_ledger ledger
    join public.labs_badge_catalog catalog on catalog.key = ledger.badge_key
    where ledger.user_id = p_user and catalog.game = p_game
  )
  where user_id = p_user and game = p_game;

  delete from public.labs_checkpoint where user_id = p_user and mission_id = p_mission_id;

  return jsonb_build_object(
    'success', true,
    'firstCompletion', first_completion,
    'pointsAwarded', earned_xp,
    'badges', badge_results,
    'weekXp', jsonb_build_object('used', week_used, 'cap', (select value from public.labs_config where key = 'weekly_xp_cap'))
  );
end;
$$;
revoke all on function public.labs_submit_mission(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.labs_submit_mission(uuid, uuid, uuid, text, text, jsonb) to service_role;
