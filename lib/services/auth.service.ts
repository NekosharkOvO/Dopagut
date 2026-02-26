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
};
