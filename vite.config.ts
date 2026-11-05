import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// Development adapter for the exact same Web Request/Response handler Vercel runs.
function recapApi(): Plugin {
  return {
    name: 'recap-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        if (req.url?.split('?')[0] !== '/recap') { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Ismeretlen API végpont.' })); return; }
        try {
          const chunks: Buffer[] = []; let size = 0;
          for await (const chunk of req) {
            const buffer = Buffer.from(chunk); size += buffer.length;
            if (size > 8192) { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Túl nagy kérés.' })); return; }
            chunks.push(buffer);
          }
          const { default: handler } = await server.ssrLoadModule('/api/recap.ts');
          const headers = new Headers();
          for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
          const request = new Request(`http://${req.headers.host || 'localhost:5173'}/api/recap`, { method: req.method, headers, ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: Buffer.concat(chunks) } : {}) });
          const response: Response = await handler.fetch(request);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          console.error('Recap development adapter:', error instanceof Error ? error.message : 'Unknown error');
          if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'A helyi API-adapter hibát jelzett. A részletek a terminálban láthatók.' }));
        }
      });
    },
  };
}
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'KRETA_');
  for (const [key, value] of Object.entries(env)) if (process.env[key] === undefined) process.env[key] = value;
  return { plugins: [react(), recapApi()], server: { host: '127.0.0.1', port: 5173, strictPort: true } };
});
