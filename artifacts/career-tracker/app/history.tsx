import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';
import { useTasks } from '@/domains/task-planning/selectors';
import { useDayRecords } from '@/domains/progress/selectors';
import { computeStreak } from '@/domains/progress/services/StreakEngine';
import { computeWeeklyData } from '@/domains/progress/services/StatsEngine';
import type { TaskCategory } from '@/domains/task-planning/types';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  LeetCode: '#FF6B35',
  Projects: '#4F7FFF',
  'System Design': '#9B59B6',
  Applications: '#00D4AA',
  Learning: '#F39C12',
  Networking: '#27AE60',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days[d.getDay()];
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tasks = useTasks();
  const dayRecords = useDayRecords();

  const streak = useMemo(() => computeStreak(dayRecords), [dayRecords]);
  const weeklyData = useMemo(() => computeWeeklyData(dayRecords), [dayRecords]);
  const maxMinutes = useMemo(
    () => Math.max(...weeklyData.map((d) => d.minutes), 30),
    [weeklyData]
  );
  const totalMinutesAllTime = useMemo(
    () => Object.values(dayRecords).reduce((s, r) => s + r.totalMinutes, 0),
    [dayRecords]
  );
  const totalTasksDone = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks]
  );

  const categoryBreakdown = useMemo(() => {
    const counts: Partial<Record<TaskCategory, number>> = {};
    tasks
      .filter((t) => t.status === 'completed')
      .forEach((t) => {
        counts[t.category] = (counts[t.category] ?? 0) + 1;
      });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => ({ cat: cat as TaskCategory, count }));
  }, [tasks]);

  const recentDays = useMemo(
    () =>
      Object.values(dayRecords)
        .filter((r) => r.completedTaskIds.length > 0)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 14),
    [dayRecords]
  );

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>History</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.summaryValue}>{streak}</Text>
            <Text style={styles.summaryLabel}>Day Streak</Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="check-circle" size={20} color={colors.accent} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totalTasksDone}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Tasks Done</Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="clock" size={20} color={colors.primary} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {totalMinutesAllTime >= 60
                ? `${Math.floor(totalMinutesAllTime / 60)}h`
                : `${totalMinutesAllTime}m`}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Time</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
          <View style={styles.chart}>
            {weeklyData.map((day) => {
              const barHeight = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
              const isToday = day.date === new Date().toISOString().split('T')[0];
              return (
                <View key={day.date} style={styles.barCol}>
                  <Text
                    style={[
                      styles.barCount,
                      { color: day.count > 0 ? colors.accent : 'transparent' },
                    ]}
                  >
                    {day.count}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (`${barHeight}%` as unknown) as number,
                          backgroundColor: isToday ? colors.primary : colors.accent,
                          opacity: day.minutes > 0 ? 1 : 0.15,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      { color: isToday ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {shortDay(day.date)}
                  </Text>
                  <Text style={[styles.barMinutes, { color: colors.mutedForeground }]}>
                    {day.minutes > 0 ? `${day.minutes}m` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {categoryBreakdown.length > 0 ? (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By Category</Text>
            <View style={styles.categoryList}>
              {categoryBreakdown.map(({ cat, count }) => (
                <View key={cat} style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
                  <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat}</Text>
                  <View style={styles.categoryBarWrap}>
                    <View
                      style={[
                        styles.categoryBar,
                        {
                          backgroundColor: CATEGORY_COLORS[cat],
                          width: (`${(count / totalTasksDone) * 100}%` as unknown) as number,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {recentDays.length > 0 ? (
          <View style={styles.daySection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Days</Text>
            {recentDays.map((record) => (
              <View
                key={record.date}
                style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.dayLeft}>
                  <Text style={[styles.dayDate, { color: colors.foreground }]}>
                    {formatDate(record.date)}
                  </Text>
                  <Text style={[styles.daySub, { color: colors.mutedForeground }]}>
                    {record.completedTaskIds.length} tasks · {record.totalMinutes}m
                  </Text>
                </View>
                <View style={[styles.dayBadge, { backgroundColor: `${colors.accent}22` }]}>
                  <Feather name="check" size={14} color={colors.accent} />
                  <Text style={[styles.dayBadgeText, { color: colors.accent }]}>
                    {record.completedTaskIds.length}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {recentDays.length === 0 && categoryBreakdown.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No history yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete tasks to see your progress and streaks here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
  content: { paddingHorizontal: 20, paddingTop: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  summaryValue: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  chart: { flexDirection: 'row', height: 160, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barCount: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  barTrack: { flex: 1, width: '80%', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  barMinutes: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  categoryList: { gap: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 100 },
  categoryBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBar: { height: '100%', borderRadius: 3 },
  categoryCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold', width: 24, textAlign: 'right' },
  daySection: { marginBottom: 24 },
  dayCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 8,
  },
  dayLeft: { gap: 3 },
  dayDate: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  daySub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dayBadgeText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 8 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
