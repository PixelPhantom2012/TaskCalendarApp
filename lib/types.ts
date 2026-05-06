/** The three calendar item types the app supports. */
export type CalendarItemKind = 'task' | 'event' | 'birthday';

export type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TaskColor =
  | '#4A6FE3'
  | '#FF6B6B'
  | '#F5A623'
  | '#4ECDC4'
  | '#A78BFA'
  | '#34D399';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  repeat: RepeatOption;
  location: string | null;
  color: TaskColor;
  tags: string[];
  notify_before_minutes: number;
  /** yyyy-MM-dd calendar keys skipped for recurring series (soft-delete one occurrence). */
  deleted_dates: string[];
  created_at: string;
  /** Item type: task, event, or birthday. Defaults to 'task' for legacy rows. */
  kind: CalendarItemKind;
  /** Optional birth year (birthdays only); used for age display. null = not set. */
  birth_year: number | null;
}

export type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at'>;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
