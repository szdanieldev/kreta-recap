# KRÉTA Recap

Mobilra tervezett, kilenc oldalas, animált tanévi összefoglaló React + TypeScript + Vite alapon. Türkiz, törtfehér és mélyzöld történetoldalak, domború glow gombok, lapozás és story-export.

## Indítás

Node.js 22+.

```bash
npm install
npm run dev
```

http://localhost:5173 — a Vite a `/api` kéréseket a helyi Express szervernek adja át (127.0.0.1:3001).

```bash
npm test
npm run build
npm start
```

A buildet az `npm start` a http://127.0.0.1:3001 címen szolgálja ki. A szerver loopback címre köt; ez továbbra is helyi alkalmazás. A mobilméretű felület asztali böngészőből is használható.

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

A `/api/recap` 21 napos, egymást nem átfedő ablakokban kéri a jegyeket és házikat, legfeljebb 3 egyidejű kéréssel. Részleges adatvesztésnél jelzi a hiányokat. Teljesen sikertelen jegylekérésből nem készít összefoglalót; elérhetetlen házifeladat-adatoknál szám helyett gondolatjel jelenik meg.

## Megosztás

A záróoldal a böngészőben 1080×1920-as PNG-képet készít. Támogatott böngészőn a Web Share API fájlmegosztó felülete nyílik meg; más esetben a PNG letölthető. A képet Instagram Storyba vagy más közösségi felületre a felhasználó teszi ki. Az elérhető célalkalmazásokat a telefon és a böngésző határozza meg; nincs automatikus posztolás.

A kép nem tartalmaz nevet, iskolát, tanárnevet vagy belépési adatokat. A demó és a részleges adatok jelölése az exporton is megmarad. A betűtípusok helyben kerülnek kiszolgálásra; nincs külső fontszolgáltatás vagy képfeltöltés.

## Belépés és debug

A működő authorization-code + PKCE S256 folyamat megmaradt: véletlen verifier/challenge és state, IDP-sütik, űrlapból olvasott CSRF-token, belépés, kézzel ellenőrzött átirányítások, majd authorization code tokenre váltása. Alapértelmezett kliens: `kreta-ellenorzo-student-mobile-ios`.

A jelszót nem tároljuk. A hozzáférési token a szerver memóriájában marad, a böngésző HttpOnly/SameSite=Strict munkamenetsütit kap. A szerver újraindítása vagy tokenlejárat után új belépés kell. Nincs adatbázis vagy localStorage.

A **Fejlesztői napló** lenyitható: tartalmazza a részletes API-lépéseket, hibákat, nyers adatokat és a számítás eredményét. A belépési hibák részletei a belépőpanelen is megnyithatók. A titkos hitelesítési értékek kitakarva maradnak; a debugnapló a tanulói adatokat viszont tartalmazza. A szerver terminálban is naplóz.

Konfiguráció induláskor: `KRETA_CLIENT_ID`, `KRETA_USER_AGENT`. A `/api/data` korábbi debug végpont megmaradt.

## Ellenőrzés

`npm test`: belépés és PKCE, cookie/CSRF/state, titkok kitakarása, tanévi intervallumok, részleges API-hiba, deduplikálás és statisztikai számítások. A felület és a 1080×1920 PNG-letöltés demóadatokkal böngészőben is ellenőrizve. A kibővített tanévi lekérés valódi fiókos ellenőrzése külön szükséges.

## API-források

- https://nzx.hu/kreta-api/mobileapi/getevaluations
- https://nzx.hu/kreta-api/mobileapi/gethomeworks
- https://docs.rs/crate/ekreta/0.4.3/source/src/account.rs

Nem hivatalos KRÉTA-alkalmazás. A külső API változása befolyásolhatja a működését.
