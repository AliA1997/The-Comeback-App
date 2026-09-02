import { useAppStore } from '@/shared/store/root';

export const useAuthStatus = () => useAppStore((s) => s.authStatus);
export const useAuthUser = () => useAppStore((s) => s.authUser);
export const useAuthError = () => useAppStore((s) => s.authError);
/** The authenticated user id, or null. Used to scope device-local migrations. */
export const useAuthUserId = () => useAppStore((s) => s.authUser?.id ?? null);
