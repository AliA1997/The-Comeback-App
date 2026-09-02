import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import type { PriorityLevel } from '@/shared/types/task';

const LABELS: Record<PriorityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface Props {
  priority: PriorityLevel;
  small?: boolean;
}

/**
 * Priority reads off the frozen palette rather than new colours: urgent takes
 * the destructive token, high the primary, and low/medium stay muted so the
 * page does not shout at someone who has a long list.
 */
export function PriorityBadge({ priority, small = false }: Props) {
  const colors = useColors();

  const tint =
    priority === 'urgent'
      ? colors.destructive
      : priority === 'high'
        ? colors.primary
        : colors.mutedForeground;

  // Medium is the default and carries no signal, so it stays unlabelled.
  if (priority === 'medium') return null;

  return (
    <View
      style={[styles.badge, small && styles.small, { backgroundColor: `${tint}22` }]}
      accessibilityLabel={`${LABELS[priority]} priority`}
    >
      {priority === 'urgent' ? (
        <Feather name="alert-triangle" size={small ? 9 : 11} color={tint} />
      ) : null}
      <Text style={[styles.text, small && styles.smallText, { color: tint }]}>
        {LABELS[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  smallText: { fontSize: 10 },
});
