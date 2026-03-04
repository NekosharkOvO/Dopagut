import { Log } from '../../types';

/**
 * 成就判定规则接口
 * check 返回当前进度数值，engine 会与 target_value 比较
 */
export interface AchievementRule {
    id: string;
    check: (userId: string, currentLog: Log, history?: Log[]) => Promise<number>;
}

// ===== 辅助函数 =====

/**
 * 计算当前连续记录天数（streak）
 * 从今天/昨天开始倒推，如果有一天缺失就中断
 */
const calcStreak = (history: Log[]): number => {
    if (!history || history.length === 0) return 0;
    const dates = [...new Set(history.map(l => new Date(l.date).toDateString()))]
        .map(d => new Date(d).getTime())
        .sort((a, b) => b - a);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const todayMs = new Date(new Date().toDateString()).getTime();
    // 最近记录必须是今天或昨天
    if (dates[0] < todayMs - oneDayMs) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        if (dates[i - 1] - dates[i] === oneDayMs) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

/**
 * 计算指定日期当天的记录数
 */
const countToday = (history: Log[]): number => {
    if (!history) return 0;
    const today = new Date().toDateString();
    return history.filter(l => new Date(l.date).toDateString() === today).length;
};

/**
 * 检查上次记录距今是否超过 N 天（用于"久旱逢甘霖"类型成就）
 */
const daysSinceLastRecord = (history: Log[], currentLog: Log): number => {
    if (!history || history.length <= 1) return 999;
    // NOTE: 按时间排序，找到当前记录之前的最后一条
    const sorted = history
        .filter(l => l.id !== currentLog.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length === 0) return 999;
    const lastDate = new Date(sorted[0].date);
    const currentDate = new Date(currentLog.date);
    return (currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
};

export const achievementRules: AchievementRule[] = [
    // ===== 🕐 时间类（12 个）=====
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
        id: 'lunch_break',
        check: async (_, log) => {
            const d = new Date(log.date);
            const minuteOfDay = d.getHours() * 60 + d.getMinutes();
            // 11:30 = 690, 13:30 = 810
            return (minuteOfDay >= 690 && minuteOfDay <= 810) ? 1 : 0;
        }
    },
    {
        id: 'rush_hour',
        check: async (_, log) => {
            const hour = new Date(log.date).getHours();
            return (hour >= 7 && hour < 9) ? 1 : 0;
        }
    },
    {
        id: 'teatime',
        check: async (_, log) => {
            const hour = new Date(log.date).getHours();
            return (hour >= 15 && hour < 16) ? 1 : 0;
        }
    },
    {
        id: 'weekend_warrior',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => {
                const day = new Date(l.date).getDay();
                return day === 0 || day === 6;
            }).length;
        }
    },
    {
        id: 'monday_blues',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => new Date(l.date).getDay() === 1).length;
        }
    },
    {
        id: 'new_year_drop',
        check: async (_, log) => {
            const d = new Date(log.date);
            return (d.getMonth() === 0 && d.getDate() === 1) ? 1 : 0;
        }
    },
    {
        id: 'double_eleven',
        check: async (_, log) => {
            const d = new Date(log.date);
            return (d.getMonth() === 10 && d.getDate() === 11) ? 1 : 0;
        }
    },
    {
        id: 'valentine',
        check: async (_, log) => {
            const d = new Date(log.date);
            return (d.getMonth() === 1 && d.getDate() === 14) ? 1 : 0;
        }
    },
    {
        id: 'christmas_gift',
        check: async (_, log) => {
            const d = new Date(log.date);
            return (d.getMonth() === 11 && d.getDate() === 25) ? 1 : 0;
        }
    },
    {
        id: 'april_fools',
        check: async (_, log) => {
            const d = new Date(log.date);
            return (d.getMonth() === 3 && d.getDate() === 1) ? 1 : 0;
        }
    },

    // ===== ⏱️ 时长/速度类（12 个）=====
    {
        id: 'thinker',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.durationSeconds > 300).length;
        }
    },
    {
        // 🎮 糖豆人：速通者（30-60 秒，与 flash 的 <30s 不重叠）
        id: 'fall_bean',
        check: async (_, log) => {
            return (log.durationSeconds >= 30 && log.durationSeconds < 60) ? 1 : 0;
        }
    },
    {
        id: 'flash',
        check: async (_, log) => {
            return (log.durationSeconds > 0 && log.durationSeconds < 30) ? 1 : 0;
        }
    },
    {
        // 🎮 空洞骑士：苦痛之路
        id: 'path_of_pain',
        check: async (_, log) => {
            return log.durationSeconds >= 900 ? 1 : 0;
        }
    },
    {
        id: 'philosopher',
        check: async (_, log) => {
            return log.durationSeconds >= 1800 ? 1 : 0;
        }
    },
    {
        id: 'speed_demon',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.speed === 'sonic').length;
        }
    },
    {
        id: 'slow_life',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.speed === 'slow').length;
        }
    },
    {
        // 🎮 糖豆人：六边形战士
        id: 'hex_a_gone',
        check: async (_, log) => {
            return (log.speed === 'normal' && log.amount === 'medium' && log.bristolType === 4) ? 1 : 0;
        }
    },
    {
        id: 'consistent_timer',
        check: async (_, __, history) => {
            if (!history || history.length < 3) return 0;
            // 按时间降序取最近 3 条
            const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const last3 = sorted.slice(0, 3);
            const durations = last3.map(l => l.durationSeconds);
            const maxDiff = Math.max(...durations) - Math.min(...durations);
            return maxDiff < 30 ? 1 : 0;
        }
    },
    {
        id: 'sonic_trio',
        check: async (_, __, history) => {
            if (!history || history.length < 3) return 0;
            const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const last3 = sorted.slice(0, 3);
            return last3.every(l => l.speed === 'sonic') ? 1 : 0;
        }
    },
    {
        id: 'two_minute_master',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.durationSeconds >= 60 && l.durationSeconds <= 120).length;
        }
    },
    {
        id: 'endurance_king',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.durationSeconds >= 600).length;
        }
    },

    // ===== 💩 Bristol 收集类（8 个）=====
    {
        id: 'bristol_king',
        check: async (_, __, history) => {
            if (!history) return 0;
            return new Set(history.map(l => l.bristolType)).size;
        }
    },
    {
        // 🎮 星露谷：铱星品质
        id: 'iridium_quality',
        check: async (_, log) => log.bristolType === 4 ? 1 : 0
    },
    {
        id: 'banana_fan',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.bristolType === 4).length;
        }
    },
    {
        id: 'rock_solid',
        check: async (_, log) => log.bristolType === 1 ? 1 : 0
    },
    {
        // 🎮 糖豆人：水涨爬高
        id: 'slime_climb',
        check: async (_, log) => log.bristolType === 7 ? 1 : 0
    },
    {
        id: 'soft_serve',
        check: async (_, log) => log.bristolType === 6 ? 1 : 0
    },
    {
        id: 'healthy_streak',
        check: async (_, __, history) => {
            if (!history || history.length < 5) return 0;
            const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const last5 = sorted.slice(0, 5);
            const allHealthy = last5.every(l => l.bristolType >= 3 && l.bristolType <= 5);
            return allHealthy ? 5 : 0;
        }
    },
    {
        id: 'extreme_collector',
        check: async (_, __, history) => {
            if (!history) return 0;
            const types = new Set(history.map(l => l.bristolType));
            return (types.has(1) && types.has(7)) ? 1 : 0;
        }
    },

    // ===== 🎨 颜色收集类（8 个）=====
    {
        id: 'color_collector',
        check: async (_, __, history) => {
            if (!history) return 0;
            return new Set(history.map(l => l.color)).size;
        }
    },
    {
        id: 'rainbow_master',
        check: async (_, __, history) => {
            if (!history) return 0;
            return new Set(history.map(l => l.color)).size;
        }
    },
    {
        // 🎮 星露谷：黄金南瓜
        id: 'golden_pumpkin',
        check: async (_, log) => log.color === 'golden' ? 1 : 0
    },
    {
        id: 'code_red',
        check: async (_, log) => log.color === 'red' ? 1 : 0
    },
    {
        // 🎮 空洞骑士：虚空之心
        id: 'void_heart',
        check: async (_, log) => log.color === 'black' ? 1 : 0
    },
    {
        id: 'green_goblin',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.color === 'green').length;
        }
    },
    {
        id: 'fifty_shades',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.color === 'brown').length;
        }
    },
    {
        id: 'pale_rider',
        check: async (_, log) => log.color === 'pale' ? 1 : 0
    },

    // ===== 😈 心情类（10 个）=====
    {
        id: 'zen_master',
        check: async (_, log) => (log.mood === 'zen' && log.durationSeconds > 300) ? 1 : 0
    },
    {
        id: 'nuclear_blast',
        check: async (_, log) => log.mood === 'nuclear' ? 1 : 0
    },
    {
        id: 'spicy_lover',
        check: async (_, log) => (log.mood === 'spicy' && log.bristolType <= 3) ? 1 : 0
    },
    {
        id: 'mood_collector',
        check: async (_, __, history) => {
            if (!history) return 0;
            return new Set(history.map(l => l.mood)).size;
        }
    },
    {
        id: 'mood_master',
        check: async (_, __, history) => {
            if (!history) return 0;
            return new Set(history.map(l => l.mood)).size;
        }
    },
    {
        id: 'happy_camper',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.mood === 'happy').length;
        }
    },
    {
        id: 'struggle_bus',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.mood === 'struggle').length;
        }
    },
    {
        id: 'pain_veteran',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.mood === 'pain').length;
        }
    },
    {
        id: 'classic_man',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.mood === 'classic').length;
        }
    },
    {
        // 🎮 以撒：圣水
        id: 'holy_water',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.filter(l => l.mood === 'spray').length;
        }
    },

    // ===== 📊 里程碑类（10 个）=====
    {
        id: 'fiber_freak',
        check: async (_, __, history) => {
            if (!history) return 0;
            return Math.min(calcStreak(history), 3);
        }
    },
    {
        // 🎮 糖豆人：达标啦！
        id: 'qualified',
        check: async (_, __, history) => {
            if (!history) return 0;
            return history.length >= 1 ? 1 : 0;
        }
    },
    {
        id: 'ten_timer',
        check: async (_, __, history) => history?.length || 0
    },
    {
        id: 'half_century',
        check: async (_, __, history) => history?.length || 0
    },
    {
        // 🎮 杀戮尖塔：腐化之心
        id: 'heart_kill',
        check: async (_, __, history) => history?.length || 0
    },
    {
        id: 'grand_master',
        check: async (_, __, history) => history?.length || 0
    },
    {
        // 🎮 杀戮尖塔：攀登者
        id: 'ascension_20',
        check: async (_, __, history) => {
            if (!history) return 0;
            return Math.min(calcStreak(history), 7);
        }
    },
    {
        id: 'monthly_iron',
        check: async (_, __, history) => {
            if (!history) return 0;
            return Math.min(calcStreak(history), 30);
        }
    },
    {
        // 🎮 糖豆人：最佳拍档
        id: 'team_round',
        check: async (_, __, history) => {
            return countToday(history || []) >= 2 ? 1 : 0;
        }
    },
    {
        id: 'triple_threat',
        check: async (_, __, history) => {
            return countToday(history || []) >= 3 ? 1 : 0;
        }
    },

    // ===== 🏆 隐藏/组合类（5 个）=====
    {
        id: 'ghost_poop',
        check: async (_, log) => {
            return (log.bristolType === 4 && log.mood === 'ghost' && log.speed === 'sonic') ? 1 : 0;
        }
    },
    {
        id: 'perfect_run',
        check: async (_, log) => {
            return (
                log.bristolType === 4 &&
                log.color === 'brown' &&
                log.mood === 'happy' &&
                log.amount === 'medium' &&
                log.speed === 'normal'
            ) ? 1 : 0;
        }
    },
    {
        // 🎮 丝之歌：苦苦等待终于拉出来了（必须至少有 2 条历史记录才算）
        id: 'lucky_dog',
        check: async (_, log, history) => {
            // NOTE: 至少要有 2 条记录，否则第一条记录会误判
            if (!history || history.length < 2) return 0;
            const gap = daysSinceLastRecord(history, log);
            return gap >= 2 ? 1 : 0;
        }
    },
    {
        // 🎮 以撒：妈妈的炸弹
        id: 'mega_blast',
        check: async (_, log) => {
            return (
                log.mood === 'nuclear' &&
                log.amount === 'high' &&
                log.speed === 'sonic' &&
                log.bristolType === 7
            ) ? 1 : 0;
        }
    },
    {
        // 🎮 糖豆人：抓握皇冠
        id: 'crown_grabber',
        check: async (_, __, history) => {
            if (!history) return 0;
            return Math.min(calcStreak(history), 5);
        }
    },
    {
        id: 'achievement_hunter',
        // NOTE: 这条规则需要特殊处理——检查已解锁成就数
        // engine 会自动将返回值与 target_value 比较
        check: async (userId, _, __) => {
            try {
                const { achievementService } = await import('../services/achievement.service');
                const userAchs = await achievementService.getUserAchievements(userId);
                return userAchs.filter((a: any) => a.unlocked_at).length;
            } catch {
                return 0;
            }
        }
    },
];
