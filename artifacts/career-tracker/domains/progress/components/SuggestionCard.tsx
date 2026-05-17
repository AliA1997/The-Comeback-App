import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import type { Suggestion } from '@/domains/progress/types';

interface Props {
  suggestion: Suggestion;
  /** Optional action — typically "Add a task in this category" */
  onAction?: () => void;
}

const TYPE_ICON: Record<Suggestion['type'], string> = {
  warning: 'alert-triangle',
  insight: 'zap',
  recommendation: 'compass',
};

export function SuggestionCard({ suggestion, onAction }: Props) {
  const colors = useColors();
  const tint =
    suggestion.type === 'warning'
      ? colors.destructive
      : suggestion.type === 'insight'
      ? colors.accent
      : colors.primary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderLeftColor: tint, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
          <Feather name={TYPE_ICON[suggestion.type] as never} size={16} color={tint} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{suggestion.message}</Text>
      </View>
      <Text style={[styles.detail, { color: colors.mutedForeground }]}>{suggestion.detail}</Text>
      {onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: `${tint}1A`, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={13} color={tint} />
          <Text style={[styles.actionText, { color: tint }]}>
            Add a {suggestion.category ?? 'related'} task
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 10,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 19 },
  detail: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  actionText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
