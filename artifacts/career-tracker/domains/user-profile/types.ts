/**
 * User Profile Domain — types
 *
 * Owns: account/profile info, goals, preferences, career track, seniority,
 * target role. All local-only for now (no backend auth).
 */

export type CareerTrack =
  | 'Frontend'
  | 'Backend'
  | 'Fullstack'
  | 'Mobile'
  | 'Data Science'
  | 'Machine Learning'
  | 'DevOps'
  | 'Other';

export const CAREER_TRACKS: CareerTrack[] = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Mobile',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Other',
];

export type Seniority = 'Junior' | 'Mid' | 'Senior' | 'Staff' | 'Principal';

export const SENIORITY_LEVELS: Seniority[] = ['Junior', 'Mid', 'Senior', 'Staff', 'Principal'];

export interface UserGoals {
  /** Target minutes of focused work per day */
  dailyMinutesTarget: number;
  /** Target tasks completed per week */
  weeklyTasksTarget: number;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  nudgesEnabled: boolean;
  adsEnabled: boolean;
}

export interface UserProfile {
  /** Display name */
  name: string;
  careerTrack: CareerTrack | null;
  seniority: Seniority | null;
  /** Free-text target role e.g. "Senior Frontend at FAANG" */
  targetRole: string;
  goals: UserGoals;
  preferences: UserPreferences;
  createdAt: number;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  careerTrack: null,
  seniority: null,
  targetRole: '',
  goals: {
    dailyMinutesTarget: 90,
    weeklyTasksTarget: 12,
  },
  preferences: {
    notificationsEnabled: true,
    nudgesEnabled: true,
    adsEnabled: true,
  },
  createdAt: 0,
};
