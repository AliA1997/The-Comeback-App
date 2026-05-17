/**
 * Static achievement catalog. Unlock evaluation lives in
 * `services/AchievementEngine.ts`.
 */
import type { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-task',
    title: 'First Step',
    description: 'Complete your first task.',
    tier: 'bronze',
    icon: 'flag',
  },
  {
    id: 'streak-3',
    title: 'Building Momentum',
    description: 'Keep a 3-day streak.',
    tier: 'bronze',
    icon: 'trending-up',
  },
  {
    id: 'streak-7',
    title: 'One Week Strong',
    description: 'Keep a 7-day streak.',
    tier: 'silver',
    icon: 'calendar',
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: 'Keep a 30-day streak.',
    tier: 'gold',
    icon: 'zap',
  },
  {
    id: 'hours-5',
    title: 'Putting in the Hours',
    description: 'Log 5 hours of focused work.',
    tier: 'bronze',
    icon: 'clock',
  },
  {
    id: 'hours-25',
    title: 'Quarter Century',
    description: 'Log 25 hours of focused work.',
    tier: 'silver',
    icon: 'clock',
  },
  {
    id: 'hours-100',
    title: 'Centurion',
    description: 'Log 100 hours of focused work.',
    tier: 'gold',
    icon: 'award',
  },
  {
    id: 'all-categories',
    title: 'Well-Rounded',
    description: 'Complete a task in every category.',
    tier: 'silver',
    icon: 'grid',
  },
  {
    id: 'first-lesson',
    title: 'Always Learning',
    description: 'Complete your first lesson.',
    tier: 'bronze',
    icon: 'book-open',
  },
  {
    id: 'lessons-5',
    title: 'Self-Taught',
    description: 'Complete 5 lessons.',
    tier: 'silver',
    icon: 'book',
  },
];

export function findAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
