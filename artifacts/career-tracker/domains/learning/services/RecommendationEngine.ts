/**
 * RecommendationEngine — picks the next lesson the user should take based
 * on their career track + recent task categories + completion history.
 */
import type { CareerTrack } from '@/domains/user-profile/types';
import type { TaskCategory } from '@/shared/types/skills';
import { LESSONS } from '../data/catalog';
import type { Lesson, LessonProgress } from '../types';

const TRACK_PRIORITIES: Record<CareerTrack, TaskCategory[]> = {
  Frontend: ['Projects', 'LeetCode', 'System Design'],
  Backend: ['System Design', 'LeetCode', 'Projects'],
  Fullstack: ['Projects', 'System Design', 'LeetCode'],
  Mobile: ['Projects', 'LeetCode', 'System Design'],
  'Data Science': ['LeetCode', 'Learning', 'Projects'],
  'Machine Learning': ['LeetCode', 'Learning', 'Projects'],
  DevOps: ['System Design', 'Projects', 'Networking'],
  Other: ['Applications', 'LeetCode', 'Networking'],
};

export function recommendNextLesson(
  track: CareerTrack | null,
  lessonProgress: Record<string, LessonProgress>
): Lesson | null {
  const completedIds = new Set(
    Object.values(lessonProgress)
      .filter((p) => p.status === 'completed')
      .map((p) => p.lessonId)
  );

  const priorities = track ? TRACK_PRIORITIES[track] : ['Applications', 'LeetCode', 'Networking'];

  for (const category of priorities) {
    const next = LESSONS.find((l) => l.category === category && !completedIds.has(l.id));
    if (next) return next;
  }
  // Fall back to any uncompleted lesson
  return LESSONS.find((l) => !completedIds.has(l.id)) ?? null;
}
