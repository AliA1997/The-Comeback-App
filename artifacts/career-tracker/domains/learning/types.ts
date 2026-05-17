/**
 * Learning & Content Domain — types
 *
 * Owns: lesson catalog (static), modules, quizzes, per-user lesson progress,
 * recommendations.
 */
import type { TaskCategory } from '@/shared/types/skills';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options` */
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  /** Plain-text/markdown-lite body */
  body: string;
  estimatedMinutes: number;
  category: TaskCategory;
  quiz?: Quiz;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  lessonIds: string[];
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  /** 0..1 — fraction of body scrolled, or quiz score if completed */
  progress: number;
  quizScore?: number; // 0..1
  startedAt?: number;
  completedAt?: number;
}
