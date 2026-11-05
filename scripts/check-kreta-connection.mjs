import { pathToFileURL } from 'node:url';
import { kretaFetch, connectivityDetails } from '../.api-build/src/lib/kreta/network.js';
export async function checkConnection() {
  const url = 'https://idp.e-kreta.hu/.well-known/openid-configuration';
  const start = Date.now();
  try {
    const response = await kretaFetch(url, { signal: AbortSignal.timeout(35000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (body.issuer !== 'https://idp.e-kreta.hu') throw new Error('Unexpected OpenID issuer');
    console.log('KRÉTA connectivity OK:', JSON.stringify({ status: response.status, durationMs: Date.now() - start, credentialsSent: false }));
    return true;
  } catch (error) {
    console.error('KRÉTA connectivity FAILED:', JSON.stringify(await connectivityDetails(url, error)));
    return false;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!(await checkConnection())) process.exitCode = 1;
}
