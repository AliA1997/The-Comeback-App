import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SkeletonList } from '@/shared/ui/SkeletonList';
import { useColors } from '@/shared/theme/useColors';
import { ActiveTimerBanner } from '@/domains/time-focus/components/ActiveTimerBanner';
import { ListCard } from '../components/ListCard';
import { useLists } from '../hooks/useLists';
import type { List } from '../types';

/**
 * The lists index (AC-2). Organising work into named lists is what turns an
 * endless backlog into something finishable, which is the whole point of
 * Story 1.
 */
export function ListsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lists, isLoading, isError, refetch } = useLists();

  const handleOpen = useCallback(
    (list: List) => router.push({ pathname: '/list/[listId]', params: { listId: list.id } }),
    [router],
  );

  const handleEdit = useCallback(
    (list: List) => router.push({ pathname: '/list-form', params: { id: list.id } }),
    [router],
  );

  const handleCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/list-form');
  }, [router]);

  const totalTasks = lists.reduce((sum, list) => sum + list.taskCount, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: 120 + (Platform.OS === 'web' ? 34 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.foreground }]}>Lists</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {lists.length} {lists.length === 1 ? 'list' : 'lists'} · {totalTasks}{' '}
              {totalTasks === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="New list"
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleCreate}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ActiveTimerBanner />

        {isLoading ? (
          <SkeletonList count={4} rowHeight={72} />
        ) : isError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="cloud-off" size={22} color={colors.mutedForeground} />
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
              We couldn&apos;t load your lists just now.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={[styles.retryBtn, { borderColor: colors.primary }]}
              onPress={() => refetch()}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : lists.length === 0 ? (
          <EmptyState
            icon="list"
            title="Group your work"
            message="A list per goal — applications this week, system design prep — makes the day's plan obvious."
            actionLabel="Create your first list"
            onAction={handleCreate}
          />
        ) : (
          lists.map((list) => (
            <ListCard key={list.id} list={list} onPress={handleOpen} onEdit={handleEdit} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  retryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
  },
  retryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
