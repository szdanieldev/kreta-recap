import { trace, registerSecret, errorDetails } from './debug.ts';
import { createHmac, createHash, randomBytes } from 'node:crypto';
import { load } from 'cheerio';
import { CookieJar } from 'tough-cookie';
export const clientId = () => process.env.KRETA_CLIENT_ID || 'kreta-ellenorzo-student-mobile-ios';
export const userAgent = () => process.env.KRETA_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
export const validInstitute = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
export function policy(institute: string, nonce: string, username: string) {
  return createHmac('sha512', process.env.KRETA_HMAC_KEY || 'baSsxOwlU1jM').update(institute.toUpperCase() + nonce + username.toUpperCase()).digest('base64');
}
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); this.name = 'ApiError'; }
}
export async function upstream(url: string, init: RequestInit = {}): Promise<unknown> {
  init = { ...init, headers: { 'User-Agent': userAgent(), ...Object.fromEntries(new Headers(init.headers)) } };
  const started = Date.now();
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  for (const [key, value] of Object.entries(headers)) if (/^authorization$|cookie|^x-authorizationpolicy-key$/i.test(key)) { registerSecret(value); registerSecret(value.replace(/^Bearer /, '')); }
  const body = init.body instanceof URLSearchParams ? Object.fromEntries(init.body) : init.body;
  trace('KRÉTA kérés indítása', { url, method: init.method ?? 'GET', headers, body });
  let response: Response;
  try { response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(20000) }); }
  catch (error) { const details = { url, durationMs: Date.now() - started, error: errorDetails(error) }; trace('KRÉTA hálózati hiba', details); throw new ApiError(502, 'A KRÉTA szervere nem érhető el vagy időtúllépés történt. Próbáld újra.', details); }
  const text = await response.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (data && typeof data === 'object') for (const [key, value] of Object.entries(data)) if (/token/i.test(key)) registerSecret(value);
  const details = { url, status: response.status, statusText: response.statusText, durationMs: Date.now() - started, headers: Object.fromEntries(response.headers), body: data };
  trace('KRÉTA válasz érkezett', details);
  if (!response.ok) {
    const oauth = data && typeof data === 'object' && 'error' in data ? String(data.error) : undefined;
    if (oauth === 'unauthorized_client' || oauth === 'invalid_client') throw new ApiError(400,
      `KRÉTA OAuth: ${oauth}. A szerver elutasította az alkalmazás kliensazonosítóját vagy a választott belépési módot. client_id=${clientId()}; grant_type=${init.body instanceof URLSearchParams ? init.body.get('grant_type') : 'ismeretlen'}. Ez nem igazolja, hogy a jelszó hibás.`, details);
    if (oauth === 'invalid_grant') throw new ApiError(400, 'KRÉTA OAuth: invalid_grant. A szerver elutasította a belépési adatokat vagy a hitelesítést. A pontos KRÉTA-válasz a debug naplóban látható.', details);
    if (oauth) throw new ApiError(400, `KRÉTA OAuth hiba: ${oauth}. A részletes szerverválasz a debug naplóban látható.`, details);
    if (response.status === 401) throw new ApiError(401, 'A munkamenet lejárt. Jelentkezz be újra.', details);
    if (response.status === 400) throw new ApiError(400, 'A KRÉTA elutasította a kérést. Ellenőrizd az intézménykódot és a belépési adatokat.', details);
    throw new ApiError(502, `A KRÉTA szervere hibát jelzett (${response.status}).`, details);
  }
  return data;
}

const IDP = 'https://idp.e-kreta.hu';
const redirectUri = 'https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect';
export function createPkce() {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url'), state: randomBytes(24).toString('base64url'), nonce: randomBytes(24).toString('base64url') };
}
export async function login(institute: string, username: string, password: string) {
  registerSecret(password);
  const pkce = createPkce();
  registerSecret(pkce.verifier);
  const jar = new CookieJar();
  trace('Bejelentkezés: authorization-code + PKCE S256 indítása', { institute, username, clientId: clientId(), grantType: 'authorization_code', redirectUri });
  const query = new URLSearchParams({ client_id: clientId(), redirect_uri: redirectUri, response_type: 'code',
    scope: 'openid email offline_access kreta-ellenorzo-webapi.public kreta-eugyintezes-webapi.public kreta-fileservice-webapi.public kreta-mobile-global-webapi.public kreta-dkt-webapi.public kreta-ier-webapi.public',
    code_challenge: pkce.challenge, code_challenge_method: 'S256', state: pkce.state, nonce: pkce.nonce, prompt: 'login', suppressed_prompt: 'login' });
  const returnUrl = `/connect/authorize/callback?${query}`;
  async function request(url: string, body?: URLSearchParams) {
    const target = new URL(url, IDP);
    if (target.origin !== IDP) throw new ApiError(502, 'Nem várt hitelesítési átirányítás; a belépési adatok nem kerültek továbbításra.', { origin: target.origin });
    const cookie = await jar.getCookieString(target.href);
    const headers = { 'User-Agent': userAgent(), ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) };
    trace('KRÉTA IDP kérés indítása', { url: target.href, method: body ? 'POST' : 'GET', headers, body: body ? Object.fromEntries(body) : undefined });
    const started = Date.now();
    let response: Response;
    let html: string;
    try {
      response = await fetch(target, { method: body ? 'POST' : 'GET', body, headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
      html = await response.text();
    } catch (error) {
      throw new ApiError(502, 'KRÉTA IDP hálózati hiba.', { url: target.href, durationMs: Date.now() - started, error: errorDetails(error) });
    }
    for (const cookie of response.headers.getSetCookie()) await jar.setCookie(cookie, target.href);
    const location = response.headers.get('location');
    if (location) registerSecret(new URL(location, IDP).searchParams.get('code'));
    const $ = load(html);
    $('input').each((_, input) => {
      const name = $(input).attr('name') ?? '';
      if (/token|password|code_verifier/i.test(name)) registerSecret($(input).attr('value'));
    });
    const errors = $('.validation-summary-errors, .field-validation-error, [role="alert"], .alert-danger').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    trace('KRÉTA IDP válasz', { url: target.href, status: response.status, durationMs: Date.now() - started,
      headers: Object.fromEntries(response.headers), html: { title: $('title').text().trim(), bytes: Buffer.byteLength(html), formFields: $('input[name]').map((_, input) => $(input).attr('name')).get(), errors } });
    if (response.status >= 400) throw new ApiError(response.status < 500 ? 400 : 502, 'A KRÉTA belépőoldal hibát adott.', { status: response.status, errors });
    return { response, html, errors, location };
  }
  const pageUrl = `${IDP}/Account/Login?${new URLSearchParams({ ReturnUrl: returnUrl })}`;
  const page = await request(pageUrl);
  const $ = load(page.html);
  const form = $('form').filter((_, element) => $(element).find('input[name="Password"]').length > 0).first();
  const csrf = form.find('input[name="__RequestVerificationToken"]').val();
  if (!form.length || typeof csrf !== 'string' || !csrf) throw new ApiError(502, 'Nem található a KRÉTA belépőűrlap vagy az ellenőrző token. A belépési oldal megváltozhatott.');
  const body = new URLSearchParams();
  form.find('input[type="hidden"][name]').each((_, element) => { body.set($(element).attr('name')!, $(element).attr('value') ?? ''); });
  body.set('__RequestVerificationToken', csrf);
  body.set('ReturnUrl', returnUrl);
  body.set('UserName', username); body.set('Password', password); body.set('InstituteCode', institute); body.set('loginType', 'InstituteLogin');
  trace('Bejelentkezés: űrlapellenőrző token és sütik megvannak, belépőűrlap beküldése');
  const action = form.find('button[formaction]').first().attr('formaction') || form.attr('action') || '/account/login';
  let result = await request(new URL(action, pageUrl).href, body);
  if (result.errors.length) throw new ApiError(400, `KRÉTA belépési hiba: ${result.errors.join('; ')}`, { errors: result.errors });
  // Some IDP versions return 200 after the login POST and require an explicit authorize callback.
  let next = result.location || returnUrl;
  let code: string | null = null;
  for (let hop = 0; hop < 8; hop++) {
    const target = new URL(next, IDP);
    if (target.origin === new URL(redirectUri).origin && target.pathname === new URL(redirectUri).pathname) {
      if (target.searchParams.get('state') !== pkce.state) throw new ApiError(400, 'OAuth state eltérés: a hitelesítési válasz nem ehhez a belépéshez tartozik.');
      const oauthError = target.searchParams.get('error');
      if (oauthError) throw new ApiError(400, `KRÉTA OAuth: ${oauthError}`, { description: target.searchParams.get('error_description') });
      code = target.searchParams.get('code');
      break;
    }
    result = await request(target.href);
    if (result.errors.length) throw new ApiError(400, `KRÉTA hitelesítési hiba: ${result.errors.join('; ')}`, { errors: result.errors });
    if (!result.location) throw new ApiError(400, 'A KRÉTA nem adott authorization code-ot. További belépési lépés, kétfaktoros azonosítás vagy beleegyezés lehet szükséges; ellenőrizd a debug naplót.', { path: target.pathname });
    next = result.location;
  }
  if (!code) throw new ApiError(502, 'Nem érkezett authorization code a KRÉTA szervertől.');
  registerSecret(code);
  trace('Bejelentkezés: authorization code megérkezett, state ellenőrizve; PKCE tokenváltás');
  const token = await upstream(`${IDP}/connect/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, code_verifier: pkce.verifier, redirect_uri: redirectUri, client_id: clientId(), grant_type: 'authorization_code' }) }) as { access_token?: string; expires_in?: number };
  if (!token || typeof token.access_token !== 'string' || !token.access_token) throw new ApiError(502, 'A KRÉTA nem küldött hozzáférési tokent.');
  trace('Bejelentkezés: hozzáférési token sikeresen lekérve', { expiresIn: token.expires_in });
  return token;
}
