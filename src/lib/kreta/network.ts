import { Agent, fetch as undiciFetch, type Dispatcher } from 'undici';
import { lookup } from 'node:dns/promises';
import { trace, errorDetails } from './debug.js';
// Keep TLS verification and the hostname/SNI intact; only select the IP family.
const dispatcher = new Agent({ connect: { family: 4, timeout: 15000 }, connectTimeout: 15000 });
// Keep fetch and its dispatcher on the same Undici version.
export const transport: { fetch: typeof globalThis.fetch } = { fetch: undiciFetch as unknown as typeof globalThis.fetch };
const retryable = new Set(['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED']);
export function networkCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const value = error as { code?: unknown; cause?: unknown };
  if (typeof value.code === 'string') return value.code;
  return networkCode(value.cause);
}
export function networkMessage(error: unknown, fallback: string) {
  const code = networkCode(error);
  return code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'ETIMEDOUT'
    ? 'A futtatókörnyezet nem tud HTTPS-kapcsolatot létrehozni a KRÉTA szerverével. Kapcsolódási időtúllépés; ez nem belépésiadat-hiba.'
    : fallback;
}
export async function connectivityDetails(url: string | URL, error: unknown) {
  const hostname = new URL(url).hostname;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let addresses: unknown;
  try {
    addresses = await Promise.race([
      lookup(hostname, { all: true }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS diagnostic timeout (2000 ms)')), 2000); }),
    ]);
  } catch (dnsError) { addresses = errorDetails(dnsError); }
  finally { if (timer) clearTimeout(timer); }
  return { hostname, addresses, errorCode: networkCode(error), region: process.env.VERCEL_REGION ?? (process.env.RENDER ? 'render' : 'local'), node: process.version, transport: 'IPv4 / TLS certificate verification enabled', connectTimeoutMs: 15000, error: errorDetails(error) };
}
export async function kretaFetch(url: string | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const attempts = method === 'GET' ? 2 : 1;
  for (let attempt = 1; ; attempt++) {
    try {
      const options: RequestInit & { dispatcher: Dispatcher } = { ...init, dispatcher };
      return await transport.fetch(url, options);
    } catch (error) {
      const code = networkCode(error);
      trace('KRÉTA hálózati kapcsolódási hiba', { hostname: new URL(url).hostname, method, attempt, errorCode: code, region: process.env.VERCEL_REGION ?? (process.env.RENDER ? 'render' : 'local'), transport: 'IPv4' });
      if (attempt >= attempts || !code || !retryable.has(code) || init.signal?.aborted) throw error;
      trace('KRÉTA GET kapcsolat újrapróbálása', { hostname: new URL(url).hostname, nextAttempt: attempt + 1 });
    }
  }
}
