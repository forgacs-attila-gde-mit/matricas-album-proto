# Log

Append-only operation log for the Matricás Album LLM wiki. Newest entries on top. Format: `## [YYYY-MM-DD] <verb> | <title>`.

## [2026-06-03] note | ADR005 — reset the shared Postgres volume when switching branches
- Diagnosed the 2026-06-03 `Adatbázis alapállapotba állítása` failure (Postgres 23503 on `FK_activity_block_relations_sticker_versions_StickerVersionId`): the shared `matricas-album_postgres-data` volume held 27 migrations from the `gold-standard-ingest-refactor-plan` branch while the running images came from `main` (20 migrations).
- New page: [[ADR005-db-volume-reset-branchvaltasnal]] — rule: `docker compose down -v` on migration-divergent branch switches; never patch `DemoSeeder` for foreign tables. Numbered 005 because ADR003–004 exist on the branch.
- Index updated (ADRs table). No contradictions with existing pages.
- next: when the branch merges, confirm ADR003/ADR004 land beside this page without numbering conflicts.

## [2026-06-01] note | Bootstrap — spun out the Matricás Album wiki from Lecke.ai discovery
- Assembled the standalone Matricás Album repository package: `apps/matricas-album/` (the working prototype, relocated to an ASCII path, with real `.env` and build artifacts excluded) and `docs/llm-wiki/` (this wiki) + the `/wiki` command + `AGENTS.md`/`CLAUDE.md`/`README.md`.
- Wiki seeded with **33 pages**: 6 entities (incl. [[Glossary]]), 10 concepts, 13 summaries, 2 ADRs, 1 prompt, plus the [[features]] registry. Generated from a classification of the origin Lecke.ai discovery wiki.
- Transformations: distilled 16 supporting pedagogy pages into ~8 concept pages; split the project-state document into [[AlbumDomain]] / [[Evidence]] / [[AiAdvice]] entities; merged the two Lannert-podcast pages into one summary; sanitized internal organizational references in the 30-day strategy.
- Language seam established: per-page `lang` frontmatter (`hu`/`en`/`mixed`); pedagogy/product = Hungarian, technical = English with Hungarian domain tokens kept verbatim; [[Glossary]] is the hu↔en bridge.
- `raw/` mirrors added (human-owned): 4 Matricás Confluence pages, the 2016 Pécs Creative Partnerships study, the 4K/6K source pack + external-example PDFs, the Lannert/Németh book, and the Lannert Te Podcast transcript.
- Scope boundary: 62 Lecke.ai-wide pages stayed in the origin discovery wiki and are referenced only as origin pointers (see [[features]]).
- Verification: all 33 pages carry the 5 frontmatter keys incl. `lang`; all wiki cross-links resolve to inventory pages (relative links normalized to bare slugs); all `sources` resolve to present `raw/` or `apps/` files.
- next: human review of content; optionally add an Obsidian vault config; before publishing, rotate the OpenAI key referenced by the original `.env` and `git init` this package as a fresh remote.
