-- =============================================
-- 修复 Supabase Security Advisor 警告
-- Function Search Path Mutable
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. dev_reset_user_data
create or replace function public.dev_reset_user_data(target_user_id uuid)
returns void as $$
begin
  delete from public.logs where user_id = target_user_id;
  delete from public.achievements where user_id = target_user_id;
  update public.profiles 
  set 
    total_drops = 0, 
    max_zen = 0, 
    beat_percentage = 0,
    title = '新手'
  where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = '';

-- 2. sync_user_stats（使用 migration-invite-codes.sql 中的最新版本）
create or replace function public.sync_user_stats(target_user_id uuid)
returns void as $$
declare
  total integer;
  max_zen_val integer;
  unlocked_count integer;
begin
  select count(*), coalesce(max(duration_seconds), 0) / 60
  into total, max_zen_val
  from public.logs
  where user_id = target_user_id;

  select count(*)
  into unlocked_count
  from public.achievements
  where user_id = target_user_id and unlocked_at is not null;

  update public.profiles
  set
    total_drops = total,
    max_zen = max_zen_val,
    achievement_count = unlocked_count,
    updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = '';

-- 3. dev_seed_logs
create or replace function public.dev_seed_logs(target_user_id uuid, count integer)
returns void as $$
begin
  insert into public.logs (user_id, date, duration_seconds, bristol_type, color, mood, amount, speed, shape)
  select 
    target_user_id,
    case 
      when gs.i <= 5 then now() - (interval '1 minute' * (random() * 300))
      else now() - (interval '1 day' * (random() * 30))
    end as log_date,
    30 + (random() * 900)::integer,
    1 + (random() * 6)::integer,
    (array['brown', 'golden', 'dark-brown', 'green'])[1 + (random() * 3)::integer],
    (array['classic', 'zen', 'struggle', 'party'])[1 + (random() * 3)::integer],
    (array['small', 'medium', 'large'])[1 + (random() * 2)::integer],
    (array['sonic', 'normal', 'slow'])[1 + (random() * 2)::integer],
    'Normal'
  from generate_series(1, count) as gs(i);
  
  perform public.sync_user_stats(target_user_id);
end;
$$ language plpgsql security definer set search_path = '';

-- 4. dev_unlock_all_achievements
create or replace function public.dev_unlock_all_achievements(target_user_id uuid)
returns integer as $$
declare
  affected_count integer;
begin
  insert into public.achievements (user_id, achievement_type, current_progress, unlocked_at)
  select 
    target_user_id, 
    id, 
    target_value, 
    now()
  from public.achievement_definitions
  on conflict (user_id, achievement_type) 
  do update set 
    current_progress = excluded.current_progress,
    unlocked_at = excluded.unlocked_at;

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$ language plpgsql security definer set search_path = '';

-- 5. validate_invite_code
create or replace function public.validate_invite_code(invite_code text)
returns text as $$
declare
  result_tag text;
begin
  select group_tag into result_tag
  from public.invite_codes
  where code = invite_code and is_active = true;
  
  return result_tag;
end;
$$ language plpgsql security definer set search_path = '';

-- 6. join_group_by_invite
create or replace function public.join_group_by_invite(invite_code text)
returns text as $$
declare
  result_tag text;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select group_tag into result_tag
  from public.invite_codes
  where code = invite_code and is_active = true;

  if result_tag is null then
    raise exception 'Invalid or inactive invite code';
  end if;

  update public.profiles
  set group_tags = array(select distinct unnest(array_append(group_tags, result_tag)))
  where id = current_user_id;

  return result_tag;
end;
$$ language plpgsql security definer set search_path = '';

-- 7. get_group_mates
create or replace function public.get_group_mates()
returns table (
    id uuid,
    name text,
    avatar_url text,
    title text,
    location text,
    total_drops integer,
    group_tags text[],
    geo_lat float8,
    geo_lng float8,
    achievement_count integer,
    last_poop_at timestamptz,
    last_duration_seconds integer,
    last_mood text
) as $$
declare
  my_tags text[];
begin
  set local row_security = off;

  select p.group_tags into my_tags from public.profiles p where p.id = auth.uid();

  if my_tags is null or array_length(my_tags, 1) is null then
    return;
  end if;

  return query
    with latest_logs as (
        select distinct on (l.user_id)
            l.user_id, l.date, l.duration_seconds, l.mood
        from public.logs l
        order by l.user_id, l.date desc
    )
    select
        p.id, p.name, p.avatar_url, p.title, p.location, p.total_drops, p.group_tags, p.geo_lat, p.geo_lng,
        coalesce(p.achievement_count, 0)::integer as achievement_count,
        l.date as last_poop_at,
        l.duration_seconds as last_duration_seconds,
        l.mood as last_mood
    from public.profiles p
    left join latest_logs l on p.id = l.user_id
    where p.id != auth.uid()
      and p.group_tags && my_tags;
end;
$$ language plpgsql security definer set search_path = '';

-- 8. handle_new_user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '新用户'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';
