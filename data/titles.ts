export interface TitleMilestone {
    level: number;
    zh: string;
    en: string;
    emoji: string;
    required: number;
    bgTheme: string;
    textColor: string;
}

export const TITLE_MILESTONES: TitleMilestone[] = [
    { level: 0, zh: "称号之路", en: "Path of Titles", emoji: "🚽", required: 0, bgTheme: "bg-gray-100", textColor: "text-gray-500" },
    { level: 1, zh: "马桶练习生", en: "Toilet Trainee", emoji: "💩", required: 3, bgTheme: "bg-dopa-cyan", textColor: "text-dopa-blue" },
    { level: 2, zh: "瓷砖建筑师", en: "Tile Architect", emoji: "🧱", required: 8, bgTheme: "bg-dopa-lime", textColor: "text-green-700" },
    { level: 3, zh: "顺滑观测员", en: "Smooth Observer", emoji: "🔍", required: 15, bgTheme: "bg-dopa-yellow", textColor: "text-dopa-orange" },
    { level: 4, zh: "黄金喷射手", en: "Golden Sprayer", emoji: "⚡", required: 25, bgTheme: "bg-dopa-orange", textColor: "text-white" },
    { level: 5, zh: "肠道外交官", en: "Gut Diplomat", emoji: "🤝", required: 40, bgTheme: "bg-dopa-pink", textColor: "text-white" },
    { level: 6, zh: "屎上最强", en: "Poop Legend", emoji: "👑", required: 60, bgTheme: "bg-dopa-purple", textColor: "text-white" }
];
