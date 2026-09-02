import { Feather } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';

const VISIBLE_MS = 5000;

interface ToastState {
  message: string;
  onRetry?: (() => void) | undefined;
}

interface ToastApi {
  /** Shows a message; passing `onRetry` adds a Try again affordance. */
  show: (message: string, onRetry?: () => void) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Imperative handle for code that runs outside React — the session lifecycle
 * services fire server mutations from plain functions and still need to tell
 * the user when a write did not land.
 */
let handle: ToastApi | null = null;

export function notify(message: string, onRetry?: () => void): void {
  handle?.show(message, onRetry);
}

/**
 * Mutation errors surface here (§ 8.5). Kept out of Zustand on purpose: a
 * toast is ephemeral UI that nothing else reads and nothing should persist.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const show = useCallback(
    (message: string, onRetry?: () => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, onRetry });
      timerRef.current = setTimeout(() => setToast(null), VISIBLE_MS);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  useEffect(() => {
    handle = api;
    return () => {
      if (handle === api) handle = null;
    };
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? <Toast toast={toast} onDismiss={dismiss} /> : null}
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + (Platform.OS === 'web' ? 96 : 88) }]}
    >
      <View
        accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="alert-circle" size={16} color={colors.destructive} />
        <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            hitSlop={12}
            onPress={() => {
              onDismiss();
              toast.onRetry?.();
            }}
          >
            <Text style={[styles.action, { color: colors.primary }]}>Try again</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={12}
            onPress={onDismiss}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return context;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  message: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  action: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
