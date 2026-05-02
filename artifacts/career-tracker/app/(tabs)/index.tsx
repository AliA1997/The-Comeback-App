import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
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
import { AdBanner } from '@/components/AdBanner';
import { StatsCard } from '@/components/StatsCard';
import { TaskCard } from '@/components/TaskCard';
import { useColors } from '@/hooks/useColors';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useTimer } from '@/hooks/useTimer';
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
  const { tasks, dayRecords, getTodayStats, getStreak, activeTimer } = useAppStore();
  const { task: activeTask } = useTimer();
  useIdleDetection();

  const stats = getTodayStats();
  const streak = getStreak();
  const today = todayStr();
  const todayTasks = tasks.filter((t) => t.date === today && t.status === 'pending');
  const completedToday = tasks.filter((t) => t.date === today && t.status === 'completed');

  const suggestions = useMemo(() => generateSuggestions(tasks, dayRecords), [tasks, dayRecords]);
  const nextBest = useMemo(() => getNextBestTask(tasks, dayRecords), [tasks, dayRecords]);

  const topInsight = suggestions[0] ?? null;

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
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greetingText()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Career Dashboard</Text>
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

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatsCard label="Done today" value={stats.completedCount} />
          <StatsCard
            label="Time logged"
            value={stats.totalMinutes >= 60
              ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
              : `${stats.totalMinutes}m`}
          />
          <StatsCard label="Day streak" value={streak} accent />
        </View>

        {/* Active Timer Banner */}
        {activeTimer && activeTask ? (
          <Pressable
            style={[styles.activeBanner, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/timer')}
          >
            <View style={styles.activeBannerLeft}>
              <View style={styles.pulsingDot} />
              <View>
                <Text style={styles.activeBannerLabel}>Active Timer</Text>
                <Text style={styles.activeBannerTask} numberOfLines={1}>
                  {activeTask.title}
                </Text>
              </View>
            </View>
            <View style={styles.activeBannerRight}>
              <Text style={styles.activeBannerTime}>
                {String(Math.floor(activeTimer.remainingSeconds / 60)).padStart(2, '0')}:
                {String(activeTimer.remainingSeconds % 60).padStart(2, '0')}
              </Text>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </Pressable>
        ) : null}

        {/* Top Insight */}
        {topInsight ? (
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.insightText, { color: colors.mutedForeground }]} numberOfLines={2}>
              {topInsight.message}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/insights' as any)}>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Next Best Task */}
        {nextBest ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Next Best Task</Text>
            <TaskCard task={nextBest} onEdit={() => router.push({ pathname: '/task-form', params: { id: nextBest.id } })} />
          </View>
        ) : null}

        {/* Today's Pending Tasks */}
        {todayTasks.filter((t) => t.id !== nextBest?.id).length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Today's Tasks
              </Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
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
                  onEdit={() =>
                    router.push({ pathname: '/task-form', params: { id: task.id } })
                  }
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

        {/* Recently Completed */}
        {completedToday.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Completed Today</Text>
            {completedToday.slice(0, 3).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        ) : null}

        {/* Empty State */}
        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="briefcase" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Start your comeback
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your first task to begin tracking your progress back into the industry.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/task-form')}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add your first task</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <AdBanner />
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
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  activeBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  activeBannerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeBannerTask: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    marginTop: 1,
  },
  activeBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBannerTime: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  insightCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  insightText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginBottom: 12 },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  viewAll: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
