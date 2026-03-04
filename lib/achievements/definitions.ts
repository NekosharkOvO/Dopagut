export interface AchievementDefinition {
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

export const achievementDefinitions: AchievementDefinition[] = [
    // ===== 🕐 时间类（12 个）=====
    {
        id: 'early_bird',
        title_zh: '早起鸟', title_en: 'Early Bird',
        description_zh: '在清晨 5:00-7:00 之间完成记录。',
        description_en: 'Record between 5:00-7:00 AM.',
        icon: '🐦', rarity: 'common', categories: ['time', 'daily'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'midnight_owl',
        title_zh: '深夜幽灵', title_en: 'Midnight Owl',
        description_zh: '在凌晨 0:00-4:00 之间完成记录。',
        description_en: 'Record between 0:00-4:00 AM.',
        icon: '🦉', rarity: 'rare', categories: ['time', 'daily'], target_value: 1, bg_theme: 'bg-black'
    },
    {
        id: 'lunch_break',
        title_zh: '午间摸鱼', title_en: 'Lunch Break',
        description_zh: '在 11:30-13:30 之间摸鱼投弹。',
        description_en: 'Sneak a drop during lunch break (11:30-13:30).',
        icon: '🍱', rarity: 'common', categories: ['time', 'daily'], target_value: 1, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'rush_hour',
        title_zh: '早高峰战士', title_en: 'Rush Hour',
        description_zh: '在早高峰 7:00-9:00 之间完成记录。',
        description_en: 'Record during rush hour (7:00-9:00 AM).',
        icon: '🚇', rarity: 'common', categories: ['time', 'daily'], target_value: 1, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'teatime',
        title_zh: '下午茶时光', title_en: 'Teatime',
        description_zh: '在 15:00-16:00 之间完成记录。',
        description_en: 'Record during teatime (15:00-16:00).',
        icon: '🍵', rarity: 'common', categories: ['time'], target_value: 1, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'weekend_warrior',
        title_zh: '周末战士', title_en: 'Weekend Warrior',
        description_zh: '在周末累计记录 5 次。',
        description_en: 'Record 5 times on weekends.',
        icon: '🏖️', rarity: 'rare', categories: ['time', 'stat'], target_value: 5, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'monday_blues',
        title_zh: '周一综合症', title_en: 'Monday Blues',
        description_zh: '周一累计记录 3 次。',
        description_en: 'Record 3 times on Mondays.',
        icon: '😩', rarity: 'rare', categories: ['time', 'stat'], target_value: 3, bg_theme: 'bg-dopa-blue'
    },
    {
        id: 'new_year_drop',
        title_zh: '跨年之💩', title_en: 'New Year Drop',
        description_zh: '在 1 月 1 日完成记录。',
        description_en: 'Record on January 1st.',
        icon: '🎆', rarity: 'legendary', categories: ['time', 'special'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'double_eleven',
        title_zh: '双十一', title_en: '11.11 Drop',
        description_zh: '在 11 月 11 日完成记录。',
        description_en: 'Record on November 11th.',
        icon: '🛒', rarity: 'rare', categories: ['time', 'special'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'valentine',
        title_zh: '有情人', title_en: 'Valentine Dump',
        description_zh: '在 2 月 14 日完成记录。',
        description_en: 'Record on Valentine\'s Day.',
        icon: '💕', rarity: 'rare', categories: ['time', 'special'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'christmas_gift',
        title_zh: '圣诞礼物', title_en: 'Christmas Gift',
        description_zh: '在 12 月 25 日完成记录。',
        description_en: 'Record on Christmas Day.',
        icon: '🎄', rarity: 'rare', categories: ['time', 'special'], target_value: 1, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'april_fools',
        title_zh: '愚人节玩笑', title_en: 'April Fools',
        description_zh: '在 4 月 1 日完成记录。',
        description_en: 'Record on April Fools\' Day.',
        icon: '🃏', rarity: 'rare', categories: ['time', 'hidden'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },

    // ===== ⏱️ 时长/速度类（12 个）=====
    {
        id: 'thinker',
        title_zh: '思想者', title_en: 'Thinker',
        description_zh: '累计 5 次单次会话超过 5 分钟。',
        description_en: '5 sessions over 5 minutes.',
        icon: '🤔', rarity: 'rare', categories: ['stat'], target_value: 5, bg_theme: 'bg-dopa-blue'
    },
    // 🎮 糖豆人：豆子在终点线摔倒
    {
        id: 'fall_bean',
        title_zh: '速通者', title_en: 'Speedrunner',
        description_zh: '在 30-60 秒内解决战斗！',
        description_en: 'Finish within 30-60 seconds!',
        icon: '🫘', rarity: 'common', categories: ['stat'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'flash',
        title_zh: '闪电侠', title_en: 'The Flash',
        description_zh: '30 秒内闪电完成。',
        description_en: 'Finish within 30 seconds.',
        icon: '⚡', rarity: 'rare', categories: ['stat'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },
    // 🎮 空洞骑士：最难的隐藏跑酷关卡
    {
        id: 'path_of_pain',
        title_zh: '苦痛之路', title_en: 'Path of Pain',
        description_zh: '在马桶上坐了整整 15 分钟……',
        description_en: 'You sat for 15 full minutes...',
        icon: '💀', rarity: 'rare', categories: ['stat', 'special'], target_value: 1, bg_theme: 'bg-black'
    },
    {
        id: 'philosopher',
        title_zh: '哲学家', title_en: 'Philosopher',
        description_zh: '单次超 30 分钟，你在思考人生。',
        description_en: 'Over 30 minutes. Deep thoughts.',
        icon: '📖', rarity: 'legendary', categories: ['stat', 'special'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'speed_demon',
        title_zh: '极速恶魔', title_en: 'Speed Demon',
        description_zh: '累计 5 次 sonic 速度。',
        description_en: '5 sonic speed records.',
        icon: '👹', rarity: 'rare', categories: ['stat'], target_value: 5, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'slow_life',
        title_zh: '慢生活主义', title_en: 'Slow Life',
        description_zh: '累计 5 次 slow 速度。',
        description_en: '5 slow speed records.',
        icon: '🐌', rarity: 'rare', categories: ['stat'], target_value: 5, bg_theme: 'bg-dopa-lime'
    },
    // 🎮 糖豆人：Hex-A-Gone 精准踩格子
    {
        id: 'hex_a_gone',
        title_zh: '六边形战士', title_en: 'Hex-A-Gone',
        description_zh: '速度适中 + 产量适中 + Bristol 4，完美平衡。',
        description_en: 'Normal speed + medium amount + Bristol 4. Balance.',
        icon: '🔷', rarity: 'rare', categories: ['stat', 'special'], target_value: 1, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'consistent_timer',
        title_zh: '精准打卡', title_en: 'Consistent Timer',
        description_zh: '连续 3 次时长差异小于 30 秒。',
        description_en: '3 consecutive records within 30s of each other.',
        icon: '⏰', rarity: 'legendary', categories: ['stat', 'hidden'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'sonic_trio',
        title_zh: '音速三连', title_en: 'Sonic Trio',
        description_zh: '连续 3 次速度为 sonic。',
        description_en: '3 consecutive sonic speed records.',
        icon: '🏎️', rarity: 'rare', categories: ['stat'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'two_minute_master',
        title_zh: '两分钟大师', title_en: '2-Min Master',
        description_zh: '累计 10 次在 1-2 分钟内完成。',
        description_en: '10 records between 1-2 minutes.',
        icon: '✌️', rarity: 'common', categories: ['stat'], target_value: 10, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'endurance_king',
        title_zh: '耐力之王', title_en: 'Endurance King',
        description_zh: '累计 3 次超过 10 分钟。',
        description_en: '3 records over 10 minutes.',
        icon: '🏋️', rarity: 'common', categories: ['stat'], target_value: 3, bg_theme: 'bg-dopa-orange'
    },

    // ===== 💩 Bristol 收集类（8 个）=====
    {
        id: 'bristol_king',
        title_zh: '布氏大满贯', title_en: 'Bristol King',
        description_zh: '集齐全部 7 种 Bristol 类型。',
        description_en: 'Collect all 7 Bristol types.',
        icon: '👑', rarity: 'legendary', categories: ['collection', 'special'], target_value: 7, bg_theme: 'bg-dopa-purple'
    },
    // 🎮 星露谷：铱星品质是作物最高品质
    {
        id: 'iridium_quality',
        title_zh: '铱星！', title_en: 'Iridium Quality',
        description_zh: 'Bristol 4——完美的香蕉形态 ⭐',
        description_en: 'Bristol 4 — Perfect banana form ⭐',
        icon: '⭐', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'banana_fan',
        title_zh: '香蕉狂热', title_en: 'Banana Fan',
        description_zh: '累计 10 次 Bristol 4。',
        description_en: '10 Bristol type 4 records.',
        icon: '🍌', rarity: 'common', categories: ['collection', 'stat'], target_value: 10, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'rock_solid',
        title_zh: '硬核选手', title_en: 'Rock Solid',
        description_zh: 'Bristol 1——坚如磐石。',
        description_en: 'Bristol 1 — Hard as rock.',
        icon: '🪨', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-gray-400'
    },
    // 🎮 糖豆人：经典淘汰关 Slime Climb
    {
        id: 'slime_climb',
        title_zh: '水涨爬高', title_en: 'Slime Climb',
        description_zh: '水状来袭，小心脚下！',
        description_en: 'Watery tide incoming! Watch your step!',
        icon: '🟢', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'soft_serve',
        title_zh: '冰淇淋机', title_en: 'Soft Serve',
        description_zh: 'Bristol 6——糊状，但不失优雅。',
        description_en: 'Bristol 6 — Mushy but graceful.',
        icon: '🍦', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'healthy_streak',
        title_zh: '健康连击', title_en: 'Healthy Streak',
        description_zh: '连续 5 次 Bristol 3/4/5（健康范围）。',
        description_en: '5 consecutive Bristol 3/4/5 (healthy range).',
        icon: '💚', rarity: 'rare', categories: ['collection', 'stat'], target_value: 5, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'extreme_collector',
        title_zh: '两极分化', title_en: 'Extreme Collector',
        description_zh: '同时拥有 Bristol 1 和 7 的记录。',
        description_en: 'Have both Bristol 1 and 7 in history.',
        icon: '🔀', rarity: 'rare', categories: ['collection', 'hidden'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },

    // ===== 🎨 颜色收集类（8 个）=====
    {
        id: 'color_collector',
        title_zh: '色彩收藏家', title_en: 'Color Collector',
        description_zh: '累计记录过 4 种不同的颜色。',
        description_en: 'Collect 4 different colors.',
        icon: '🎨', rarity: 'rare', categories: ['collection'], target_value: 4, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'rainbow_master',
        title_zh: '彩虹大师', title_en: 'Rainbow Master',
        description_zh: '集齐全部 7 种颜色。',
        description_en: 'Collect all 7 colors.',
        icon: '🌈', rarity: 'legendary', categories: ['collection', 'special'], target_value: 7, bg_theme: 'bg-dopa-purple'
    },
    // 🎮 星露谷：灵魂节限定道具
    {
        id: 'golden_pumpkin',
        title_zh: '黄金南瓜', title_en: 'Golden Pumpkin',
        description_zh: '黄金色——灵魂之夜的稀有奖品。',
        description_en: 'Golden — A rare Spirit\'s Eve prize.',
        icon: '🎃', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'code_red',
        title_zh: '红色警报', title_en: 'Code Red',
        description_zh: '记录一次 red，请注意健康。',
        description_en: 'Record a red. Please monitor your health.',
        icon: '🚨', rarity: 'rare', categories: ['collection'], target_value: 1, bg_theme: 'bg-dopa-pink'
    },
    // 🎮 空洞骑士：Void Heart 是关键剧情道具
    {
        id: 'void_heart',
        title_zh: '虚空之心', title_en: 'Void Heart',
        description_zh: '黑色……来自深渊最深处。',
        description_en: 'Black... from the deepest abyss.',
        icon: '🖤', rarity: 'common', categories: ['collection'], target_value: 1, bg_theme: 'bg-black'
    },
    {
        id: 'green_goblin',
        title_zh: '绿巨人', title_en: 'Green Goblin',
        description_zh: '累计 3 次 green 颜色。',
        description_en: '3 green color records.',
        icon: '🥬', rarity: 'common', categories: ['collection'], target_value: 3, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'fifty_shades',
        title_zh: '五十度棕', title_en: '50 Shades of Brown',
        description_zh: '累计 20 次 brown 颜色。',
        description_en: '20 brown color records.',
        icon: '🟤', rarity: 'common', categories: ['collection', 'stat'], target_value: 20, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'pale_rider',
        title_zh: '苍白骑士', title_en: 'Pale Rider',
        description_zh: '记录一次 pale 颜色。',
        description_en: 'Record a pale color.',
        icon: '🦴', rarity: 'rare', categories: ['collection'], target_value: 1, bg_theme: 'bg-gray-400'
    },

    // ===== 😈 心情类（10 个）=====
    {
        id: 'zen_master',
        title_zh: '禅定大师', title_en: 'Zen Master',
        description_zh: '心情禅定且时长超过 5 分钟。',
        description_en: 'Mood Zen and duration over 5 minutes.',
        icon: '🧘', rarity: 'rare', categories: ['vibe', 'special'], target_value: 1, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'nuclear_blast',
        title_zh: '核爆现场', title_en: 'Nuclear Blast',
        description_zh: '正如其名，这是一场核爆。',
        description_en: 'As the name suggests, a nuclear explosion.',
        icon: '☢️', rarity: 'common', categories: ['vibe'], target_value: 1, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'spicy_lover',
        title_zh: '辣味爱好者', title_en: 'Spicy Lover',
        description_zh: '心情火辣辣，且 Bristol 类型偏硬。',
        description_en: 'Spicy mood and hard Bristol type.',
        icon: '🔥', rarity: 'common', categories: ['vibe'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'mood_collector',
        title_zh: '情绪收藏家', title_en: 'Mood Collector',
        description_zh: '集齐 7 种不同心情。',
        description_en: 'Collect 7 different moods.',
        icon: '🎭', rarity: 'rare', categories: ['vibe', 'collection'], target_value: 7, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'mood_master',
        title_zh: '情绪大师', title_en: 'Mood Master',
        description_zh: '集齐全部 10 种心情。',
        description_en: 'Collect all 10 moods.',
        icon: '🃏', rarity: 'legendary', categories: ['vibe', 'collection'], target_value: 10, bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'happy_camper',
        title_zh: '快乐露营者', title_en: 'Happy Camper',
        description_zh: '累计 5 次 happy 心情。',
        description_en: '5 happy mood records.',
        icon: '😊', rarity: 'common', categories: ['vibe'], target_value: 5, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'struggle_bus',
        title_zh: '痛苦面具', title_en: 'Struggle Bus',
        description_zh: '累计 3 次 struggle 心情。',
        description_en: '3 struggle mood records.',
        icon: '😤', rarity: 'common', categories: ['vibe'], target_value: 3, bg_theme: 'bg-gray-400'
    },
    {
        id: 'pain_veteran',
        title_zh: '久经沙场', title_en: 'Pain Veteran',
        description_zh: '累计 5 次 pain 心情。',
        description_en: '5 pain mood records.',
        icon: '😖', rarity: 'rare', categories: ['vibe'], target_value: 5, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'classic_man',
        title_zh: '经典老炮', title_en: 'Classic Man',
        description_zh: '累计 10 次 classic 心情。',
        description_en: '10 classic mood records.',
        icon: '💩', rarity: 'common', categories: ['vibe', 'stat'], target_value: 10, bg_theme: 'bg-dopa-purple'
    },
    // 🎮 以撒：Holy Water 道具
    {
        id: 'holy_water',
        title_zh: '圣水', title_en: 'Holy Water',
        description_zh: '累计 3 次 spray 心情。',
        description_en: '3 spray mood records.',
        icon: '💧', rarity: 'common', categories: ['vibe'], target_value: 3, bg_theme: 'bg-dopa-blue'
    },

    // ===== 📊 里程碑类（10 个）=====
    {
        id: 'fiber_freak',
        title_zh: '纤维狂人', title_en: 'Fiber Freak',
        description_zh: '连续 3 天保持排便记录。',
        description_en: 'Consistent drops for 3 consecutive days.',
        icon: '🥦', rarity: 'common', categories: ['daily', 'stat'], target_value: 3, bg_theme: 'bg-dopa-cyan'
    },
    // 🎮 糖豆人：每局通过的 "QUALIFIED!"
    {
        id: 'qualified',
        title_zh: '达标啦！', title_en: 'Qualified!',
        description_zh: '恭喜，你成功投下了第一颗💩',
        description_en: 'Congrats! You made your first drop 💩',
        icon: '✅', rarity: 'common', categories: ['stat'], target_value: 1, bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'ten_timer',
        title_zh: '十全十美', title_en: 'Ten Timer',
        description_zh: '累计 10 次记录。',
        description_en: '10 total records.',
        icon: '🔟', rarity: 'common', categories: ['stat'], target_value: 10, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'half_century',
        title_zh: '半百之路', title_en: 'Half Century',
        description_zh: '累计 50 次记录。',
        description_en: '50 total records.',
        icon: '🏅', rarity: 'rare', categories: ['stat'], target_value: 50, bg_theme: 'bg-dopa-yellow'
    },
    // 🎮 杀戮尖塔：击败第四幕 Boss
    {
        id: 'heart_kill',
        title_zh: '腐化之心', title_en: 'Heart Kill',
        description_zh: '累计 100 次记录——你击败了最终 Boss。',
        description_en: '100 total records — You defeated the final boss.',
        icon: '❤️‍🔥', rarity: 'legendary', categories: ['stat', 'special'], target_value: 100, bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'grand_master',
        title_zh: '大师之路', title_en: 'Grand Master',
        description_zh: '累计 500 次记录。',
        description_en: '500 total records.',
        icon: '🏆', rarity: 'legendary', categories: ['stat', 'special'], target_value: 500, bg_theme: 'bg-dopa-purple'
    },
    // 🎮 杀戮尖塔：最高难度 Ascension 20
    {
        id: 'ascension_20',
        title_zh: '攀登者Lv.20', title_en: 'Ascension 20',
        description_zh: '连续 7 天有记录——每天都在攀升。',
        description_en: '7 consecutive days with records.',
        icon: '⬆️', rarity: 'rare', categories: ['daily', 'stat'], target_value: 7, bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'monthly_iron',
        title_zh: '铁人月卡', title_en: 'Monthly Iron',
        description_zh: '连续 30 天有记录。',
        description_en: '30 consecutive days with records.',
        icon: '🔥', rarity: 'legendary', categories: ['daily', 'stat'], target_value: 30, bg_theme: 'bg-dopa-orange'
    },
    // 🎮 糖豆人：团队赛需要频繁出场
    {
        id: 'team_round',
        title_zh: '最佳拍档', title_en: 'DUOS!',
        description_zh: '同一天记录 2 次以上。',
        description_en: 'Record more than twice in one day.',
        icon: '🤝', rarity: 'common', categories: ['daily'], target_value: 1, bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'triple_threat',
        title_zh: '帽子戏法', title_en: 'Triple Threat',
        description_zh: '同一天记录 3 次以上。',
        description_en: 'Record more than 3 times in one day.',
        icon: '🎩', rarity: 'rare', categories: ['daily', 'stat'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },

    // ===== 🏆 隐藏/组合类（5 个）=====
    {
        id: 'ghost_poop',
        title_zh: '幽灵便便', title_en: 'Ghost Poop',
        description_zh: '在冲水之前它就消失了。',
        description_en: 'It vanishes before you even flush.',
        icon: '👻', rarity: 'legendary', categories: ['hidden'], target_value: 1, bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'perfect_run',
        title_zh: '完美一投', title_en: 'Perfect Run',
        description_zh: 'Bristol 4 + brown + happy + medium + normal，天选之人。',
        description_en: 'B4 + brown + happy + medium + normal. Perfection.',
        icon: '🌟', rarity: 'legendary', categories: ['hidden', 'special'], target_value: 1, bg_theme: 'bg-dopa-yellow'
    },
    // 🎮 丝之歌：苦苦等待续作终于发布的梗
    {
        id: 'lucky_dog',
        title_zh: '我真幸运', title_en: 'Lucky Dog',
        description_zh: '超过 2 天没有记录后终于拉出来了……苦尽甘来！',
        description_en: 'Finally dropped after 2+ days of nothing... Worth the wait!',
        icon: '🕸️', rarity: 'rare', categories: ['hidden'], target_value: 1, bg_theme: 'bg-black'
    },
    // 🎮 以撒：Mega Blast 道具，射出毁灭光线
    {
        id: 'mega_blast',
        title_zh: '妈妈的炸弹！', title_en: 'MEGA MAMA!',
        description_zh: 'nuclear + high + sonic + Bristol 7——毁灭一切！',
        description_en: 'Nuclear + high + sonic + B7 — Total destruction!',
        icon: '💥', rarity: 'legendary', categories: ['hidden', 'special'], target_value: 1, bg_theme: 'bg-dopa-orange'
    },
    // 🎮 糖豆人：最终回合抢皇冠
    {
        id: 'crown_grabber',
        title_zh: '抓握皇冠', title_en: 'Crown Grabber',
        description_zh: '连续 5 天每天都有记录——日日夺冠！',
        description_en: '5 consecutive days with records — Daily champion!',
        icon: '👑', rarity: 'rare', categories: ['daily', 'special'], target_value: 5, bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'achievement_hunter',
        title_zh: '成就猎人', title_en: 'Achievement Hunter',
        description_zh: '解锁 30 个成就。',
        description_en: 'Unlock 30 achievements.',
        icon: '🎯', rarity: 'rare', categories: ['special'], target_value: 30, bg_theme: 'bg-dopa-purple'
    },
];
