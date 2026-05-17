/**
 * Mutation & Progress Domain — types
 *
 * Owns: per-day completion records, streaks, achievements, badges,
 * milestones, suggestion outputs.
 */
import type { TaskCategory } from '@/shared/types/skills';

export interface DayRecord {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  completedTaskIds: string[];
  skippedTaskIds: string[];
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  /** Feather icon name */
  icon: string;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
}

export interface Suggestion {
  id: string;
  message: string;
  detail: string;
  type: 'warning' | 'insight' | 'recommendation';
  category?: TaskCategory;
}
