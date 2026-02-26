import { useState, useEffect, useCallback } from 'react';
import { logService } from '../lib/api';
import { Log } from '../types';

/**
 * 自定义 Hook：管理用户的排便日志数据
 * 提供日志列表、今日 MVP、周报统计、平均时间等
 */
export function useLogs(userId: string | undefined) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [dailyMVP, setDailyMVP] = useState<Log | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<{ score: number; label: string }[]>([]);
    const [averageTime, setAverageTime] = useState('0m 0s');
    const [loading, setLoading] = useState(true);

    /**
     * 加载所有日志数据
     */
    const loadData = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [logsData, mvp, weekly, avgTime] = await Promise.all([
                logService.getLogs(userId),
                logService.getDailyMVP(userId),
                logService.getWeeklyStats(userId),
                logService.getAverageTime(userId),
            ]);

            setLogs(logsData);
            setDailyMVP(mvp);
            setWeeklyStats(weekly);
            setAverageTime(avgTime);
        } catch (err) {
            console.error('加载日志数据失败:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * 创建新记录并自动刷新数据
     */
    const createLog = useCallback(
        async (log: Omit<Log, 'id'>) => {
            if (!userId) return;
            await logService.createLog(userId, log);
            await loadData();
        },
        [userId, loadData]
    );

    return {
        logs,
        dailyMVP,
        weeklyStats,
        averageTime,
        loading,
        createLog,
        refreshLogs: loadData,
    };
}
