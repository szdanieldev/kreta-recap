import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecapHandler } from './handler.ts';
import { ApiError } from './api.ts';
const url = 'https://recap-preview.vercel.app/api/recap';
const credentials = { institute: 'school', username: ' student ', password: 'test-password-secret' };
function request(body: unknown = credentials, headers: Record<string,string> = {}) { return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', origin: new URL(url).origin, ...headers }, body: JSON.stringify(body) }); }
test('single stateless request authenticates and returns recap without cookies or token disclosure', async () => {
  const calls: string[] = [];
  const handler = createRecapHandler({
    async login(institute, username, password) { assert.equal(institute, 'school'); assert.equal(username, 'student'); assert.equal(password, credentials.password); calls.push('login'); return { access_token: 'test-token-secret', expires_in: 1800 }; },
    async collectRecap(institute, token) { assert.equal(institute, 'school'); assert.equal(token, 'test-token-secret'); calls.push('recap'); return { grades: [], homeworks: [], coverage: { grades: 'complete', homeworks: 'complete' } }; },
  });
  for (let i = 0; i < 2; i++) {
    const response = await handler(request());
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('set-cookie'), null);
    const text = await response.text(); assert.ok(!text.includes(credentials.password)); assert.ok(!text.includes('test-token-secret'));
    assert.deepEqual(JSON.parse(text).grades, []);
  }
  assert.deepEqual(calls, ['login','recap','login','recap']);
});
test('validates origin, JSON, body size, input and HTTP method before contacting KRÉTA', async () => {
  const handler = createRecapHandler({ async login() { throw new Error('Must not call login'); }, async collectRecap() { throw new Error('Must not call recap'); } });
  assert.equal((await handler(new Request(url))).status, 405);
  assert.equal((await handler(request(credentials,{origin:'https://other.example'}))).status, 403);
  assert.equal((await handler(request(credentials,{'content-type':'text/plain'}))).status, 415);
  assert.equal((await handler(request({ ...credentials, institute: 'school.evil.com' }))).status, 400);
  assert.equal((await handler(request({ ...credentials, password:'x'.repeat(9000) }))).status, 413);
  assert.equal((await handler(new Request(url, {method:'POST',headers:{'content-type':'application/json'},body:'{bad'}))).status,400);
});
test('preserves detailed failures while redacting known secrets', async () => {
  const handler = createRecapHandler({ async login() { throw new ApiError(400, 'Login failed', { password: credentials.password, error: 'invalid_grant' }); }, async collectRecap() { throw new Error('Must not call recap'); } });
  const response = await handler(request()); assert.equal(response.status,400);
  const text = await response.text(); assert.ok(!text.includes(credentials.password)); assert.match(text,/invalid_grant/); assert.match(text,/ApiError/); assert.match(text,/REDACTED/);
});
