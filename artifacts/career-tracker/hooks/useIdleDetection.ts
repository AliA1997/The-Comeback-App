import { useEffect, useRef } from 'react';
import { useIsTimerIdle } from '@/store/selectors';
import { AdService } from '@/services/AdService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function useIdleDetection() {
  // Subscribes to a boolean — host component does NOT re-render on every
  // timer tick, only when idleness actually transitions.
  const isIdle = useIsTimerIdle();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isIdle) {
      idleTimerRef.current = setTimeout(() => {
        AdService.showInterstitialAd();
        // Reschedule after showing
        idleTimerRef.current = setTimeout(function reschedule() {
          AdService.showInterstitialAd();
          idleTimerRef.current = setTimeout(reschedule, IDLE_THRESHOLD_MS);
        }, IDLE_THRESHOLD_MS);
      }, IDLE_THRESHOLD_MS);
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isIdle]);
}
