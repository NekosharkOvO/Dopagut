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
    {
        id: 'early_bird',
        title_zh: '早起鸟',
        title_en: 'Early Bird',
        description_zh: '在清晨 5:00 - 7:00 之间完成记录。',
        description_en: 'Record between 5:00 - 7:00 AM.',
        icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDVE58ckV9bbBOpVKkfO0SMsEo-kGJ80YRFuvBwSHtumZu1MuqtSEF1N1KZpNwXOHmqy_OWT2Rm4AaM1PNZ7Q_CVUEzov03lMNYNlwjKhiNWcfDdDSvHfYjWFm3XyVRECElIbKKcs_KVO2AgumQtAetSMlnGefRUovdmAD9nAY4-t2p8-SiPP4KStEvF0vdKYG0xT7-k2D1FV8EIBad-vdm22oCmBvvh03urWjYV-IymH-YEBpyxqMxyyBVDSFGgy9fXpoFlQOUkY',
        rarity: 'common',
        categories: ['daily', 'time'],
        target_value: 1,
        bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'midnight_owl',
        title_zh: '深夜幽灵',
        title_en: 'Midnight Owl',
        description_zh: '在凌晨 00:00 - 04:00 之间完成记录。',
        description_en: 'Record between 00:00 - 04:00 AM.',
        icon: '🦉',
        rarity: 'rare',
        categories: ['daily', 'time'],
        target_value: 1,
        bg_theme: 'bg-black'
    },
    {
        id: 'thinker',
        title_zh: '思想者',
        title_en: 'Thinker',
        description_zh: '单次会话超过 5 分钟。',
        description_en: 'Session over 5 minutes.',
        icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXK7jsL_s6yy9T3yA-dJl3eZlhbV4sBtJ55buAQIjzFHPfL71MDWr6ccJ-pAYCLsnF9irlked5Hx8IRwMuLsppMoxqYeTqP7ROhr27IPWbQmtI6hLQNUgQy_7Y-55rrqp_r5n8gyvdBQMrYjIJ95CZZyrKVFBW-QCe0L_z6XWoLjQXRy3yLhGwdKH4Uvr1OkBAHkdIXijLughZIVtnCQAlHNyI5mGGVI9lxhvSck1fFXro6F_Yi1nsN7XmPk0MuckylrVKqqxwvQ0',
        rarity: 'rare',
        categories: ['stat'],
        target_value: 5,
        bg_theme: 'bg-dopa-blue'
    },
    {
        id: 'sprinter',
        title_zh: '冲刺手',
        title_en: 'Sprinter',
        description_zh: '在 60 秒内神速完成一次记录。',
        description_en: 'Finish a record within 60 seconds.',
        icon: '⚡',
        rarity: 'common',
        categories: ['stat'],
        target_value: 1,
        bg_theme: 'bg-dopa-pink'
    },
    {
        id: 'fiber_freak',
        title_zh: '纤维狂人',
        title_en: 'Fiber Freak',
        description_zh: '连续 3 天保持排便记录。',
        description_en: 'Consistent drops for 3 consecutive days.',
        icon: '🥦',
        rarity: 'common',
        categories: ['daily'],
        target_value: 3,
        bg_theme: 'bg-dopa-cyan'
    },
    {
        id: 'bristol_king',
        title_zh: '布氏大满贯',
        title_en: 'Bristol King',
        description_zh: '解锁全部 7 种 Bristol 类型。',
        description_en: 'Collect all 7 Bristol types.',
        icon: '👑',
        rarity: 'legendary',
        categories: ['collection', 'special'],
        target_value: 7,
        bg_theme: 'bg-dopa-purple'
    },
    {
        id: 'color_collector',
        title_zh: '色彩收藏家',
        title_en: 'Color Collector',
        description_zh: '累计记录过 4 种不同的颜色。',
        description_en: 'Collect 4 different poop colors.',
        icon: '🎨',
        rarity: 'rare',
        categories: ['collection', 'special'],
        target_value: 4,
        bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'zen_master',
        title_zh: '禅定大师',
        title_en: 'Zen Master',
        description_zh: '心情禅定且时长超过 5 分钟。',
        description_en: 'Mood Zen and duration over 5 minutes.',
        icon: '🧘',
        rarity: 'rare',
        categories: ['vibe', 'special'],
        target_value: 1,
        bg_theme: 'bg-dopa-lime'
    },
    {
        id: 'nuclear_blast',
        title_zh: '核爆现场',
        title_en: 'Nuclear Blast',
        description_zh: '正如其名，这是一场核爆。',
        description_en: 'As the name suggests, it is a nuclear explosion.',
        icon: '☢️',
        rarity: 'common',
        categories: ['vibe'],
        target_value: 1,
        bg_theme: 'bg-dopa-orange'
    },
    {
        id: 'spicy_lover',
        title_zh: '辣味爱好者',
        title_en: 'Spicy Lover',
        description_zh: '心情火辣辣，且 Bristol 类型偏硬。',
        description_en: 'Spicy mood and hard Bristol type.',
        icon: '🔥',
        rarity: 'common',
        categories: ['vibe'],
        target_value: 1,
        bg_theme: 'bg-dopa-yellow'
    },
    {
        id: 'ghost_poop',
        title_zh: '幽灵便便',
        title_en: 'Ghost Poop',
        description_zh: '在冲水之前它就消失了。',
        description_en: 'It vanishes before you even flush.',
        icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AfAYUODO9MDf16GRPiKBeYJVslZgbcJ_BknK6sYg9GzhYyEuCumNEigY7jml5faAPAHj1YFuviVEgxb2PNHP1bEjcpBVy7ZkhTCUCHFB6hraKn_0s6WezaoFttTS0o-FqUV9z33AgdSRP3uMWa0nOnNU2nw-mzEdL-0cXRWZLbAF6h8osK6mgkrYjEMciHYrV-odXYIETBApeuqzqc9Jv6lBj3AkU05GwqIir0A4dtsagq1qGMd2FjXLXGIIx2NKrKH0MWAv8C4',
        rarity: 'legendary',
        categories: ['hidden'],
        target_value: 1,
        bg_theme: 'bg-dopa-purple'
    }
];
