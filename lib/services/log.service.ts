import { supabase } from '../supabase-client';
import { Log } from '../../types';
import { AchievementEngine } from '../achievements/engine';
import { profileService } from './profile.service';
import { achievementService } from './achievement.service';

/** 数据库中的排便记录 */
export interface DbLog {
    id: string;
    user_id: string;
    date: string;
    duration_seconds: number;
    bristol_type: number;
    shape: string | null;
    color: string | null;
    mood: string | null;
    speed: string | null;
    amount: string | null;
    created_at: string;
}

export const logService = {
    async createLog(userId: string, log: Omit<Log, 'id'>): Promise<DbLog> {
        const { data, error } = await supabase
            .from('logs')
            .insert({
                user_id: userId,
                date: log.date,
                duration_seconds: log.durationSeconds,
                bristol_type: log.bristolType,
                shape: log.shape,
                color: log.color,
                mood: log.mood,
                speed: log.speed,
                amount: log.amount,
            })
            .select()
            .single();
        if (error) throw error;

        const createdLog: Log = logService.dbLogToLog(data);

        // 1. 核心统计同步：必须同步等待，确保个人资料页的等级和次数能即时刷新
        try {
            await supabase.rpc('sync_user_stats', { target_user_id: userId });
        } catch (err) {
            console.error('Core stats sync failed:', err);
            // 回退逻辑：手动更新 Profile 计数
            const currentProfile = await profileService.getProfile(userId);
            if (currentProfile) {
                await profileService.updateProfile(userId, {
                    total_drops: (currentProfile.total_drops || 0) + 1,
                    max_zen: Math.max(currentProfile.max_zen || 0, Math.floor(log.durationSeconds / 60)),
                });
            }
        }

        // 2. 耗时成就判定：改为后台异步执行，不阻塞“保存记录”的主响应
        // 这样可以解决用户反馈的“点击保存要很久”的问题
        (async () => {
            try {
                await AchievementEngine.run(userId, createdLog);
            } catch (err) {
                console.error('Background achievement engine failed:', err);
            }
        })();

        return data;
    },

    async getLogs(userId: string): Promise<Log[]> {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) throw error;
        return (data || []).map(logService.dbLogToLog);
    },

    /**
     * 从已加载的日志中计算今日 MVP（纯内存，无 DB 查询）
     */
    getDailyMVPFromLogs(logs: Log[]): Log | null {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayLogs = logs.filter(l => new Date(l.date) >= startOfToday);
        if (todayLogs.length === 0) return null;

        // 优先选 bristol_type === 4 的完美型
        const perfect = todayLogs.find(l => l.bristolType === 4);
        if (perfect) return perfect;

        // 否则选 bristol_type 最接近 4 的
        return todayLogs.sort((a, b) => Math.abs(a.bristolType - 4) - Math.abs(b.bristolType - 4))[0];
    },

    /**
     * 从已加载的日志中计算周报统计（纯内存，无 DB 查询）
     * NOTE: 原实现用 for 循环串行查 7 次 DB，现在一次内存过滤
     */
    getWeeklyStatsFromLogs(logs: Log[]): { score: number; label: string }[] {
        const stats: { score: number; label: string }[] = [];
        const now = new Date();
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

        for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(now.getDate() - i);
            day.setHours(0, 0, 0, 0);

            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);

            const label = dayNames[day.getDay()];

            // NOTE: 内存过滤取代 DB 查询
            const dayLogs = logs.filter(l => {
                const d = new Date(l.date);
                return d >= day && d < nextDay;
            });

            if (dayLogs.length > 0) {
                const dayScores = dayLogs.map(log => {
                    let s = 0;
                    const b = log.bristolType;
                    if (b === 4) s += 60;
                    else if (b === 3 || b === 5) s += 45;
                    else if (b === 2 || b === 6) s += 25;
                    else s += 10;

                    const m = log.mood;
                    if (['classic', 'zen', 'happy', 'party'].includes(m)) s += 20;
                    else if (['struggle', 'pain', 'nuclear'].includes(m)) s += 0;
                    else s += 10;

                    const sp = log.speed;
                    if (['sonic', 'normal'].includes(sp)) s += 20;
                    else if (sp === 'fast') s += 15;
                    else s += 5;

                    return s;
                });

                const avgScore = dayScores.reduce((a, b) => a + b, 0) / dayScores.length;
                const finalScore = Math.min(100, Math.round(avgScore + (dayLogs.length - 1) * 5));
                stats.push({ score: finalScore, label });
            } else {
                stats.push({ score: 0, label });
            }
        }
        return stats;
    },

    /**
     * 从已加载的日志中计算平均时间（纯内存，无 DB 查询）
     */
    getAverageTimeFromLogs(logs: Log[]): string {
        if (logs.length === 0) return '0m 0s';
        const total = logs.reduce((acc, log) => acc + log.durationSeconds, 0);
        const avg = Math.floor(total / logs.length);
        const m = Math.floor(avg / 60);
        const s = avg % 60;
        return `${m}m ${s}s`;
    },

    dbLogToLog(dbLog: DbLog): Log {
        return {
            id: dbLog.id,
            date: dbLog.date,
            durationSeconds: dbLog.duration_seconds,
            bristolType: dbLog.bristol_type,
            shape: dbLog.shape || '',
            color: dbLog.color || '',
            mood: dbLog.mood || '',
            speed: dbLog.speed || '',
            amount: dbLog.amount || '',
        };
    },
};
