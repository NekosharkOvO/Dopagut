-- =============================================
-- 未完成记录恢复机制：pending_sessions 表
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- NOTE: 独立于 logs 表管理进行中的记录会话
-- 用户点击「开始投弹」时写入，记录完成后删除
-- 页面被销毁时 pending session 留存，用于下次恢复
create table if not exists public.pending_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamptz not null,
  mood text,
  created_at timestamptz default now()
);

-- 索引：按用户查询未完成会话
create index if not exists idx_pending_sessions_user_id
  on public.pending_sessions(user_id);

-- =============================================
-- RLS 策略
-- =============================================
alter table public.pending_sessions enable row level security;

drop policy if exists "用户只能查看自己的未完成会话" on public.pending_sessions;
create policy "用户只能查看自己的未完成会话"
  on public.pending_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "用户只能创建自己的未完成会话" on public.pending_sessions;
create policy "用户只能创建自己的未完成会话"
  on public.pending_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "用户只能更新自己的未完成会话" on public.pending_sessions;
create policy "用户只能更新自己的未完成会话"
  on public.pending_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "用户只能删除自己的未完成会话" on public.pending_sessions;
create policy "用户只能删除自己的未完成会话"
  on public.pending_sessions for delete
  using (auth.uid() = user_id);
