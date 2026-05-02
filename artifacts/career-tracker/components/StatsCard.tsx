import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatsCard({ label, value, sub, accent = false }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.value, { color: accent ? colors.primaryForeground : colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: accent ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
        {label}
      </Text>
      {sub ? (
        <Text style={[styles.sub, { color: accent ? 'rgba(255,255,255,0.6)' : colors.mutedForeground }]}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
