import type { RecapData, RecordValue } from './stats';
export function demoData(): RecapData {
  const now = new Date(); const year = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
  const end = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(now);
  const start = `${year}-09-01`, duration = Math.max(1, Math.floor((Date.parse(end) - Date.parse(start)) / 86400000));
  const subjects = ['Matematika', 'Angol nyelv', 'Történelem', 'Magyar irodalom', 'Biológia'];
  const modes = ['Írásbeli dolgozat', 'Szóbeli felelet', 'Témazáró dolgozat', 'Házi feladat', 'Órai munka'];
  const grades = Array.from({ length: 87 }, (_, i): RecordValue => ({ Uid: `demo-${i}`, SzamErtek: [5, 4, 5, 3, 4, 5, 2, 5, 4, 1, 5, 5][i % 12], Tantargy: { Nev: subjects[i % 5] }, Mod: { Leiras: modes[i % 5] }, Tipus: { Nev: 'evkozi_jegy' }, SulySzazalekErteke: i % 5 === 2 ? 200 : 100, KeszitesDatuma: new Date(Date.parse(start) + Math.floor((i / 87) * duration) * 86400000 + 43200000).toISOString() }));
  return { student: { Nev: 'Minta Anna' }, grades, homeworks: Array.from({ length: 46 }, (_, i) => ({ Uid: `hw-${i}`, FeladasDatuma: grades[i].KeszitesDatuma })), period: { start, end, label: `${year}/${String(year + 1).slice(-2)}` }, coverage: { grades: 'complete', homeworks: 'complete' }, errors: [] };
}
