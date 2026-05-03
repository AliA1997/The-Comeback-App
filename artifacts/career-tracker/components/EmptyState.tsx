import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={icon as any} size={32} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  message: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
