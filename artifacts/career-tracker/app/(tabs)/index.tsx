import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveTimerBanner } from '@/components/ActiveTimerBanner';
import { AdBanner } from '@/components/AdBanner';
import { EmptyState } from '@/components/EmptyState';
import { LandingOverlay } from '@/components/LandingOverlay';
import { QuickStatsRow } from '@/components/QuickStatsRow';
import { TaskCard } from '@/components/TaskCard';
import { useColors } from '@/hooks/useColors';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useAppStore } from '@/store/useAppStore';
import { generateSuggestions, getNextBestTask } from '@/services/SuggestionEngine';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, dayRecords, getTodayStats, getStreak, _hasHydrated, hasSeenLanding } = useAppStore();
  useIdleDetection();

  const stats = getTodayStats();
  const streak = getStreak();
  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.date === today && t.status === 'pending');
  const completedToday = tasks.filter((t) => t.date === today && t.status === 'completed');
  const inProgressToday = tasks.filter((t) => t.date === today && t.status === 'in_progress');

  const suggestions = useMemo(() => generateSuggestions(tasks, dayRecords), [tasks, dayRecords]);
  const nextBest = useMemo(() => getNextBestTask(tasks, dayRecords), [tasks, dayRecords]);
  const topSuggestion = suggestions.find((s) => s.type === 'warning') ?? suggestions[0] ?? null;

  const showLanding = _hasHydrated && !hasSeenLanding;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: 120 + (Platform.OS === 'web' ? 34 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greetingText()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/task-form');
            }}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <QuickStatsRow
          completedCount={stats.completedCount}
          totalMinutes={stats.totalMinutes}
          streak={streak}
        />

        {/* Active Timer Banner */}
        <ActiveTimerBanner />

        {/* Top Suggestion strip */}
        {topSuggestion && tasks.length > 0 ? (
          <TouchableOpacity
            style={[styles.insightStrip, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/insights' as any)}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {topSuggestion.message}
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Next Best Task */}
        {nextBest ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Next Best Task</Text>
              <View style={[styles.recBadge, { backgroundColor: `${colors.accent}22` }]}>
                <Text style={[styles.recBadgeText, { color: colors.accent }]}>Recommended</Text>
              </View>
            </View>
            <TaskCard
              task={nextBest}
              onEdit={() => router.push({ pathname: '/task-form', params: { id: nextBest.id } })}
            />
          </View>
        ) : null}

        {/* In Progress */}
        {inProgressToday.filter((t) => t.id !== nextBest?.id).length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>In Progress</Text>
            {inProgressToday
              .filter((t) => t.id !== nextBest?.id)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => router.push({ pathname: '/task-form', params: { id: task.id } })}
                />
              ))}
          </View>
        ) : null}

        {/* Today's pending tasks */}
        {todayTasks.filter((t) => t.id !== nextBest?.id).length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {todayTasks.length} pending
              </Text>
            </View>
            {todayTasks
              .filter((t) => t.id !== nextBest?.id)
              .slice(0, 5)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => router.push({ pathname: '/task-form', params: { id: task.id } })}
                />
              ))}
            {todayTasks.length > 6 ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks' as any)}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all {todayTasks.length} tasks
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Completed today */}
        {completedToday.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Completed today</Text>
            {completedToday.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        ) : null}

        {/* Empty state */}
        {tasks.length === 0 && _hasHydrated && hasSeenLanding ? (
          <EmptyState
            icon="briefcase"
            title="Start your comeback"
            message="Add your first task to begin tracking your progress back into the industry."
            actionLabel="Add first task"
            onAction={() => router.push('/task-form')}
          />
        ) : null}
      </ScrollView>

      <AdBanner />

      {/* Animated landing overlay — shown only on first launch */}
      {showLanding ? <LandingOverlay /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F7FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  insightStrip: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  insightText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  section: { marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  recBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  viewAll: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 4 },
});
