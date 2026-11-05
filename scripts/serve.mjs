import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../.api-build/api/recap.js';
import institutionsHandler from '../.api-build/api/institutions.js';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).origin;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8' };
function json(res, status, body) { res.writeHead(status, { 'Content-Type': mime['.json'], 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const url = new URL(req.url || '/', publicOrigin);
    if (url.pathname === '/healthz') { if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { error: 'Method not allowed' }); return; } res.writeHead(200, { 'Content-Type': mime['.json'], 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok: true })); return; }
    if (url.pathname.startsWith('/api/')) {
      if (!['/api/recap', '/api/institutions'].includes(url.pathname)) { json(res, 404, { error: 'Ismeretlen API végpont.' }); return; }
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 8192) { json(res, 413, { error: 'Túl nagy kérés.' }); return; } chunks.push(chunk); }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      // Render terminates TLS at its proxy. Use the configured external HTTPS origin.
      const requestUrl = new URL(url.pathname + url.search, publicOrigin);
      if (!process.env.PUBLIC_ORIGIN && !process.env.RENDER_EXTERNAL_URL) requestUrl.host = req.headers.host || new URL(publicOrigin).host;
      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });
      const request = new Request(requestUrl, { method: req.method, headers, signal: controller.signal, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: Buffer.concat(chunks) } : {}) });
      const response = await (url.pathname === '/api/institutions' ? institutionsHandler : handler).fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { error: 'Method not allowed' }); return; }
    let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { json(res, 400, { error: 'Invalid URL' }); return; }
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { json(res, 403, { error: 'Forbidden' }); return; }
    let info; try { info = await stat(path); } catch { json(res, 404, { error: 'Not found' }); return; }
    if (!info.isFile()) { json(res, 404, { error: 'Not found' }); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') { res.end(); return; }
    await pipeline(createReadStream(path), res);
  } catch (error) {
    console.error('HTTP request failed.');
    if (!res.headersSent) json(res, 500, { error: 'Az alkalmazás feldolgozási hibát jelzett.' }); else res.end();
  }
});
server.requestTimeout = 270000;
server.listen(port, host, () => {
  console.log(`KRÉTA Recap: http://${host}:${server.address().port} (frontend + API, one process)`);
  if (process.env.KRETA_CHECK_ON_START === '1') import('./check-kreta-connection.mjs').then(({ checkConnection }) => checkConnection()).catch(error => console.error('KRÉTA startup connectivity:', error.message));
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 5000).unref();
});
