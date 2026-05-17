import React, { useEffect } from 'react';
import { runNudgeEvaluation } from '@/domains/notifications/services/NudgeEngine';

/**
 * NudgeProvider — fires the nudge evaluator on mount and every hour.
 * The engine itself respects per-rule cool-downs so we won't spam inbox.
 */
export function NudgeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Defer first run so initial hydration completes
    const initial = setTimeout(() => runNudgeEvaluation(), 1500);
    const interval = setInterval(() => runNudgeEvaluation(), 60 * 60 * 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);
  return <>{children}</>;
}
