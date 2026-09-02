import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';

interface Props {
  score: number;
  /** Dims the pill for work that has not been banked yet. */
  earned?: boolean;
  small?: boolean;
}

/**
 * Principle IV, Momentum Made Visible: the point of a score is that it can be
 * read in a glance, so it goes on the card itself rather than behind a tap.
 */
export function ScorePill({ score, earned = false, small = false }: Props) {
  const colors = useColors();
  const tint = earned ? colors.accent : colors.mutedForeground;

  return (
    <View
      style={[styles.pill, small && styles.small, { backgroundColor: `${tint}1F` }]}
      accessibilityLabel={earned ? `${score} points earned` : `Worth ${score} points`}
    >
      <Feather name="zap" size={small ? 10 : 12} color={tint} />
      <Text style={[styles.text, small && styles.smallText, { color: tint }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  smallText: { fontSize: 11 },
});
