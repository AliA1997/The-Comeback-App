import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/shared/theme/useColors';
import {
  useIsAnyTimerRunning,
  useIsTimerPaused,
} from '@/domains/time-focus/selectors';
import { TimerSecondsText } from './TimerSecondsText';

interface Props {
  size?: number;
}

export function TimerDisplay({ size = 240 }: Props) {
  const colors = useColors();
  const isRunning = useIsAnyTimerRunning();
  const isPaused = useIsTimerPaused();

  // Subtle pulse on the outer ring while running
  const pulse = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(pulse);
    if (isRunning && !isPaused) {
      pulse.value = withRepeat(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 250 });
    }
    return () => cancelAnimation(pulse);
  }, [isRunning, isPaused]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const ringColor = isPaused ? colors.muted : colors.primary;
  const textColor = isPaused ? colors.mutedForeground : colors.foreground;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: `${ringColor}55`,
          },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            width: size - 24,
            height: size - 24,
            borderRadius: (size - 24) / 2,
            backgroundColor: colors.card,
            borderColor: ringColor,
          },
        ]}
      >
        <TimerSecondsText
          style={[
            styles.digits,
            {
              color: textColor,
              fontSize: Platform.OS === 'web' ? size * 0.22 : size * 0.2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 8 },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  digits: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
});
