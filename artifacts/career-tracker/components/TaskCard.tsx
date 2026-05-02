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

export function TaskCard({ task, onEdit }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { startTimer, setTaskStatus, deleteTask, activeTimer } = useAppStore();

  const isActive = activeTimer?.taskId === task.id;
  const isTimerRunning = !!activeTimer;

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              <Feather name={isActive ? 'clock' : 'play'} size={14} color="#fff" />
              <Text style={styles.startText}>{isActive ? 'Active' : 'Start'}</Text>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
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
  startText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
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
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
});
