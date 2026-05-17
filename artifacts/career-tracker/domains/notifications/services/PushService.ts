/**
 * PushService — placeholder for remote push notifications.
 *
 * In a real native build this wraps expo-notifications + a token registry.
 * Web has no push in dev preview; this is intentionally a no-op stub so
 * calling code is identical on every platform.
 */

export const PushService = {
  async registerForRemoteNotifications(): Promise<string | null> {
    return null;
  },
  async sendLocalAlert(_title: string, _body: string): Promise<void> {
    // no-op
  },
};
