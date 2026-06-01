---
title: AlbumDomain
type: entity
sources:
  - apps/matricas-album/docs/architecture.md
updated: 2026-06-01
lang: en
---

# AlbumDomain

The core domain objects of the Matricás Album prototype. The demonstrator deliberately **separates planning from execution**: a global versioned library feeds versioned album templates, which are minted into one running classroom instance each. Hungarian domain tokens used below are canonical — see [[Glossary]] on first use; this page describes *how the domain is built and persisted*, while [[matricas-album]] covers the product idea and [[matricas-album-projekt-allapot]] the full state mirror.

The product-facing token for the smallest unit is `Tevékenység (matrica)`: "matrica" stays the concrete album token and DB/API naming, while "tevékenység" is the newer planning language. There is no `ActivityResource` rename and no Activity Studio UI.

## Planning layer

### StickerResource / StickerVersion

`StickerResource` is a global, reusable sticker/activity resource; `StickerResource.ArchivedAt` soft-hides it from default pickers without losing history. Content changes create a new `StickerVersion` (versioned activity-card content: `Title`, `Phase`, `StudentInstruction`, `BPlan`, `LowResource`). Architecturally these are reusable activity-card primitives — the smallest working `Tevékenység (matrica)` primitive. `StickerVersionTeacherStep` rows hold the teacher steps for a version. This is the `Matricatár` (sticker library) backend — see [[Glossary]] for the token.

### AlbumTemplate / AlbumTemplateVersion

`AlbumTemplate` is the root of a versioned, reusable album plan; `AlbumTemplate.ArchivedAt` hides it from the instance picker. A new template lands as `v1` with `IsDraft = true` and becomes instantiable only after Publikálás. Editing a published template creates or updates **at most one** `AlbumTemplateVersion` draft per template (enforced by a partial unique index); the draft is then Publikálás-ed to become the next published version or Elvetés-ed.

Each version owns its own metadata and children: `PatternKey`/`PatternName`/`PatternDescription`, `DrivingQuestion`, `Subject`, `Grade`, `FinalProduct`, `Audience`, dispositions (`AlbumTemplateVersionDisposition`), units (`AlbumTemplateVersionWeekPlan`), differentiation paths (`AlbumTemplateVersionDifferentiationPath`), and sticker assignments (`AlbumTemplateVersionSticker`, referencing a `StickerVersion` at a unit `Week` + `SortOrder`). The parent `AlbumTemplate` keeps denormalized fields only as a fallback for the rare "no versions yet" path; the version row is the runtime source of truth.

`DurationType` (`het | ora | fazis`) on both `AlbumTemplate` and `AlbumTemplateVersion` only **labels** what each unit row represents; the number of units is implicit from the rows in `album_template_version_week_plans`.

`AlbumTemplatePatterns` allows exactly three pedagogical patterns — `altalanos`, `produktiv-hibazas`, `kutatas-bizonyitas` — normalized case-insensitively, with unknown/missing values falling back to `altalanos`. The pattern picker seeds the first draft's unit structure, sticker order, and reflection prompts; later changing only `PatternKey` is metadata-only and does not regenerate teacher edits. In the progressive entry UI this is a secondary `Pedagógiai minta`, not a hierarchy level.

## Execution layer

### AlbumInstance

`AlbumInstance` is one classroom execution of a published template version. It references **both** the legacy `AlbumTemplateId` (join convenience / backward compatibility) and the specific `AlbumTemplateVersionId` it was minted from, so later template versions do not disturb a running instance. It carries `ClassName`, `Title`, `CurrentWeek` (current unit index), `ArchivedAt`, plus its teams, unit-title overrides (`AlbumInstanceWeekPlan`), closure checklist (`AlbumInstanceClosureChecklistItem`), team reflections, team help requests, team differentiation-path assignments, and instance-owned AI notes. Teams and evidence belong to an instance, never to a template.

A template-version **upgrade** atomically opts a running instance into the latest published version while preserving evidence — first by exact `StickerVersionId`, then by same `StickerResourceId` fallback.

### InstanceSticker

`InstanceSticker` is a runtime copy of a template-assigned sticker for one instance (frozen at a `StickerVersionId`, with `Week` + `SortOrder`). Its `State` is **lifecycle-only** — `tervezett | aktiv` — and the teacher controls when a sticker opens for the album; once `aktiv` it stays so regardless of how many teams have submitted. `Deprecated = true` parks a sticker removed by a template-version upgrade while preserving its evidence. Instance views address stickers by `InstanceSticker.Id`, not global sticker IDs.

### Team / TeamMember

`Team` and `TeamMember` define team structure under an `AlbumInstance`. The student-side UI is team-scoped; the canonical lookup is `progressFor(stickerId, teamId)`.

### InstanceStickerTeamProgress

`InstanceStickerTeamProgress` is the **single source of truth** for "where is team X on sticker Y": per-team submission state `varakozik | javitas | elkeszult | reflektalt`, plus `LatestEvidenceId`. "No row" means the team has not started. The API owns all transitions; the frontend reads but never writes them. Transitions: no row → `varakozik` on `POST /api/evidence`; `varakozik` → `javitas` / `elkeszult` / `varakozik` on feedback `nextStep = javitas | lezar | megj`; `javitas` → `varakozik` on resubmit; `elkeszult` → `reflektalt` on student reflection (future). The teacher's album-plan view aggregates these per sticker into counts ("3/4 beküldte", "N/N kész", "X/N javít"). This progress lifecycle is the [[Evidence|bizonyíték]]-flow's runtime spine.

### InstanceStickerTeamDifferentiationPath

`InstanceStickerTeamDifferentiationPath` is the teacher-chosen path assignment for one team on one runtime sticker: `tamogatott | alap | kihivas`. It records adaptation history **without ranking teams**. Template-level path texts live on `AlbumTemplateVersionDifferentiationPath` (one support/base/challenge path per `Phase`); old versions without rows hydrate default paths at API mapping time.

## Quality and AI attachments

### QualityDimension

`QualityDimension` carries a creative-learning quality check via `OwnerType` + `OwnerId` (so a check can belong to a sticker version, template, or instance), a `Code`, an integer `Score`, and a `State` (`ok | warn | miss`). It backs the kreatív tanulási minőségpanel (see [[kreativ-tanulas]]) and is descriptive, not an effectiveness score.

### AiAdvice / AiAdviceRun

`AiAdvice` and `AiAdviceRun` persist target-aware AI advice plus its audit trail, generated through the separate Python/Agno service and the static methodology `agent-wiki` projection. They are described in full on [[AiAdvice]]. `AiNote` (`OwnerType` + `OwnerId`, `TargetType`/`TargetId`/`TargetKey`, `Kind`, `Severity`) is the lighter instance-owned note primitive.

## The hierarchy as a compatibility layer

The locked product hierarchy is:

`Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`

Foundation decision: `Témakör` is **first-class** and contains `Tanulási egység` (see [[ADR002-temakor-elso-osztalyu-szint]]). The current implementation is a **compatibility layer** — there are no `Curriculum`, `Module`, `Topic`, `LearningUnit`, or `Block` schema objects yet. The mapping:

| Target concept | Current implementation | Mapping stance |
|---|---|---|
| `Tanterv` | No dedicated entity | Future top-level container; do not add `Curriculum` until a later schema slice. |
| `Modul` | No dedicated entity | Future larger thematic/program unit; do not add `Module` until ownership/navigation are scoped. |
| `Témakör` | No dedicated entity | Future first-class level between `Modul` and `Tanulási egység`; do not model as a tag/label now. |
| `Tanulási egység` | `AlbumTemplateVersionWeekPlan`, `AlbumInstanceWeekPlan`, `DurationType`, `Week` / `WeekNumber` | Current operational unit structure; keep existing names until the schema slice handles compatibility. |
| `Blokk` | No dedicated entity | Future lesson/block composition; lesson starts save through `AlbumTemplateVersion` unit rows + final-product notes. |
| `Tevékenység` | `StickerVersion` + `StickerVersionTeacherStep` | Current reusable activity-card primitive; `Tevékenység (matrica)` is the teacher-facing bridge while DB/API names stay unchanged. |
| Classroom execution | `AlbumInstance`, `InstanceSticker`, teams, evidence, progress, feedback, reflections | Current running-album layer; the execution model until the hierarchy is explicitly introduced. |

Deferred schema guidance: do not introduce `Curriculum`/`Module`/`Topic`/`LearningUnit`/`Block`; do not rename `Week`/`WeekNumber`/`CurrentWeek` to `UnitIndex` before a migration strategy is scoped; do not force teachers to manage the full hierarchy before creating or running an activity; do not build structured filtering/adaptation logic on text notes saved into existing fields (a no-regression bridge only).

## Versioning and ownership invariants

- Sticker resources are global; content changes create a new `StickerVersion`; soft-delete via `ArchivedAt`.
- Album templates are versioned; `AlbumTemplateVersion` rows own metadata, dispositions, units, differentiation paths, and sticker assignments; at most one draft per template.
- Published versions stay immutable for already-running albums; drafts stay draft-only until Publikálás.
- A running instance stays bound to the exact `AlbumTemplateVersionId` it was minted from.
- Template-version upgrade preserves evidence by exact `StickerVersionId`, then same-`StickerResourceId` fallback.
- Evidence, progress, help requests, and team reflections stay attached to runtime stickers and teams.
- Differentiation paths express teacher adaptation without ranking teams.
- Closure synthesis stays descriptive and teacher-facing — no automated effectiveness score, no AI decision-making.

For the Evidence object itself see [[Evidence]]; for the AI lifecycle see [[AiAdvice]].
