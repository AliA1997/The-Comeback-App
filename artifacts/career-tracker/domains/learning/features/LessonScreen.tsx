import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useColors } from '@/shared/theme/useColors';
import { useAppStore } from '@/shared/store/root';
import { findLesson } from '@/domains/learning/data/catalog';
import { useLessonProgress } from '@/domains/learning/selectors';
import { runAchievementEvaluation } from '@/domains/progress/services/AchievementEngine';

export function LessonScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => (id ? findLesson(id) : undefined), [id]);
  const progress = useLessonProgress(id ?? '');

  const startLesson = useAppStore((s) => s.startLesson);
  const completeLesson = useAppStore((s) => s.completeLesson);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (lesson && (!progress || progress.status === 'not_started')) {
      startLesson(lesson.id);
    }
  }, [lesson, progress, startLesson]);

  if (!lesson) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 16, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <EmptyState icon="book-open" title="Lesson not found" message="This lesson is no longer available." />
      </View>
    );
  }

  const handleSubmit = () => {
    if (!lesson.quiz) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeLesson(lesson.id);
      runAchievementEvaluation();
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const total = lesson.quiz.questions.length;
    const correct = lesson.quiz.questions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length;
    const score = correct / total;
    setSubmitted(true);
    completeLesson(lesson.id, score);
    runAchievementEvaluation();
  };

  const allAnswered = lesson.quiz
    ? lesson.quiz.questions.every((q) => answers[q.id] !== undefined)
    : true;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[
          styles.closeBtn,
          { top: insets.top + (Platform.OS === 'web' ? 67 : 16), borderColor: colors.border },
        ]}
        onPress={() => router.back()}
      >
        <Feather name="x" size={20} color={colors.foreground} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 110 : 64),
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CategoryBadge category={lesson.category} />
        <Text style={[styles.title, { color: colors.foreground }]}>{lesson.title}</Text>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>{lesson.summary}</Text>

        <View style={[styles.metaRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="clock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {lesson.estimatedMinutes} min read
          </Text>
          {progress?.status === 'completed' ? (
            <>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>·</Text>
              <Feather name="check-circle" size={14} color={colors.accent} />
              <Text style={[styles.metaText, { color: colors.accent }]}>Completed</Text>
            </>
          ) : null}
        </View>

        <Text style={[styles.body, { color: colors.foreground }]}>{lesson.body}</Text>

        {lesson.quiz ? (
          <View style={styles.quizBlock}>
            <Text style={[styles.quizHeader, { color: colors.foreground }]}>Knowledge check</Text>
            {lesson.quiz.questions.map((q, qi) => {
              const chosen = answers[q.id];
              return (
                <View
                  key={q.id}
                  style={[styles.question, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.qPrompt, { color: colors.foreground }]}>
                    {qi + 1}. {q.prompt}
                  </Text>
                  {q.options.map((opt, oi) => {
                    const selected = chosen === oi;
                    const showCorrect = submitted && oi === q.correctIndex;
                    const showWrong = submitted && selected && oi !== q.correctIndex;
                    return (
                      <Pressable
                        key={oi}
                        disabled={submitted}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setAnswers((prev) => ({ ...prev, [q.id]: oi }));
                        }}
                        style={[
                          styles.opt,
                          {
                            borderColor: showCorrect
                              ? colors.accent
                              : showWrong
                              ? colors.destructive
                              : selected
                              ? colors.primary
                              : colors.border,
                            backgroundColor: showCorrect
                              ? `${colors.accent}1A`
                              : showWrong
                              ? `${colors.destructive}1A`
                              : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[styles.optText, { color: colors.foreground }]}>{opt}</Text>
                        {showCorrect ? (
                          <Feather name="check" size={16} color={colors.accent} />
                        ) : showWrong ? (
                          <Feather name="x" size={16} color={colors.destructive} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {submitted && q.explanation ? (
                    <Text style={[styles.qExplain, { color: colors.mutedForeground }]}>
                      {q.explanation}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {submitted ? (
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: colors.accent }]}
            onPress={() => router.back()}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.primaryText}>Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={!allAnswered}
            onPress={handleSubmit}
            style={[
              styles.primary,
              { backgroundColor: allAnswered ? colors.primary : colors.border },
            ]}
          >
            <Text style={styles.primaryText}>
              {lesson.quiz ? 'Submit & Mark Complete' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: { paddingHorizontal: 24, gap: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginTop: 4 },
  summary: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  body: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24, marginTop: 8 },
  quizBlock: { gap: 12, marginTop: 16 },
  quizHeader: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  question: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  qPrompt: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  optText: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  qExplain: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: 2 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
  },
  primaryText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
