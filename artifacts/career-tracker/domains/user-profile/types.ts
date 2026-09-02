/**
 * User Profile Domain — types.
 *
 * Owns: profile info, goals, preferences, career track, seniority, target
 * role. The profile itself is server state (spec § 5.2); its shape comes from
 * the generated schemas. The vocabulary below is client-side because the
 * server stores these as free text.
 */
export type { Profile, UserPreferences } from '@workspace/api-client-react';

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

/**
 * Mirrors the column defaults in `comebackapp.user_profiles`. Used before the
 * profile query resolves so a toggle never renders as off just because the
 * network is slow.
 */
export const DEFAULT_PREFERENCES = {
  notificationsEnabled: true,
  nudgesEnabled: true,
  adsEnabled: true,
} as const;

export const DEFAULT_DAILY_MINUTES_TARGET = 90;
export const DEFAULT_WEEKLY_TASKS_TARGET = 12;
