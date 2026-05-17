import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';
import { getLastNDays } from '@/shared/lib/dateUtils';
import { SuggestionCard } from '@/domains/progress/components/SuggestionCard';
import { useTasks } from '@/domains/task-planning/selectors';
import { useDayRecords } from '@/domains/progress/selectors';
import {
  generateSuggestions,
  getNextBestTask,
} from '@/domains/progress/services/SuggestionEngine';
import type { TaskCategory } from '@/domains/task-planning/types';

const CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  LeetCode: 'Algorithm & data structure practice',
  Projects: 'Build something real for your portfolio',
  'System Design': 'Architecture and scalability thinking',
  Applications: 'Job applications and follow-ups',
  Learning: 'Courses, tutorials, documentation',
  Networking: 'Outreach, coffee chats, LinkedIn',
};

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tasks = useTasks();
  const dayRecords = useDayRecords();

  const suggestions = useMemo(
    () => generateSuggestions(tasks, dayRecords),
    [tasks, dayRecords]
  );
  const nextBest = useMemo(() => getNextBestTask(tasks, dayRecords), [tasks, dayRecords]);

  const last7 = useMemo(() => getLastNDays(7), []);

  const completedThisWeek = useMemo(
    () => tasks.filter((t) => t.status === 'completed' && last7.includes(t.date)),
    [tasks, last7]
  );

  const categoryStats = useMemo(() => {
    const counts: Partial<Record<TaskCategory, number>> = {};
    completedThisWeek.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a) as [TaskCategory, number][];
  }, [completedThisWeek]);

  const handleAddTask = (category: TaskCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/task-form', params: { category } });
  };

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
        <Text style={[styles.title, { color: colors.foreground }]}>Career Guidance</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Rule-based insights from your activity
        </Text>

        {nextBest ? (
          <View style={[styles.nextBestCard, { backgroundColor: colors.primary }]}>
            <View style={styles.nextBestTop}>
              <Feather name="target" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.nextBestTopLabel}>Next Best Task</Text>
            </View>
            <Text style={styles.nextBestTitle} numberOfLines={2}>
              {nextBest.title}
            </Text>
            <View style={styles.nextBestMeta}>
              <Text style={styles.nextBestMuted}>{nextBest.category}</Text>
              <Text style={styles.nextBestMuted}>·</Text>
              <Text style={styles.nextBestMuted}>{nextBest.estimatedDuration}m</Text>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/timer');
              }}
            >
              <Feather name="play" size={14} color={colors.primary} />
              <Text style={[styles.startBtnText, { color: colors.primary }]}>Start Now</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>This Week</Text>
          {completedThisWeek.length > 0 ? (
            <>
              <Text style={[styles.weekSummary, { color: colors.mutedForeground }]}>
                {completedThisWeek.length} tasks · {categoryStats.length} categories
              </Text>
              {categoryStats.map(([cat, count]) => (
                <View key={cat} style={styles.catRow}>
                  <View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                    <Text style={[styles.catDesc, { color: colors.mutedForeground }]}>
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </Text>
                  </View>
                  <View style={[styles.catBadge, { backgroundColor: `${colors.primary}22` }]}>
                    <Text style={[styles.catCount, { color: colors.primary }]}>{count}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.weekEmpty}>
              <Feather name="calendar" size={24} color={colors.border} />
              <Text style={[styles.weekEmptyText, { color: colors.mutedForeground }]}>
                Complete tasks to unlock insights
              </Text>
            </View>
          )}
        </View>

        <View style={styles.linkRow}>
          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/history')}
          >
            <Feather name="bar-chart-2" size={18} color={colors.primary} />
            <Text style={[styles.linkLabel, { color: colors.foreground }]}>History</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/achievements')}
          >
            <Feather name="award" size={18} color={colors.accent} />
            <Text style={[styles.linkLabel, { color: colors.foreground }]}>Achievements</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.insightsHeader, { color: colors.foreground }]}>
          Insights · {suggestions.length}
        </Text>

        {suggestions.length > 0 ? (
          suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAction={s.category ? () => handleAddTask(s.category!) : undefined}
            />
          ))
        ) : (
          <View
            style={[styles.allGoodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="check-circle" size={32} color={colors.accent} />
            <Text style={[styles.allGoodTitle, { color: colors.foreground }]}>
              You're on track
            </Text>
            <Text style={[styles.allGoodText, { color: colors.mutedForeground }]}>
              Keep balanced activity across categories. Check back after more sessions.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.privacyLink} onPress={() => router.push('/privacy')}>
          <Feather name="shield" size={13} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2, marginBottom: 20 },
  nextBestCard: { borderRadius: 20, padding: 20, marginBottom: 16, gap: 8 },
  nextBestTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextBestTopLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextBestTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 26 },
  nextBestMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextBestMuted: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)' },
  startBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  startBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  card: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16, gap: 12 },
  cardTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  weekSummary: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: -4 },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  catDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  catCount: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  weekEmpty: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  weekEmptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  linkRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  linkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  insightsHeader: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  allGoodCard: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 10 },
  allGoodTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  allGoodText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  privacyText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
