---
title: "ADR005: Reset the shared Postgres volume when switching branches"
type: adr
sources:
  - apps/matricas-album/docker-compose.yml
  - apps/matricas-album/src/MatricasAlbum.Api/Data/DemoSeeder.cs
updated: 2026-06-03
lang: mixed
---

# ADR005: Reset the shared Postgres volume when switching branches

Status: accepted (decided 2026-06-03, debug session with the product owner)

## Decision

All builds of the prototype, from any git branch, share the **same** Docker volume (`matricas-album_postgres-data` — Compose derives it from the project directory name, not from the branch). When the checked-out code's EF migration set diverges from what the volume's database has already applied, the remedy is a **volume reset**:

```
cd apps/matricas-album
docker compose down -v
docker compose up -d --wait
```

It is a rule, not a workaround: **demo data is disposable by design** (the product has a reset endpoint precisely because of that), so the volume is never worth preserving across a migration-divergent branch switch. Conversely, `DemoSeeder` must **never** be taught about tables outside the checked-out EF model, and orphan rows must never be hand-deleted to "make reset pass".

## Context

On 2026-06-03 the UI action `Adatbázis alapállapotba állítása` (`POST /api/demo-maintenance/reset`) failed with Postgres error 23503: deleting `sticker_versions` violated the foreign key `FK_activity_block_relations_sticker_versions_StickerVersionId` (declared `ON DELETE RESTRICT`).

Root cause was a code↔database version mismatch, not a bug in the running code:

- The database in the shared volume had **27 applied migrations** — the last 7 (`AddActivityTypes` … `AddCurricula`, 2026-06-01/02) came from a build of the `gold-standard-ingest-refactor-plan` branch and created the hierarchy tables (`blocks`, `block_versions`, `activity_block_relations`, `topics`, `modules`, `curricula`, …) for the `Tanterv→Modul→Témakör→Tanulási egység→Blokk→Tevékenység` chain (see [[ADR002-temakor-elso-osztalyu-szint]], [[Glossary]]).
- The running images were built from `main` (the `init` commit), which has only **20 migrations** and whose `DemoSeeder.DeleteAllDemoDataAsync` deletes tables in a hard-coded FK-safe order — an order that cannot include tables the model does not know.
- EF Core's `Migrate()` silently ignores applied-but-unknown migration history rows, so the API **starts up healthy** against the newer database; the mismatch only surfaces when the seeder tries to delete.

The failure mode therefore recurs every time work alternates between `main` and the hierarchy branch (or any future pair of migration-divergent branches) without resetting the volume.

## Alternatives considered

- **Patch `main`'s `DemoSeeder` to delete the branch's tables first** — rejected: code on an older branch cannot enumerate tables created by future migrations; every new branch table would re-break it, and it couples `main` to schema it deliberately does not have.
- **Surgical cleanup (`DELETE FROM activity_block_relations` etc.) keeping the branch schema** — rejected: leaves the hierarchy tables half-orphaned, and the very next reset on `main` re-creates the same inconsistency. Fragile hybrid state.
- **A separate volume per branch** — rejected: Compose pins the volume to the project directory, demo data is throwaway, and the extra moving part isn't justified for a prototype with a one-command reset.

## Consequences

- Switching between migration-divergent branches costs one `down -v` + reseed (~1 minute). Accepted trade-off: any demo data clicked together in the UI is lost — which is aligned with what the reset action promises anyway.
- No code change lands on `main` for this; `DemoSeeder.DeleteAllDemoDataAsync` stays a plain, model-scoped delete list.
- Reversibility: cheap — this is an operating rule, not a schema commitment; undoing it is simply choosing another strategy later.

## Revisit trigger

- When `gold-standard-ingest-refactor-plan` merges into `main` (the current divergence disappears, but the rule stays for the next divergent branch).
- If the demo database ever starts holding non-reproducible data worth keeping — then per-branch volumes or migration-aware reset tooling must be designed instead.
