import { useAppStore } from '@/shared/store/root';
import type { LessonProgress } from './types';

export const useAllLessonProgress = () => useAppStore((s) => s.lessonProgress);

export const useLessonProgress = (lessonId: string): LessonProgress | null =>
  useAppStore((s) => s.lessonProgress[lessonId] ?? null);

