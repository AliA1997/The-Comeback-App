import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface Props {
  remainingSeconds: number;
  totalSeconds: number;
  size?: number;
}

export function TimerDisplay({ remainingSeconds, totalSeconds, size = 260 }: Props) {
  const colors = useColors();

  const RADIUS = (size - 24) / 2;
  const STROKE_WIDTH = 10;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * RADIUS;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLow = progress < 0.2;
  const arcColor = isLow ? colors.destructive : colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          stroke={colors.border}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          stroke={arcColor}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={[styles.inner, StyleSheet.absoluteFillObject]}>
        <Text style={[styles.time, { color: colors.foreground }]}>{timeStr}</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>remaining</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
