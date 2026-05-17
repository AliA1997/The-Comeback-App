import { useAppStore } from '@/shared/store/root';

export const useNotifications = () => useAppStore((s) => s.inbox);
export const useUnreadNotificationCount = () =>
  useAppStore((s) => s.inbox.reduce((acc, n) => acc + (n.readAt === null ? 1 : 0), 0));
export const useNudgeHistory = () => useAppStore((s) => s.nudgeHistory);
