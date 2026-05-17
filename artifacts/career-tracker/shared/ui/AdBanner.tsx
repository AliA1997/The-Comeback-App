import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';

/**
 * AdBanner — Fixed bottom banner ad placeholder.
 *
 * In a native build, swap the View for a real ad surface (AppLovin MAX
 * MaxAdView, BidMachine BannerView, etc).
 */
interface Props {
  visible?: boolean;
}

export function AdBanner({ visible = true }: Props) {
  const colors = useColors();
  if (!visible) return null;
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Ad Banner — AppLovin MAX + BidMachine (native build)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? { paddingBottom: 8 } : {}),
  },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
