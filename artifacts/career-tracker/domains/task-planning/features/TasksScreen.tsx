import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
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
import { useTabBarInset } from '@/shared/ui/tabBarMetrics';
import { TASK_CATEGORIES, type TaskCategory } from '@/shared/types/skills';
import { PRIORITY_RANK, taskCategory, type Task } from '@/shared/types/task';
import { TaskCard } from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { STATUS_FILTERS, STATUS_LABELS, type StatusFilter } from '../types';

const CATEGORIES: (TaskCategory | 'All')[] = ['All', ...TASK_CATEGORIES];

/** Above this many rows, virtualise (§ 8.7) — long lists on low-end Android. */
const VIRTUALISATION_THRESHOLD = 50;

export function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('pending');

  // Status is a server-side filter; category is client-side because task types
  // are a small fixed set and refetching per chip would be wasteful.
  const { tasks, isLoading } = useTasks(
    selectedStatus === 'All' ? undefined : { status: selectedStatus },
  );

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => selectedCategory === 'All' || taskCategory(t) === selectedCategory)
        .sort(
          (a, b) =>
            (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [tasks, selectedCategory],
  );

  const outstandingScore = useMemo(
    () =>
      filtered.reduce(
        (total, task) => (task.status === 'completed' ? total : total + task.score),
        0,
      ),
    [filtered],
  );

  const handleEdit = useCallback(
    (task: Task) => router.push({ pathname: '/task-form', params: { id: task.id } }),
    [router],
  );

  const renderTask = useCallback(
    ({ item }: { item: Task }) => <TaskCard task={item} onEdit={() => handleEdit(item)} />,
    [handleEdit],
  );

  const header = (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Tasks</Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
            </Text>
            {outstandingScore > 0 ? <ScorePill score={outstandingScore} small /> : null}
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="New task"
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/task-form');
          }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((status) => {
          const active = selectedStatus === status;
          return (
            <Pressable
              key={status}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={status === 'All' ? 'All statuses' : STATUS_LABELS[status]}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedStatus(status);
              }}
            >
              <Text
                style={[styles.filterText, { color: active ? '#fff' : colors.mutedForeground }]}
              >
                {status === 'All' ? 'All' : STATUS_LABELS[status]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat === 'All' ? 'All categories' : cat}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.secondary : colors.card,
                  borderColor: active ? colors.foreground : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

  const empty = isLoading ? (
    <SkeletonList count={4} />
  ) : (
    <EmptyState
      icon="inbox"
      title={selectedStatus === 'pending' ? 'Nothing waiting on you' : 'Nothing here'}
      message={
        selectedStatus === 'pending'
          ? 'Add a task and today has a shape. Small ones count.'
          : 'No tasks match this filter yet.'
      }
      {...(selectedStatus === 'pending'
        ? { actionLabel: 'New task', onAction: () => router.push('/task-form') }
        : {})}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(task) => task.id}
        renderItem={renderTask}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: tabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={filtered.length > VIRTUALISATION_THRESHOLD}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: { marginBottom: 8 },
  filterContent: { gap: 8, paddingRight: 20 },
  filterChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
