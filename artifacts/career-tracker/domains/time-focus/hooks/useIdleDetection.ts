import { useEffect, useRef } from 'react';
import { useIsTimerIdle } from '@/domains/time-focus/selectors';
import { readCachedProfile } from '@/shared/api/profileCache';
import { AdService } from '@/shared/services/AdService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Triggers an interstitial ad after `IDLE_THRESHOLD_MS` of no active timer,
 * then keeps rescheduling. Respects the user's `adsEnabled` preference.
 *
 * Subscribes to the boolean `isIdle` only, so the host does not re-render
 * on per-second timer ticks — only on real idle transitions.
 */
export function useIdleDetection() {
  const isIdle = useIsTimerIdle();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (!isIdle) return;

    const fire = () => {
      if (readCachedProfile().preferences.adsEnabled) AdService.showInterstitialAd();
    };

    idleTimerRef.current = setTimeout(function reschedule() {
      fire();
      idleTimerRef.current = setTimeout(reschedule, IDLE_THRESHOLD_MS);
    }, IDLE_THRESHOLD_MS);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [isIdle]);
}
