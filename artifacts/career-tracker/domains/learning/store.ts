/**
 * Learning slice — per-user lesson progress (catalog is static, in `data/`).
 */
import type { StateCreator } from 'zustand';
import type { LessonProgress, LessonStatus } from './types';

export interface LearningSlice {
  lessonProgress: Record<string, LessonProgress>;

  startLesson: (lessonId: string) => void;
  setLessonProgress: (lessonId: string, progress: number) => void;
  completeLesson: (lessonId: string, quizScore?: number) => void;
}

export const createLearningSlice: StateCreator<
  LearningSlice,
  [],
  [],
  LearningSlice
> = (set) => ({
  lessonProgress: {},

  startLesson: (lessonId) =>
    set((s) => {
      const existing = s.lessonProgress[lessonId];
      if (existing && existing.status !== 'not_started') return s;
      const next: LessonProgress = {
        lessonId,
        status: 'in_progress',
        progress: 0,
        startedAt: Date.now(),
      };
      return { lessonProgress: { ...s.lessonProgress, [lessonId]: next } };
    }),

  setLessonProgress: (lessonId, progress) =>
    set((s) => {
      const existing: LessonProgress = s.lessonProgress[lessonId] ?? {
        lessonId,
        status: 'in_progress' satisfies LessonStatus,
        progress: 0,
        startedAt: Date.now(),
      };
      return {
        lessonProgress: {
          ...s.lessonProgress,
          [lessonId]: { ...existing, progress: Math.max(existing.progress, progress) },
        },
      };
    }),

  completeLesson: (lessonId, quizScore) =>
    set((s) => {
      const existing: LessonProgress = s.lessonProgress[lessonId] ?? {
        lessonId,
        status: 'in_progress',
        progress: 0,
        startedAt: Date.now(),
      };
      return {
        lessonProgress: {
          ...s.lessonProgress,
          [lessonId]: {
            ...existing,
            status: 'completed',
            progress: 1,
            quizScore,
            completedAt: Date.now(),
          },
        },
      };
    }),
});
