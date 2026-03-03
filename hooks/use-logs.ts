import { useState, useEffect, useCallback, useRef } from 'react';
import { logService } from '../lib/api';
import { Log } from '../types';

/**
 * 自定义 Hook：管理用户的排便日志数据
 * 提供日志列表、今日 MVP、周报统计、平均时间等
 *
 * NOTE: 内置请求去重机制（isLoadingRef 锁），防止 tab 切换恢复时
 * 多次 refreshLogs 调用导致并发请求堆积。
 */
export function useLogs(userId: string | undefined) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [dailyMVP, setDailyMVP] = useState<Log | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<{ score: number; label: string }[]>([]);
    const [averageTime, setAverageTime] = useState('0m 0s');
    const [loading, setLoading] = useState(true);

    // NOTE: 防并发锁——同一时间只允许一个 loadData 执行
    const isLoadingRef = useRef(false);

    // NOTE: AbortController 支持——新请求到来时可取消旧请求
    const abortRef = useRef<AbortController | null>(null);

    /**
     * 加载所有日志数据
     * 内置去重：如果上一次加载尚未完成，直接跳过
     */
    const loadData = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // NOTE: 防并发——如果仍在加载中，跳过本次调用
        if (isLoadingRef.current) {
            return;
        }

        // 取消上一次可能还在 pending 的请求（安全保护）
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        isLoadingRef.current = true;

        try {
            setLoading(true);
            // NOTE: 优化前是 4 个并行 DB 查询（其中 getWeeklyStats 内有 7 次串行查询 = 10 次 DB）
            // 优化后只查一次 DB，其余全部内存计算
            const logsData = await logService.getLogs(userId);

            setLogs(logsData);
            setDailyMVP(logService.getDailyMVPFromLogs(logsData));
            setWeeklyStats(logService.getWeeklyStatsFromLogs(logsData));
            setAverageTime(logService.getAverageTimeFromLogs(logsData));
        } catch (err) {
            // NOTE: AbortError 是正常的取消行为，不需要报错
            if (err instanceof DOMException && err.name === 'AbortError') return;
            console.error('加载日志数据失败:', err);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
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
            // NOTE: 创建后强制刷新（重置锁以确保一定执行）
            isLoadingRef.current = false;
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
