import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleInstitutionSearch, parseInstitutions } from './institutions.ts';
import { transport } from './network.ts';
test('school search parses the live KRÉTA HTML format, decodes entities and blocks invalid hosts', () => {
  const list = parseInstitutions('<li><a class="dropdown-item" data-val="klik123">Budapesti &Aacute;ltal&aacute;nos Iskola</a></li><a class="dropdown-item" data-val="">Nincs találat</a><a class="dropdown-item" data-val="evil.com">Bad</a><a class="dropdown-item" data-val="klik123">Duplicate</a>');
  assert.deepEqual(list, [{code:'klik123',name:'Budapesti Általános Iskola'}]);
});
test('school search uses only the public IDP endpoint and no login credentials', async () => {
  const original=transport.fetch;let calls=0;
  transport.fetch=async (input,init)=>{calls++;const url=new URL(String(input));assert.equal(url.origin,'https://idp.e-kreta.hu');assert.equal(url.pathname,'/logininstituteselector');assert.equal(url.searchParams.get('searchValue'),'Budapest');assert.equal(init?.body,undefined);return new Response('<a class="dropdown-item" data-val="klik123">Test School</a>');};
  try { const response=await handleInstitutionSearch(new Request('https://app.example/api/institutions?q=Budapest'));assert.equal(response.status,200);assert.equal((await response.json()).institutions.length,1);await handleInstitutionSearch(new Request('https://app.example/api/institutions?q=ab'));assert.equal(calls,1); }
  finally{transport.fetch=original;}
});
