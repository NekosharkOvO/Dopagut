import { supabase } from '../supabase-client';

/** 数据库中的用户档案 */
export interface Profile {
    id: string;
    name: string;
    avatar_url: string | null;
    title: string;
    location: string | null;
    total_drops: number;
    max_zen: number;
    beat_percentage: number;
    group_tags: string[];
    geo_lat: number | null;
    geo_lng: number | null;
    created_at: string;
    updated_at: string;
    // 扩展字段（用于地图动态显示）
    last_poop_at?: string;
    last_duration_seconds?: number;
    last_mood?: string;
    achievement_count?: number;
    // NOTE: 管理员标识，用于开发者控制台权限校验
    is_admin?: boolean;
}

export const authService = {
    async signUp(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });
        if (error) throw error;
        // 防范 Supabase 的防邮箱爆破机制静默拦截（返回空 identities 说明邮箱已被占用）
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error('此电子邮箱已被注册，请使用其他邮箱或直接登录。');
        }
        return data;
    },

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * 验证邀请码是否有效
     * @returns 对应的 group_tag 或 null
     */
    async validateInviteCode(code: string): Promise<string | null> {
        const { data, error } = await supabase.rpc('validate_invite_code', { invite_code: code });
        if (error) return null;
        return data as string | null;
    },

    /**
     * 验证注册时的 Email OTP 验证码
     * NOTE: 验证通过后 Supabase 会自动标记 email_confirmed_at
     */
    async verifyOtp(email: string, token: string): Promise<{ user: any; session: any }> {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });
        if (error) throw error;
        return data;
    },

    /**
     * 发送密码重置验证码到用户邮箱
     * Supabase 会发送 6 位 OTP 验证码
     */
    async resetPassword(email: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    },

    /**
     * 用 OTP 验证码验证身份，然后设置新密码
     * 先用 recovery 类型 OTP 验证获取临时 session，再调用 updateUser 设置新密码
     */
    async verifyResetOtp(email: string, token: string, newPassword: string): Promise<void> {
        // 用 recovery OTP 验证身份
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
        });
        if (verifyError) throw verifyError;

        // 验证通过后 Supabase 会自动建立临时 session，此时可以更新密码
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (updateError) throw updateError;

        // 重置完成后登出，让用户用新密码重新登录
        await supabase.auth.signOut();
    },
};
