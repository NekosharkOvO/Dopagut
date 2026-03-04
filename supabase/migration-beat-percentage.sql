-- =============================================
-- 修复 beat_percentage：在 sync_user_stats 中
-- 计算当前用户在同圈内便便次数击败了多少百分比的人
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

create or replace function public.sync_user_stats(target_user_id uuid)
returns void as $$
declare
  total integer;
  max_zen_val integer;
  unlocked_count integer;
  my_tags text[];
  group_total integer;
  beaten_count integer;
  beat_pct integer;
begin
  -- 1. 基础统计
  select count(*), coalesce(max(duration_seconds), 0) / 60
  into total, max_zen_val
  from public.logs
  where user_id = target_user_id;

  -- 2. 成就统计
  select count(*)
  into unlocked_count
  from public.achievements
  where user_id = target_user_id and unlocked_at is not null;

  -- 3. 计算同圈排名百分比
  -- 获取用户的 group_tags
  select p.group_tags into my_tags
  from public.profiles p
  where p.id = target_user_id;

  beat_pct := 0;

  if my_tags is not null and array_length(my_tags, 1) is not null then
    -- 同圈内（group_tags 有交集）的其他用户总数
    select count(*)
    into group_total
    from public.profiles p
    where p.id != target_user_id
      and p.group_tags && my_tags;

    if group_total > 0 then
      -- 其中 total_drops 比我少的人数
      select count(*)
      into beaten_count
      from public.profiles p
      where p.id != target_user_id
        and p.group_tags && my_tags
        and p.total_drops < total;

      beat_pct := round((beaten_count::numeric / group_total::numeric) * 100)::integer;
    end if;
  end if;

  -- 4. 写入
  update public.profiles
  set
    total_drops = total,
    max_zen = max_zen_val,
    achievement_count = unlocked_count,
    beat_percentage = beat_pct,
    updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = '';
