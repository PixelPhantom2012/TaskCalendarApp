import { createContext, useContext } from 'react';
import type { Task } from './types';

/** Maps yyyy-MM-dd → projected Task[] for the visible calendar month. */
export const TasksByDateContext = createContext<Record<string, Task[]>>({});

export function useTasksForDay(dateString: string): Task[] {
  return useContext(TasksByDateContext)[dateString] ?? [];
}
