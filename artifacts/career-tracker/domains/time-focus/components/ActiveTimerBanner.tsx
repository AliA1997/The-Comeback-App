import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import { useActiveTask } from '@/domains/task-planning/selectors';
import { useIsTimerPaused } from '@/domains/time-focus/selectors';
import { TimerSecondsText } from './TimerSecondsText';

/**
 * Compact banner that surfaces the active timer on every tab. The seconds
 * digit is isolated inside <TimerSecondsText> so this banner itself does
 * NOT re-render on every tick.
 */
export function ActiveTimerBanner() {
  const colors = useColors();
  const router = useRouter();
  const task = useActiveTask();
  const isPaused = useIsTimerPaused();

  if (!task) return null;

  const accent = isPaused ? colors.muted : colors.primary;

  return (
    <Pressable
      onPress={() => router.push('/timer')}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: accent,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {isPaused ? 'Paused' : 'In focus'} · {task.category}
        </Text>
      </View>
      <TimerSecondsText style={[styles.time, { color: accent }]} />
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  time: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
});
