import { transport } from './network.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schoolPeriod, windows, deduplicate, collectRecap } from './recap.ts';
test('Budapest school year rolls at September, and windows cover each day once with max 21 days', () => {
  assert.equal(schoolPeriod(new Date('2026-08-31T22:30:00Z')).start, '2026-09-01');
  assert.equal(schoolPeriod(new Date('2026-01-04T12:00:00Z')).label, '2025/26');
  const ranges = windows('2026-09-01', '2027-08-31');
  assert.equal(ranges[0].start, '2026-09-01'); assert.equal(ranges.at(-1)?.end, '2027-08-31');
  ranges.forEach((range, i) => { assert.ok(Date.parse(range.end) - Date.parse(range.start) <= 20 * 86400000); if (i) assert.equal(Date.parse(range.start) - Date.parse(ranges[i - 1].end), 86400000); });
  assert.deepEqual(deduplicate([{ Uid: '1' }, { Uid: '1' }]), [{ Uid: '1' }]);
});
test('collects date windows, deduplicates API items and reports missing data without inventing zeros', async () => {
  const original = transport.fetch;
  transport.fetch = async input => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('TanuloAdatlap')) return Response.json({ Nev: 'Teszt Diák' });
    if (url.pathname.endsWith('HaziFeladatok')) return Response.json({ error: 'unavailable' }, { status: 503 });
    assert.equal(url.searchParams.get('datumTol'), '2026-09-01');
    assert.equal(url.searchParams.get('datumIg'), '2026-09-05');
    return Response.json([{ Uid: 'one' }, { Uid: 'one' }]);
  };
  try {
    const result = await collectRecap('school', 'test-token', new Date('2026-09-05T12:00:00Z'));
    assert.deepEqual(result.grades, [{ Uid: 'one' }]);
    assert.deepEqual(result.coverage, { grades: 'complete', homeworks: 'unavailable' });
    assert.equal((result.errors as unknown[]).length, 1);
  } finally { transport.fetch = original; }
});
