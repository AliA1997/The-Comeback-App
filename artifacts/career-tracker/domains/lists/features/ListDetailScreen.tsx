import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ScorePill } from '@/shared/ui/ScorePill';
import { SkeletonList } from '@/shared/ui/SkeletonList';
import { useColors } from '@/shared/theme/useColors';
import type { Task } from '@/shared/types/task';
import { TaskCard } from '@/domains/task-planning/components/TaskCard';
import { useTasks } from '@/domains/task-planning/hooks/useTasks';
import { useDeleteList, useList } from '../hooks/useLists';

/** Above this many rows, virtualise (§ 8.7) — long lists on low-end Android. */
const VIRTUALISATION_THRESHOLD = 50;

export function ListDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();

  const list = useList(listId);
  const { tasks, isLoading } = useTasks(listId ? { listId } : undefined);
  const deleteList = useDeleteList();

  const earned = useMemo(
    () =>
      tasks.reduce(
        (total, task) => (task.status === 'completed' ? total + task.score : total),
        0,
      ),
    [tasks],
  );

  const handleAddTask = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/task-form', params: { listId } });
  }, [router, listId]);

  const handleEditTask = useCallback(
    (task: Task) => router.push({ pathname: '/task-form', params: { id: task.id } }),
    [router],
  );

  /** The confirmation states the task count, per spec § 12.1. */
  const handleDeleteList = useCallback(() => {
    if (!listId || !list) return;

    const run = () => {
      deleteList.mutate({ listId });
      router.back();
    };

    const count = list.taskCount;
    const detail =
      count === 0
        ? 'You can restore it later if you change your mind.'
        : `${count} ${count === 1 ? 'task moves' : 'tasks move'} to deleted with it. You can restore the whole list later.`;

    if (Platform.OS === 'web') {
      run();
      return;
    }

    Alert.alert(`Delete "${list.name}"?`, detail, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  }, [deleteList, list, listId, router]);

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard task={item} onEdit={() => handleEditTask(item)} />
    ),
    [handleEditTask],
  );

  const header = (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to lists"
          hitSlop={12}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Rename list"
            style={[styles.iconBtn, { borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/list-form', params: { id: listId } })}
          >
            <Feather name="edit-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Delete list"
            style={[styles.iconBtn, { borderColor: colors.border }]}
            onPress={handleDeleteList}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {list?.name ?? 'List'}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </Text>
        {earned > 0 ? <ScorePill score={earned} earned small /> : null}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add a task to this list"
        style={[styles.addRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleAddTask}
      >
        <Feather name="plus" size={16} color={colors.primary} />
        <Text style={[styles.addLabel, { color: colors.primary }]}>Add a task</Text>
      </TouchableOpacity>
    </>
  );

  const body = isLoading ? (
    <SkeletonList count={3} />
  ) : (
    // Empty lists offer task creation directly rather than only a message
    // (spec § 12.7 — fewer steps, Principle V).
    <EmptyState
      icon="check-square"
      title="Nothing here yet"
      message="Add the first task and this list starts working for you."
      actionLabel="Add a task"
      onAction={handleAddTask}
    />
  );

  const padding = {
    paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
    paddingBottom: 120 + (Platform.OS === 'web' ? 34 : 0),
  };

  // FlatList virtualisation only past the threshold; below it the plain map
  // keeps scroll behaviour simpler and measurement shows no benefit (§ 8.7).
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        renderItem={renderTask}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        contentContainerStyle={[styles.content, padding]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={tasks.length > VIRTUALISATION_THRESHOLD}
        initialNumToRender={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  addLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
