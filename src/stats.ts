export type RecordValue = Record<string, unknown>;
export type RecapData = {
  student?: RecordValue; grades: RecordValue[]; homeworks: RecordValue[];
  period: { start: string; end: string; label: string };
  coverage: { grades: 'complete' | 'partial' | 'unavailable'; homeworks: 'complete' | 'partial' | 'unavailable' };
  errors?: { resource: string; message: string; start?: string; end?: string }[];
};
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function descriptor(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') { const v = value as RecordValue; return [v.Leiras, v.Nev].filter(x => typeof x === 'string').join(' '); }
  return '';
}
export function subjectName(grade: RecordValue) {
  const subject = grade.Tantargy as RecordValue | undefined;
  return typeof subject?.Nev === 'string' ? subject.Nev : 'Egyéb tantárgy';
}
function day(value: unknown) {
  if (typeof value !== 'string') return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export const gradeDay = (g: RecordValue) => day(g.KeszitesDatuma || g.RogzitesDatuma);
export function makeStats(data: RecapData) {
  const inPeriod = (date: string) => date !== '' && date >= data.period.start && date <= data.period.end;
  const seen = new Set<string>();
  const raw = data.grades.filter(g => {
    if (!g || typeof g !== 'object') return false;
    const id = g.Uid ? String(g.Uid) : JSON.stringify(g);
    if (seen.has(id)) return false; seen.add(id); return true;
  });
  const grades = raw.filter(g => {
    const type = normalized(descriptor(g.Tipus));
    const subject = normalized(subjectName(g));
    const n = Number(g.SzamErtek);
    return Number.isInteger(n) && n >= 1 && n <= 5 && !/felev|evvegi|ev vegi|ev v[eé]gi/.test(type) && !/magatartas|szorgalom/.test(subject) && inPeriod(gradeDay(g));
  }).sort((a, b) => {
    const time = (value: unknown) => Date.parse(String(value ?? '')) || 0;
    return time(a.KeszitesDatuma || a.RogzitesDatuma) - time(b.KeszitesDatuma || b.RogzitesDatuma)
      || time(a.RogzitesDatuma) - time(b.RogzitesDatuma)
      || String(a.Uid ?? '').localeCompare(String(b.Uid ?? ''));
  });
  const counts = [1, 2, 3, 4, 5].map(value => grades.filter(g => Number(g.SzamErtek) === value).length);
  const average = grades.length ? grades.reduce((sum, g) => sum + Number(g.SzamErtek), 0) / grades.length : null;
  let weightedSum = 0, weights = 0;
  const subjects = new Map<string, { count: number; sum: number; weight: number; fives: number }>();
  const months = new Map<string, number>();
  const modes = { written: 0, oral: 0, homework: 0, other: 0 };
  for (const g of grades) {
    const n = Number(g.SzamErtek), rawWeight = Number(g.SulySzazalekErteke);
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 100;
    weightedSum += n * weight; weights += weight;
    const name = subjectName(g), old = subjects.get(name) ?? { count: 0, sum: 0, weight: 0, fives: 0 };
    subjects.set(name, { count: old.count + 1, sum: old.sum + n * weight, weight: old.weight + weight, fives: old.fives + (n === 5 ? 1 : 0) });
    const month = gradeDay(g).slice(0, 7); months.set(month, (months.get(month) ?? 0) + 1);
    const mode = normalized(descriptor(g.Mod));
    if (/hazi/.test(mode)) modes.homework++;
    else if (/felel|szobeli/.test(mode)) modes.oral++;
    else if (/dolgozat|irasbeli|teszt|temazaro|ropdolgozat/.test(mode)) modes.written++;
    else modes.other++;
  }
  const ranking = [...subjects].map(([name, v]) => ({ name, count: v.count, average: v.sum / v.weight, fives: v.fives })).sort((a, b) => b.average - a.average || b.count - a.count || a.name.localeCompare(b.name, 'hu'));
  const best = ranking.find(v => v.count >= 3 && v.name !== 'Egyéb tantárgy') ?? null;
  const busiest = [...months].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? null;
  let streak = 0, bestStreak = 0;
  for (const g of grades) { streak = Number(g.SzamErtek) === 5 ? streak + 1 : 0; bestStreak = Math.max(streak, bestStreak); }
  const homeworkIds = new Set<string>();
  const homeworks = data.homeworks.filter(h => {
    if (!h || typeof h !== 'object') return false;
    const id = String(h.Uid ?? JSON.stringify(h));
    const date = day(h.FeladasDatuma || h.RogzitesIdopontja);
    if (homeworkIds.has(id) || !inPeriod(date)) return false;
    homeworkIds.add(id); return true;
  });
  const half = Math.floor(grades.length / 2);
  const avg = (list: RecordValue[]) => list.reduce((sum, g) => sum + Number(g.SzamErtek), 0) / list.length;
  const trend = grades.length >= 6 ? avg(grades.slice(half)) - avg(grades.slice(0, half)) : null;
  return { grades, total: grades.length, counts, average, weightedAverage: weights ? weightedSum / weights : null, modes, ranking, best, busiest, bestStreak, homeworks: homeworks.length, trend, excluded: raw.length - grades.length, fivePercent: grades.length ? Math.round(counts[4] / grades.length * 100) : 0 };
}
export type Stats = ReturnType<typeof makeStats>;
export const decimal = (value: number | null) => value === null ? '—' : value.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const monthName = (value: string) => new Intl.DateTimeFormat('hu-HU', { month: 'long', timeZone: 'UTC' }).format(new Date(value + '-15T12:00:00Z'));
