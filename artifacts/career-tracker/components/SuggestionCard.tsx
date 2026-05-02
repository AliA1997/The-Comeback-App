import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Suggestion } from '@/types';

const TYPE_ICON: Record<Suggestion['type'], string> = {
  warning: 'alert-triangle',
  insight: 'zap',
  recommendation: 'target',
};

const TYPE_COLOR: Record<Suggestion['type'], string> = {
  warning: '#FF6B35',
  insight: '#4F7FFF',
  recommendation: '#00D4AA',
};

interface Props {
  suggestion: Suggestion;
  onAction?: () => void;
}

export function SuggestionCard({ suggestion, onAction }: Props) {
  const colors = useColors();
  const accentColor = TYPE_COLOR[suggestion.type];
  const iconName = TYPE_ICON[suggestion.type] as any;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
        <Feather name={iconName} size={18} color={accentColor} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.message, { color: colors.foreground }]}>{suggestion.message}</Text>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>{suggestion.detail}</Text>
        {suggestion.category && onAction ? (
          <TouchableOpacity style={[styles.actionBtn, { borderColor: accentColor }]} onPress={onAction}>
            <Text style={[styles.actionText, { color: accentColor }]}>
              Add {suggestion.category} task
            </Text>
            <Feather name="arrow-right" size={12} color={accentColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
