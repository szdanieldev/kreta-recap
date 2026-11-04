import { ApiError, upstream } from './api.ts';
import { trace } from './debug.ts';
export function schoolPeriod(now = new Date()) {
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const year = Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 9 ? 1 : 0);
  return { start: `${year}-09-01`, end: date, label: `${year}/${String(year + 1).slice(-2)}` };
}
export function windows(start: string, end: string) {
  const result: { start: string; end: string }[] = [];
  const finish = Date.parse(`${end}T00:00:00Z`);
  let cursor = Date.parse(`${start}T00:00:00Z`);
  while (cursor <= finish) {
    const last = Math.min(cursor + 20 * 86400000, finish);
    result.push({ start: new Date(cursor).toISOString().slice(0, 10), end: new Date(last).toISOString().slice(0, 10) });
    cursor = last + 86400000;
  }
  return result;
}
export function deduplicate(items: unknown[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item && typeof item === 'object' && 'Uid' in item && item.Uid ? String(item.Uid) : JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export async function collectRecap(institute: string, token: string, now = new Date()) {
  const period = schoolPeriod(now);
  const ranges = windows(period.start, period.end);
  const base = `https://${institute}.e-kreta.hu/ellenorzo/v3/sajat`;
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const output: Record<string, unknown> = { period };
  const errors: { resource: string; start?: string; end?: string; message: string }[] = [];
  const grades: unknown[] = [], homeworks: unknown[] = [];
  const tasks = [
    { resource: 'student', path: '/TanuloAdatlap', range: undefined as { start: string; end: string } | undefined },
    ...ranges.flatMap(range => ['grades', 'homeworks'].map(resource => ({ resource, path: resource === 'grades' ? '/Ertekelesek' : '/HaziFeladatok', range }))),
  ];
  let next = 0;
  trace('Recap: tanévi adatok lekérése', { period, requests: tasks.length, concurrency: 3 });
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      const query = task.range ? `?${new URLSearchParams({ datumTol: task.range.start, datumIg: task.range.end })}` : '';
      try {
        const value = await upstream(base + task.path + query, options);
        if (task.resource === 'student') output.student = value;
        else {
          if (!Array.isArray(value)) throw new ApiError(502, 'Az API listát vártunk, de más formátumot adott.');
          (task.resource === 'grades' ? grades : homeworks).push(...value);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) throw error;
        errors.push({ resource: task.resource, ...task.range, message: error instanceof Error ? error.message : 'Sikertelen lekérés.' });
        trace('Recap: hiányzó adatszelet', errors[errors.length - 1]);
      }
    }
  }));
  const allFailed = (resource: string) => errors.filter(e => e.resource === resource).length === ranges.length;
  output.grades = deduplicate(grades);
  output.homeworks = deduplicate(homeworks);
  output.errors = errors;
  output.coverage = { grades: allFailed('grades') ? 'unavailable' : errors.some(e => e.resource === 'grades') ? 'partial' : 'complete', homeworks: allFailed('homeworks') ? 'unavailable' : errors.some(e => e.resource === 'homeworks') ? 'partial' : 'complete' };
  trace('Recap: összesítésre kész', { gradeCount: (output.grades as unknown[]).length, homeworkCount: (output.homeworks as unknown[]).length, coverage: output.coverage });
  return output;
}
