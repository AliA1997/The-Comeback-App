import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';
import { useTabBarInset } from '@/shared/ui/tabBarMetrics';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import {
  LESSONS,
  MODULES,
  findModuleForLesson,
} from '@/domains/learning/data/catalog';
import { useAllLessonProgress } from '@/domains/learning/selectors';
import { useCareerTrack } from '@/domains/user-profile/hooks/useProfile';

export function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();
  const progress = useAllLessonProgress();
  const careerTrack = useCareerTrack();

  const completed = useMemo(
    () => Object.values(progress).filter((p) => p.status === 'completed').length,
    [progress]
  );
  const inProgress = useMemo(
    () => Object.values(progress).filter((p) => p.status === 'in_progress').length,
    [progress]
  );
  const totalMinutes = useMemo(
    () =>
      LESSONS.filter((l) => progress[l.id]?.status === 'completed').reduce(
        (acc, l) => acc + l.estimatedMinutes,
        0
      ),
    [progress]
  );

  const recommendation = useMemo(() => {
    const notStarted = LESSONS.filter(
      (l) => !progress[l.id] || progress[l.id].status === 'not_started'
    );
    if (notStarted.length === 0) return null;
    if (careerTrack === 'Frontend' || careerTrack === 'Fullstack' || careerTrack === 'Mobile') {
      const ui = notStarted.find((l) => l.category === 'Projects' || l.category === 'System Design');
      if (ui) return ui;
    }
    if (careerTrack === 'Backend' || careerTrack === 'DevOps') {
      const sys = notStarted.find((l) => l.category === 'System Design');
      if (sys) return sys;
    }
    return notStarted[0];
  }, [progress, careerTrack]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: tabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Learn</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Bite-sized lessons for your comeback
        </Text>

        <View style={styles.statRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Done</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalMinutes}m</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Logged</Text>
          </View>
        </View>

        {recommendation ? (
          <Pressable
            style={[styles.recCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/lesson', params: { id: recommendation.id } })}
          >
            <View style={styles.recTop}>
              <Feather name="compass" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.recTopLabel}>Recommended for you</Text>
            </View>
            <Text style={styles.recTitle}>{recommendation.title}</Text>
            <Text style={styles.recSummary} numberOfLines={2}>
              {recommendation.summary}
            </Text>
            <View style={styles.recMeta}>
              <Text style={styles.recMetaText}>{recommendation.category}</Text>
              <Text style={styles.recMetaText}>·</Text>
              <Text style={styles.recMetaText}>{recommendation.estimatedMinutes} min</Text>
            </View>
          </Pressable>
        ) : null}

        {MODULES.map((mod) => (
          <View key={mod.id} style={styles.moduleBlock}>
            <Text style={[styles.moduleTitle, { color: colors.foreground }]}>{mod.title}</Text>
            <Text style={[styles.moduleDesc, { color: colors.mutedForeground }]}>
              {mod.description}
            </Text>
            <View style={styles.lessonList}>
              {mod.lessonIds.map((lessonId) => {
                const lesson = LESSONS.find((l) => l.id === lessonId);
                if (!lesson) return null;
                const lp = progress[lesson.id];
                const status = lp?.status ?? 'not_started';
                const icon =
                  status === 'completed' ? 'check-circle' : status === 'in_progress' ? 'play-circle' : 'circle';
                const tint =
                  status === 'completed'
                    ? colors.accent
                    : status === 'in_progress'
                    ? colors.primary
                    : colors.mutedForeground;
                return (
                  <Pressable
                    key={lesson.id}
                    style={[
                      styles.lessonCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => router.push({ pathname: '/lesson', params: { id: lesson.id } })}
                  >
                    <Feather name={icon as never} size={20} color={tint} />
                    <View style={styles.lessonBody}>
                      <Text style={[styles.lessonTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      <View style={styles.lessonMeta}>
                        <CategoryBadge category={lesson.category} small />
                        <Text style={[styles.lessonMins, { color: colors.mutedForeground }]}>
                          {lesson.estimatedMinutes}m
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Lessons that don't belong to any module shown above */}
        {(() => {
          const unbinned = LESSONS.filter((l) => !findModuleForLesson(l.id));
          if (unbinned.length === 0) return null;
          return (
            <View style={styles.moduleBlock}>
              <Text style={[styles.moduleTitle, { color: colors.foreground }]}>More lessons</Text>
              {unbinned.map((lesson) => (
                <Pressable
                  key={lesson.id}
                  style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/lesson', params: { id: lesson.id } })}
                >
                  <Feather name="circle" size={20} color={colors.mutedForeground} />
                  <View style={styles.lessonBody}>
                    <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{lesson.title}</Text>
                    <View style={styles.lessonMeta}>
                      <CategoryBadge category={lesson.category} small />
                      <Text style={[styles.lessonMins, { color: colors.mutedForeground }]}>
                        {lesson.estimatedMinutes}m
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2, marginBottom: 20 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recCard: { borderRadius: 18, padding: 18, gap: 8, marginBottom: 24 },
  recTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recTopLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  recSummary: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  recMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  moduleBlock: { marginBottom: 24 },
  moduleTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  moduleDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 12 },
  lessonList: { gap: 8 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  lessonBody: { flex: 1, gap: 6 },
  lessonTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lessonMins: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
