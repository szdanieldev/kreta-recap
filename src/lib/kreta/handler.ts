import { ApiError, login, validInstitute } from './api.js';
import { collectRecap } from './recap.js';
import { debugContext, trace, redact, errorDetails, registerSecret } from './debug.js';
const MAX_BODY = 8192;
async function readJson(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new ApiError(413, 'Túl nagy kérés.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Hiányzó JSON kérés.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new ApiError(413, 'Túl nagy kérés.'); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new ApiError(400, 'Érvénytelen JSON kérés.'); }
}
export function createRecapHandler(services = { login, collectRecap }) {
  return async (request: Request): Promise<Response> => {
    const started = Date.now();
    const deadline = AbortSignal.timeout(240000);
    return debugContext.run({ entries: [], secrets: new Set(), signal: AbortSignal.any([request.signal, deadline]) }, async () => {
      function respond(status: number, payload: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
        trace('API válasz', { status, durationMs: Date.now() - started });
        return Response.json({ ...payload, debug: redact(debugContext.getStore()?.entries ?? []) }, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders } });
      }
      try {
        trace('Recap API kérés fogadva', { method: request.method, path: new URL(request.url).pathname, region: process.env.VERCEL_REGION ?? 'local', node: process.version });
        if (request.method !== 'POST') return respond(405, { error: 'Csak POST kérés engedélyezett.' }, { Allow: 'POST' });
        const origin = request.headers.get('origin');
        if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return respond(403, { error: 'Nem engedélyezett origin.' });
        if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return respond(415, { error: 'JSON kérés szükséges.' });
        const body = await readJson(request);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Adj meg belépési adatokat.');
        const { institute, username, password } = body as Record<string, unknown>;
        if (!validInstitute(institute) || typeof username !== 'string' || !username.trim() || username.length > 256 || typeof password !== 'string' || !password || password.length > 256) throw new ApiError(400, 'Adj meg érvényes intézménykódot, felhasználónevet és jelszót.');
        registerSecret(password);
        trace('Belépési mezők formai ellenőrzése sikeres', { institute, username });
        const token = await services.login(institute, username.trim(), password);
        registerSecret(token.access_token);
        trace('Hitelesítés kész; tanévi adatok lekérése ugyanebben a kérésben');
        const result = await services.collectRecap(institute, token.access_token!);
        if (deadline.aborted) throw new ApiError(504, 'A tanévi adatlekérés túllépte a 4 perces időkorlátot. Próbáld újra.');
        return respond(200, result);
      } catch (error) {
        trace('Recap API hiba', errorDetails(error));
        return respond(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : 'A kérés feldolgozása sikertelen.', details: errorDetails(error) });
      }
    });
  };
}
