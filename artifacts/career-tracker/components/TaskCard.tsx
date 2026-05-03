import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/store/useAppStore';
import type { Task } from '@/types';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
}

function TaskCardImpl({ task, onEdit }: Props) {
  const colors = useColors();
  const router = useRouter();

  // Granular subscriptions — actions are stable refs, booleans only flip on
  // real transitions. Crucially, this card does NOT subscribe to the whole
  // `activeTimer` object, so per-second timer ticks do not re-render it.
  const startTimer = useAppStore((s) => s.startTimer);
  const setTaskStatus = useAppStore((s) => s.setTaskStatus);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const isActive = useAppStore((s) => s.activeTimer?.taskId === task.id);
  const isTimerRunning = useAppStore((s) => s.activeTimer !== null);

  // Progress from saved state: how far through the task they got
  const totalSeconds = task.estimatedDuration * 60;
  const savedRemaining = task.savedRemainingSeconds;
  const hasProgress =
    savedRemaining !== undefined &&
    savedRemaining > 0 &&
    savedRemaining < totalSeconds &&
    task.status !== 'completed' &&
    task.status !== 'skipped';
  const progressFraction = hasProgress ? 1 - savedRemaining / totalSeconds : 0;
  const savedMinsLeft = hasProgress ? Math.ceil(savedRemaining / 60) : 0;

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isActive) {
      // Timer is already running — just open the timer screen, do NOT restart
      router.push('/timer');
      return;
    }
    startTimer(task.id, task.estimatedDuration);
    router.push('/timer');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTaskStatus(task.id, 'skipped');
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    deleteTask(task.id);
  };

  const statusColor =
    task.status === 'completed'
      ? colors.accent
      : task.status === 'in_progress'
      ? colors.primary
      : task.status === 'skipped'
      ? colors.mutedForeground
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
          <CategoryBadge category={task.category} small />
          <Text style={[styles.duration, { color: colors.mutedForeground }]}>
            {task.estimatedDuration}m
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: task.status === 'skipped' ? colors.mutedForeground : colors.foreground,
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

        {/* Progress bar — shown when task was stopped mid-way */}
        {hasProgress && !isActive ? (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(progressFraction * 100)}%` as any,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.primary }]}>
              {savedMinsLeft}m left · resume
            </Text>
          </View>
        ) : null}

        {task.status === 'pending' || task.status === 'in_progress' ? (
          <View style={styles.actions}>
            <Pressable
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
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={() => onEdit?.(task)}
            >
              <Feather name="edit-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={handleSkip}
            >
              <Feather name="skip-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: colors.border }]}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.completedRow}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {task.status === 'completed' ? 'Completed' : 'Skipped'}
              {task.actualDuration ? ` · ${task.actualDuration}m` : ''}
            </Text>
            <TouchableOpacity onPress={handleDelete}>
              <Feather name="trash-2" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Memoized: only re-renders when the `task` reference changes (Zustand
 * immutable updates ensure stable refs unless THIS task was mutated).
 *
 * The custom comparator intentionally ignores `onEdit` identity so parent
 * components can pass inline arrow functions without invalidating the memo.
 */
export const TaskCard = React.memo(TaskCardImpl, (prev, next) => prev.task === next.task);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  statusBar: { width: 4 },
  content: { flex: 1, padding: 16, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  progressWrap: { gap: 5 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  startText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
