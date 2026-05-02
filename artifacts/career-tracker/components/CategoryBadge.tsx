import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TaskCategory } from '@/types';

const CATEGORY_COLORS: Record<TaskCategory, { bg: string; text: string }> = {
  LeetCode: { bg: '#FF6B35', text: '#FFFFFF' },
  Projects: { bg: '#4F7FFF', text: '#FFFFFF' },
  'System Design': { bg: '#9B59B6', text: '#FFFFFF' },
  Applications: { bg: '#00D4AA', text: '#0A0E1A' },
  Learning: { bg: '#F39C12', text: '#0A0E1A' },
  Networking: { bg: '#27AE60', text: '#FFFFFF' },
};

interface Props {
  category: TaskCategory;
  small?: boolean;
}

export function CategoryBadge({ category, small = false }: Props) {
  const colors = CATEGORY_COLORS[category];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          small && styles.smallText,
        ]}
        numberOfLines={1}
      >
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 10,
  },
});
