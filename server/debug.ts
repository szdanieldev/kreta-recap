import { AsyncLocalStorage } from 'node:async_hooks';
export type Trace = { time: string; step: string; details?: unknown };
export const debugContext = new AsyncLocalStorage<{ entries: Trace[]; secrets: Set<string> }>();
const sensitive = /password|token|cookie|hmac|secret|^code$|^code_verifier$|^authorization$|^x-authorizationpolicy-key$/i;
export function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    let text = value;
    for (const secret of debugContext.getStore()?.secrets ?? []) if (secret) text = text.split(secret).join('[REDACTED]');
    return text.replace(/Bearer\s+[\w.~-]+/gi, 'Bearer [REDACTED]');
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? '[REDACTED]' : redact(item)]));
  return value;
}
export function registerSecret(value: unknown) {
  if (typeof value === 'string' && value) debugContext.getStore()?.secrets.add(value);
}
export function trace(step: string, details?: unknown) {
  const entry = { time: new Date().toISOString(), step, details: redact(details) };
  debugContext.getStore()?.entries.push(entry);
  console.debug('[KRÉTA debug]', JSON.stringify(entry));
}
export function errorDetails(error: unknown): unknown {
  if (!(error instanceof Error)) return redact(error);
  return redact({ name: error.name, message: error.message, stack: error.stack, cause: error.cause ? errorDetails(error.cause) : undefined,
    ...('details' in error ? { details: error.details } : {}) });
}
