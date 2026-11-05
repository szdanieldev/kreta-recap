import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: fileURLToPath(new URL('..', import.meta.url)), env: { ...process.env, HOST: '127.0.0.1', PORT: '0', PUBLIC_ORIGIN: 'https://recap-test.onrender.com', KRETA_CHECK_ON_START: '0' }, stdio: ['ignore','pipe','pipe'] });
try {
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Hosting adapter did not start')), 10000);
    child.stdout.on('data', data => { const match = data.toString().match(/127\.0\.0\.1:(\d+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    child.once('error', reject); child.once('exit', code => { clearTimeout(timer); reject(new Error(`Adapter exited: ${code}`)); });
  });
  const base = `http://127.0.0.1:${port}`;
  let response = await fetch(base + '/healthz'); assert.equal(response.status,200); assert.deepEqual(await response.json(),{ok:true});
  response = await fetch(base); assert.equal(response.status,200); assert.match(response.headers.get('content-type'), /text\/html/);
  response = await fetch(base + '/api/recap'); assert.equal(response.status,405); assert.equal(response.headers.get('cache-control'),'no-store');
  response = await fetch(base + '/api/recap', {method:'POST',headers:{'Content-Type':'application/json',origin:'https://recap-test.onrender.com'},body:'{}'}); assert.equal(response.status,400);
  response = await fetch(base + '/api/recap', {method:'POST',headers:{'Content-Type':'application/json',origin:'https://wrong.example'},body:'{}'}); assert.equal(response.status,403);
  response = await fetch(base + '/api/recap', {method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(9000)}); assert.equal(response.status,413);
  for(const path of ['/package.json','/src/main.tsx','/api/unknown','/..%2fpackage.json']) { response = await fetch(base + path); assert.ok([403,404].includes(response.status), path); }
  console.log('Production hosting smoke passed: frontend, health, same-origin HTTPS proxy handling, API validation and private files.');
} finally { child.kill('SIGTERM'); }
