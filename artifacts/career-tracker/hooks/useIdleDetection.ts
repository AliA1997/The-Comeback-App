import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AdService } from '@/services/AdService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function useIdleDetection() {
  const activeTimer = useAppStore((s) => s.activeTimer);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdle = !activeTimer || (!activeTimer.isRunning && !activeTimer.isPaused);

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
