# Log

Append-only operation log for the Matricás Album LLM wiki. Newest entries on top. Format: `## [YYYY-MM-DD] <verb> | <title>`.

## [2026-06-01] note | Gold-standard döntések (C1–C5) + „plans live in the wiki" szabály
- Terméktulajdonosi döntés a 2026-06-01 ingest ellentmondásaira: **C1+C2** → a `Tanulási egység` szint kikerül, a `Témakör` first-class marad ⇒ lánc `Tanterv → Modul → Témakör → Blokk → Tevékenység`; **C3** → a `matrica` marad a tanulási atom (jutalom-olvasat elvetve); **C4+C5** → a ChatGPT-ábrát (`Feladat` szint stb.) egyelőre mellőzzük, a platform-spec fölérendelt réteg.
- Rögzítve: [[ADR002-temakor-elso-osztalyu-szint]] frissítve (flag → Resolution), új [[ADR003-matrica-tanulasi-atom]], a [[2026-06-01-rendszerstruktura-gold-standard]] „6. Ellentmondások és döntések" szakasza, [[Glossary]] hierarchia-sora, és `AGENTS.md` §1 hierarchia-invariáns.
- Szabály (`AGENTS.md` §2): a fejlesztési/implementációs tervek a wikibe kerülnek (`wiki/plans/`, `type: plan`), nem `apps/`-ba. A `REFACTOR-001` terv átmozgatva: `wiki/plans/REFACTOR-001-gold-standard-rendszerstruktura.md`; `index.md` „Plans" szekció + `roadmap.md` mutató frissítve.
- next: opcionális konzisztencia-pass — [[AlbumDomain]], [[matricas-album-projekt-allapot]] és `apps/matricas-album/docs/architecture.md` még a régi (Tanulási egység-es) láncot / leképezést írják.

## [2026-06-01] ingest | Rendszerstruktúra és alapfogalmak — gold-standard Confluence subtree
- Ingested Confluence `726106121` ("3. Rendszerstruktúra és alapfogalmak") + full descendant subtree (26 content pages: `Tanterv/Modul/Témakör/Blokk/Tevékenység` × {definíció, adatmodell, működési elvek, UX} + `Tevékenységtípusok` × 5; 6 empty container nodes recorded in manifest) as a **dated raw snapshot**: `raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/` (+ `_manifest.md`). Future ingests = new dated folder; deltas = folder diff (per-page `azonosito`/`modositva`). Created under explicit user request (raw/ guard).
- New wiki page: [[2026-06-01-rendszerstruktura-gold-standard]] (lang: mixed) — target model (`Curriculum/Module/Topic/Block/Activity`, reference-based composition, versioning), per-level condensation, `Tevékenységtípus` taxonomy, common creation-UX pattern, **deltas vs current app**, flagged contradictions C1–C5.
- [[Glossary]]: registered the `Tevékenységtípus` (ActivityType) closed 6-type taxonomy (`Felfedező/Kísérletező/Feldolgozó/Kommunikációs/Kollaboratív/Reflektív`) — also closes a prior lint gap.
- Flagged in [[ADR002-temakor-elso-osztalyu-szint]]: newer detail pages confirm `Témakör` first-class but **drop `Tanulási egység`** (ADR002 had `Témakör → Tanulási egység → Blokk`).
- Contradictions flagged, not resolved: C1 hierarchy mismatch (root vs detail pages), C2 vs ADR002, C3 "matrica" reframed as reward element (root §4) vs the not-a-badge guardrail, C4 PNG-only `Feladat` level, C5 platform-vs-product scope. The ChatGPT system diagram (`raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png`) is recorded as an uncertain future signal, not ingested as fact (low-res; not yet on Confluence).
- next: refactor plan (functionality parity to the spec + UX simplification of Albumterv / "Matrica" creation).

## [2026-06-01] note | Bootstrap — spun out the Matricás Album wiki from Lecke.ai discovery
- Assembled the standalone Matricás Album repository package: `apps/matricas-album/` (the working prototype, relocated to an ASCII path, with real `.env` and build artifacts excluded) and `docs/llm-wiki/` (this wiki) + the `/wiki` command + `AGENTS.md`/`CLAUDE.md`/`README.md`.
- Wiki seeded with **33 pages**: 6 entities (incl. [[Glossary]]), 10 concepts, 13 summaries, 2 ADRs, 1 prompt, plus the [[features]] registry. Generated from a classification of the origin Lecke.ai discovery wiki.
- Transformations: distilled 16 supporting pedagogy pages into ~8 concept pages; split the project-state document into [[AlbumDomain]] / [[Evidence]] / [[AiAdvice]] entities; merged the two Lannert-podcast pages into one summary; sanitized internal organizational references in the 30-day strategy.
- Language seam established: per-page `lang` frontmatter (`hu`/`en`/`mixed`); pedagogy/product = Hungarian, technical = English with Hungarian domain tokens kept verbatim; [[Glossary]] is the hu↔en bridge.
- `raw/` mirrors added (human-owned): 4 Matricás Confluence pages, the 2016 Pécs Creative Partnerships study, the 4K/6K source pack + external-example PDFs, the Lannert/Németh book, and the Lannert Te Podcast transcript.
- Scope boundary: 62 Lecke.ai-wide pages stayed in the origin discovery wiki and are referenced only as origin pointers (see [[features]]).
- Verification: all 33 pages carry the 5 frontmatter keys incl. `lang`; all wiki cross-links resolve to inventory pages (relative links normalized to bare slugs); all `sources` resolve to present `raw/` or `apps/` files.
- next: human review of content; optionally add an Obsidian vault config; before publishing, rotate the OpenAI key referenced by the original `.env` and `git init` this package as a fresh remote.
