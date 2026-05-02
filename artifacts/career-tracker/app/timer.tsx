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
import { CategoryBadge } from '@/components/CategoryBadge';
import { TimerDisplay } from '@/components/TimerDisplay';
import { useColors } from '@/hooks/useColors';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store/useAppStore';

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeTimer, task } = useTimer();
  const { pauseTimer, resumeTimer, stopTimer, completeTimer } = useAppStore();

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeTimer?.isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'web') {
      stopTimer();
      router.back();
      return;
    }
    Alert.alert(
      'Stop Timer',
      'Are you sure? Your progress on this task will not be logged.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopTimer();
            router.back();
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeTimer();
    router.back();
  };

  if (!activeTimer || !task) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
          <Feather name="clock" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No active timer</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Start a task from the dashboard or tasks screen.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color={colors.foreground} />
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = activeTimer.totalSeconds > 0
    ? activeTimer.remainingSeconds / activeTimer.totalSeconds
    : 0;
  const isLow = progress < 0.2;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <TouchableOpacity
        style={[
          styles.closeBtn,
          { top: insets.top + (Platform.OS === 'web' ? 67 : 16), borderColor: colors.border },
        ]}
        onPress={() => router.back()}
      >
        <Feather name="chevron-down" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <View style={[styles.inner, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
        {/* Task info */}
        <View style={styles.taskInfo}>
          <CategoryBadge category={task.category} />
          <Text style={[styles.taskTitle, { color: colors.foreground }]} numberOfLines={2}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[styles.taskDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
              {task.description}
            </Text>
          ) : null}
        </View>

        {/* Timer */}
        <View style={styles.timerWrap}>
          <TimerDisplay
            remainingSeconds={activeTimer.remainingSeconds}
            totalSeconds={activeTimer.totalSeconds}
            size={280}
          />
          {activeTimer.isPaused ? (
            <View style={[styles.pausedBadge, { backgroundColor: `${colors.primary}22` }]}>
              <Feather name="pause" size={12} color={colors.primary} />
              <Text style={[styles.pausedText, { color: colors.primary }]}>Paused</Text>
            </View>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.stopBtn, { borderColor: colors.destructive }]}
            onPress={handleStop}
          >
            <Feather name="square" size={20} color={colors.destructive} />
          </TouchableOpacity>

          <Pressable
            style={[styles.mainBtn, { backgroundColor: activeTimer.isPaused ? colors.accent : colors.primary }]}
            onPress={handlePauseResume}
          >
            <Feather
              name={activeTimer.isPaused ? 'play' : 'pause'}
              size={28}
              color="#fff"
            />
          </Pressable>

          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: colors.accent }]}
            onPress={handleComplete}
          >
            <Feather name="check" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Estimated total */}
        <Text style={[styles.estNote, { color: colors.mutedForeground }]}>
          Estimated: {task.estimatedDuration}m · {Math.round((activeTimer.totalSeconds - activeTimer.remainingSeconds) / 60)}m elapsed
        </Text>
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
  taskInfo: { alignItems: 'center', gap: 10 },
  taskTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  taskDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
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
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stopBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  doneBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estNote: { fontSize: 12, fontFamily: 'Inter_400Regular', letterSpacing: 0.2 },
  empty: { flex: 1, alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  backBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
