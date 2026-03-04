import { supabase } from '../supabase-client';
import { Log } from '../../types';
import { logService } from './log.service';

export const testService = {
    async resetUserData(userId: string) {
        const { error } = await supabase.rpc('dev_reset_user_data', { target_user_id: userId });
        if (error) throw error;
    },

    async seedLogs(userId: string, count: number) {
        const { error } = await supabase.rpc('dev_seed_logs', { target_user_id: userId, count });
        if (error) throw error;
    },

    async unlockAllAchievements(userId: string): Promise<number> {
        const { data, error } = await supabase.rpc('dev_unlock_all_achievements', { target_user_id: userId });
        if (error) throw error;
        return (data as number) || 0;
    },

    async createCustomLog(userId: string, options: {
        daysOffset: number;
        bristol: number;
        mood: string;
        speed: string;
        amount: string;
        color: string;
    }) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + options.daysOffset);

        const newLog: Omit<Log, 'id'> = {
            date: targetDate.toISOString(),
            durationSeconds: 300 + Math.floor(Math.random() * 600),
            bristolType: options.bristol,
            shape: `Type ${options.bristol}`,
            color: options.color,
            mood: options.mood,
            speed: options.speed,
            amount: options.amount
        };

        return await logService.createLog(userId, newLog);
    },

    async syncDefinitions(): Promise<void> {
        const { achievementDefinitions } = await import('../achievements/definitions');

        const { error } = await supabase
            .from('achievement_definitions')
            .upsert(achievementDefinitions, { onConflict: 'id' });

        if (error) throw error;
    },

    /**
     * 锁定用户所有成就（清空 user_achievements 表）
     */
    async lockAllAchievements(userId: string): Promise<void> {
        const { error } = await supabase
            .from('user_achievements')
            .delete()
            .eq('user_id', userId);
        if (error) throw error;
    },

    /**
     * 锁定特定成就
     */
    async lockOneAchievement(userId: string, achievementId: string): Promise<void> {
        const { error } = await supabase
            .from('user_achievements')
            .delete()
            .eq('user_id', userId)
            .eq('achievement_type', achievementId);
        if (error) throw error;
    },

    /**
     * 解锁特定成就
     */
    async unlockOneAchievement(userId: string, achievementId: string): Promise<void> {
        const { error } = await supabase
            .from('user_achievements')
            .upsert({
                user_id: userId,
                achievement_type: achievementId,
                unlocked_at: new Date().toISOString(),
                current_progress: 1
            }, { onConflict: 'user_id,achievement_type' });
        if (error) throw error;
    },

    /**
     * 删除特定记录
     */
    async deleteLog(logId: string): Promise<void> {
        const { error } = await supabase
            .from('poop_logs')
            .delete()
            .eq('id', logId);
        if (error) throw error;
    },

    /**
     * 清除用户所有记录（仅 poop_logs，不清成就）
     */
    async clearAllLogs(userId: string): Promise<void> {
        const { error } = await supabase
            .from('poop_logs')
            .delete()
            .eq('user_id', userId);
        if (error) throw error;
    }
};
