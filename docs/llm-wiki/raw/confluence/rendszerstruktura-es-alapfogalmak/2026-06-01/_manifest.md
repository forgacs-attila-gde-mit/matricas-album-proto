---
cim: "3. Rendszerstruktúra és alapfogalmak — subtree snapshot"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/726106121/3.+Rendszerstrukt+ra+s+alapfogalmak
azonosito: "726106121-subtree"
ter: "AI (TroyAI csapat)"
szerzo: "pongracz.kristof (accountId: 712020:3c7a321e-9726-42b1-b51e-7fd710733a0f)"
lekerve: 2026-06-01
nyelv: hu
---

# 3. Rendszerstruktúra és alapfogalmak — subtree snapshot (2026-06-01)

> Confluence MCP lekérés: **2026-06-01**. Gyökéroldal: `726106121`.
> Ez a mappa a `726106121` ("3. Rendszerstruktúra és alapfogalmak") oldal és teljes leszármazott-fája **változatlan forrásmásolata**, ahogy 2026-06-01-én állt. A `raw/` emberi tulajdonú és immutábilis; ezt a snapshotot kifejezett felhasználói kérésre hoztuk létre.
> A jövőbeli ingestek **új dátumozott mappába** kerülnek (`.../YYYY-MM-DD/`); a delták a mappák diff-jéből és az alábbi `Módosítva` oszlop összevetéséből olvashatók. A `Page ID` a stabil azonosító — cím/struktúra változáskor is ez köti össze a verziókat.
> Média/blob assetek (a gyökéroldalba ágyazott rendszerábra) **nincsenek letöltve**. A kapcsolódó, Confluence-re még fel nem került ChatGPT-ábra külön él: `raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png` (lásd lent).
> Footer/inline **komment nem lett lekérve** ebben a snapshotban.
> A `modositva` értékek a lekéréskori API-jelzésből származnak: a gyökér `2026-05-28`, az összes részletoldal „about 3–4 hours ago" volt 2026-06-01-én ⇒ ~`2026-06-01`.

## Kapcsolat a korábbi mirrorhoz / delta

A `raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md` (a `722370562` "Termékvízió" gyökér 2026-05-29-ig terjedő állapota) **már tartalmazta ezt az ágat**, de eltérő belső struktúrával: akkor szintenként egyetlen „<szint> létrehozása" oldal létezett (pl. `733085697` = „Tanterv létrehozása"). 2026-06-01-re a fát **átstrukturálták**: minden szint alatt önálló **definíció / adatmodell / működési elvek / UX** facet-oldalak vannak (pl. `733085697` ma = „Tanterv - UX"). Ez maga egy jelentős delta a korábbi állapothoz képest.

## Hierarchia (a részletes, ma szerkesztett oldalak szerint)

`Tanterv (Curriculum) → Modul (Module) → Témakör (Topic) → Blokk (Block) → Tevékenység (Activity)`

A `Tevékenység` alatt a `Tevékenységtípus` (ActivityType) **zárt, rendszer által definiált taxonómia** (kategória, nem strukturális szint). Kompozíció **hivatkozással** (lazán csatolt, újrafelhasználható), minden szint verziózott.

## Oldalfa (2026-06-01)

| # | Page ID | Cím | Szülő | Tartalom | Módosítva | Fájl |
|---|---------|-----|-------|----------|-----------|------|
| — | 726106121 | 3. Rendszerstruktúra és alapfogalmak | 722370562 | van | 2026-05-28 | `00-root--rendszerstruktura-es-alapfogalmak--726106121.md` |
| — | 728498190 | Tanterv | 726106121 | üres konténer | ~2026-06-01 | — |
| 10 | 738426886 | Tanterv - definíció | 728498190 | van | ~2026-06-01 | `10-tanterv--definicio--738426886.md` |
| 11 | 737378350 | Tanterv - adatmodell | 728498190 | van | ~2026-06-01 | `11-tanterv--adatmodell--737378350.md` |
| 12 | 736526374 | Tanterv - működési elvek | 728498190 | van | ~2026-06-01 | `12-tanterv--mukodesi-elvek--736526374.md` |
| 13 | 733085697 | Tanterv - UX | 728498190 | van | ~2026-06-01 | `13-tanterv--ux--733085697.md` |
| — | 728727553 | Modulok | 728498190 | üres konténer | ~2026-06-01 | — |
| 20 | 737607716 | Modul - definíció | 728727553 | van | ~2026-06-01 | `20-modul--definicio--737607716.md` |
| 21 | 737673247 | Modul - adatmodell | 728727553 | van | ~2026-06-01 | `21-modul--adatmodell--737673247.md` |
| 22 | 736985102 | Modul - működési elvek | 728727553 | van | ~2026-06-01 | `22-modul--mukodesi-elvek--736985102.md` |
| 23 | 732561412 | Modul - UX | 728727553 | van | ~2026-06-01 | `23-modul--ux--732561412.md` |
| — | 731480065 | Témakörök | 728727553 | üres konténer | ~2026-06-01 | — |
| 30 | 737247255 | Témakör - definíció | 731480065 | van | ~2026-06-01 | `30-temakor--definicio--737247255.md` |
| 31 | 738263073 | Témakör - adatmodell | 731480065 | van | ~2026-06-01 | `31-temakor--adatmodell--738263073.md` |
| 32 | 737673239 | Témakör - működési elv | 731480065 | van | ~2026-06-01 | `32-temakor--mukodesi-elv--737673239.md` |
| 33 | 738230279 | Témakör - UX | 731480065 | van | ~2026-06-01 | `33-temakor--ux--738230279.md` |
| — | 728465410 | Blokkok | 731480065 | üres konténer | ~2026-06-01 | — |
| 40 | 737935390 | Blokk - definíció | 728465410 | van | ~2026-06-01 | `40-blokk--definicio--737935390.md` |
| 41 | 738099217 | Blokk - adatmodell | 728465410 | van | ~2026-06-01 | `41-blokk--adatmodell--738099217.md` |
| 42 | 738099225 | Blokk - működési elvek | 728465410 | van | ~2026-06-01 | `42-blokk--mukodesi-elvek--738099225.md` |
| 43 | 738099233 | Blokk - létrehozás (UX) | 728465410 | van | ~2026-06-01 | `43-blokk--letrehozas-ux--738099233.md` |
| — | 728301572 | Tevékenységek | 728465410 | üres konténer | ~2026-06-01 | — |
| 50 | 737378329 | Tevékenység - definíció | 728301572 | van | ~2026-06-01 | `50-tevekenyseg--definicio--737378329.md` |
| 51 | 736460813 | Tevékenység - adatmodell | 728301572 | van | ~2026-06-01 | `51-tevekenyseg--adatmodell--736460813.md` |
| 52 | 737902594 | Tevékenység - működési elvek | 728301572 | van | ~2026-06-01 | `52-tevekenyseg--mukodesi-elvek--737902594.md` |
| 53 | 732528641 | Tevékenység - létrehozás (UX) | 728301572 | van | ~2026-06-01 | `53-tevekenyseg--letrehozas-ux--732528641.md` |
| — | 725811208 | Tevékenységtípusok | 728301572 | üres konténer | ~2026-06-01 | — |
| 60 | 737017874 | Tevékenységtípusok - definíció | 725811208 | van | ~2026-06-01 | `60-tevekenysegtipusok--definicio--737017874.md` |
| 61 | 736624652 | Tevékenységtípusok - taxonómia | 725811208 | van | ~2026-06-01 | `61-tevekenysegtipusok--taxonomia--736624652.md` |
| 62 | 738033669 | Tevékenységtípusok - adatmodell | 725811208 | van | ~2026-06-01 | `62-tevekenysegtipusok--adatmodell--738033669.md` |
| 63 | 737509388 | Tevékenységtípusok - működési elvek | 725811208 | van | ~2026-06-01 | `63-tevekenysegtipusok--mukodesi-elvek--737509388.md` |
| 64 | 736591951 | Tevékenységtípusok - UX | 725811208 | van | ~2026-06-01 | `64-tevekenysegtipusok--ux--736591951.md` |

## Kapcsolódó, Confluence-en kívüli forrás

- `raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png` — „Rendszerszintű áttekintés" rendszerábra. Confluence-re **még nem került fel**. Olvasható magas szintű tartalma: a hierarchia `TANTERV → MODUL → TÉMAKÖR → BLOKK → TEVÉKENYSÉG → FELADAT` (figyelem: a `FELADAT` szint **csak az ábrán** van, a Confluence-oldalakon nincs), plusz „Módszertani könyvtár" (kompetenciák / pedagógiai módszerek / bizonyíték-szintek), „Kapcsolódás" és egy „Alapelv" sáv. Az ábra alacsony felbontású; a finom szöveg nem olvasható megbízhatóan, ezért tényként nem ingesteljük — bizonytalan jövőbeli jelzésként kezeljük.

## Ellentmondások (flag, nem feloldva)

Részletes leírás és kereszthivatkozások a wiki-összegzőben: `docs/llm-wiki/wiki/summaries/2026-06-01-rendszerstruktura-gold-standard.md`.

- **C1** — A gyökéroldal (`726106121`, régebbi) hierarchiája `… Modul → Tanulási egység → Blokk …` (Témakör nélkül); az összes részletoldal (újabb) `… Modul → Témakör → Blokk …` (Tanulási egység nélkül).
- **C2** — Ütközik az `ADR002`-vel, amely `Témakör → Tanulási egység → Blokk` (mindkettő) láncot rögzített.
- **C3** — A gyökér §4 szerint a `matrica` **jutalmazási/motivációs elem**, nem strukturális szint — szemben a termék `Tevékenység (matrica)` magjával és a wiki „matrica = bizonyíték-hordozó tanulási epizód, nem badge" guardraillel.
- **C4** — A ChatGPT-ábra `Feladat` szintet mutat, ami a Confluence-en nincs.
- **C5** — A subtree platform-szintű rendszerstruktúrának olvasható (nincs benne `album`, `evidence`, `differenciálás`, `Hatásnapló`) — a Matricás Album termék fölötti réteg.
