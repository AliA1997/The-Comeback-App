import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureApiClient, queryClient } from '@/shared/api/client';
import { AdService } from '@/shared/services/AdService';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { ToastProvider } from '@/shared/ui/ToastProvider';
import { bootstrap } from '@/domains/auth/services/AuthService';
import { useAuthStatus } from '@/domains/auth/selectors';
import { NudgeProvider } from '@/domains/notifications/components/NudgeProvider';
import { NotificationService } from '@/domains/notifications/services/NotificationService';
import { useLocalTaskMigration } from '@/domains/task-planning/hooks/useLocalTaskMigration';
import { useEnsureProfile } from '@/domains/user-profile/hooks/useProfile';
import { TimerProvider } from '@/domains/time-focus/components/TimerProvider';

SplashScreen.preventAutoHideAsync();

// Initialize service singletons once at module scope.
configureApiClient();
AdService.initialize();
NotificationService.initialize();

const MODAL_SCREENS = [
  'timer',
  'task-form',
  'list-form',
  'privacy',
  'lesson',
  'achievements',
  'notifications',
  'history',
] as const;

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0E1A' } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="list/[listId]" options={{ headerShown: false }} />
      {MODAL_SCREENS.map((name) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      ))}
    </Stack>
  );
}

/**
 * Route-level permission check (§ 8.8.1): no route renders without a session.
 * Element-level checks are deliberately absent — the app is single-user with
 * no roles, and ownership is enforced server-side, not by hiding UI.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStatus();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (status === 'signedIn' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [status, inAuthGroup, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0E1A' }}>
        <ActivityIndicator size="large" color="#4F7FFF" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Runs inside the providers because the migration reads React Query and the
 * auth session. Renders nothing — it is a side effect with a lifecycle.
 */
function SignedInEffects() {
  useLocalTaskMigration();
  // Creates the profile row on first login and keeps it in the query cache.
  useEnsureProfile();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Reads the stored Supabase session and follows refreshes and expiries.
  useEffect(() => bootstrap(), []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ToastProvider>
                {/* TimerProvider owns the single global interval — prevents double-tick */}
                <TimerProvider>
                  {/* NudgeProvider rolls suggestions into inbox notifications */}
                  <NudgeProvider>
                    <SignedInEffects />
                    <AuthGuard>
                      <RootLayoutNav />
                    </AuthGuard>
                  </NudgeProvider>
                </TimerProvider>
              </ToastProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
