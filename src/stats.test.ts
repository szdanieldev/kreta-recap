import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStats, type RecapData, type RecordValue } from './stats.ts';
const grade = (id: string, value: number, extras: RecordValue = {}): RecordValue => ({ Uid: id, SzamErtek: value, Tantargy: { Nev: 'Matematika' }, Tipus: { Nev: 'evkozi_jegy' }, KeszitesDatuma: '2026-10-01T10:00:00Z', ...extras });
const data = (grades: RecordValue[]): RecapData => ({ grades, homeworks: [], period: { start: '2026-09-01', end: '2026-11-05', label: '2026/27' }, coverage: { grades: 'complete', homeworks: 'complete' } });
test('counts only unique numeric in-year subject grades, excluding final grades and conduct', () => {
  const result = makeStats(data([grade('1', 5), grade('1', 5), grade('2', 4, { Tipus: { Leiras: 'Félévi jegy' } }), grade('3', 5, { Tipus: { Leiras: 'Év végi jegy' } }), grade('4', 3, { Tantargy: { Nev: 'Magatartás' } }), grade('5', 0), grade('6', 2, { KeszitesDatuma: '2025-10-01' }), grade('7', 1), grade('8', 6)]));
  assert.equal(result.total, 2); assert.deepEqual(result.counts, [1, 0, 0, 0, 1]); assert.equal(result.average, 3); assert.equal(result.fivePercent, 50);
});
test('weights grades, ranks subjects with at least three grades and classifies assessment modes', () => {
  const result = makeStats(data([grade('1', 5, { SulySzazalekErteke: 200, Mod: { Leiras: 'Témazáró dolgozat' } }), grade('2', 3, { Mod: { Nev: 'szobeli_felelet' } }), grade('3', 4, { Mod: { Leiras: 'Házi feladat' } }), grade('4', 5, { Tantargy: { Nev: 'Fizika' }, Mod: { Leiras: 'Órai munka' } })]));
  assert.equal(result.weightedAverage, 4.4); assert.equal(result.best?.name, 'Matematika'); assert.equal(result.best?.average, 4.25);
  assert.deepEqual(result.modes, { written: 1, oral: 1, homework: 1, other: 1 });
});
test('handles empty data honestly and filters/deduplicates assigned homework', () => {
  const fixture = data([]); fixture.homeworks = [{ Uid: 'a', FeladasDatuma: '2026-10-01' }, { Uid: 'a', FeladasDatuma: '2026-10-01' }, { Uid: 'b', FeladasDatuma: '2025-10-01' }];
  const result = makeStats(fixture);
  assert.equal(result.average, null); assert.equal(result.weightedAverage, null); assert.equal(result.best, null); assert.equal(result.trend, null); assert.equal(result.homeworks, 1);
});
test('streaks and busiest month use chronological grades and Budapest calendar dates', () => {
  const result = makeStats(data([grade('1', 5, { KeszitesDatuma: '2026-09-30T22:30:00Z' }), grade('2', 5, { KeszitesDatuma: '2026-10-02T12:00:00Z' }), grade('3', 5, { KeszitesDatuma: '2026-10-03T12:00:00Z' }), grade('4', 4, { KeszitesDatuma: '2026-10-04T12:00:00Z' })].reverse()));
  assert.equal(result.bestStreak, 3); assert.deepEqual(result.busiest, ['2026-10', 4]);
});
