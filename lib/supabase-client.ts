import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端实例
 * 从环境变量读取配置，确保不在代码中硬编码任何密钥
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '缺少 Supabase 环境变量。请在 .env.local 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );
}

// NOTE: 使用默认配置（autoRefreshToken: true, persistSession: true）。
// Supabase 会在 visibilitychange 时自动执行 _recoverAndRefresh，
// 但 auth-context 会忽略其产生的假 SIGNED_OUT 事件。
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
