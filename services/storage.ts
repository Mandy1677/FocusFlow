import { Task, STORAGE_KEYS } from '../types';

export const loadTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load tasks", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks", e);
  }
};

export const loadHistory = (): Record<string, number> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load history", e);
    return {};
  }
};

export const saveHistory = (history: Record<string, number>) => {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};
