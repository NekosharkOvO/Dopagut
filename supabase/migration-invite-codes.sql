-- =============================================
-- DopaGut 增量迁移：邀请码圈子隔离 + 地理坐标
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. 邀请码管理表（管理员手动维护）
create table if not exists public.invite_codes (
  code text primary key,
  group_tag text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. profiles 表新增字段
alter table public.profiles add column if not exists group_tags text[] default '{}';
alter table public.profiles add column if not exists geo_lat float8;
alter table public.profiles add column if not exists geo_lng float8;

-- 3. 邀请码验证 RPC
-- 返回对应的 group_tag，若无效则返回 null
drop function if exists public.validate_invite_code(text);
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
$$ language plpgsql security definer;

grant execute on function public.validate_invite_code(text) to anon;
grant execute on function public.validate_invite_code(text) to authenticated;

-- 4. 为用户加入圈子的 RPC
-- 验证邀请码后将 group_tag 追加到用户的 group_tags 数组中
drop function if exists public.join_group_by_invite(text);
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

  -- 使用 array_append 并去重
  update public.profiles
  set group_tags = array(select distinct unnest(array_append(group_tags, result_tag)))
  where id = current_user_id;

  return result_tag;
end;
$$ language plpgsql security definer;

grant execute on function public.join_group_by_invite(text) to authenticated;

-- 5. 查询同圈用户的 RPC
-- 返回与当前用户有共同 group_tag 的所有其他用户，并关联最新排便记录
-- NOTE: 使用 security definer + set local row_security = off 绕过 RLS，
--       从而在 CTE 中读取他人的 logs/achievements 数据
drop function if exists public.get_group_mates();
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
  -- security definer 函数中显式关闭行级安全，确保内部 CTE 可跨用户读取
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
$$ language plpgsql security definer;

grant execute on function public.get_group_mates() to authenticated;

-- 新增：profiles 表中记录 achievement_count，由 sync 函数维护
-- 这样读取他人成就数时直接从 profiles 读，无需跨 RLS 查 achievements 表
alter table public.profiles add column if not exists achievement_count integer default 0;

-- 更新 sync_user_stats，同步成就数到 profiles（每次记录排便后调用）
drop function if exists public.sync_user_stats(uuid);
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

  -- 一并同步成就数，供地图页跨用户读取
  update public.profiles
  set
    total_drops = total,
    max_zen = max_zen_val,
    achievement_count = unlocked_count,
    updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

grant execute on function public.sync_user_stats(uuid) to authenticated;

-- 6. RLS 策略调整
-- 保留原有策略不动（自查 + 全局可读），因为 get_group_mates RPC 使用 security definer
-- 已经能保证只返回同圈用户。前端仅通过 RPC 获取同圈用户，不直接 select profiles。

-- 7. invite_codes 的 RLS
alter table public.invite_codes enable row level security;

-- 匿名和已认证用户都可以验证邀请码（通过 RPC，此策略仅用于 select 查询）
drop policy if exists "邀请码可查询验证" on public.invite_codes;
create policy "邀请码可查询验证" on public.invite_codes for select using (true);

-- 8. 索引
create index if not exists idx_profiles_group_tags on public.profiles using gin(group_tags);

-- 9. 一次性回填：更新所有现有用户的 achievement_count 到 profiles 表
-- 已加入圈子用户的成就数默认为 0（因 add column 时默认值），需补偿写入
-- 每次新增成就解锁时，sync_user_stats 会自动同步，此处仅需执行一次
update public.profiles p
set achievement_count = (
    select count(*)
    from public.achievements a
    where a.user_id = p.id
      and a.unlocked_at is not null
);
