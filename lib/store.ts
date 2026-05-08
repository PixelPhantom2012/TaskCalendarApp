import { create } from 'zustand';
import { supabase } from './supabase';
import type { Task, NewTask, UserProfile, RepeatOption, CalendarItemKind } from './types';
import { cancelScheduledNotificationsForTask, rescheduleAllNotificationsForTasks, scheduleTaskNotification } from './notifications';
import { format } from 'date-fns';
import type { CalendarViewMode } from './calendarViewMode';
import { saveCalendarViewMode } from './calendarViewMode';
import { taskOccursOnVisibleDate, projectTaskToOccurrence } from './recurrence';

function normalizeTaskRow(row: Task): Task {
  const repeat: RepeatOption =
    row.repeat === 'daily' ||
    row.repeat === 'weekly' ||
    row.repeat === 'monthly' ||
    row.repeat === 'yearly' ||
    row.repeat === 'none'
      ? row.repeat
      : 'none';
  const deleted_dates = Array.isArray(row.deleted_dates) ? row.deleted_dates : [];
  const kind: CalendarItemKind =
    row.kind === 'event' || row.kind === 'birthday' ? row.kind : 'task';
  const birth_year = typeof row.birth_year === 'number' ? row.birth_year : null;
  return { ...row, repeat, deleted_dates, kind, birth_year };
}

interface TaskStore {
  tasks: Task[];
  selectedDate: string;
  /** yyyy-MM visible on calendar grid (updates when navigating months) */
  calendarMonthKey: string;
  /** Month grid vs Day / Week / 3-days timeline — persisted externally via save helper */
  calendarViewMode: CalendarViewMode;
  loading: boolean;
  user: UserProfile | null;

  setUser: (user: UserProfile | null) => void;
  setSelectedDate: (date: string) => void;
  setCalendarMonthKey: (monthKey: string) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
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
  calendarViewMode: 'month',
  loading: false,
  user: null,

  setUser: (user) => set({ user }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setCalendarMonthKey: (monthKey) => set({ calendarMonthKey: monthKey }),

  setCalendarViewMode: (mode) => {
    set({ calendarViewMode: mode });
    void saveCalendarViewMode(mode);
  },

  fetchTasks: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('start_at', { ascending: true });

    if (!error && data) {
      const tasks = (data as Task[]).map(normalizeTaskRow);
      set({ tasks });
      await rescheduleAllNotificationsForTasks(tasks);
    }
    set({ loading: false });
  },

  addTask: async (taskData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      ...taskData,
      user_id: user.id,
      deleted_dates: taskData.deleted_dates ?? [],
    };

    let { data, error } = await supabase.from('tasks').insert(payload).select().single();

    // Graceful fallback: if kind/birth_year columns don't exist yet (migration not run),
    // retry without them so the item still saves.
    if (error) {
      const { kind, birth_year, ...legacyPayload } = payload;
      const result = await supabase.from('tasks').insert(legacyPayload).select().single();
      data = result.data;
      error = result.error;
      // Merge the kind/birth_year back so local state is correct
      if (!error && data) {
        (data as Task).kind = kind;
        (data as Task).birth_year = birth_year;
      }
    }

    if (!error && data) {
      const task = normalizeTaskRow(data as Task);
      set((state) => ({ tasks: [...state.tasks, task] }));
      await scheduleTaskNotification(task);
    }
  },

  updateTask: async (id, updates) => {
    let { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // Same fallback: if new columns don't exist yet, retry without them
    if (error) {
      const { kind, birth_year, ...legacyUpdates } = updates as Partial<NewTask> & { kind?: CalendarItemKind; birth_year?: number | null };
      const result = await supabase.from('tasks').update(legacyUpdates).eq('id', id).select().single();
      data = result.data;
      error = result.error;
      if (!error && data) {
        if (kind !== undefined) (data as Task).kind = kind;
        if (birth_year !== undefined) (data as Task).birth_year = birth_year;
      }
    }

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
      await cancelScheduledNotificationsForTask(id);
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
