import { Log } from '../../types';
import { achievementRules } from './rules';
import { achievementService } from '../services/achievement.service';
import { logService } from '../services/log.service';

export const AchievementEngine = {
    /**
     * 运行成就检测流（优化版）
     * 优化策略：
     * 1. 预加载所有定义和用户进度（2 次 DB 查询取代原来 22 次）
     * 2. 并行执行所有规则的 check（Promise.all）
     * 3. 仅对有变化的进度执行 upsert
     * @param userId 用户 ID
     * @param currentLog 当前刚产出的日志
     */
    async run(userId: string, currentLog: Log) {
        console.log(`[AchievementEngine] Starting optimized sync for user: ${userId}`);

        // 1. 并行预加载：历史记录 + 成就定义 + 当前用户进度
        let history: Log[] = [];
        let definitions: any[] = [];
        let userAchievements: any[] = [];

        try {
            [history, definitions, userAchievements] = await Promise.all([
                logService.getLogs(userId),
                achievementService.getDefinitions(),
                achievementService.getUserAchievements(userId),
            ]);
        } catch (e) {
            console.error('[AchievementEngine] Failed to preload data:', e);
            return;
        }

        // 2. 构建查找表避免重复遍历
        const defMap = new Map(definitions.map(d => [d.id, d]));
        const progressMap = new Map(userAchievements.map(a => [a.achievement_type, a]));

        // 3. 并行执行所有规则的 check
        const checkResults = await Promise.allSettled(
            achievementRules.map(async rule => ({
                id: rule.id,
                value: await rule.check(userId, currentLog, history),
            }))
        );

        // 4. 仅对有变化的进度执行 upsert
        for (const result of checkResults) {
            if (result.status !== 'fulfilled') continue;
            const { id, value } = result.value;

            try {
                const def = defMap.get(id);
                if (!def) continue;

                const current = progressMap.get(id);
                const oldProgress = current?.current_progress || 0;
                const newProgress = Math.min(value, def.target_value);

                // NOTE: 跳过无变化的进度，避免不必要的 DB 写入
                if (newProgress === oldProgress && current) continue;

                const isUnlocking = !current?.unlocked_at
                    && oldProgress < def.target_value
                    && newProgress >= def.target_value;

                await achievementService.upsertProgress(userId, id, newProgress, isUnlocking, current?.unlocked_at);

                if (isUnlocking) {
                    console.log(`[AchievementEngine] NEW UNLOCK DETECTED: ${id}`);

                    // 派发全局解锁事件
                    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
                        detail: { id, title: id }
                    }));

                    // 设置红点状态
                    localStorage.setItem('has_new_achievements', 'true');
                    window.dispatchEvent(new CustomEvent('achievement-dot-refresh'));
                }
            } catch (err) {
                console.error(`[AchievementEngine] Error syncing rule ${id}:`, err);
            }
        }
    }
};
