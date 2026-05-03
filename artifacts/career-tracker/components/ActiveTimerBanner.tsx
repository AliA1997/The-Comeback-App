import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TimerSecondsText } from '@/components/TimerSecondsText';
import { useColors } from '@/hooks/useColors';
import { useActiveTask, useActiveTaskId, useIsTimerPaused } from '@/store/selectors';

/**
 * Banner shown on dashboard whenever a timer is active.
 *
 * The MM:SS string is rendered by the inner <TimerSecondsText/> which is the
 * only piece subscribed to per-second updates. Everything else here only
 * re-renders when the active task or pause state actually changes.
 */
export function ActiveTimerBanner() {
  const colors = useColors();
  const router = useRouter();
  const activeTaskId = useActiveTaskId();
  const isPaused = useIsTimerPaused();
  const task = useActiveTask();

  if (!activeTaskId || !task) return null;

  return (
    <Pressable
      style={[styles.banner, { backgroundColor: colors.primary }]}
      onPress={() => router.push('/timer')}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { opacity: isPaused ? 0.4 : 1 }]} />
        <View>
          <Text style={styles.label}>{isPaused ? 'Paused' : 'Active Timer'}</Text>
          <Text style={styles.taskName} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <TimerSecondsText style={styles.time} />
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginTop: 2,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
});
