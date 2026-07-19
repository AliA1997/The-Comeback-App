import type { RoutineTemplate } from '../types';

/**
 * Built-in template used when the user has no routine template yet
 * (spec: Edge Cases — first day). A balanced mix across the four
 * categories so the user always has a plan out of the box.
 */
export const DEFAULT_ROUTINE_TEMPLATE: RoutineTemplate = {
  id: 'template_default',
  name: 'Comeback Starter',
  items: [
    { title: 'Apply to 2 jobs', category: 'applications' },
    { title: 'Solve 1 coding problem', category: 'practice' },
    { title: 'Message 1 person in your network', category: 'networking' },
    { title: 'Read 1 article or watch 1 talk', category: 'learning' },
  ],
};
