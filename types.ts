
export enum Tab {
  Daily = 'daily',
  Achievements = 'achievements',
  Tracker = 'tracker',
  Map = 'map',
  Profile = 'profile',
}

export interface User {
  id: number;
  name: string;
  avatar: string;
  // Level is derived
  title: string; // Keep title for legacy or other badge usage
  location?: string; // New: "Country-Region"
  stats: {
    totalDrops: number;
    maxZen: number; // minutes
    beatPercentage: number;
  }
}

export interface TrackerState {
  isRunning: boolean;
  startTime: Date | null;
  endTime: Date | null;
  showModal: boolean;
  activeType: string; // Mood/Status
  poopAmount: string;
  bristolType: number;
  poopColor: string; // New: Color ID
}

export const INITIAL_TRACKER_STATE: TrackerState = {
  isRunning: false,
  startTime: null,
  endTime: null,
  showModal: false,
  activeType: 'classic',
  poopAmount: 'medium',
  bristolType: 4,
  poopColor: 'brown', // Default
};

// New Interfaces for Data Consistency
export interface Log {
  id: string;
  date: string; // ISO String (Start Time)
  durationSeconds: number;
  bristolType: number;
  shape: string; // Derived from Bristol in UI, stored for history
  color: string; // Color ID
  mood: string; // 'zen', 'struggle', etc.
  speed: string; // 'sonic', 'slow', etc.
  amount: string;
}

export type AchievementType =
  // 时间类
  | 'early_bird' | 'midnight_owl' | 'lunch_break' | 'rush_hour' | 'teatime'
  | 'weekend_warrior' | 'monday_blues' | 'new_year_drop' | 'double_eleven'
  | 'valentine' | 'christmas_gift' | 'april_fools'
  // 时长/速度类
  | 'thinker' | 'fall_bean' | 'flash' | 'path_of_pain' | 'philosopher'
  | 'speed_demon' | 'slow_life' | 'hex_a_gone' | 'consistent_timer'
  | 'sonic_trio' | 'two_minute_master' | 'endurance_king'
  // Bristol 收集类
  | 'bristol_king' | 'iridium_quality' | 'banana_fan' | 'rock_solid'
  | 'slime_climb' | 'soft_serve' | 'healthy_streak' | 'extreme_collector'
  // 颜色收集类
  | 'color_collector' | 'rainbow_master' | 'golden_pumpkin' | 'code_red'
  | 'void_heart' | 'green_goblin' | 'fifty_shades' | 'pale_rider'
  // 心情类
  | 'zen_master' | 'nuclear_blast' | 'spicy_lover' | 'mood_collector'
  | 'mood_master' | 'happy_camper' | 'struggle_bus' | 'pain_veteran'
  | 'classic_man' | 'holy_water'
  // 里程碑类
  | 'fiber_freak' | 'qualified' | 'ten_timer' | 'half_century'
  | 'heart_kill' | 'grand_master' | 'ascension_20' | 'monthly_iron'
  | 'team_round' | 'triple_threat'
  // 隐藏/组合类
  | 'ghost_poop' | 'perfect_run' | 'lucky_dog' | 'mega_blast'
  | 'crown_grabber' | 'achievement_hunter';
export type Rarity = 'common' | 'rare' | 'legendary';
export type Category = 'all' | 'daily' | 'vibe' | 'stat' | 'collection' | 'time' | 'special' | 'hidden' | 'rare';

export interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  lockedDescription?: string;
  icon: string;
  rarity: Rarity;
  categories: Category[];
  unlockedAt?: string; // If present, it's unlocked
  progress?: { current: number; total: number };
  bgTheme: string;
}
