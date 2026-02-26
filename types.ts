
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
  | 'early_bird' | 'thinker' | 'ghost_poop' | 'fiber_freak' | 'sprinter'
  | 'midnight_owl' | 'bristol_king' | 'color_collector' | 'zen_master'
  | 'nuclear_blast' | 'spicy_lover';
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
