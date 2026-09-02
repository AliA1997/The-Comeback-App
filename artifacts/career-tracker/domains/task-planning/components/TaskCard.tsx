import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { PriorityBadge } from '@/shared/ui/PriorityBadge';
import { ScorePill } from '@/shared/ui/ScorePill';
import { useColors } from '@/shared/theme/useColors';
import { isOpen, taskCategory, type Task } from '@/shared/types/task';
import { useActiveTaskId, useIsAnyTimerRunning } from '@/domains/time-focus/selectors';
import { startSession } from '@/domains/time-focus/services/SessionLifecycle';
import { useDeleteTask } from '@/domains/task-planning/hooks/useTaskMutations';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
}

/**
 * Memoized: only re-renders when the `task` reference changes. React Query
 * hands back a new array on every refetch but preserves item identity for
 * unchanged rows, so the guarantee the old Zustand store gave still holds.
 *
 * The custom comparator intentionally ignores `onEdit` identity because
 * dashboards pass inline arrows like `onEdit={() => handleEdit(task.id)}`.
 */
function TaskCardImpl({ task, onEdit }: Props) {
  const colors = useColors();
  const router = useRouter();

  // Granular subscriptions — booleans only flip on real transitions.
  // Crucially, this card does NOT subscribe to the whole `activeTimer`
  // object, so per-second timer ticks do not re-render it.
  const activeTaskId = useActiveTaskId();
  const isTimerRunning = useIsAnyTimerRunning();
  const isActive = activeTaskId === task.id;

  const deleteTask = useDeleteTask();

  const totalSeconds = task.estimatedDurationMinutes * 60;
  const savedRemaining = task.savedRemainingSeconds ?? undefined;
  const hasProgress =
    savedRemaining !== undefined &&
    savedRemaining > 0 &&
    savedRemaining < totalSeconds &&
    task.status !== 'completed' &&
    task.status !== 'deleted';
  const progressFraction = hasProgress ? 1 - savedRemaining! / totalSeconds : 0;
  const savedMinsLeft = hasProgress ? Math.ceil(savedRemaining! / 60) : 0;

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isActive) startSession(task);
    router.push('/timer');
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    deleteTask.mutate({ taskId: task.id });
  };

  const statusColor =
    task.status === 'completed'
      ? colors.accent
      : task.status === 'in_progress'
        ? colors.primary
        : task.status === 'paused'
          ? colors.muted
          : colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 1.5 : 1,
        },
      ]}
    >
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerBadges}>
            <CategoryBadge category={taskCategory(task)} small />
            <PriorityBadge priority={task.priority} small />
          </View>
          <View style={styles.headerMeta}>
            <ScorePill score={task.score} earned={task.status === 'completed'} small />
            <Text style={[styles.duration, { color: colors.mutedForeground }]}>
              {task.estimatedDurationMinutes}m
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.foreground,
              textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {hasProgress && !isActive ? (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: (`${Math.round(progressFraction * 100)}%` as unknown) as number,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.primary }]}>
              {savedMinsLeft}m left · resume
            </Text>
          </View>
        ) : null}

        {isOpen(task) ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isActive ? `${task.title} is running` : `Start ${task.title}`
              }
              accessibilityState={{ disabled: isTimerRunning && !isActive }}
              style={[
                styles.startBtn,
                {
                  backgroundColor: isActive ? colors.accent : colors.primary,
                  opacity: isTimerRunning && !isActive ? 0.4 : 1,
                },
              ]}
              onPress={handleStart}
              disabled={isTimerRunning && !isActive}
            >
              <Feather
                name={isActive ? 'clock' : hasProgress ? 'rotate-ccw' : 'play'}
                size={14}
                color="#fff"
              />
              <Text style={styles.startText}>
                {isActive ? 'Active' : hasProgress ? 'Resume' : 'Start'}
              </Text>
            </Pressable>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Edit ${task.title}`}
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={() => onEdit?.(task)}
            >
              <Feather name="edit-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Delete ${task.title}`}
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedRow}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              Completed
              {task.actualDurationMinutes ? ` · ${task.actualDurationMinutes}m` : ''}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Delete ${task.title}`}
              hitSlop={12}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export const TaskCard = React.memo(TaskCardImpl, (prev, next) => prev.task === next.task);

const styles = StyleSheet.create({
  card: { borderRadius: 16, flexDirection: 'row', overflow: 'hidden', marginBottom: 12 },
  statusBar: { width: 4 },
  content: { flex: 1, padding: 16, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerBadges: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duration: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  progressWrap: { gap: 5 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    gap: 6,
  },
  startText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
});
