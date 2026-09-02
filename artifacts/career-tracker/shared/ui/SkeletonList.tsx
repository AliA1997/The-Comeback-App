import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';

interface Props {
  /** How many placeholder rows to draw. Match the list this stands in for. */
  count?: number;
  /** Height of one row, so the skeleton occupies the final layout's space. */
  rowHeight?: number;
}

/**
 * Loading placeholder that matches the shape of the list it replaces (§ 8.5).
 * Never a full-screen spinner over existing content — a spinner throws away
 * the layout and makes a fast load feel like a stall.
 *
 * Deliberately static: an animated shimmer would add a second per-frame
 * subscriber to a screen that may also host the timer.
 */
export function SkeletonList({ count = 3, rowHeight = 96 }: Props) {
  const colors = useColors();

  return (
    <View style={styles.wrap} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            { height: rowHeight, backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.bar, styles.barWide, { backgroundColor: colors.border }]} />
          <View style={[styles.bar, styles.barNarrow, { backgroundColor: colors.border }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 10,
  },
  bar: { height: 10, borderRadius: 5 },
  barWide: { width: '70%' },
  barNarrow: { width: '40%' },
});
