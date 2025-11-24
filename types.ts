export interface Task {
  id: string;
  title: string;
  progress: number; // 0 to 100
  isCompleted: boolean;
  isRecurring: boolean;
  lastCompletedDate: string | null; // ISO Date string (YYYY-MM-DD)
  createdAt: number;
}

export interface FocusSession {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface AppState {
  tasks: Task[];
  focusHistory: Record<string, number>; // Date string -> minutes
  dailyGoalMinutes: number;
}

export enum STORAGE_KEYS {
  TASKS = 'focusflow_tasks',
  HISTORY = 'focusflow_history',
}
