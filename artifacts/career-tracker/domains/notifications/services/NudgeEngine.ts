/**
 * NudgeEngine — converts Suggestion rules into in-app inbox notifications,
 * with per-rule cool-downs so the user isn't spammed.
 *
 * Called by `<NudgeProvider>` on mount and at most once per hour.
 */
import { useAppStore } from '@/shared/store/root';
import { readCachedProfile } from '@/shared/api/profileCache';
import { readCachedTasks } from '@/shared/api/taskCache';
import { generateSuggestions } from '@/domains/progress/services/SuggestionEngine';

const COOLDOWN_MS = 12 * 60 * 60 * 1000; // each rule fires at most every 12h

export function runNudgeEvaluation(): void {
  const state = useAppStore.getState();

  if (!readCachedProfile().preferences.nudgesEnabled) return;

  const suggestions = generateSuggestions(readCachedTasks(), state.dayRecords);
  const now = Date.now();

  for (const suggestion of suggestions) {
    const ruleId = `nudge:${suggestion.id}`;
    const lastFired = state.nudgeHistory.find((h) => h.ruleId === ruleId)?.lastFiredAt ?? 0;
    if (now - lastFired < COOLDOWN_MS) continue;

    state.pushNotification({
      kind: 'nudge',
      title: suggestion.message,
      body: suggestion.detail,
      route: '/(tabs)/insights',
    });
    state.recordNudgeFired(ruleId);
  }
}
