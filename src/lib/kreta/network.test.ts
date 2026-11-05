import { transport } from './network.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kretaFetch, networkCode, networkMessage } from './network.ts';
const timeout = () => new TypeError('fetch failed', { cause: Object.assign(new Error('Connect timeout'), { code: 'UND_ERR_CONNECT_TIMEOUT' }) });
test('GET retries only a transport failure, and sends a configured dispatcher', async () => {
  const original = transport.fetch; let calls = 0;
  transport.fetch = async (_url, init) => { assert.ok('dispatcher' in init!); if (++calls === 1) throw timeout(); return new Response('ok'); };
  try { assert.equal(await (await kretaFetch('https://idp.e-kreta.hu/Account/Login')).text(), 'ok'); assert.equal(calls, 2); }
  finally { transport.fetch = original; }
});
test('does not retry credential POSTs or HTTP error responses', async () => {
  const original = transport.fetch; let calls = 0;
  transport.fetch = async () => { calls++; throw timeout(); };
  try {
    await assert.rejects(() => kretaFetch('https://idp.e-kreta.hu/account/login', { method: 'POST' })); assert.equal(calls, 1);
    transport.fetch = async () => { calls++; return new Response('bad', { status: 400 }); };
    assert.equal((await kretaFetch('https://idp.e-kreta.hu/Account/Login')).status, 400); assert.equal(calls, 2);
  } finally { transport.fetch = original; }
});
test('preserves connection error codes and does not retry cancelled requests', async () => {
  assert.equal(networkCode(timeout()), 'UND_ERR_CONNECT_TIMEOUT'); assert.match(networkMessage(timeout(), 'fallback'), /nem belépésiadat-hiba/);
  const original = transport.fetch; let calls = 0;
  transport.fetch = async () => { calls++; throw timeout(); };
  try { await assert.rejects(() => kretaFetch('https://idp.e-kreta.hu/Account/Login', { signal: AbortSignal.abort() })); assert.equal(calls, 1); }
  finally { transport.fetch = original; }
});
