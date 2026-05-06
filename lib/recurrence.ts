import {
  parse,
  format,
  startOfDay,
  getDay,
  isBefore,
  endOfMonth,
  isSameDay,
  eachDayOfInterval,
  startOfMonth,
  addDays,
} from 'date-fns';

import type { Task } from './types';

export function parseLocalDateString(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

/** True if this calendar day is skipped for a recurring task (not shown, not notified). */
export function isOccurrenceSkipped(task: Task, dateStr: string): boolean {
  return (task.deleted_dates ?? []).includes(dateStr);
}

/** Occurs on date per repeat rules and not in deleted_dates. */
export function taskOccursOnVisibleDate(task: Task, dateStr: string): boolean {
  return taskOccursOn(task, dateStr) && !isOccurrenceSkipped(task, dateStr);
}

export function taskOccursOn(task: Task, dateStr: string): boolean {
  const anchor = startOfDay(new Date(task.start_at));
  const target = startOfDay(parseLocalDateString(dateStr));

  if (task.repeat === 'none') {
    return isSameDay(anchor, target);
  }

  if (isBefore(target, anchor)) {
    return false;
  }

  switch (task.repeat) {
    case 'daily':
      return true;
    case 'weekly':
      return getDay(target) === getDay(anchor);
    case 'monthly': {
      const anchorDom = anchor.getDate();
      const dim = endOfMonth(target).getDate();
      const expectedDay = Math.min(anchorDom, dim);
      return target.getDate() === expectedDay;
    }
    case 'yearly': {
      const aMonth = anchor.getMonth();
      const aDay = anchor.getDate();
      const tMonth = target.getMonth();
      const tDay = target.getDate();
      // Feb-29 anchor on a non-leap target year → show on Feb 28 instead
      const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
      if (aMonth === 1 && aDay === 29 && !isLeap(target.getFullYear())) {
        return tMonth === 1 && tDay === 28;
      }
      return tMonth === aMonth && tDay === aDay;
    }
    default:
      return false;
  }
}

/** Snapshot of task with start/end shifted to `dateStr`, preserving duration and clock time */
export function projectTaskToOccurrence(task: Task, dateStr: string): Task {
  const origStart = new Date(task.start_at);
  const origEnd = new Date(task.end_at);

  const y = Number(dateStr.slice(0, 4));
  const m = Number(dateStr.slice(5, 7)) - 1;
  const d = Number(dateStr.slice(8, 10));

  if (task.all_day) {
    const anchor = new Date(y, m, d, 0, 0, 0, 0);
    return {
      ...task,
      start_at: anchor.toISOString(),
      end_at: anchor.toISOString(),
    };
  }

  const newStart = new Date(
    y,
    m,
    d,
    origStart.getHours(),
    origStart.getMinutes(),
    origStart.getSeconds(),
    origStart.getMilliseconds()
  );
  const durationMs = origEnd.getTime() - origStart.getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);

  return {
    ...task,
    start_at: newStart.toISOString(),
    end_at: newEnd.toISOString(),
  };
}

/** Every yyyy-MM-dd in calendar month keyed by yyyy-MM */
export function eachDateStringInMonth(monthKey: string): string[] {
  const first = parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date());
  return eachDayOfInterval({
    start: startOfMonth(first),
    end: endOfMonth(first),
  }).map((dt) => format(dt, 'yyyy-MM-dd'));
}

/** Upcoming occurrences starting from scan day (walk forward up to horizon). */
export function upcomingOccurrenceDateStrings(
  task: Task,
  scanFrom: Date,
  maxCount: number,
  horizonDays = 366
): string[] {
  const out: string[] = [];
  let cursor = startOfDay(scanFrom);
  const deadline = addDays(cursor, horizonDays);

  while (cursor <= deadline && out.length < maxCount) {
    const dateStr = format(cursor, 'yyyy-MM-dd');
    if (taskOccursOnVisibleDate(task, dateStr)) {
      out.push(dateStr);
    }
    cursor = addDays(cursor, 1);
  }

  return out;
}
