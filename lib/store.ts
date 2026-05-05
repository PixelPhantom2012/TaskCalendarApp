import { create } from 'zustand';
import { supabase } from './supabase';
import type { Task, NewTask, UserProfile, RepeatOption } from './types';
import { scheduleTaskNotification } from './notifications';
import { format } from 'date-fns';
import { taskOccursOnVisibleDate, projectTaskToOccurrence } from './recurrence';

function normalizeTaskRow(row: Task): Task {
  const repeat: RepeatOption =
    row.repeat === 'daily' ||
    row.repeat === 'weekly' ||
    row.repeat === 'monthly' ||
    row.repeat === 'none'
      ? row.repeat
      : 'none';
  const deleted_dates = Array.isArray(row.deleted_dates) ? row.deleted_dates : [];
  return { ...row, repeat, deleted_dates };
}

interface TaskStore {
  tasks: Task[];
  selectedDate: string;
  /** yyyy-MM visible on calendar grid (updates when navigating months) */
  calendarMonthKey: string;
  loading: boolean;
  user: UserProfile | null;

  setUser: (user: UserProfile | null) => void;
  setSelectedDate: (date: string) => void;
  setCalendarMonthKey: (monthKey: string) => void;
  fetchTasks: () => Promise<void>;
  addTask: (task: NewTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<NewTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  /** Append one yyyy-MM-dd to deleted_dates (recurring tasks only). */
  deleteTaskOccurrence: (id: string, dateStr: string) => Promise<void>;
  getTasksForDate: (date: string) => Task[];
  getMarkedDates: () =>
    Record<string, { dots?: { color: string }[]; selected?: boolean; selectedColor?: string }>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  calendarMonthKey: format(new Date(), 'yyyy-MM'),
  loading: false,
  user: null,

  setUser: (user) => set({ user }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCalendarMonthKey: (monthKey) => set({ calendarMonthKey: monthKey }),

  fetchTasks: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('start_at', { ascending: true });

    if (!error && data) {
      set({ tasks: (data as Task[]).map(normalizeTaskRow) });
    }
    set({ loading: false });
  },

  addTask: async (taskData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: user.id,
        deleted_dates: taskData.deleted_dates ?? [],
      })
      .select()
      .single();

    if (!error && data) {
      const task = normalizeTaskRow(data as Task);
      set((state) => ({ tasks: [...state.tasks, task] }));
      await scheduleTaskNotification(task);
    }
  },

  updateTask: async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const updated = normalizeTaskRow(data as Task);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      await scheduleTaskNotification(updated);
    }
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    }
  },

  deleteTaskOccurrence: async (id, dateStr) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task || task.repeat === 'none') return;
    const prev = task.deleted_dates ?? [];
    if (prev.includes(dateStr)) return;
    const deleted_dates = [...prev, dateStr];
    const { data, error } = await supabase
      .from('tasks')
      .update({ deleted_dates })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const updated = normalizeTaskRow(data as Task);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      await scheduleTaskNotification(updated);
    }
  },

  getTasksForDate: (date) => {
    const { tasks } = get();
    return tasks
      .filter((task) => taskOccursOnVisibleDate(task, date))
      .map((task) => projectTaskToOccurrence(task, date))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  },

  getMarkedDates: () => {
    const { selectedDate } = get();
    return {
      [selectedDate]: {
        selected: true,
      },
    };
  },
}));
