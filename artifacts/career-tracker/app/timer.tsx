import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useColors } from '@/shared/theme/useColors';
import { TimerDisplay } from '@/domains/time-focus/components/TimerDisplay';
import { useActiveTimer, useIsTimerPaused } from '@/domains/time-focus/selectors';
import { useActiveTask } from '@/domains/task-planning/selectors';
import {
  pauseSession,
  resumeSession,
  stopSession,
  completeSession,
} from '@/domains/time-focus/services/SessionLifecycle';

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // We subscribe to the activeTimer object for static fields (totalSeconds,
  // startedAt, etc.) — fine because they don't change every tick. The
  // displayed seconds is rendered inside <TimerDisplay> via TimerSecondsText,
  // so the rest of this screen only re-renders on real state changes.
  const activeTimer = useActiveTimer();
  const task = useActiveTask();
  const isPaused = useIsTimerPaused();

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'web') {
      stopSession();
      router.back();
      return;
    }
    Alert.alert('Stop Timer', 'Progress on this task will not be logged.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: () => {
          stopSession();
          router.back();
        },
      },
    ]);
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeSession();
    router.back();
  };

  if (!activeTimer || !task) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 16, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <EmptyState
          icon="clock"
          title="No active timer"
          message="Start a task from the dashboard or tasks screen to begin a focus session."
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[
          styles.closeBtn,
          {
            top: insets.top + (Platform.OS === 'web' ? 67 : 16),
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.back()}
      >
        <Feather name="chevron-down" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <View
        style={[
          styles.inner,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) },
        ]}
      >
        <View style={styles.taskInfo}>
          <CategoryBadge category={task.category} />
          <Text style={[styles.taskTitle, { color: colors.foreground }]} numberOfLines={2}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[styles.taskDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.timerWrap}>
          <TimerDisplay size={280} />
          {isPaused ? (
            <View style={[styles.pausedBadge, { backgroundColor: `${colors.primary}22` }]}>
              <Feather name="pause" size={12} color={colors.primary} />
              <Text style={[styles.pausedText, { color: colors.primary }]}>Paused</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.destructive }]}
            onPress={handleStop}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="square" size={22} color={colors.destructive} />
          </TouchableOpacity>

          <Pressable
            style={[
              styles.mainBtn,
              { backgroundColor: isPaused ? colors.accent : colors.primary },
            ]}
            onPress={handlePauseResume}
          >
            <Feather name={isPaused ? 'play' : 'pause'} size={30} color="#fff" />
          </Pressable>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.accent }]}
            onPress={handleComplete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="check" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.metaRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.metaItem}>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {task.estimatedDuration}m
            </Text>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Estimated</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {Math.round(activeTimer.totalSeconds / 60)}m
            </Text>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Session</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {task.category}
            </Text>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Category</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 32,
  },
  taskInfo: { alignItems: 'center', gap: 10, paddingTop: 40 },
  taskTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  taskDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  timerWrap: { alignItems: 'center', gap: 16 },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pausedText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  secondaryBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  metaRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  metaItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  metaValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaDivider: { width: 1, marginVertical: 10 },
});
