import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import { completeTask } from '../services/DailyTaskLifecycle';
import { TaskAlreadyCompletedError, TaskNotFoundError } from '../types';
import type { DailyTask, DailyTaskCategory } from '../types';

const CATEGORY_LABEL: Record<DailyTaskCategory, string> = {
  applications: 'Applications',
  practice: 'Practice',
  networking: 'Networking',
  learning: 'Learning',
};

const CATEGORY_COLOR: Record<DailyTaskCategory, string> = {
  applications: '#00D4AA',
  practice: '#FF6B35',
  networking: '#27AE60',
  learning: '#F39C12',
};

interface Props {
  task: DailyTask;
}

/**
 * One row of the daily plan. Completing is a single tap on the row
 * (Principle V) — no confirmation, no extra input.
 */
export const DailyTaskItem = React.memo(
  function DailyTaskItem({ task }: Props) {
    const colors = useColors();

    const handlePress = useCallback(() => {
      if (task.completed) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        completeTask(task.id);
      } catch (e) {
        // Double-taps and midnight rollover races are benign — the row
        // re-renders from store state either way.
        if (
          !(e instanceof TaskAlreadyCompletedError) &&
          !(e instanceof TaskNotFoundError)
        ) {
          throw e;
        }
      }
    }, [task.completed, task.id]);

    const categoryColor = CATEGORY_COLOR[task.category];

    return (
      <TouchableOpacity
        style={[styles.row, { borderColor: colors.border }]}
        onPress={handlePress}
        disabled={task.completed}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.check,
            task.completed
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : { borderColor: colors.mutedForeground },
          ]}
        >
          {task.completed ? (
            <Feather name="check" size={14} color={colors.accentForeground} />
          ) : null}
        </View>
        <Text
          style={[
            styles.title,
            { color: task.completed ? colors.mutedForeground : colors.foreground },
            task.completed && styles.titleDone,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${categoryColor}22` }]}>
          <Text style={[styles.badgeText, { color: categoryColor }]}>
            {CATEGORY_LABEL[task.category]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.task === next.task
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  titleDone: { textDecorationLine: 'line-through' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
});
