import { supabase } from '../supabase-client';

export interface DbAchievementDefinition {
    id: string;
    title_zh: string;
    title_en: string;
    description_zh: string;
    description_en: string;
    icon: string;
    rarity: 'common' | 'rare' | 'legendary';
    categories: string[];
    target_value: number;
    bg_theme: string;
}

export interface DbUserAchievement {
    id: string;
    user_id: string;
    achievement_type: string;
    current_progress: number;
    unlocked_at: string | null;
    created_at: string;
}

export const achievementService = {
    async getDefinitions(): Promise<DbAchievementDefinition[]> {
        const { data, error } = await supabase
            .from('achievement_definitions')
            .select('*');
        if (error) throw error;
        return data || [];
    },

    async getUserAchievements(userId: string): Promise<DbUserAchievement[]> {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        return data || [];
    },

    async updateProgress(userId: string, achievementId: string, increment: number) {
        // ... 原有逻辑保持兼容 ...
        await this.syncProgress(userId, achievementId, increment, true);
    },

    async syncProgress(userId: string, achievementId: string, absoluteValue: number, isIncrement = false): Promise<boolean> {
        const { data: def, error: defErr } = await supabase
            .from('achievement_definitions')
            .select('target_value')
            .eq('id', achievementId)
            .single();
        if (defErr) return false;

        const { data: current } = await supabase
            .from('achievements')
            .select('*')
            .match({ user_id: userId, achievement_type: achievementId })
            .maybeSingle();

        const oldProgress = current?.current_progress || 0;
        const newProgress = isIncrement
            ? Math.min(oldProgress + absoluteValue, def.target_value)
            : Math.min(absoluteValue, def.target_value);

        const isUnlocking = !current?.unlocked_at && oldProgress < def.target_value && newProgress >= def.target_value;

        const { error: upsertErr } = await supabase
            .from('achievements')
            .upsert({
                user_id: userId,
                achievement_type: achievementId,
                current_progress: newProgress,
                unlocked_at: isUnlocking ? new Date().toISOString() : (current?.unlocked_at || null)
            }, { onConflict: 'user_id,achievement_type' });

        if (upsertErr) throw upsertErr;
        return isUnlocking;
    }
};
