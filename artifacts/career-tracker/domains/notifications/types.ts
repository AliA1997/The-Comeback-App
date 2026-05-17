/**
 * Notifications & Generic Domain — types
 *
 * Owns: in-app notification inbox, scheduled nudges, push/email abstractions.
 */

export type NotificationKind =
  | 'nudge'           // rule-based reminder
  | 'achievement'     // unlocked badge
  | 'timer'           // timer completed
  | 'system'          // generic info
  | 'tip';            // contextual tip

export interface InAppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Optional deep-link route, e.g. "/(tabs)/insights" */
  route?: string;
  createdAt: number;
  readAt: number | null;
}

export interface NudgeRecord {
  /** Stable rule id so we don't re-fire the same nudge repeatedly */
  ruleId: string;
  /** When this rule last produced a notification */
  lastFiredAt: number;
}
