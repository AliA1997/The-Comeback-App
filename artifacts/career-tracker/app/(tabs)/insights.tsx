import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/store/useAppStore';
import { generateSuggestions, getNextBestTask } from '@/services/SuggestionEngine';
import type { TaskCategory } from '@/types';

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
  const { tasks, dayRecords } = useAppStore();

  const suggestions = useMemo(() => generateSuggestions(tasks, dayRecords), [tasks, dayRecords]);
  const nextBest = useMemo(() => getNextBestTask(tasks, dayRecords), [tasks, dayRecords]);

  const last7 = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && last7.includes(t.date)
  );

  const categoryStats = useMemo(() => {
    const counts: Partial<Record<TaskCategory, number>> = {};
    completedThisWeek.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a) as [TaskCategory, number][];
  }, [completedThisWeek]);

  const handleAddTask = (category: TaskCategory) => {
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
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Feather name="zap" size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>Career Guidance</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Rule-based insights from your activity
            </Text>
          </View>
        </View>

        {/* Next Best Task */}
        {nextBest ? (
          <View style={[styles.nextBestCard, { backgroundColor: colors.primary }]}>
            <View style={styles.nextBestHeader}>
              <Feather name="target" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nextBestLabel}>Next Best Task</Text>
            </View>
            <Text style={styles.nextBestTitle} numberOfLines={2}>
              {nextBest.title}
            </Text>
            <View style={styles.nextBestMeta}>
              <Text style={styles.nextBestCategory}>{nextBest.category}</Text>
              <Text style={styles.nextBestDot}>·</Text>
              <Text style={styles.nextBestDuration}>{nextBest.estimatedDuration}m</Text>
            </View>
            <TouchableOpacity
              style={styles.nextBestBtn}
              onPress={() => router.push('/timer')}
            >
              <Feather name="play" size={14} color={colors.primary} />
              <Text style={[styles.nextBestBtnText, { color: colors.primary }]}>Start Now</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* This Week Activity */}
        <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
          {completedThisWeek.length > 0 ? (
            <>
              <Text style={[styles.weekSummary, { color: colors.mutedForeground }]}>
                {completedThisWeek.length} tasks completed across {categoryStats.length} categories
              </Text>
              {categoryStats.map(([cat, count]) => (
                <View key={cat} style={styles.catRow}>
                  <View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                    <Text style={[styles.catDesc, { color: colors.mutedForeground }]}>
                      {CATEGORY_DESCRIPTIONS[cat]}
                    </Text>
                  </View>
                  <View style={[styles.catCount, { backgroundColor: `${colors.primary}22` }]}>
                    <Text style={[styles.catCountText, { color: colors.primary }]}>{count}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.weekEmpty}>
              <Feather name="calendar" size={28} color={colors.border} />
              <Text style={[styles.weekEmptyText, { color: colors.mutedForeground }]}>
                No completed tasks yet this week. Start one to get insights.
              </Text>
            </View>
          )}
        </View>

        {/* Insights */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
          Insights · {suggestions.length}
        </Text>

        {suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={
                suggestion.category
                  ? () => handleAddTask(suggestion.category!)
                  : undefined
              }
            />
          ))
        ) : (
          <View style={[styles.allGoodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={32} color={colors.accent} />
            <Text style={[styles.allGoodTitle, { color: colors.foreground }]}>You're on track</Text>
            <Text style={[styles.allGoodText, { color: colors.mutedForeground }]}>
              Keep up the balanced activity across all categories. Check back after a few more days of work.
            </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  headerText: { flex: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  nextBestCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  nextBestHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextBestLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
  nextBestTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 26 },
  nextBestMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextBestCategory: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  nextBestDot: { color: 'rgba(255,255,255,0.4)' },
  nextBestDuration: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  nextBestBtn: {
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
  nextBestBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  weekCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  weekSummary: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: -4 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  catName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  catDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  catCount: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  catCountText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  weekEmpty: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  weekEmptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  allGoodCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  allGoodTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  allGoodText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
