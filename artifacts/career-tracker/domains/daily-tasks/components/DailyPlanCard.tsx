import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { localTodayStr } from '@/shared/lib/dateUtils';
import { useHydrationState } from '@/shared/store/root';
import { useColors } from '@/shared/theme/useColors';
import { useDailyTasks } from '../selectors';
import {
  computeDailyStreak,
  getRestartMessage,
} from '../services/DailyTaskEngine';
import { createDailyTasks } from '../services/DailyTaskLifecycle';
import { DailyTaskItem } from './DailyTaskItem';

/**
 * Local-calendar "today" that refreshes when the app returns to the
 * foreground, so a device left open overnight rolls over to the new
 * day's plan (spec: day rollover at midnight local time).
 */
function useLocalToday(): string {
  const [today, setToday] = useState(localTodayStr);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(localTodayStr());
    });
    return () => sub.remove();
  }, []);
  return today;
}

/**
 * The core daily loop (Principle I): today's pre-structured plan,
 * generated from the routine template, with streak + one-tap completion.
 */
export function DailyPlanCard() {
  const colors = useColors();
  const dailyTasks = useDailyTasks();
  const { hasHydrated } = useHydrationState();
  const today = useLocalToday();

  // Generate today's plan once state is restored. Idempotent — keeps
  // existing tasks if already generated (spec: Behavior).
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      createDailyTasks({ date: today });
    } catch {
      // A malformed custom template must not take down the dashboard;
      // the card just renders empty for today.
    }
  }, [hasHydrated, today]);

  const todayTasks = useMemo(
    () => dailyTasks.filter((t) => t.date === today),
    [dailyTasks, today]
  );
  const doneCount = useMemo(
    () => todayTasks.filter((t) => t.completed).length,
    [todayTasks]
  );
  const streak = useMemo(
    () => computeDailyStreak(dailyTasks, today),
    [dailyTasks, today]
  );
  const restartMessage = useMemo(
    () => getRestartMessage(dailyTasks, today),
    [dailyTasks, today]
  );

  if (!hasHydrated || todayTasks.length === 0) return null;

  const allDone = doneCount === todayTasks.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Today&apos;s Plan
        </Text>
        <View style={[styles.streakChip, { backgroundColor: `${colors.accent}22` }]}>
          <Feather name="zap" size={12} color={colors.accent} />
          <Text style={[styles.streakText, { color: colors.accent }]}>
            {streak} day{streak === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {restartMessage ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: `${colors.primary}18`, borderColor: colors.border },
          ]}
        >
          <Feather name="sunrise" size={14} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            {restartMessage}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {todayTasks.map((task) => (
          <DailyTaskItem key={task.id} task={task} />
        ))}
        <Text style={[styles.progress, { color: colors.mutedForeground }]}>
          {allDone
            ? "You're done for today — see you tomorrow."
            : `${doneCount} of ${todayTasks.length} done`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  progress: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 12,
  },
});
