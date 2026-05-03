export type TaskCategory =
  | 'LeetCode'
  | 'Projects'
  | 'System Design'
  | 'Applications'
  | 'Learning'
  | 'Networking';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  estimatedDuration: number; // minutes
  status: TaskStatus;
  createdAt: number; // ms timestamp
  completedAt?: number;
  actualDuration?: number; // minutes actually spent
  date: string; // YYYY-MM-DD
  savedRemainingSeconds?: number; // persisted countdown — resumes here on restart
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  completedTaskIds: string[];
  skippedTaskIds: string[];
}

export interface ActiveTimer {
  taskId: string;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number;
  pausedAt: number | null;
  totalPausedMs: number;
}

export interface Suggestion {
  id: string;
  message: string;
  detail: string;
  type: 'warning' | 'insight' | 'recommendation';
  category?: TaskCategory;
}
