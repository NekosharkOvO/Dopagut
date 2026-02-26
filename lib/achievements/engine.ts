import { Log } from '../../types';
import { achievementRules } from './rules';
import { achievementService } from '../services/achievement.service';
import { logService } from '../services/log.service';
import { supabase } from '../supabase-client';

export const AchievementEngine = {
    /**
     * 运行成就检测流
     * @param userId 用户 ID
     * @param currentLog 当前刚产出的日志
     */
    async run(userId: string, currentLog: Log) {
        console.log(`[AchievementEngine] Starting global sync for user: ${userId}`);

        let history: Log[] = [];
        try {
            history = await logService.getLogs(userId);
        } catch (e) {
            console.error('[AchievementEngine] Failed to fetch history:', e);
            return;
        }

        for (const rule of achievementRules) {
            try {
                // 1. 计算绝对进度
                const absoluteValue = await rule.check(userId, currentLog, history);

                // 2. 执行物理同步并获取解锁状态
                const newlyUnlocked = await achievementService.syncProgress(userId, rule.id, absoluteValue);

                if (newlyUnlocked) {
                    console.log(`[AchievementEngine] NEW UNLOCK DETECTED: ${rule.id}`);

                    // 派发全局解锁事件
                    window.dispatchEvent(new CustomEvent('achievement-unlocked', {
                        detail: { id: rule.id, title: rule.id }
                    }));

                    // 设置红点状态
                    localStorage.setItem('has_new_achievements', 'true');
                    window.dispatchEvent(new CustomEvent('achievement-dot-refresh'));
                }
            } catch (err) {
                console.error(`[AchievementEngine] Error syncing rule ${rule.id}:`, err);
            }
        }
    }
};
