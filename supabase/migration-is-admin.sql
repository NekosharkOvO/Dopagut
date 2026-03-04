-- 给 profiles 表添加 is_admin 字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 将你自己的账号设为管理员（请替换为你真实的 uid）
-- UPDATE profiles SET is_admin = true WHERE id = '你的-user-id';
