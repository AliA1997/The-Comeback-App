import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/shared/theme/useColors';
import { useUnreadNotificationCount } from '@/domains/notifications/selectors';

export function NotificationBell() {
  const colors = useColors();
  const router = useRouter();
  const unread = useUnreadNotificationCount();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityLabel={`Notifications, ${unread} unread`}
    >
      <Feather name="bell" size={18} color={colors.foreground} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
});
