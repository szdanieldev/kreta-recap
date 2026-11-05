import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// Import emitted JS directly: no tsx loader, bundler or TypeScript source files.
const root = new URL('../.api-build/', import.meta.url);
async function checkImports(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await checkImports(path);
    else if (entry.name.endsWith('.js')) {
      const source = await readFile(path, 'utf8');
      assert.doesNotMatch(source, /(?:from\s*|import\s*\()\s*['"][^'"]+\.tsx?['"]/, `TypeScript import in emitted module: ${fileURLToPath(path)}`);
    }
  }
}
await checkImports(root);
const { default: handler } = await import(new URL('api/recap.js', root));
const url = 'https://recap-check.vercel.app/api/recap';
let response = await handler.fetch(new Request(url));
assert.equal(response.status, 405);
assert.equal(response.headers.get('cache-control'), 'no-store');
response = await handler.fetch(new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(url).origin }, body: JSON.stringify({ institute: 'invalid.example', username: 'test', password: 'not-a-real-password' }) }));
assert.equal(response.status, 400);
assert.match((await response.json()).error, /intézménykódot/);
console.log('API production ESM smoke passed: emitted JavaScript imports and handler work in plain Node.js.');
