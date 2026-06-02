---
title: "ADR004 — Hivatkozás-alapú, verziózott hierarchia (Tanterv → Tevékenység)"
type: adr
sources:
  - wiki/plans/REFACTOR-001-gold-standard-rendszerstruktura.md
  - apps/matricas-album/docs/architecture.md
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/Block.cs
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/Topic.cs
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/Module.cs
  - apps/matricas-album/src/MatricasAlbum.Api/Domain/Curriculum.cs
updated: 2026-06-02
lang: mixed
---

# ADR004 — Hivatkozás-alapú, verziózott hierarchia (Tanterv → Tevékenység)

**Status:** Accepted (2026-06-02) — REFACTOR-001 Phases 4–6 shipped.

## Context

The gold-standard rendszerstruktúra ([[2026-06-01-rendszerstruktura-gold-standard]]) defines five **reference-composed, versioned** levels — `Tanterv → Modul → Témakör → Blokk → Tevékenység` — where a parent references a *child version* (loose coupling, the child reusable across many parents) rather than copying it. The app implemented none of these as entities; the hierarchy existed only as UI/metadata serialized into `AlbumTemplate`/`AlbumInstance` note-fields ([[AlbumDomain]]). [[ADR002-temakor-elso-osztalyu-szint]] made `Témakör` first-class and **retired `Tanulási egység`** (so `Témakör → Blokk` directly); [[ADR003-matrica-tanulasi-atom]] kept `matrica` (`StickerVersion`) as the `Tevékenység` learning atom.

## Decision

Introduce the four missing levels as **real, additive, feature-flagged entities** bottom-up (`Block`, then `Topic`, `Module`, `Curriculum`), each as a `Resource / Version / ReferenceJoin` triple that mirrors the proven `AlbumTemplate` versioning:

- **Reference composition, not copy.** The join row (`ActivityBlockRelation → StickerVersion`, `TopicBlockRelation → BlockVersion`, `ModuleTopicRelation → TopicVersion`, `CurriculumModuleRelation → ModuleVersion`) uses `FK … ON DELETE RESTRICT`. Deleting a relation never touches the referenced child, and the same child version is referenceable by many parents (no `unique` on the referenced id). Parents reference only **published** child versions (`latestPublishedVersionId`).
- **Uniform versioning.** `≤1 draft` per resource (partial unique index `WHERE IsDraft = TRUE`), published-immutable, `v1` starts editable, `POST …/draft` clones the latest published; two-pass reorder avoids the `unique (parentVersionId, SortOrder)` collision.
- **Closed/defaulted values** on `Blokk`: `BlockFlowTypes`/`BlockGroupings` default; `BlockActivityRoles` closed (unknown → 400). `Tevékenység` carries a persisted `ActivityType` (closed 6-type taxonomy, see [[Glossary]]) + structured planning metadata.
- **Dark by default.** Each level is gated by `Features:Hierarchy:{Block|Topic|Module|Curriculum}` (on in Development, off in prod; no web nav entry when off). The running app is untouched.
- **Additive, evidence-safe migration.** `POST /api/album-templates/{id}/derive-blocks` maps a template's unit rows to published Blocks; it inserts only Block rows (idempotent by name) and never reads or mutates templates, instances, evidence, or progress.

## Why (not the alternatives)

- **Not copy-composition.** Copying children would break reuse and double-counting of edits; the spec is explicit about reference + "snapshot at run". The existing `InstanceSticker` mint already provides snapshot-at-run, so the planning layer can stay pure-reference.
- **Not a big-bang rewire of the mint path.** Routing `AlbumInstance` minting *through* the new hierarchy would put live-album evidence at risk for no immediate gain while no template composes blocks yet. Deferred deliberately.
- **Feature-flagged + additive** keeps the pilot-safe, compatibility-first guardrails (`roadmap.md`) intact: the hierarchy can mature behind flags without destabilising running albums.

## Consequences

- The full chain exists end-to-end as queryable entities with per-level 3-pane builders + a read-only drill-down explorer; verified live (Tanterv → … → activities).
- Two parallel structures coexist: the compatibility layer (`AlbumTemplate`/`AlbumInstance`) still drives planning+execution; the hierarchy is a parallel, dark, reference-composed model.
- **Deferred (tracked):** mint-through-blocks rewire; `Week → UnitIndex` rename (`backlog.md`); `Tanterv` `draft/review/approved/published` governance workflow; richer per-level fields (`learningGoals`/`competencies`/`progression`); `Blokk` `rules`; suggest-only AI structure help.

See [[AlbumDomain]] for the entity-level description and [[REFACTOR-001-gold-standard-rendszerstruktura]] for the phased execution record.
