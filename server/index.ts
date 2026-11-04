import { collectRecap } from './recap.ts';
import { debugContext, trace, redact, errorDetails, registerSecret } from './debug.ts';
import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ApiError, login, upstream, validInstitute } from './api.ts';
const app = express();
const sessions = new Map<string, { token: string; institute: string; expires: number }>();
app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
  debugContext.run({ entries: [], secrets: new Set() }, () => {
    const started = Date.now();
    trace('Helyi API kérés fogadva', { method: req.method, path: req.path, origin: req.get('origin') });
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      trace('Helyi API válasz', { status: res.statusCode, durationMs: Date.now() - started });
      return originalJson({ ...(body as object), debug: redact(debugContext.getStore()?.entries ?? []) });
    }) as typeof res.json;
    next();
  });
});
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
// Only same-origin browser mutations; no permissive CORS.
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  if (origin && !['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001', 'http://127.0.0.1:3001'].includes(origin)) {
    res.status(403).json({ error: 'Nem engedélyezett origin.' }); return;
  }
  if (req.method === 'POST' && !req.is('application/json')) { res.status(415).json({ error: 'JSON kérés szükséges.' }); return; }
  next();
});
app.use(express.json({ limit: '8kb' }));
function sessionId(cookie = '') { return cookie.split(';').map(v => v.trim()).find(v => v.startsWith('kreta_session='))?.slice('kreta_session='.length); }
const cookieOptions = { httpOnly: true, sameSite: 'strict' as const, path: '/api', secure: false };
const cleanup = setInterval(() => { for (const [id, s] of sessions) if (s.expires <= Date.now()) sessions.delete(id); }, 60000);
cleanup.unref();
let attempts: number[] = [];
app.post('/api/login', async (req, res) => {
  attempts = attempts.filter(t => t > Date.now() - 60000);
  if (attempts.length >= 10) { res.status(429).json({ error: 'Túl sok próbálkozás. Várj egy percet.' }); return; }
  const { institute, username, password } = req.body ?? {};
  if (!validInstitute(institute) || typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password || username.length > 256 || password.length > 1024) {
    res.status(400).json({ error: 'Adj meg érvényes intézménykódot, felhasználónevet és jelszót.' }); return;
  }
  registerSecret(password);
  trace('Belépési mezők helyi formai ellenőrzése sikeres', { institute, username });
  attempts.push(Date.now());
  const token = await login(institute, username.trim(), password);
  const old = sessionId(req.headers.cookie); if (old) sessions.delete(old);
  const id = randomBytes(32).toString('hex');
  const seconds = typeof token.expires_in === 'number' && token.expires_in > 0 ? Math.min(token.expires_in, 3600) : 1800;
  sessions.set(id, { institute, token: token.access_token!, expires: Date.now() + seconds * 1000 });
  trace('Helyi munkamenet létrehozva', { expiresIn: seconds });
  res.cookie('kreta_session', id, { ...cookieOptions, maxAge: seconds * 1000 }).json({ ok: true });
});
app.get('/api/recap', async (req, res) => {
  const id = sessionId(req.headers.cookie);
  const session = id ? sessions.get(id) : undefined;
  if (!session || session.expires <= Date.now()) { if (id) sessions.delete(id); throw new ApiError(401, 'A munkamenet lejárt. Jelentkezz be újra.'); }
  try { res.json(await collectRecap(session.institute, session.token)); }
  catch (error) { if (error instanceof ApiError && error.status === 401) sessions.delete(id!); throw error; }
});
app.get('/api/data', async (req, res) => {
  const id = sessionId(req.headers.cookie);
  const session = id ? sessions.get(id) : undefined;
  if (!session || session.expires <= Date.now()) { if (id) sessions.delete(id); throw new ApiError(401, 'Jelentkezz be a KRÉTA-fiókodba.'); }
  trace('Munkamenet ellenőrizve; adatlap és értékelések párhuzamos lekérése', { institute: session.institute, expiresAt: new Date(session.expires).toISOString() });
  const base = `https://${session.institute}.e-kreta.hu/ellenorzo/v3/sajat`;
  const options = { headers: { Authorization: `Bearer ${session.token}` } };
  const results = await Promise.allSettled([upstream(`${base}/TanuloAdatlap`, options), upstream(`${base}/Ertekelesek`, options)]);
  const names = ['student', 'grades'] as const;
  const output: Record<string, unknown> = {};
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') output[names[i]] = result.value;
    else { if (result.reason instanceof ApiError && result.reason.status === 401) { sessions.delete(id!); throw result.reason; }
      trace('Részleges adatlekérési hiba', { resource: names[i], error: errorDetails(result.reason) });
      output[`${names[i]}Error`] = result.reason instanceof Error ? result.reason.message : 'Sikertelen lekérés.'; }
  });
  res.json(output);
});
app.post('/api/logout', (req, res) => { const id = sessionId(req.headers.cookie); if (id) sessions.delete(id); trace('Helyi munkamenet törölve'); res.clearCookie('kreta_session', cookieOptions).json({ ok: true }); });
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Ismeretlen API végpont.' }); });
app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  trace('Kérés feldolgozási hiba', errorDetails(error));
  res.status(error instanceof ApiError ? error.status : 500).json({ error: error instanceof Error ? error.message : 'A kérés feldolgozása sikertelen.', details: errorDetails(error) });
});
app.listen(3001, '127.0.0.1', () => console.log('KRÉTA API: http://127.0.0.1:3001'));
