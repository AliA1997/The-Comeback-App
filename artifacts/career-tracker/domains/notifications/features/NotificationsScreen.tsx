import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useColors } from '@/shared/theme/useColors';
import { useAppStore } from '@/shared/store/root';
import { useNotifications } from '@/domains/notifications/selectors';
import type { NotificationKind } from '@/domains/notifications/types';

const KIND_ICON: Record<NotificationKind, string> = {
  nudge: 'compass',
  achievement: 'award',
  timer: 'clock',
  system: 'info',
  tip: 'zap',
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = useNotifications();

  const markRead = useAppStore((s) => s.markRead);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const clearNotification = useAppStore((s) => s.clearNotification);
  const clearAllNotifications = useAppStore((s) => s.clearAllNotifications);

  const unread = items.filter((n) => n.readAt === null).length;

  const handleTap = (id: string, route?: string) => {
    markRead(id);
    if (route) {
      router.back();
      setTimeout(() => router.push(route as never), 50);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Notifications {unread > 0 ? `· ${unread}` : ''}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            if (unread > 0) markAllRead();
            else clearAllNotifications();
          }}
        >
          <Text style={[styles.actionLink, { color: colors.primary }]}>
            {unread > 0 ? 'Mark all read' : 'Clear all'}
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="All caught up"
          message="You have no notifications. We'll let you know when there's something new."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {items.map((n) => {
            const tint =
              n.kind === 'achievement'
                ? colors.accent
                : n.kind === 'nudge'
                ? colors.primary
                : n.kind === 'timer'
                ? colors.accent
                : colors.mutedForeground;
            return (
              <Pressable
                key={n.id}
                onPress={() => handleTap(n.id, n.route)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  clearNotification(n.id);
                }}
                style={[
                  styles.item,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: n.readAt ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: `${tint}22` },
                  ]}
                >
                  <Feather name={KIND_ICON[n.kind] as never} size={16} color={tint} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.title,
                        { color: colors.foreground, fontFamily: n.readAt ? 'Inter_500Medium' : 'Inter_700Bold' },
                      ]}
                      numberOfLines={2}
                    >
                      {n.title}
                    </Text>
                    {n.readAt === null ? (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    ) : null}
                  </View>
                  <Text style={[styles.bodyText, { color: colors.mutedForeground }]} numberOfLines={3}>
                    {n.body}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                    {relativeTime(n.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Long-press a notification to remove it.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  actionLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  item: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, lineHeight: 19 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  bodyText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  timestamp: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 16,
  },
});
