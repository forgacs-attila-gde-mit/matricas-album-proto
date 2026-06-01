---
title: Features
type: features
sources:
  - summaries/matricas-album-projekt-allapot.md
updated: 2026-06-01
lang: mixed
---

# Features

Registry of shipped/proposed product capabilities in `apps/matricas-album/`. This is a **table, not per-feature pages** (see `AGENTS.md` §2). The canonical current state of the prototype is [[matricas-album-projekt-allapot]]; pedagogy backing lives in the linked concepts.

| Feature | Status | Wiki refs | Code path (apps/matricas-album) | lang |
|---|---|---|---|---|
| progressziv-tervezes (`Kezdj egy ötlettel` / `órával` / `tantervtel`) | shipped | [[matricas-album]], [[2026-05-31-matricas-album-live-termekfa]] | `src/MatricasAlbum.Web` (Műhely entry paths) | hu |
| kreativ-tanulasi-ellenorzo (minőségpanel) | shipped | [[kreativ-tanulas]], [[AlbumDomain]] | `src/MatricasAlbum.Api` Domain `QualityDimension` / `QualityStates` | hu |
| projektzaras-hatasnaplo (closure + Hatásnapló) | shipped | [[matricas-pilot-merese]], [[projekterettsegi]] | `src/MatricasAlbum.Api` Domain `TeacherEffectLog`, closure flow | hu |
| differencialas (`tamogatott` / `alap` / `kihivas` utak) | shipped | [[AlbumDomain]], [[nyomtatott-vs-digitalis]] | `src/MatricasAlbum.Api` Domain `DifferentiationPathKeys` | hu |
| evidence + feedback loop | shipped | [[Evidence]] | `src/MatricasAlbum.Api` Domain `Evidence`, `InstanceStickerTeamProgress` | en |
| AI co-pilot (target-aware advice) | shipped | [[AiAdvice]], [[pedagogia-elobb-ai-masodik]] | `src/MatricasAlbum.Agent`, API `AiAdvice` / `AiAdviceRun` | en |
| product hierarchy (`Témakör` first-class) | partial (compatibility layer) | [[ADR002-temakor-elso-osztalyu-szint]], [[AlbumDomain]] | UI/metadata only; no `Curriculum`/`Module`/`Topic` schema yet | mixed |
| common activity-run domain | proposed (architecture decision) | [[ADR001-kozos-activity-domain]], [[aktivitas-csaladok]] | reuses `Sticker`/`Album`/`Instance`/`Evidence` core | mixed |

## Origin pointers (NOT in this repo)

These were Lecke.ai-wide capabilities; they remain in the origin discovery wiki and are referenced only here:

- `modszertani-oravazlat-asszisztens` — DPA Tanár lesson-plan assistant; relates to a matrica via `album_id` but is a separate Lecke.ai product slice.
- `tartalomfeldolgozas-es-generalas`, `ai-ertekeles-es-visszajelzes`, `differencialt-feladatkeszites`, `feladatbank-erettsegi-felveteli`, `tartalommegosztas-es-ujrafelhasznalas` — general Lecke.ai product directions, intentionally **not** ported.
