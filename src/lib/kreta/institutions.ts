import { load } from 'cheerio';
import { validInstitute } from './api.js';
import { kretaFetch } from './network.js';
export function parseInstitutions(html: string) {
  const $ = load(html), seen = new Set<string>();
  return $('.dropdown-item[data-val]').map((_, el) => {
    const code = $(el).attr('data-val') ?? '', name = $(el).text().replace(/\s+/g, ' ').trim();
    if (!validInstitute(code) || !name || seen.has(code)) return null;
    seen.add(code); return { code, name };
  }).get().slice(0, 50);
}
export async function handleInstitutionSearch(request: Request): Promise<Response> {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (request.method !== 'GET') return Response.json({ error: 'Csak GET kérés engedélyezett.' }, { status: 405, headers: { ...headers, Allow: 'GET' } });
    const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (query.length > 100) return Response.json({ error: 'Túl hosszú keresés.' }, { status: 400, headers });
    if (query.length < 3) return Response.json({ institutions: [] }, { headers });
    try {
      // Same public search endpoint used by the KRÉTA login page, without credentials.
      const url = new URL('https://idp.e-kreta.hu/logininstituteselector'); url.searchParams.set('searchValue', query);
      const response = await kretaFetch(url, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]), redirect: 'error' });
      if (!response.ok) throw new Error('Institution search unavailable');
      return Response.json({ institutions: parseInstitutions(await response.text()) }, { headers });
    } catch { return Response.json({ error: 'Az iskolakereső most nem érhető el. Próbáld újra, vagy használd az intézménykódot.' }, { status: 503, headers }); }
}
