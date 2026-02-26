-- =============================================
-- DopaGut Supabase 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. 用户档案表（扩展 auth.users）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '新用户',
  avatar_url text,
  title text default '新手',
  location text,
  total_drops integer default 0,
  max_zen integer default 0,
  beat_percentage integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 确保旧表也有这些字段
alter table public.profiles add column if not exists total_drops integer default 0;
alter table public.profiles add column if not exists max_zen integer default 0;
alter table public.profiles add column if not exists beat_percentage integer default 0;
alter table public.profiles add column if not exists title text default '新手';

-- 2. 排便记录表
create table if not exists public.logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date timestamptz not null,
  duration_seconds integer not null,
  bristol_type integer not null check (bristol_type between 1 and 7),
  shape text,
  color text,
  mood text,
  speed text,
  amount text,
  created_at timestamptz default now()
);

-- =============================================
-- 3. 成就定义表（存储静态信息）
-- =============================================
create table if not exists public.achievement_definitions (
  id text primary key,
  title_zh text not null,
  title_en text not null,
  description_zh text not null,
  description_en text not null,
  icon text not null,
  rarity text check (rarity in ('common', 'rare', 'legendary')) default 'common',
  categories text[] default '{}',
  target_value integer default 1,
  bg_theme text default 'bg-white'
);

-- 4. 成就解锁与进度记录表
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_type text references public.achievement_definitions(id) on delete cascade not null,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, achievement_type)
);

-- 确保旧表也有这些字段和约束
alter table public.achievements add column if not exists current_progress integer default 0;
alter table public.achievements add column if not exists unlocked_at timestamptz;

-- 补齐唯一约束（如果旧表没有）
do $$ 
begin 
    if not exists (select 1 from pg_constraint where conname = 'achievements_user_id_achievement_type_key') then
        alter table public.achievements add constraint achievements_user_id_achievement_type_key unique (user_id, achievement_type);
    end if;
end $$;

-- 5. 好友关系表
create table if not exists public.friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- =============================================
-- 初始化成就定义数据
-- =============================================
insert into public.achievement_definitions (id, title_zh, title_en, description_zh, description_en, icon, rarity, categories, target_value, bg_theme)
values 
('early_bird', '早起鸟', 'Early Bird', '在清晨 5:00 - 7:00 之间完成记录。', 'Record between 5:00 - 7:00 AM.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDVE58ckV9bbBOpVKkfO0SMsEo-kGJ80YRFuvBwSHtumZu1MuqtSEF1N1KZpNwXOHmqy_OWT2Rm4AaM1PNZ7Q_CVUEzov03lMNYNlwjKhiNWcfDdDSvHfYjWFm3XyVRECElIbKKcs_KVO2AgumQtAetSMlnGefRUovdmAD9nAY4-t2p8-SiPP4KStEvF0vdKYG0xT7-k2D1FV8EIBad-vdm22oCmBvvh03urWjYV-IymH-YEBpyxqMxyyBVDSFGgy9fXpoFlQOUkY', 'common', '{daily, time}', 1, 'bg-dopa-yellow'),
('midnight_owl', '深夜幽灵', 'Midnight Owl', '在凌晨 00:00 - 04:00 之间完成记录。', 'Record between 00:00 - 04:00 AM.', '🦉', 'rare', '{daily, time}', 1, 'bg-black'),
('thinker', '思想者', 'Thinker', '单次会话超过 5 分钟。', 'Session over 5 minutes.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXK7jsL_s6yy9T3yA-dJl3eZlhbV4sBtJ55buAQIjzFHPfL71MDWr6ccJ-pAYCLsnF9irlked5Hx8IRwMuLsppMoxqYeTqP7ROhr27IPWbQmtI6hLQNUgQy_7Y-55rrqp_r5n8gyvdBQMrYjIJ95CZZyrKVFBW-QCe0L_z6XWoLjQXRy3yLhGwdKH4Uvr1OkBAHkdIXijLughZIVtnCQAlHNyI5mGGVI9lxhvSck1fFXro6F_Yi1nsN7XmPk0MuckylrVKqqxwvQ0', 'rare', '{stat}', 5, 'bg-dopa-blue'),
('sprinter', '冲刺手', 'Sprinter', '在 60 秒内神速完成一次记录。', 'Finish a record within 60 seconds.', '⚡', 'common', '{stat}', 1, 'bg-dopa-pink'),
('fiber_freak', '纤维狂人', 'Fiber Freak', '连续 3 天保持排便记录。', 'Consistent drops for 3 consecutive days.', '🥦', 'common', '{daily}', 3, 'bg-dopa-cyan'),
('bristol_king', '布氏大满贯', 'Bristol King', '解锁全部 7 种 Bristol 类型。', 'Collect all 7 Bristol types.', '👑', 'legendary', '{collection, special}', 7, 'bg-dopa-purple'),
('color_collector', '色彩收藏家', 'Color Collector', '累计记录过 4 种不同的颜色。', 'Collect 4 different poop colors.', '🎨', 'rare', '{collection, special}', 4, 'bg-dopa-yellow'),
('zen_master', '禅定大师', 'Zen Master', '心情禅定且时长超过 5 分钟。', 'Mood Zen and duration over 5 minutes.', '🧘', 'rare', '{vibe, special}', 1, 'bg-dopa-lime'),
('nuclear_blast', '核爆现场', 'Nuclear Blast', '正如其名，这是一场核爆。', 'As the name suggests, it is a nuclear explosion.', '☢️', 'common', '{vibe}', 1, 'bg-dopa-orange'),
('spicy_lover', '辣味爱好者', 'Spicy Lover', '心情火辣辣，且 Bristol 类型偏硬。', 'Spicy mood and hard Bristol type.', '🔥', 'common', '{vibe}', 1, 'bg-dopa-yellow'),
('ghost_poop', '幽灵便便', 'Ghost Poop', '在冲水之前它就消失了。', 'It vanishes before you even flush.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AfAYUODO9MDf16GRPiKBeYJVslZgbcJ_BknK6sYg9GzhYyEuCumNEigY7jml5faAPAHj1YFuviVEgxb2PNHP1bEjcpBVy7ZkhTCUCHFB6hraKn_0s6WezaoFttTS0o-FqUV9z33AgdSRP3uMWa0nOnNU2nw-mzEdL-0cXRWZLbAF6h8osK6mgkrYjEMciHYrV-odXYIETBApeuqzqc9Jv6lBj3AkU05GwqIir0A4dtsagq1qGMd2FjXLXGIIx2NKrKH0MWAv8C4', 'legendary', '{hidden}', 1, 'bg-dopa-purple')
on conflict (id) do update set
  title_zh = excluded.title_zh,
  title_en = excluded.title_en,
  description_zh = excluded.description_zh,
  description_en = excluded.description_en,
  icon = excluded.icon,
  rarity = excluded.rarity,
  categories = excluded.categories,
  target_value = excluded.target_value,
  bg_theme = excluded.bg_theme;

-- =============================================
-- 开发者/测试 RPC
-- =============================================

-- 一键重置用户数据
drop function if exists public.dev_reset_user_data(uuid);
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
$$ language plpgsql security definer;

-- =============================================
-- 统计同步函数
-- =============================================
drop function if exists public.sync_user_stats(uuid);
create or replace function public.sync_user_stats(target_user_id uuid)
returns void as $$
declare
  total integer;
  max_zen_val integer;
begin
  -- 获取最新统计
  select count(*), coalesce(max(duration_seconds), 0) / 60
  into total, max_zen_val
  from public.logs
  where user_id = target_user_id;

  -- 同步到 profile
  update public.profiles 
  set 
    total_drops = total,
    max_zen = max_zen_val,
    updated_at = now()
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- 快速生成随机日志
drop function if exists public.dev_seed_logs(uuid, integer);
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
  
  -- 批量操作后也要同步
  perform public.sync_user_stats(target_user_id);
end;
$$ language plpgsql security definer;

grant execute on function public.dev_seed_logs(uuid, integer) to authenticated;

-- 一键解锁所有成就
drop function if exists public.dev_unlock_all_achievements(uuid);
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
$$ language plpgsql security definer;

-- 权限赋予
grant execute on function public.dev_reset_user_data(uuid) to authenticated;
grant execute on function public.dev_seed_logs(uuid, integer) to authenticated;
grant execute on function public.dev_unlock_all_achievements(uuid) to authenticated;

-- =============================================
-- 索引
-- =============================================
create index if not exists idx_logs_user_id on public.logs(user_id);
create index if not exists idx_logs_date on public.logs(date desc);
create index if not exists idx_achievements_user_id on public.achievements(user_id);
create index if not exists idx_friends_user_id on public.friends(user_id);

-- =============================================
-- RLS
-- =============================================
alter table public.achievement_definitions enable row level security;
drop policy if exists "成就定义所有人可读" on public.achievement_definitions;
create policy "成就定义所有人可读" on public.achievement_definitions for select using (true);

alter table public.profiles enable row level security;
drop policy if exists "用户可以查看所有人的档案" on public.profiles;
create policy "用户可以查看所有人的档案" on public.profiles for select using (true);
drop policy if exists "用户只能更新自己的档案" on public.profiles;
create policy "用户只能更新自己的档案" on public.profiles for update using (auth.uid() = id);
drop policy if exists "用户可以插入自己的档案" on public.profiles;
create policy "用户可以插入自己的档案" on public.profiles for insert with check (auth.uid() = id);

alter table public.logs enable row level security;
drop policy if exists "用户只能查看自己的记录" on public.logs;
create policy "用户只能查看自己的记录" on public.logs for select using (auth.uid() = user_id);
drop policy if exists "用户只能插入自己的记录" on public.logs;
create policy "用户只能插入自己的记录" on public.logs for insert with check (auth.uid() = user_id);
drop policy if exists "用户只能删除自己的记录" on public.logs;
create policy "用户只能删除自己的记录" on public.logs for delete using (auth.uid() = user_id);

alter table public.achievements enable row level security;
drop policy if exists "用户只能查看自己的成就" on public.achievements;
create policy "用户只能查看自己的成就" on public.achievements for select using (auth.uid() = user_id);
drop policy if exists "用户只能解锁自己的成就" on public.achievements;
create policy "用户只能解锁自己的成就" on public.achievements for insert with check (auth.uid() = user_id);
drop policy if exists "用户只能更新自己的成就进度" on public.achievements;
create policy "用户只能更新自己的成就进度" on public.achievements for update using (auth.uid() = user_id);

alter table public.friends enable row level security;
drop policy if exists "用户可以查看自己的好友" on public.friends;
create policy "用户可以查看自己的好友" on public.friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
drop policy if exists "用户可以添加好友" on public.friends;
create policy "用户可以添加好友" on public.friends for insert with check (auth.uid() = user_id);
drop policy if exists "用户可以删除好友" on public.friends;
create policy "用户可以删除好友" on public.friends for delete using (auth.uid() = user_id);

-- =============================================
-- 触发器
-- =============================================
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
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Storage Bucket
-- =============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "用户可以上传自己的头像" on storage.objects;
create policy "用户可以上传自己的头像" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "头像公开可读" on storage.objects;
create policy "头像公开可读" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "用户可以更新自己的头像" on storage.objects;
create policy "用户可以更新自己的头像" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
