import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { policy, validInstitute, login } from './api.ts';
test('institution validation blocks host/path injection', () => {
  for (const input of ['support-farkas', 'klik123', 'a']) assert.equal(validInstitute(input), true);
  for (const input of ['evil.com', 'a/b', 'a@evil.com', '-foo', '', null, 'a'.repeat(64)]) assert.equal(validInstitute(input), false);
});
test('PKCE login preserves cookies and CSRF, verifies state, then exchanges code', async () => {
  const { createHash } = await import('node:crypto');
  const { debugContext } = await import('./debug.ts');
  const original = globalThis.fetch;
  let authorize: URL;
  let verifier = '';
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    const target = new URL(String(url));
    if (calls === 1) {
      authorize = new URL(target.searchParams.get('ReturnUrl')!, target.origin);
      assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
      return new Response('<form action="/account/login"><input type="hidden" name="__RequestVerificationToken" value="csrf-secret"><input name="Password"></form>', { headers: { 'Set-Cookie': 'idp_session=private-cookie; Path=/; Secure; HttpOnly' } });
    }
    if (calls === 2) {
      assert.equal(target.pathname, '/account/login');
      const body = init?.body as URLSearchParams;
      assert.equal(body.get('Password'), 'test-password');
      assert.equal(body.get('UserName'), 'Student');
      assert.equal(body.get('InstituteCode'), 'school');
      assert.equal(body.get('__RequestVerificationToken'), 'csrf-secret');
      assert.match(new Headers(init?.headers).get('cookie')!, /idp_session=private-cookie/);
      return new Response('', { status: 302, headers: { location: authorize!.pathname + authorize!.search } });
    }
    if (calls === 3) {
      assert.equal(target.pathname, '/connect/authorize/callback');
      return new Response('', { status: 302, headers: { location: `https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect?code=private-code&state=${authorize!.searchParams.get('state')}` } });
    }
    assert.equal(calls, 4);
    assert.equal(target.pathname, '/connect/token');
    const body = init?.body as URLSearchParams;
    assert.equal(body.get('grant_type'), 'authorization_code');
    assert.equal(body.get('code'), 'private-code');
    verifier = body.get('code_verifier')!;
    assert.equal(createHash('sha256').update(verifier).digest('base64url'), authorize!.searchParams.get('code_challenge'));
    assert.equal(body.has('password'), false);
    return Response.json({ access_token: 'private-token', expires_in: 1800 });
  };
  try {
    await debugContext.run({ entries: [], secrets: new Set() }, async () => {
      assert.equal((await login('school', 'Student', 'test-password')).access_token, 'private-token');
      assert.equal(calls, 4);
      const log = JSON.stringify(debugContext.getStore()?.entries);
      for (const secret of ['test-password', 'csrf-secret', 'private-cookie', 'private-code', 'private-token', verifier]) assert.ok(!log.includes(secret), `log leaked ${secret}`);
    });
  } finally { globalThis.fetch = original; }
});

test('PKCE rejects an unexpected state before exchanging the code', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) return new Response('<form><input name="Password"><input name="__RequestVerificationToken" value="csrf"></form>');
    return new Response('', { status: 302, headers: { location: 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect?code=code&state=wrong' } });
  };
  try { await assert.rejects(() => login('school', 'Student', 'password'), /state eltérés/); assert.equal(calls, 2); }
  finally { globalThis.fetch = original; }
});

test('debug preserves upstream error details and redacts credentials', async () => {
  const { debugContext } = await import('./debug.ts');
  const { upstream, ApiError } = await import('./api.ts');
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'invalid_grant', error_description: 'invalid_username_or_password', password: 'test-secret', access_token: 'private-token' }, { status: 400 });
  try {
    await debugContext.run({ entries: [], secrets: new Set(['test-secret']) }, async () => {
      await assert.rejects(() => upstream('https://idp.e-kreta.hu/connect/token'), error => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 400);
        assert.match(JSON.stringify(error.details), /invalid_username_or_password/);
        return true;
      });
      const log = JSON.stringify(debugContext.getStore()?.entries);
      assert.match(log, /invalid_grant/);
      assert.match(log, /REDACTED/);
      assert.ok(!log.includes('test-secret'));
      assert.ok(!log.includes('private-token'));
    });
  } finally { globalThis.fetch = original; }
});


test('unauthorized_client is diagnosed as a client error, preserving upstream response', async () => {
  const { upstream, ApiError } = await import('./api.ts');
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: 'unauthorized_client' }, { status: 400 });
  try {
    await assert.rejects(() => upstream('https://idp.e-kreta.hu/connect/token'), error => {
      assert.ok(error instanceof ApiError);
      assert.match(error.message, /unauthorized_client/);
      assert.match(error.message, /client_id=/);
      assert.match(JSON.stringify(error.details), /unauthorized_client/);
      return true;
    });
  } finally { globalThis.fetch = original; }
});
