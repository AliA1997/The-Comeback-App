import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskCard } from '@/components/TaskCard';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/store/useAppStore';
import type { Task, TaskCategory, TaskStatus } from '@/types';

const CATEGORIES: (TaskCategory | 'All')[] = [
  'All',
  'LeetCode',
  'Projects',
  'System Design',
  'Applications',
  'Learning',
  'Networking',
];

const STATUS_FILTERS: (TaskStatus | 'All')[] = ['All', 'pending', 'in_progress', 'completed', 'skipped'];

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'All'>('pending');

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => selectedCategory === 'All' || t.category === selectedCategory)
      .filter((t) => selectedStatus === 'All' || t.status === selectedStatus)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, selectedCategory, selectedStatus]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Tasks</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {pendingCount} pending · {tasks.length} total
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/task-form');
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
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
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedStatus(status as typeof selectedStatus);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#fff' : colors.mutedForeground },
                  ]}
                >
                  {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Category Filter */}
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
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.foreground : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat as typeof selectedCategory);
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

        {/* Task List */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No tasks here</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {selectedStatus === 'pending'
                ? 'Add a task to start tracking your progress.'
                : 'No tasks match this filter.'}
            </Text>
            {selectedStatus === 'pending' ? (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/task-form')}
              >
                <Feather name="plus" size={15} color="#fff" />
                <Text style={styles.emptyBtnText}>New Task</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() =>
                  router.push({ pathname: '/task-form', params: { id: task.id } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
