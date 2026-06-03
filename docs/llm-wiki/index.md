# Matricás Album — LLM wiki index

Catalog of all wiki pages, grouped by type. This wiki is scoped to the **Matricás Album** prototype (`apps/matricas-album/`); broader Lecke.ai discovery stays in the origin repo. Conventions and the hu/en language policy: see `AGENTS.md`. Maintained via `/wiki`.

## Entities

| Page | lang | Description |
|------|------|-------------|
| [[Glossary]] | mixed | Canonical hu↔en domain-term bridge: hierarchy, persisted enums (never translate), pedagogy terms, UI labels. |
| [[AlbumDomain]] | en | Core domain objects (`StickerResource/Version`, `AlbumTemplate/Version`, `AlbumInstance`, `InstanceSticker`, `Team`, `QualityDimension`) + the `Tanterv→…→Tevékenység` compatibility layer. |
| [[Evidence]] | en | The `Evidence`/bizonyíték entity; matrica = evidence-bearing learning episode, with help-request, feedback, team progress. |
| [[AiAdvice]] | en | Target-aware `AiAdvice`/`AiAdviceRun` + statuses + audit trail; the "AI suggests, teacher decides" guardrail. |
| [[Lauder]] | hu | A Matricás pilot/beachhead intézmény (Horányi Gábor, András osztályfőnök, Lauder matrica-könyvtár, szeptemberi pilot). |
| [[KreativKiserletezoTanar]] | hu | Az elsődleges célfelhasználó persona: 7–8. évf. természettudományos, autonóm, kísérletező tanár. |

## Concepts

| Page | lang | Description |
|------|------|-------------|
| [[matricas-album]] | hu | A domain belépő koncepciója: album-metafora, terméklogika, MVP- és flagship-olvasat. |
| [[kreativ-tanulas]] | hu | Kreatív tanulás termékelvként: kreatív diszpozíciók, OECD CERI 4 makrofolyamat + 8 kritérium, szignatúra módszerek. |
| [[tanulasi-bizonyitek-evidence]] | hu | Az `Evidence` entitás pedagógiai alapja: látható tanulási nyomok evidence-portfóliója. |
| [[projekterettsegi]] | hu | Lannert-féle projektérettségi mint az album legitimációs narratívája (többhetes projektút, kompetenciabizonyítás). |
| [[pedagogia-elobb-ai-masodik]] | hu | Az `AiAdvice` guardrail: AI javasol/előtölt, tanár dönt; digitális eszköz pedagógia nélkül nem fejleszt. |
| [[matricas-pilot-merese]] | hu | Hogyan mérünk egy Matricás pilotot: heti megfigyelés, Hatásnapló, pre/post, rubrika, evidence. |
| [[aktivitas-csaladok]] | hu | A domain által támogatott módszercsaládok (Pattern/MethodFamily), evidence A–D szintekkel — az ADR001 betáplálója. |
| [[6k-kompetenciak]] | hu | 6K mint termékparaméter: kompetencia = megfigyelhető evidence, nem díszcímke (CompetencyTags háttér). |
| [[nyomtatott-vs-digitalis]] | hu | Egy pedagógiai modell több output-megjelenése: fizikai matrica/füzet, digitális, hibrid. |
| [[kreativ-partnerseg]] | hu | Pécsi Kreatív Partnerség mint bevezetési és hatásmérési minta. |

## Summaries

| Page | lang | Description |
|------|------|-------------|
| [[matricas-album-projekt-allapot]] | mixed | A működő prototípus kanonikus állapotképe: domainmodell, API, UX, AI, prototípus-érettség, scope-korlátok. |
| [[matricas-album-30-napos-strategia]] | hu | 30 napos belső flagship-demó stratégia és scope (sanitizált szervezeti nyelvvel). |
| [[matricas-album-igazgatoi-pitch]] | hu | Partneri hangvételű igazgatói pitch a 21. századi tanulási vízióhoz. |
| [[matricas-album-kreativ-tanulas-illeszkedes]] | hu | Illeszkedés a kreatív tanulás elveihez; a matrica = tanulási epizód guardrail forrása. |
| [[matricas-album-kulso-projektalapu-peldak]] | hu | Külső projektalapú benchmark (OECD CERI, PBLWorks/HTH, EL Education, Project Zero, Design for Change). |
| [[matricas-album-belso-funkciomintak]] | hu | Az album eredettörténete: hogyan áll össze a korábbi Lecke.ai discovery mintáiból. |
| [[2026-05-31-matricas-album-live-termekfa]] | hu | A legfrissebb live Confluence termékfa: célcsoport, progresszív UX, hierarchia, tevékenységtípusok. |
| [[2026-05-20-lauder-lecke-bemutatas]] | hu | Lauder szeptemberi pilot-readiness és a matrica-szervezés minimum. |
| [[2026-04-21-matricas-album-eredeti-terv]] | hu | Az eredeti album funkcióterv; az album-metafora kiindulópontja. |
| [[2026-03-11-lauder-science-workshop]] | hu | Az eredeti vizionáló forrás: integrált természettudományos, tevékenységalapú megközelítés. |
| [[4k-6k-activity-piackutatas]] | hu | 8 evidence-alapú module-család, STEM-first activity-katalógus (CSV mellékletcel). |
| [[2016-creative-partnerships-pecs-pilot]] | hu | Pécsi KP matematika-pilot: pre/post + kontrollcsoportos pedagógiai hatásmérés. |
| [[lannert-podcast-matricas-guardrailek]] | hu | Lannert Te Podcast Matricás-releváns guardrailjei: projektérettségi, evidence, hatásnapló, anti-gamifikáció, AI-szerep. |

## ADRs

| Page | lang | Description |
|------|------|-------------|
| [[ADR001-kozos-activity-domain]] | mixed | No per-method bounded context; the `Sticker`/`Album`/`Instance`/`Evidence` core is the common activity-run engine. |
| [[ADR002-temakor-elso-osztalyu-szint]] | mixed | `Témakör` is a first-class hierarchy level (contains `Tanulási egység`); schema rename only after a migration mapping. |
| [[ADR005-db-volume-reset-branchvaltasnal]] | mixed | Branches share one Postgres volume; on migration-divergent branch switch, reset with `docker compose down -v` — never teach `DemoSeeder` foreign tables. (ADR003–004 are reserved on the `gold-standard-ingest-refactor-plan` branch.) |

## Prompts

| Page | lang | Description |
|------|------|-------------|
| [[matricas-album-end-to-end-demo]] | mixed | English generative-prototyping prompt that produces the full Hungarian end-to-end album demo. |

## Plans

| Page | lang | Description |
|------|------|-------------|
| [[REFACTOR-003-urlap-suruseg-es-hierarchia]] | mixed | Cross-cutting form-density/hierarchy refactor: shared `ma-field`/`ma-form-section`/`ma-disclosure` + spacing tokens, required-first ordering with visible markers, collapsed „Opcionális részletek", one primary per screen, WCAG AA label contrast. Status: Complete (2026-06-03, branch `design-improvement`). |

## Features

| Page | lang | Description |
|------|------|-------------|
| [[features]] | mixed | Registry of shipped/proposed product capabilities with wiki refs and `apps/matricas-album` code paths; origin-only Lecke.ai features listed as pointers. |
