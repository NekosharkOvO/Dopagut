import { supabase } from '../supabase-client';
import { Profile } from './auth.service';

export const profileService = {
    async getProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data as Profile;
    },

    async updateAvatar(userId: string, file: File): Promise<string> {
        const filePath = `${userId}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        await profileService.updateProfile(userId, { avatar_url: publicUrl });
        return publicUrl;
    },

    async updateAvatarBase64(userId: string, base64: string): Promise<string> {
        const response = await fetch(base64);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        return profileService.updateAvatar(userId, file);
    },

    async ensureProfile(userId: string, name?: string): Promise<Profile> {
        const profile = await profileService.getProfile(userId);
        if (profile) return profile;

        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                name: name || '新用户',
                title: '新手',
                total_drops: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    /**
     * 通过邀请码加入圈子
     * 调用数据库 RPC，验证码并追加 group_tag 到用户 profile
     */
    async joinGroup(inviteCode: string): Promise<string> {
        const { data, error } = await supabase.rpc('join_group_by_invite', { invite_code: inviteCode });
        if (error) throw error;
        return data as string;
    },

    /**
     * 获取同圈用户列表（供地图页使用）
     * 返回与当前用户 group_tags 有交集的所有其他用户
     */
    async getGroupMates(): Promise<Profile[]> {
        // NOTE: 多窗口并发时 Supabase RPC 可能永久 hang 住，加 5s timeout 兆底
        const rpcPromise = supabase.rpc('get_group_mates');
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getGroupMates timeout')), 5000)
        );
        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
        if (error) throw error;
        return (data || []) as Profile[];
    },

    /**
     * 实时同步用户统计数据（total_drops / max_zen / beat_percentage 等）
     * 每次打开个人页时调用，确保排名百分比等数据反映最新状态
     */
    async syncStats(userId: string): Promise<void> {
        const { error } = await supabase.rpc('sync_user_stats', { target_user_id: userId });
        if (error) console.error('syncStats failed:', error);
    }
};
