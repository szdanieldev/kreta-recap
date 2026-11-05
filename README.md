# KRÉTA Recap

Mobilra tervezett, kilenc oldalas, animált tanévi összefoglaló React + TypeScript + Vite alapon. Türkiz, törtfehér és mélyzöld történetoldalak, domború glow gombok, lapozás és story-export.

## Indítás

Node.js 22 (a Vercel futtatókörnyezetével egyezően).

```bash
npm install
npm run dev
```

http://localhost:5173 — egyetlen Vite-folyamat szolgálja ki a felületet és fejlesztés közben ugyanazt az API-handlert, amely Vercelen functionként fut. Nincs külön szerver, második port vagy proxybeállítás.

```bash
npm test
npm run build
npm run preview
```

Az `npm run preview` csak a statikus frontend buildjét mutatja (a demó használható). Teljes helyi belépéshez `npm run dev`, Vercel-környezethez `vercel dev` használható. A mobilméretű felület asztali böngészőből is használható.

## Használat

**Mutasd a sztorim → KRÉTA-belépés → tanévi recap → Ez mehet sztoriba.**

Az **Előbb belenézek** felirattal a teljes élmény fiktív, DEMÓ-val jelölt adatokon próbálható ki; a megosztható képen is rajta marad a jelölés. A demó nem küld KRÉTA-kérést.

A történet automatikusan 11 másodpercenként lapoz, szüneteltethető, kézzel lapozható, és érintéses vízszintes csúsztatást, valamint a billentyűzet nyilait is támogatja. A csökkentett mozgást kérő rendszerbeállításnál az animációk és az automatikus lapozás kikapcsolnak. A háttérbe tett böngészőlap, a debug panel és a megosztás szünetelteti a lejátszást.

## Statisztikák és értelmezés

Az aktuális tanév szeptember 1-től a lekérés napjáig tartó része, Europe/Budapest naptár szerint. A felület ezt **eddig** jelöléssel mutatja.

- Évközi, 1–5 közötti tantárgyi jegyek száma és eloszlása, ötösök aránya.
- Írásbeli dolgozatra, szóbeli feleletre és házi feladatra kapott jegyek az API `Mod` mezője szerint. A nem azonosítható módok az egyéb csoportba kerülnek. A dolgozatjegyek száma nem a KRÉTA-n kívül megírt összes dolgozat száma.
- Súlyozott átlag a `SulySzazalekErteke` mezővel; hiányzó vagy érvénytelen súly: 100%.
- Legerősebb tantárgy súlyozott átlag szerint, minimum 3 jeggyel.
- Legtöbb jegyet hozó hónap, ötössorozat, az időrendi jegysor két felének egyszerű átlagkülönbsége legalább 6 jegynél.
- A KRÉTA-ban kiadott házik száma; ez nem a megoldott feladatok mérése.

A félévi és év végi jegyek, magatartás, szorgalom és nem számszerű értékelések kimaradnak. Az elemeket Uid alapján deduplikáljuk; hiányzó dátumú és tanéven kívüli elemek nem kerülnek az összesítésbe. Az értékelési módok a szolgáltató szöveges mezőiből kerülnek felismerésre, így az ismeretlen módokat nem soroljuk találomra dolgozatnak.

A `POST /api/recap` a megadott belépési adatokkal hitelesít, majd ugyanabban a kérésben 21 napos, egymást nem átfedő ablakokban kéri a jegyeket és házikat, legfeljebb 3 egyidejű kéréssel. Részleges adatvesztésnél jelzi a hiányokat. Teljesen sikertelen jegylekérésből nem készít összefoglalót; elérhetetlen házifeladat-adatoknál szám helyett gondolatjel jelenik meg.

## Megosztás

A záróoldal a böngészőben 1080×1920-as PNG-képet készít. Támogatott böngészőn a Web Share API fájlmegosztó felülete nyílik meg; más esetben a PNG letölthető. A képet Instagram Storyba vagy más közösségi felületre a felhasználó teszi ki. Az elérhető célalkalmazásokat a telefon és a böngésző határozza meg; nincs automatikus posztolás.

A kép nem tartalmaz nevet, iskolát, tanárnevet vagy belépési adatokat. A demó és a részleges adatok jelölése az exporton is megmarad. A betűtípusok helyben kerülnek kiszolgálásra; nincs külső fontszolgáltatás vagy képfeltöltés.

## Belépés és debug

A működő authorization-code + PKCE S256 folyamat megmaradt: véletlen verifier/challenge és state, IDP-sütik, űrlapból olvasott CSRF-token, belépés, kézzel ellenőrzött átirányítások, majd authorization code tokenre váltása. Alapértelmezett kliens: `kreta-ellenorzo-student-mobile-ios`.

A jelszót nem tároljuk. A KRÉTA-hozzáférési token csak az aktuális function-hívás idejére létezik; nem kerül a böngészőbe, sütibe vagy több kérés között megosztott memóriába. A böngésző csak a lekért adatokat kapja, az összefoglaló bezárásakor ezek az alkalmazás állapotából törlődnek. Új adatlekéréshez új belépés kell. Nincs saját munkamenetsüti, adatbázis vagy localStorage.

A **Fejlesztői napló** lenyitható: tartalmazza a részletes API-lépéseket, hibákat, nyers adatokat és a számítás eredményét. A belépési hibák részletei a belépőpanelen is megnyithatók. A titkos hitelesítési értékek kitakarva maradnak; a debugnapló a tanulói adatokat viszont tartalmazza. A szerver terminálban is naplóz.

Opcionális, kizárólag function-oldali konfiguráció: `KRETA_CLIENT_ID`, `KRETA_USER_AGENT`. Helyben `.env.local` fájlban, Vercelen az Environment Variables beállításnál adhatók meg; ne kapjanak `VITE_` előtagot. Lásd `.env.example`. A korábbi `/api/login`, `/api/data` és `/api/logout` végpontok megszűntek.

## Ellenőrzés

`npm test`: belépés és PKCE, cookie/CSRF/state, titkok kitakarása, tanévi intervallumok, részleges API-hiba, deduplikálás és statisztikai számítások. A felület és a 1080×1920 PNG-letöltés demóadatokkal böngészőben is ellenőrizve. A kibővített tanévi lekérés valódi fiókos ellenőrzése külön szükséges.

## API-források

- https://nzx.hu/kreta-api/mobileapi/getevaluations
- https://nzx.hu/kreta-api/mobileapi/gethomeworks
- https://docs.rs/crate/ekreta/0.4.3/source/src/account.rs

Nem hivatalos KRÉTA-alkalmazás. A külső API változása befolyásolhatja a működését.

## Teljes alkalmazás ingyenes hostingon: Render

A projekt egyetlen ingyenes Render **Web Service**-ként futtatható, a frontend és az API ugyanabban a Node.js-folyamatban. Nincs külön backendtelepítés, adatbázis vagy új `server/` mappa.

1. Commitold és pushold a változásokat, különösen a `render.yaml` és `scripts/` fájlokat.
2. Render Dashboard → **New → Blueprint**, majd válaszd a repót. A gyökérben lévő `render.yaml` alapján egy `plan: free`, Frankfurt régiós szolgáltatás jön létre.
3. Ellenőrizd, hogy **Free** szerepel a csomagnál, majd indítsd a telepítést. A frontend is az új `onrender.com` címen lesz.
4. A Logs nézetben az induló tesztnél `KRÉTA connectivity OK` várható. Ez bejelentkezési adatok nélkül ellenőrzi a KRÉTA elérhetőségét.
5. Csak sikeres kapcsolatteszt után próbáld ki a valódi belépést az új címen.

Kézi **New → Web Service** beállításokkal is telepíthető:

| Beállítás | Érték |
| --- | --- |
| Runtime | Node |
| Region | Frankfurt |
| Instance Type | Free |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| NODE_VERSION | `22` |
| KRETA_CHECK_ON_START | `1` |

A Render `PORT` és `RENDER_EXTERNAL_URL` változóit az app automatikusan használja. Saját domain esetén a `PUBLIC_ORIGIN` legyen a saját teljes HTTPS eredet (például `https://recap.example.hu`); enélkül az alap Render-domaint engedi az API origin-ellenőrzése.

A Free példány 15 perc inaktivitás után elalszik, és a következő látogatáskor újraindul, ami körülbelül egy percet is igénybe vehet. A havi ingyenes keret és a külső API-forgalom korlátai érvényesek: https://render.com/docs/free . Az ingyenes csomag hobbiprojektre alkalmas, nem jelent korlátlan vagy garantált rendelkezésre állást.

**A KRÉTA elérhetősége Renderből még nem igazolt.** A Vercelen látott kapcsolódási hiba egy másik szolgáltatónál is előfordulhat. A host kiválasztása önmagában nem bizonyítja, hogy a KRÉTA fogadja az onnan indított kapcsolatokat. Az indulási teszt a folyamatot nem állítja le sikertelenségnél: a demó elérhető marad, a hiba részletei a logban látszanak.

Helyi éles próba:

```bash
npm run build
npm start
# http://localhost:3000
npm run check:hosting
npm run check:connection
```

A `check:hosting` ideiglenes loopback-porton teszteli az éles kiszolgálót és leállítja maga után. A kapcsolatellenőrzés csak a KRÉTA nyilvános OpenID-konfigurációját kéri le, jelszót nem küld.

## Vercel telepítés

A teljes projekt egyetlen Vercel-alkalmazásként telepíthető:

1. Importáld a projekt Git-repóját Vercelen (vagy futtasd a projektben a `vercel` parancsot).
2. Framework Preset: **Vite**, Build Command: **npm run build**, Output Directory: **dist**, Node.js: **22.x**.
3. A `vercel.json` ezeket a buildbeállításokat és a function 300 másodperces maximális futásidejét is deklarálja. Az alkalmazás 240 másodperces belső időkorlátot használ. A function számára Fluid Compute-ot használj; a fiókod futásideje ne legyen rövidebbre korlátozva.
4. Alapesetben nem kell környezeti változó vagy külön szolgáltatás.

Struktúra:

```text
api/recap.ts              Vercel Node.js Web Request/Response function
src/lib/kreta/            csak az API-ból importált KRÉTA/PKCE/adatlekérési logika
src/                     React felület, statisztikák, animációk és PNG-export
vite.config.ts           a function helyi, egyfolyamatos fejlesztői adaptere
vercel.json              Vercel build- és function-konfiguráció
```

A `src/lib/kreta` moduljai nem kerülnek a frontend bundle-be. A böngészőből közvetlenül nem lehet ugyanezt a belépést elvégezni, mert a szükséges IDP-sütik és átirányítások nem olvashatók szabadon cross-origin JavaScriptből. A Node.js API-function az alkalmazás része; nem igényel külön backendtelepítést. Részletes debug módban a Vercel function naplója is tartalmazhat tanulói adatokat, a hitelesítési titkok kitakarva maradnak.

A Vercel-telepítés ebben a munkamenetben nem történt meg. Ellenőrizve: 14 automatizált teszt, TypeScript/Vite build, Node 22 célú function-bundle és a helyi egyfolyamatos API HTTP-tesztjei. A teljes éles belépést telepítés után is ellenőrizni kell.

Vercel dokumentáció: https://vercel.com/docs/functions/runtimes/node-js

### API ESM-importok ellenőrzése

A Vercel által lefordított Node.js API-modulok relatív importjai `.js` végződést használnak, a TypeScript-forrásokban is. A `.ts` végződés éles JavaScriptből `ERR_MODULE_NOT_FOUND` hibát okozhat.

Az `npm run check:api` külön `NodeNext` beállítással lefordítja a teljes API-modulgráfot a figyelmen kívül hagyott `.api-build` mappába, majd sima Node.js alatt, loader és bundler nélkül betölti a belépési pontot és meghívja a handler validációját. Ez az ellenőrzés az `npm run build` része is. A `.api-build` csak ellenőrzési kimenet; Vercelen továbbra is az `api/recap.ts` az éles function belépési pontja.

### Vercel → KRÉTA kapcsolódási időtúllépés

A function régiója `fra1` (Frankfurt) a `vercel.json` fájlban. A KRÉTA-kérések explicit IPv4-es Undici-kapcsolatot használnak, 15 másodperces kapcsolódási és 45 másodperces teljes kérésidőkorláttal. Átmeneti hálózati hibánál csak a GET-kérés próbálható újra, legfeljebb egyszer; a jelszót beküldő POST és a tokenváltás nem ismétlődik automatikusan. A TLS-tanúsítvány ellenőrzése és az eredeti hostnév megmarad, nincs hardcoded IP.

Hálózati hiba esetén a debug tartalmazza a Vercel régióját, a Node-verziót, a feloldott címeket és az alacsony szintű hibakódot is. A `ConnectTimeoutError` HTTP-válasz előtti kapcsolódási hibát jelent; ebből nem állapítható meg hibás jelszó vagy biztos IP-blokkolás. A frankfurti régió és az explicit IPv4 javíthat hálózati útvonal- vagy címcsaládproblémán, de egy szolgáltatói oldali elérési korlátozást nem old fel.

A helyi, bejelentkezés nélküli IPv4-kérés 200-as választ adott a KRÉTA nyilvános OpenID-konfigurációjára; a Vercelről való elérhetőség új telepítés után igazolható. A debug első API-eseményében éles környezetben `region: fra1` várható.
