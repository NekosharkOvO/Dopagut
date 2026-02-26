
export interface MarqueeTemplate {
    zh: string;
    en: string;
}

export const MARQUEE_TEMPLATES = {
    // 纯搞笑/梗
    HUMOR: [
        { zh: "🌈 尝尝彩虹的味道（别真的吃）", en: "🌈 Taste the rainbow (don't srsly eat it)" },
        { zh: "💩 检测到传说级产出，系统正在由于过度兴奋而颤抖", en: "💩 Legendary drop detected. System is lowkey shakin'" },
        { zh: "🦄 肠道多巴胺正在爆表，请注意情绪管理", en: "🦄 Gut dopamine over 9000, watch urself" },
        { zh: "🍕 刚才那个披萨在内部经历了一场奇妙冒险", en: "🍕 That pizza just went on a wild internal adventure" },
        { zh: "🌌 这一条如果发向外太空，外星人也会沉默", en: "🌌 If u sent this to space, aliens would be speechless fr" }
    ],

    // 评价今日 MVP
    DAILY_MVP: [
        { zh: "🏆 今日 MVP 霸气侧漏：${score} 分！", en: "🏆 Daily MVP is serving: ${score} PTS!" },
        { zh: "🍌 今日最佳形状堪称‘肠道艺术品’：${shape}", en: "🍌 Today's best shape is straight up art: ${shape}" },
        { zh: "⚡ 今日最速达成记录：仅用时 ${duration}", en: "⚡ World record pace: Cleared in ${duration}" },
        { zh: "🌟 今日 MVP 布里斯托类型为传说中的 ${type} 型", en: "🌟 Today's MVP is a legendary Type ${type}" }
    ],

    // 评价当日所有记录
    DAILY_TOTAL: [
        { zh: "🚀 今日已累计发射 ${count} 枚重磅弹药", en: "🚀 Total missions today: ${count} drops" },
        { zh: "⏳ 今日马桶总坐禅时长已达 ${duration}", en: "⏳ Total toilet zen time today: ${duration}" },
        { zh: "📊 今日排泄曲线波动比股市还精彩", en: "📊 Today's output curve is wilder than the stock market" }
    ],

    // 排名/地位 (占位，待后续地图功能完善)
    RANKING: [
        { zh: "👑 全球排名：${rank}（地位稳如泰山）", en: "👑 Global Rank: ${rank} (U're unbeatable fr)" },
        { zh: "🏁 在本地‘瓷砖争霸赛’中排名：第 ${position} 位", en: "🏁 Rank in local 'Tile Wars': #${position}" },
        { zh: "🗺️ 地图显示：你的排泄足迹正在占领这片街区", en: "🗺️ Map update: Ur drops are lowkey takin' over the block" }
    ],

    // 评价本周情况 (新增维度)
    WEEKLY_STATS: [
        { zh: "📅 本周战况汇报：已累计打卡 ${count} 次，肠道很勤奋", en: "📅 Weekly Report: ${count} check-ins. Ur gut is workin' OT" },
        { zh: "🔥 本周最高产出日：${bestDay}（那一天你经历了什么？）", en: "🔥 Weekly Peak: ${bestDay} was wild (What did u eat?)" },
        { zh: "🕹️ 本周累计游戏时长：${duration}（腿麻了吗？）", en: "🕹️ Weekly Game Time: ${duration} (Can u still feel ur legs?)" },
        { zh: "📈 本周肠道活跃度击败了全球 ${percent}% 的用户", en: "📈 Weekly Activity: U outperformed ${percent}% of global users" }
    ]
};
