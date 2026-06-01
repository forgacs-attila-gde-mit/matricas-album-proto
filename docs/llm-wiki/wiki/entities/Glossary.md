---
title: Glossary
type: entity
sources:
  - apps/matricas-album/docs/architecture.md
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/DomainValues.cs
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/Album.cs
updated: 2026-06-01
lang: mixed
---

# Glossary

The canonical **hu ↔ en bridge** for this repo. It is the contract that lets an English technical page (an ADR, a domain entity, the architecture doc) use a Hungarian domain term **verbatim** without translating it: write the Hungarian token, link `[[Glossary]]` on first use, and rely on this table for the explanatory English gloss.

**Rules (see [AGENTS.md](../../../../AGENTS.md) §1 for the full language policy):**

- The Hungarian term is the **canonical identifier**. The English gloss is explanatory only — it is **never** used as a substitute name in code, enums, routes, page titles, or other docs.
- **Persisted enums / state strings are stored verbatim in Postgres and matched case-insensitively. Never translate or rename them** — in code or in docs.
- A new Hungarian domain term enters the wiki by being added here **first**, then linked from the page that introduces it.

## Hierarchy and core domain objects

| hu (canonical) | en gloss | Definíció | Kód / megfelelő |
|---|---|---|---|
| Tanterv → Modul → Témakör → Tanulási egység → Blokk → Tevékenység | Curriculum → Module → Topic → Learning unit → Block → Activity | A Confluence-igazított termékhierarchia. A `Témakör` első osztályú szint ([[ADR002-temakor-elso-osztalyu-szint\|ADR002]]). Magyar marad docs+UI-ban; több szint még nem külön schema-entitás. | lásd [[AlbumDomain]] |
| Tevékenység (matrica) | Activity (sticker) | A legkisebb tanulási tevékenység a hierarchia alján; egy kérdezés→képzelet→cselekvés→reflexió ívű, evidence-szel záruló tanulási epizód. | `StickerResource` / `StickerVersion` |
| matrica | sticker (learning episode) | A `Tevékenység` termékesített, vizuális egysége. Nem jutalom/badge, hanem evidence-szel záruló epizód. Domain token — nem fordítandó. | `Sticker*` |
| Album / Albumterv / Futó album | Album / Album template / Running album instance | Album = tanulási út/expedíció; Albumterv = verziózott sablon; Futó album = egy osztályra példányosított futás. | `AlbumTemplate(+Version)` / `AlbumInstance` |
| Matricatár | Sticker library | Az újrafelhasználható matricasablonok tára (pl. a Lauder matrica-könyvtár). | `StickerResource(+Version)` |
| Műhely | Workshop (teacher home) | A tanári kezdőfelület: progresszív indulások + kezelés/visszakeresés. | — |
| Evidence (bizonyíték) | Evidence (learning evidence) | A matricát lezáró tanulási bizonyíték; az evidence-portfólió eleme. A "matrica = evidence-bearing learning episode" invariáns hordozója. | `Evidence` — lásd [[Evidence]] |
| Reflexió | Reflection | A matrica kötelező záró fázisa: a tanulói gondolkodásváltozás rögzítése. | `reflektalt` állapot |
| Hatásnapló | Teacher effect log | Projektzáráshoz persistált tanári hatásnapló (heti megfigyelés + pre/post a pilot-hatásméréshez). | `TeacherEffectLog` |
| Projektzárás | Project closure | Az album lezárása: produktum + evidence-portfólió + hatásnapló összegzése; a [[projekterettsegi\|projektérettségi]] narratíva csúcspontja. | closure flow |

## Persisted enums — NEVER translate or rename

| hu (stored string) | en gloss | Definíció | Kód |
|---|---|---|---|
| tervezett / aktiv | planned / active | `InstanceSticker.State` életciklus (mikor nyílik meg a matrica az osztálynak). | `StickerStates` |
| varakozik / javitas / elkeszult / reflektalt / bekuldve | pending / revision / done / reflected / submitted | Csapatonkénti munkaállapot egy futó matricán. | `InstanceStickerTeamProgress` |
| het / ora / fazis | week / lesson / phase | Az album/blokk időléptéke (duration type). | `DurationTypes` |
| tamogatott / alap / kihivas | supported / base / challenge | Albumon belüli differenciálási utak (nem rangsor). | `DifferentiationPathKeys` |
| uj / elfogadott / elutasitott / alkalmazott / hibas | new / accepted / rejected / applied / failed | Az [[AiAdvice]] állapotai (a "pedagógia előbb, AI második" guardrail kimenete). | `AdviceStatuses` |
| ok / warn / miss | ok / warn / miss | A [[kreativ-tanulas\|kreatív tanulási]] minőségdimenziók állapota. | `QualityStates` |
| altalanos / produktiv-hibazas / kutatas-bizonyitas | general / productive-failure / inquiry-proof | Albumsablon pedagógiai minták (`Pedagógiai minta`): Általános / Produktív hibázás / Kutatás-bizonyítás. | `AlbumTemplatePatterns` |

## Pedagogy concepts

| hu (canonical) | en gloss | Definíció | Oldal |
|---|---|---|---|
| Pedagógiai minta (MethodFamily / Pattern) | Pedagogical pattern / method family | A matrica mint végrehajtható playbook módszertani magja; az activity-domain Pattern rétege. | [[aktivitas-csaladok]], [[ADR001-kozos-activity-domain]] |
| Projektérettségi | Project-based maturity exam | Lannert-féle keret: többhetes projektúton kompetenciabizonyítás; a Matricás album legitimációs narratívája. | [[projekterettsegi]] |
| 6K kompetenciák | 6C competencies | Hatkompetenciás keret (kritikai gondolkodás, kreativitás, kommunikáció, kollaboráció, karakter, közösségi szerepvállalás). Kompetencia = megfigyelhető evidence, nem díszcímke. | [[6k-kompetenciak]] |
| Kreatív tanulás | Creative learning | Aktív kérdezés → képzelet → cselekvés → reflexió tanulási folyamat (Lannert/Németh, OECD CERI). | [[kreativ-tanulas]] |

## UI / flow labels (user-facing — stay Hungarian)

| hu (canonical) | en gloss | Definíció |
|---|---|---|
| Kezdj egy ötlettel / órával / tantervtel | Start from an idea / a lesson / a curriculum | A három progresszív tervezési belépési út; a tanári onboarding fő ágai. |
| Publikálás / Elvetés / Szerkesztés / Mégse | Publish / Discard / Edit / Cancel | Albumterv-verziózási műveletek (draft → published). |
| Diák nézet / Csapatunk / Bizonyítékaink / Visszajelzések / Reflexió / Segítség | Student view / Our team / Our evidence / Feedback / Reflection / Help | A tanulói/csapat felület fő nézetei. User-facing hu, nem fordítandó. |
| Megszerzett matricák / Csapatunk állapota | Earned stickers / Our team status | Tanulói haladás-nézetek. |
| Pedagógiai súgó | Pedagogical help | A tanári kereshető módszertani háttérréteg (a futó agent ugyanazt a tudástárat használja). |
