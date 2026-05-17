/**
 * Notifications slice — in-app inbox + nudge rule firing history.
 *
 * Push/email delivery is handled by services in this domain (currently stubs).
 */
import type { StateCreator } from 'zustand';
import type { InAppNotification, NudgeRecord } from './types';

export interface NotificationsSlice {
  inbox: InAppNotification[];
  nudgeHistory: NudgeRecord[];

  pushNotification: (
    n: Omit<InAppNotification, 'id' | 'createdAt' | 'readAt'>
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  recordNudgeFired: (ruleId: string) => void;
}

function genId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const createNotificationsSlice: StateCreator<
  NotificationsSlice,
  [],
  [],
  NotificationsSlice
> = (set) => ({
  inbox: [],
  nudgeHistory: [],

  pushNotification: (n) =>
    set((s) => ({
      inbox: [
        { ...n, id: genId(), createdAt: Date.now(), readAt: null },
        ...s.inbox,
      ].slice(0, 100),
    })),

  markRead: (id) =>
    set((s) => ({
      inbox: s.inbox.map((n) =>
        n.id === id && n.readAt === null ? { ...n, readAt: Date.now() } : n
      ),
    })),

  markAllRead: () =>
    set((s) => {
      const now = Date.now();
      return {
        inbox: s.inbox.map((n) => (n.readAt === null ? { ...n, readAt: now } : n)),
      };
    }),

  clearNotification: (id) =>
    set((s) => ({ inbox: s.inbox.filter((n) => n.id !== id) })),

  clearAllNotifications: () => set({ inbox: [] }),

  recordNudgeFired: (ruleId) =>
    set((s) => {
      const now = Date.now();
      const existing = s.nudgeHistory.find((h) => h.ruleId === ruleId);
      if (existing) {
        return {
          nudgeHistory: s.nudgeHistory.map((h) =>
            h.ruleId === ruleId ? { ...h, lastFiredAt: now } : h
          ),
        };
      }
      return {
        nudgeHistory: [...s.nudgeHistory, { ruleId, lastFiredAt: now }],
      };
    }),
});
