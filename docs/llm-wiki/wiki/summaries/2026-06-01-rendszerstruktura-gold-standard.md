---
title: "Rendszerstruktúra és alapfogalmak — gold-standard termékspec (2026-06-01 snapshot)"
type: summary
sources:
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/_manifest.md
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/00-root--rendszerstruktura-es-alapfogalmak--726106121.md
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/51-tevekenyseg--adatmodell--736460813.md
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/61-tevekenysegtipusok--taxonomia--736624652.md
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/53-tevekenyseg--letrehozas-ux--732528641.md
  - "raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png"
updated: 2026-06-01
lang: mixed
---

# Rendszerstruktúra és alapfogalmak — gold-standard termékspec

Ez a **termék által karbantartott, gold-standard rendszerstruktúra** kivonata: a `gdemikk` Confluence `AI` tér `726106121` ("3. Rendszerstruktúra és alapfogalmak") oldalának és teljes leszármazott-fájának 2026-06-01-i állapota. A forrásmásolat változatlanul a dátumozott raw snapshotban él: `raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/` (lásd `_manifest.md`). A lap **iterál** — a jövőbeli ingestek új dátumozott mappába kerülnek, és a delták a snapshotok összevetéséből adódnak; ez az összegző az adott snapshot olvasata.

> **Hatókör (C5).** A subtree a **platform-szintű tanulási rendszerstruktúra** (Lecke.ai-szintű), nem közvetlenül a Matricás Album termék: nem szerepel benne `album`, `Evidence`, `differenciálás`, `Hatásnapló`. A Matricás Album e fölötti réteg egy konkrét termékolvasata. A jelenlegi prototípus kanonikus állapota: [[matricas-album-projekt-allapot]]; a domain-objektumok: [[AlbumDomain]]. A korábbi (2026-05-31) termékfa-olvasat: [[2026-05-31-matricas-album-live-termekfa]].

## 1. Hierarchia és entitások

A részletes (ma szerkesztett) oldalak szerinti lánc:

`Tanterv → Modul → Témakör → Blokk → Tevékenység`

Minden szint **önálló, verziózott entitás**, angol adatmodell-azonosítóval, és a gyerekeket **hivatkozással** (nem beágyazással) tartja — lazán csatolt, önállóan újrafelhasználható:

| Szint (hu) | Entitás | Tartalmaz (referenciával) | Szerep |
|---|---|---|---|
| Tanterv | `Curriculum` | `modules: [ModuleReference]` | normatív/szabályozó felső keret (NAT-illeszkedés, kompetencia-keret, kimenetek); „mit és miért", nem „hogyan" |
| Modul | `Module` | `topics: [TopicReference]` | több hetes/hónapos tanulási ív; témakörök stratégiai szervezése |
| Témakör | `Topic` | `blocks: [BlockReference]` (+ opcionális `activities`) | tematikus „fejezet"-szint; blokkokat fog össze közös fókusz mentén |
| Blokk | `Block` | `activities: [ActivityBlockRelation]` | foglalkozás/óraszakasz; tevékenységeket rendez pedagógiai flow-vá (`flowType`, `grouping`, `rules`, szerepek) |
| Tevékenység | `Activity` | — (atom) | a legkisebb újrafelhasználható pedagógiai egység; önállóan és blokkban is működik |

Közös elvek minden szinten: **lazán csatolt** (a gyerek több szülőben is élhet), **nem destruktív** (a szülő csak keretet/kontextust ad, nem írja felül a gyerek belső struktúráját), **verziózott**, és **AI-támogatott létrehozás** (az AI javasol, nem dönt — vö. [[pedagogia-elobb-ai-masodik]]).

## 2. Szintenkénti kivonat

- **Tanterv (`Curriculum`)** — `id, name, modules, subjects, gradeLevels, competencyFramework, learningOutcomes, progressionModel, assessmentPolicy, curriculumStandards, versioning, governance`. Stabil, ritkán változó, auditálható réteg; státuszok: `draft / review / approved / published`. UX: „nem tartalomgyártás, hanem pedagógiai rendszertervezés".
- **Modul (`Module`)** — `topics, learningGoals, competencies, curriculumAlignment{NAT,…}, progression, structure, outcomes, assessmentFramework`. UX: témakör-timeline / flow builder; „tanulási ívet szervez, nem elemekből épül".
- **Témakör (`Topic`)** — `blocks, activities?, learningGoals, competencies, curriculumAlignment, progression`. UX: blokk-szervező/navigációs réteg, nem mély szerkesztő.
- **Blokk (`Block`)** — `activities (ActivityBlockRelation), structure, pedagogyContext, flowType (linear|cyclical|exploratory|project_based|mixed), grouping (individual|pair|group|whole_class|dynamic), rules, outcomes`. Tevékenység-szerepek a blokkban: `primary | supporting | optional | transition | assessment`. UX: **drag-&-drop flow builder**, „pedagógiai flow összeállítás tevékenységekből".
- **Tevékenység (`Activity`)** — `instruction, type, metadata{shortDescription, estimatedTime, difficulty, groupSize, modality}, pedagogy{competencies, methods, reflectionPrompts}, context{subject, gradeLevel, topics, natReferences}, resources{tools, materials, attachments, externalLinks}, relations{blocks, versions, derivedFrom, reusedIn}, lifecycle{status: draft|active|archived, source: manual|ai|adapted|library}`. „Atom": nem óra, nem tanterv, nem blokk.

## 3. Tevékenységtípus (`ActivityType`) — zárt taxonómia

Minden `Activity` pontosan **egy** domináns `Tevékenységtípushoz` tartozik. A taxonómia **zárt és rendszer által definiált**: a felhasználó és az AI **nem hoz létre** új típust (az AI csak besorol/javasol). A hat típus (kulcs · `pedagogyModel`):

`Felfedező` (felfedezo · exploratory) · `Kísérletező` (kiserletezo · experimental) · `Feldolgozó` (feldolgozo · analytical) · `Kommunikációs` (communicative) · `Kollaboratív` (collaborative) · `Reflektív` (reflective).

`ActivityType` mezők: `key (nem lokalizált), name, pedagogyModel, interactionModel, cognitiveFocus, structureFlexibility, defaultGroupForm, allowedActivityPatterns, compatibility{strongWith/weakWith/conflictingWith}, examples`. Lásd [[Glossary]] (most regisztrálva). **Megjegyzés:** ez a 6 típus **egybevág** a jelenlegi app Matricatár-létrehozó felületének fix `Tevékenységtípus`-készletével (lásd [[matricas-album-projekt-allapot]]) — tehát alignment, nem delta.

## 4. Létrehozási UX — közös minta (a part-2 rework alapja)

Minden „létrehozás (UX)" oldal ugyanazt az elvet ismétli, és **élesen szemben áll a jelenlegi app zsúfolt űrlapjaival**:

1. **Nem lineáris űrlap**, hanem előbb egy **létrehozási mód választó**: `üres (manuális) · AI-generálás · meglévő adaptálása · könyvtárból · kontextusból (blokk/tevékenység)`.
2. **3-paneles szerkesztő**: bal = navigáció/mezők/könyvtár, közép = szerkesztő / **flow builder**, jobb = **élő előnézet + AI-javaslatok**.
3. **Folyamatos AI-javaslat** (típus, kompetencia, eszköz, NAT, hasonló elemek) — felülbírálható, nem kötelező.
4. **Előnézet és verziózás** mindenütt (eredeti / AI-generált / felhasználói módosítás külön kezelve).

## 5. Delták a jelenlegi apphoz (a refaktor-terv hídja)

| Gold-standard (spec) | Jelenlegi app | Delta / teendő |
|---|---|---|
| `Curriculum / Module / Topic / Block / Activity` mint külön, verziózott entitások | nincs ilyen séma; `StickerResource/StickerVersion` + `AlbumTemplate(+Version)` + `AlbumInstance/InstanceSticker` kompatibilitási réteg ([[AlbumDomain]]) | **teljes hierarchia-entitások** bevezetése — amit [[ADR002-temakor-elso-osztalyu-szint]] eddig kifejezetten halasztott |
| Kompozíció **hivatkozással** (lazán csatolt, újrafelhasználható) | **másolás/befagyasztás** (template másolja az assignmenteket; `InstanceSticker` befagyasztja a `StickerVersionId`-t) | reference-alapú kompozíció + reuse-modell (`reusedIn`, `derivedFrom`) |
| `Activity` gazdag modell + 1 domináns `Tevékenységtípus` | `StickerVersion` = `Tevékenység (matrica)`; `Phase` enum (`kerdezes/kepzelet/cselekves/reflexio`) + külön fix activity-type készlet | Activity-modell gazdagítása; `Tevékenységtípus` mint elsődleges osztályozó; a `Phase` szerepének tisztázása (megmarad-e a kreatív-tanulás fázis mellett) |
| `Tevékenységtípus`: 6 zárt, rendszer-definiált típus + `ActivityType` séma | a Matricatár UI már ugyanezt a 6 nevet kínálja (note-mezőben, nem oszlopban) | **alignment** — formalizálni mint zárt enum + `ActivityType` entitás |
| Mode-chooser + 3-paneles builder minden létrehozásnál | „crammed" űrlapok, főleg Albumterv és „Matrica" létrehozás | **UX-újratervezés** (a part-2 mandátum) |
| Minden szint verziózott (`draft/review/approved/published`) | template- és sticker-verziózás van; `Curriculum/Module/Topic/Block` nincs | verziózás kiterjesztése az új szintekre |
| `Blokk.flowType / grouping / rules` + tevékenység-szerepek | nincs explicit flow/role-modell a futó matricákon | blokk-szintű flow- és szerep-modell |

A közös activity-domain elv (egy motor, sokféle módszer) összhangban van a meglévő [[ADR001-kozos-activity-domain]] döntéssel és az [[aktivitas-csaladok]] mintával — a gold-standard ezt a motort emeli explicit, hivatkozás-alapú hierarchiává.

## 6. Ellentmondások és döntések

Az alábbi ütközéseket a **2026-06-01-i terméktulajdonosi döntés feloldotta** — a hierarchiáról lásd [[ADR002-temakor-elso-osztalyu-szint|ADR002]] (frissítve), a matrica/platform kérdésről [[ADR003-matrica-tanulasi-atom|ADR003]] (új). Az eredeti ütközés és a döntés:

- **C1 — a spec két helyen mást írt a hierarchiáról.** A subtree fő (gyökér-) oldala, a „3. Rendszerstruktúra és alapfogalmak" (`726106121`, régebbi), a „3. A szintek kapcsolata" szakaszban `Tanterv → Modul → Tanulási egység → Blokk → Tevékenység`-et írt (**`Témakör` nélkül**); a frissebb részletoldalak `Tanterv → Modul → Témakör → Blokk → Tevékenység`-et (**`Tanulási egység` nélkül**, a `Topic` adatmodell közvetlenül `blocks`-ot tartalmaz). **→ Döntés:** a friss olvasat marad — a `Témakör` first-class, a `Tanulási egység` **kivéve**.
- **C2 — a spec ütközött a saját korábbi ADR-ünkkel.** Az [[ADR002-temakor-elso-osztalyu-szint]] a `Témakör → Tanulási egység → Blokk` láncot rögzítette (mindkét szint). **→ Döntés:** a `Tanulási egység` szintet **elhagyjuk**; az ADR002 ennek megfelelően frissítve (Resolution 2026-06-01).
- **C3 — a spec a „matricát" jutalommá fokozta le.** A gyökéroldal utolsó, „4. Jutalmazás és reflektív működés" szakasza a `matricá`-kat visszajelzési/motivációs (jutalom-jellegű) elemnek mondta, nem strukturális szintnek. **→ Döntés:** a `matrica` **marad a tanulási atom**; a jutalom-olvasatot **elvetjük**, a „nem badge" guardrail érvényben ([[ADR003-matrica-tanulasi-atom|ADR003]]; [[matricas-album]], [[tanulasi-bizonyitek-evidence]]).
- **C4 — a ChatGPT-ábra `Feladat` szintet mutatott.** A `raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png` ("Rendszerszintű áttekintés") a láncot `… → TEVÉKENYSÉG → FELADAT` alakban rajzolta (+ „Módszertani könyvtár", „Kapcsolódás", „Alapelv" sávok), alacsony felbontással. **→ Döntés:** az ábrát **egyelőre figyelmen kívül hagyjuk**; **nincs** `Feladat` szint, amíg Confluence-re nem kerül és meg nem erősítik.
- **C5 — ez a fa a platform rendszerstruktúrája, nem maga az album-termék.** A subtree-ben nincs `album`, `Evidence`, `differenciálás`, `Hatásnapló`. **→ Döntés:** a platform-spec **fölérendelt réteg**, amelyhez a terméket szelektíven illesztjük (nem 1:1); a pontos megfeleltetés későbbi finomítás ([[ADR003-matrica-tanulasi-atom|ADR003]]).

## Kapcsolódó oldalak

[[matricas-album-projekt-allapot]] · [[AlbumDomain]] · [[ADR002-temakor-elso-osztalyu-szint]] · [[ADR001-kozos-activity-domain]] · [[aktivitas-csaladok]] · [[2026-05-31-matricas-album-live-termekfa]] · [[Glossary]] · [[matricas-album]] · [[pedagogia-elobb-ai-masodik]]
