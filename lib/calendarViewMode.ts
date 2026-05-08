import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, eachDayOfInterval, format, startOfWeek } from 'date-fns';
import { parseLocalDateString } from '@/lib/recurrence';

export const CALENDAR_VIEW_MODE_KEY = '@app_calendar_view_mode';

export type CalendarViewMode = 'month' | 'day' | 'threeDay' | 'week';

export const CALENDAR_VIEW_MODES: CalendarViewMode[] = ['month', 'day', 'threeDay', 'week'];

export function isCalendarViewMode(value: unknown): value is CalendarViewMode {
  return typeof value === 'string' && (CALENDAR_VIEW_MODES as string[]).includes(value);
}

export async function loadCalendarViewMode(): Promise<CalendarViewMode | null> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_VIEW_MODE_KEY);
    return isCalendarViewMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function saveCalendarViewMode(mode: CalendarViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(CALENDAR_VIEW_MODE_KEY, mode);
  } catch {
    /* noop */
  }
}

/** yyyy-MM-dd strings chronologically ascending (logical order). */
export function getTimelineDays(mode: Exclude<CalendarViewMode, 'month'>, selectedDate: string): string[] {
  const base = parseLocalDateString(selectedDate);
  if (mode === 'day') return [selectedDate];

  if (mode === 'threeDay') {
    return [0, 1, 2].map((i) => format(addDays(base, i), 'yyyy-MM-dd'));
  }

  const weekStart = startOfWeek(base, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map((d) =>
    format(d, 'yyyy-MM-dd')
  );
}

export function toolbarTitleForTimeline(
  mode: Exclude<CalendarViewMode, 'month'>,
  selectedDate: string,
  formatLocalized: (d: Date, p: string) => string
): string {
  const base = parseLocalDateString(selectedDate);
  const days = getTimelineDays(mode, selectedDate);

  if (mode === 'day') {
    return formatLocalized(base, 'EEE d MMMM');
  }

  const start = parseLocalDateString(days[0]);
  const end = parseLocalDateString(days[days.length - 1]);

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${formatLocalized(start, 'MMMM yyyy')}`;
  }

  return `${formatLocalized(start, 'd MMM')} – ${formatLocalized(end, 'd MMM yyyy')}`;
}
