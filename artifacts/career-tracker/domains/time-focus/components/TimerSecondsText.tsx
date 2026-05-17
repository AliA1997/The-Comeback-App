import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTimerRemainingSeconds } from '@/domains/time-focus/selectors';

/**
 * The single leaf component in the app that subscribes to per-second ticks.
 * Keeping per-tick subscriptions to one leaf means banners / screens that
 * include it do not re-render on every tick.
 */
export function TimerSecondsText({ style, ...props }: TextProps) {
  const secs = useTimerRemainingSeconds();
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;
  const label = `${String(mins).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return (
    <Text style={style} {...props}>
      {label}
    </Text>
  );
}
