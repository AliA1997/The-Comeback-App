import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useColors } from '@/shared/theme/useColors';
import { completeSignIn } from '../services/AuthService';

/**
 * Landing point for the OAuth redirect.
 *
 * On most launches `openAuthSessionAsync` resolves first and the exchange has
 * already happened; this screen then just shows a beat of progress while the
 * root guard swaps in the tabs. On a cold start the deep link arrives here
 * first, so the exchange runs from the URL instead.
 */
export function AuthCallbackScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ code?: string }>();
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current || !params.code) return;
    exchanged.current = true;

    void Linking.getInitialURL().then((initialUrl) =>
      completeSignIn(initialUrl ?? Linking.createURL(`/callback?code=${params.code}`)),
    );
  }, [params.code]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Getting you signed in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
