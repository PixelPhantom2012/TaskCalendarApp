import type { Task } from './types';

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase();
}

/** Case-insensitive substring match on title, notes, location (client-side v1). */
export function filterTasksByQuery(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tasks
    .filter((task) => {
      if (norm(task.title).includes(q)) return true;
      if (norm(task.notes).includes(q)) return true;
      if (norm(task.location).includes(q)) return true;
      return false;
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
