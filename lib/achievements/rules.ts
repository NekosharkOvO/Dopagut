import { Log } from '../../types';
import { achievementService } from '../services/achievement.service';

/**
 * 成就判定规则接口
 */
export interface AchievementRule {
    id: string;
    check: (userId: string, currentLog: Log, history?: Log[]) => Promise<number>;
}

export const achievementRules: AchievementRule[] = [
    {
        id: 'early_bird',
        check: async (_, log) => {
            const hour = new Date(log.date).getHours();
            return (hour >= 5 && hour < 7) ? 1 : 0;
        }
    },
    {
        id: 'midnight_owl',
        check: async (_, log) => {
            const hour = new Date(log.date).getHours();
            return (hour >= 0 && hour < 4) ? 1 : 0;
        }
    },
    {
        id: 'thinker',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.durationSeconds > 300).length;
        }
    },
    {
        id: 'sprinter',
        check: async (_, log) => {
            return (log.durationSeconds > 0 && log.durationSeconds < 60) ? 1 : 0;
        }
    },
    {
        id: 'zen_master',
        check: async (_, log) => {
            return (log.mood === 'zen' && log.durationSeconds > 300) ? 1 : 0;
        }
    },
    {
        id: 'nuclear_blast',
        check: async (_, log) => {
            return log.mood === 'nuclear' ? 1 : 0;
        }
    },
    {
        id: 'spicy_lover',
        check: async (_, log) => {
            return (log.mood === 'spicy' && log.bristolType <= 3) ? 1 : 0;
        }
    },
    {
        id: 'ghost_poop',
        check: async (_, log) => {
            return (
                log.bristolType === 4 &&
                log.mood === 'ghost' &&
                log.speed === 'sonic'
            ) ? 1 : 0;
        }
    },
    {
        id: 'bristol_king',
        check: async (_, __, history) => {
            if (!history) return 0;
            const types = new Set(history.map(l => l.bristolType));
            return types.size;
        }
    },
    {
        id: 'color_collector',
        check: async (_, __, history) => {
            if (!history) return 0;
            const colors = new Set(history.map(l => l.color));
            return colors.size;
        }
    },
    {
        id: 'fiber_freak',
        check: async (userId, _, history) => {
            if (!history || history.length === 0) return 0;

            // 获取去重后的日期集合（降序排列）
            const dates = [...new Set(history.map(l => new Date(l.date).toDateString()))]
                .map(d => new Date(d).getTime())
                .sort((a, b) => b - a);

            const oneDayMs = 24 * 60 * 60 * 1000;
            let streak = 0;
            const today = new Date().toDateString();
            const todayMs = new Date(today).getTime();

            // 如果历史记录中没有今天或昨天，连击为 0 (除非刚完成的一条就是今天)
            if (dates[0] < todayMs - oneDayMs) return 0;

            for (let i = 0; i < dates.length; i++) {
                if (i === 0) {
                    streak = 1;
                    continue;
                }
                // 检查是否是连续的一天
                if (dates[i - 1] - dates[i] === oneDayMs) {
                    streak++;
                } else {
                    break;
                }
            }
            return Math.min(streak, 3);
        }
    }
];
