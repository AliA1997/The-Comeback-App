import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { signInWithProvider } from '../services/AuthService';
import { useEnabledProviders } from '../hooks/useEnabledProviders';
import { useAuthError, useAuthStatus } from '../selectors';
import type { OAuthProvider } from '../types';

const PROVIDER_UI: Record<OAuthProvider, { label: string; icon: string }> = {
  github: { label: 'Continue with GitHub', icon: 'github' },
  google: { label: 'Continue with Google', icon: 'chrome' },
};

/**
 * First screen a new user sees (AC-1). The copy frames the app as a place to
 * rebuild momentum, never as a place that will judge the gap on a CV.
 */
export function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const status = useAuthStatus();
  const error = useAuthError();
  const { providers, isLoading: loadingProviders } = useEnabledProviders();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const busy = status === 'loading' || pending !== null || loadingProviders;

  const handleSignIn = async (provider: OAuthProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPending(provider);
    try {
      await signInWithProvider(provider);
    } finally {
      setPending(null);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 24),
        },
      ]}
    >
      <View style={styles.hero}>
        <View style={[styles.mark, { backgroundColor: `${colors.primary}22` }]}>
          <Feather name="trending-up" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Career Comeback</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Small, steady days add up. Sign in and pick up where you left off.
        </Text>
      </View>

      <View style={styles.actions}>
        {providers.map((provider) => {
          const ui = PROVIDER_UI[provider];
          return (
            <Pressable
              key={provider}
              accessibilityRole="button"
              accessibilityLabel={ui.label}
              accessibilityState={{ disabled: busy }}
              disabled={busy || !isSupabaseConfigured}
              onPress={() => void handleSignIn(provider)}
              style={({ pressed }) => [
                styles.provider,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: busy || !isSupabaseConfigured ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {pending === provider ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name={ui.icon as never} size={20} color={colors.foreground} />
              )}
              <Text style={[styles.providerLabel, { color: colors.foreground }]}>
                {ui.label}
              </Text>
            </Pressable>
          );
        })}

        {!isSupabaseConfigured ? (
          <Text style={[styles.notice, { color: colors.mutedForeground }]}>
            Sign-in isn&apos;t configured in this build yet. Set
            EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable it.
          </Text>
        ) : null}

        {error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: `${colors.destructive}18`, borderColor: colors.destructive },
            ]}
          >
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.foreground }]}>
              That didn&apos;t go through. Tap a provider to try again.
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        Your job-search data stays private to your account. Nothing is shared
        without you asking for it.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actions: { gap: 12 },
  provider: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  providerLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  notice: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  privacy: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 24,
  },
});
