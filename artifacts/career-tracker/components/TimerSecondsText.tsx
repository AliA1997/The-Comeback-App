/**
 * TimerSecondsText
 *
 * Renders a single MM:SS Text node and is the ONLY component in the tree
 * that subscribes to per-second updates. By isolating the high-frequency
 * subscription to a leaf component, every parent (banners, screens, lists)
 * stops re-rendering on each tick.
 */
import React from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';
import { useTimerRemainingSeconds } from '@/store/selectors';

interface Props {
  style?: StyleProp<TextStyle>;
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const TimerSecondsText = React.memo(function TimerSecondsText({ style }: Props) {
  const remaining = useTimerRemainingSeconds();
  return <Text style={style}>{formatMMSS(remaining)}</Text>;
});
