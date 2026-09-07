import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '@/shared/ui/AdBanner';
import { EmptyState } from '@/shared/ui/EmptyState';
import { QuickStatsRow } from '@/shared/ui/QuickStatsRow';
import { ScorePill } from '@/shared/ui/ScorePill';
import { SkeletonList } from '@/shared/ui/SkeletonList';
import { useColors } from '@/shared/theme/useColors';
import { useTabBarInset } from '@/shared/ui/tabBarMetrics';
import { todayStr } from '@/shared/lib/dateUtils';
import { useHydrationState } from '@/shared/store/root';
import { taskDate, type Task } from '@/shared/types/task';
import { useIdleDetection } from '@/domains/time-focus/hooks/useIdleDetection';
import { TaskCard } from '@/domains/task-planning/components/TaskCard';
import { useEarnedScore, useTasks } from '@/domains/task-planning/hooks/useTasks';
import { useDayRecords } from '@/domains/progress/selectors';
import { computeStreak } from '@/domains/progress/services/StreakEngine';
import { computeTodayStats } from '@/domains/progress/services/StatsEngine';
import {
  generateSuggestions,
  getNextBestTask,
} from '@/domains/progress/services/SuggestionEngine';
import { useOnboardingComplete } from '@/domains/user-profile/selectors';
import { useProfileName } from '@/domains/user-profile/hooks/useProfile';
import { OnboardingWizard } from '@/domains/user-profile/components/OnboardingWizard';
import { NotificationBell } from '@/domains/notifications/components/NotificationBell';
import { DailyPlanCard } from '../components/DailyPlanCard';

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();

  // Granular subscriptions — this screen does NOT re-render on timer ticks.
  const { tasks, isLoading } = useTasks();
  const dayRecords = useDayRecords();
  const earnedScore = useEarnedScore();
  const { hasHydrated, onboardingComplete } = useHydrationState();
  const name = useProfileName();
  useIdleDetection();

  const today = todayStr();

  // Pure derivations memoized on their inputs.
  const stats = useMemo(() => computeTodayStats(tasks, dayRecords), [tasks, dayRecords]);
  const streak = useMemo(() => computeStreak(dayRecords), [dayRecords]);

  const todayTasks = useMemo(
    () => tasks.filter((t) => taskDate(t) === today && t.status === 'pending'),
    [tasks, today]
  );
  const completedToday = useMemo(
    () => tasks.filter((t) => taskDate(t) === today && t.status === 'completed'),
    [tasks, today]
  );
  // Paused work is still in progress from the user's point of view; hiding it
  // here would make a task they stepped away from look abandoned.
  const inProgressToday = useMemo(
    () =>
      tasks.filter(
        (t) =>
          taskDate(t) === today && (t.status === 'in_progress' || t.status === 'paused')
      ),
    [tasks, today]
  );

  const suggestions = useMemo(
    () => generateSuggestions(tasks, dayRecords),
    [tasks, dayRecords]
  );
  const nextBest = useMemo(() => getNextBestTask(tasks, dayRecords), [tasks, dayRecords]);
  const topSuggestion = useMemo(
    () => suggestions.find((s) => s.type === 'warning') ?? suggestions[0] ?? null,
    [suggestions]
  );

  const inProgressOthers = useMemo(
    () => inProgressToday.filter((t: Task) => t.id !== nextBest?.id),
    [inProgressToday, nextBest]
  );
  const todayOthers = useMemo(
    () => todayTasks.filter((t: Task) => t.id !== nextBest?.id),
    [todayTasks, nextBest]
  );

  const handleEdit = useCallback(
    (id: string) => router.push({ pathname: '/task-form', params: { id } }),
    [router]
  );
  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/task-form');
  }, [router]);

  const showOnboarding = hasHydrated && !onboardingComplete;
  const greeting = name ? `${greetingText()}, ${name}` : greetingText();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: tabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
              {earnedScore > 0 ? <ScorePill score={earnedScore} earned /> : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <NotificationBell />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="New task"
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <QuickStatsRow
          completedCount={stats.completedCount}
          totalMinutes={stats.totalMinutes}
          streak={streak}
        />


        <DailyPlanCard />

        {topSuggestion && tasks.length > 0 ? (
          <TouchableOpacity
            style={[
              styles.insightStrip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/(tabs)/insights')}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {topSuggestion.message}
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {nextBest ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Next Best Task</Text>
              <View style={[styles.recBadge, { backgroundColor: `${colors.accent}22` }]}>
                <Text style={[styles.recBadgeText, { color: colors.accent }]}>Recommended</Text>
              </View>
            </View>
            <TaskCard task={nextBest} onEdit={() => handleEdit(nextBest.id)} />
          </View>
        ) : null}

        {inProgressOthers.length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                styles.sectionTitleSpaced,
                { color: colors.foreground },
              ]}
            >
              In Progress
            </Text>
            {inProgressOthers.map((task: Task) => (
              <TaskCard key={task.id} task={task} onEdit={() => handleEdit(task.id)} />
            ))}
          </View>
        ) : null}

        {todayOthers.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {todayTasks.length} pending
              </Text>
            </View>
            {todayOthers.slice(0, 5).map((task: Task) => (
              <TaskCard key={task.id} task={task} onEdit={() => handleEdit(task.id)} />
            ))}
            {todayTasks.length > 6 ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>
                  View all {todayTasks.length} tasks
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {completedToday.length > 0 ? (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                styles.sectionTitleSpaced,
                { color: colors.foreground },
              ]}
            >
              Completed today
            </Text>
            {completedToday.slice(0, 3).map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        ) : null}

        {isLoading ? (
          <SkeletonList count={3} />
        ) : tasks.length === 0 && hasHydrated && onboardingComplete ? (
          <EmptyState
            icon="briefcase"
            title="Start your comeback"
            message="Add one task and today has a shape. It only takes a minute."
            actionLabel="Add first task"
            onAction={() => router.push('/task-form')}
          />
        ) : null}
      </ScrollView>

      <AdBanner />

      {showOnboarding ? <OnboardingWizard /> : null}
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
    gap: 12,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  },
  sectionTitleSpaced: { marginBottom: 12 },
  recBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  count: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  viewAll: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 4 },
});
