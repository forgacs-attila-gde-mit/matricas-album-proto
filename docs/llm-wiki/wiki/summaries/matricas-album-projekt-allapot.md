---
title: "Matricás Album — projekt-állapot (working prototype state-mirror)"
type: summary
sources:
  - apps/matricas-album/docs/architecture.md
  - apps/matricas-album/README.md
  - wiki/plans/REFACTOR-001-gold-standard-rendszerstruktura.md
updated: 2026-06-02
lang: mixed
---

# Matricás Album — projekt-állapot

This is the canonical current-state mirror of the working `apps/matricas-album/` prototype: domain model, API, UX, and AI. It is not an implementation plan and not a pitch — it is the shared decision map of where the prototype actually stands. The domain entry concept is [[matricas-album]]; the domain objects are split out into [[AlbumDomain]], [[Evidence]], and [[AiAdvice]]. On first use of Hungarian domain tokens, see [[Glossary]].

**Update rule:** refresh this page when the product goal, target segment, hierarchy, main teacher/student workflow, AI role, data model, runtime architecture, or shipped feature set changes materially.

## In one sentence

The Matricás Album is a running Lecke.ai demonstrator that treats learning not as a series of isolated tasks but as a teacher-controlled, multi-step learning path: a `Tevékenység (matrica)` is an evidence-bearing learning episode wrapped in student choice, teamwork, [[Evidence|bizonyíték]], teacher feedback, revision, and Reflexió.

## Executive picture

- **Product role:** flagship-style Lecke.ai prototype showing the product can be a learning-process organizer, not just a task generator (see [[matricas-album]]).
- **Pilot focus:** the live product plan targets 7-8th grade természettudományos teachers in an autonomy-supporting school context; [[Lauder]] remains the central pilot / beachhead.
- **Current app state:** a running Angular + .NET + PostgreSQL + Python/FastAPI AI agent demonstrator, started via Docker Compose with seeded mikroklíma album data.
- **UX state:** the teacher can start progressively from an idea, a lesson/`Blokk`, or a curriculum outline; the system does not force the full tantervi hierarchy on first use.
- **Data-model state:** the running app still plans + executes through `StickerResource` / `StickerVersion`, `AlbumTemplate` / `AlbumTemplateVersion`, and `AlbumInstance`. **Update 2026-06-02:** the target hierarchy is now also realized as real, reference-composed, versioned entities — `Curriculum`, `Module`, `Topic`, `Block` (+ `ActivityType` on `Tevékenység`) — shipped **dark behind feature flags** and **not yet wired into the mint path**; the two coexist ([[ADR004-hivatkozas-alapu-hierarchia]], [[AlbumDomain]]). `Tanulási egység` was retired ([[ADR002-temakor-elso-osztalyu-szint]]).
- **AI state:** the AI suggests, pre-fills, asks, and drafts, but makes no pedagogical decision and never auto-saves a full structure ([[pedagogia-elobb-ai-masodik]]).
- **Top guardrail:** pilot safety outranks fast conceptual cleanup. The target hierarchy may show in the UI, but schema/API migration only follows an explicit mapping and compatibility slice.

## What it means per stakeholder

| Stakeholder | What to take from this state |
|---|---|
| Product | The Matricás Album is simultaneously a pilot-friendly Lauder tool and a broader activity-domain preview; do not abstract it into a platform too early (see [[ADR001-kozos-activity-domain]]). |
| Pedagogy | The matrica is not a badge but a learning episode; the pedagogical value lives in the evidence → feedback → revision → differentiation → reflection cycle. |
| Teacher / pilot partner | No need to build a full curriculum. Start with an idea or one lesson `Blokk`, then extend only when it makes sense. |
| School leader | The prototype makes active, project-based, evidence-driven learning visible and keeps teacher control over the technology. |
| Developer | The current schema is a compatibility layer. The target hierarchy shows up at UI/metadata level, but the execution core stays sticker/template/instance. |
| AI owner | The AI is not a decision-maker. The real product risks are teacher review, snapshot minimization, citation/trace audit, and non-automatic application. |
| Demo / pilot owner | The usable story: progressive start → running album → student evidence → teacher feedback → closure/learning overview. |

## Product hierarchy as a compatibility layer

> **Update 2026-06-02 (REFACTOR-001 Phases 4–6).** The hierarchy below is no longer *only* a compatibility layer: `Curriculum / Module / Topic / Block` now exist as real, reference-composed, versioned entities (`Tanterv → Modul → Témakör → Blokk → Tevékenység`, `Tanulási egység` retired), each with a 3-pane builder + a read-only drill-down explorer, shipped **dark behind `Features:Hierarchy:*` flags**. They are **additive** and **not yet wired into the `AlbumInstance` mint path**, so the compatibility-layer mapping described here still drives the running app (planning + execution stay on `AlbumTemplate`/`AlbumInstance`). `POST /api/album-templates/{id}/derive-blocks` maps template units → published Blocks additively (no touch to instances/evidence). Full detail: [[ADR004-hivatkozas-alapu-hierarchia]] + [[AlbumDomain]]. The rest of this section documents the still-live compatibility layer.

The locked target hierarchy is `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`, with `Témakör` as a first-class level that contains `Tanulási egység` ([[ADR002-temakor-elso-osztalyu-szint]]). The 2026-05-29 recursive Confluence re-check found one source mismatch worth flagging before schema work: the `3. Rendszerstruktúra és alapfogalmak` page still lists the hierarchy without `Témakör`, while later topic/creation pages and product decisions treat it as first-class. Until reconciled, implementation stays aligned with the locked hierarchy and avoids introducing `Topic` / `LearningUnit` schema objects.

Current-to-target mapping (see [[AlbumDomain]] for the objects):

| Target concept | Current implementation | Status |
|---|---|---|
| `Tanterv` | `AlbumTemplateVersion`-based curriculum outline | UI preview/outline only; no `Curriculum` entity. |
| `Modul` | module/topic preview fields on the curriculum outline | Placement/thinking frame, not a table. |
| `Témakör` | activity/block/curriculum planning metadata | First-class target level, but no schema yet. |
| `Tanulási egység` | `AlbumTemplateVersionWeekPlan`, `AlbumInstanceWeekPlan`, `DurationType`, `WeekNumber` | Visible planning context; legacy unit/week fields keep working. |
| `Blokk` | `Kezdj egy órával` block outline, 3-5 activities | Saved on the existing album-template surface; no `Block` entity. |
| `Tevékenység` | `StickerVersion` + `StickerVersionTeacherStep` | The smallest working activity-card / matrica primitive. |
| Classroom execution | `AlbumInstance`, `InstanceSticker`, `Team`, `Evidence` | The current execution core. |

This mapping is a regression guard. Versioning, running instances, evidence links, upgrade flows, differentiation paths, and closure synthesis all work today. New hierarchy schema arrives only after an explicit migration mapping and compatibility plan.

## Teacher side (current prototype)

### Műhely

The Műhely is the teacher landing point, split into:

- **progressive starts:** `Kezdj egy ötlettel`, `Kezdj egy órával`, `Kezdj egy tantervvel`;
- **management/retrieval (`Kezelés és visszakeresés`):** Matricatár, Albumtervek, Futó albumok.

This split keeps first use from requiring the whole system at once — the teacher picks the smallest meaningful next step.

### Kezdj egy ötlettel

The idea path creates a `Tevékenység (matrica)` draft (`StickerEntryContext='idea'`). The teacher gives a simple idea (e.g. "papírrepülő sebességmérés"); the system can pre-fill editable fields (title, Phase, leírás, student instruction, evidence type), and the teacher reviews every field before saving. No auto-apply, no new schema. Activity-planning metadata (tantárgy, évfolyam, kompetenciák, NAT links, fixed activity type, interaction mode, participant mode, estimated minutes, real-world/home/community context, placement context across `Tanterv`/`Modul`/`Témakör`/`Tanulási egység`/`Blokk`) is currently serialized into teacher-facing note fields — not queryable schema columns, so no filter or adaptation logic may be built on it.

### Kezdj egy órával

The lesson start creates a `Blokk-vázlat` (`TemplateEntryContext='lesson'`, `DurationType = ora`). The teacher edits 3-5 activities, per-activity minutes, kötelező/választható/extra status, tools, a block reflection prompt, and an alternative-path note, plus a placement ladder `Blokk -> Tanulási egység -> Témakör -> Modul -> Tanterv`. It still saves through `AlbumTemplate` / `AlbumTemplateVersion` — the `Blokk` is not yet its own entity.

### Kezdj egy tantervvel

The curriculum start (`TemplateEntryContext='curriculum'`) shows an editable module/topic preview plus one concrete expansion through `Tanulási egység`, `Blokk`, and `Tevékenység`. Its goal is not to force a full curriculum but to make the future `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység` chain visible. It does not create hierarchy entities; any printable/package hint is future export/print context, not order/fulfillment scope.

### Matricatár

The Matricatár is the library of reusable activities/stickers, backed by `StickerResource` / `StickerVersion` (global, versioned activity-card primitive). The teacher views detail, creates a new version, archives/unarchives, and in the creation surface picks the activity type from a system-owned fixed set: `Felfedező`, `Kísérletező`, `Feldolgozó`, `Kommunikációs`, `Kollaboratív`, `Reflektív`. Important UX cleanup: `Tevékenységtípus` (what kind of student work) is not the same field as `Tanulási út fázisa` (where the learning process stands).

### Albumtervek

Albumtervek are versioned, re-runnable learning paths (`AlbumTemplate` + `AlbumTemplateVersion`). A new template lands as draft `v1` (`IsDraft = true`) and is instantiable only after Publikálás. Editing a published template creates or updates one draft (at most one per template, enforced by a partial unique index); the draft can be Publikálás-ed or Elvetés-ed. Published versions are immutable while an instance runs. A version owns its DrivingQuestion, Subject, Grade, `DurationType` (`het`, `ora`, `fazis`), unit titles, sticker order, differentiation-path texts, and project reflection prompts. The older album-pattern picker now lives as a secondary `Pedagógiai minta` section so it does not compete with the product hierarchy. The pattern set is `altalanos`, `produktiv-hibazas`, `kutatas-bizonyitas`; the picker only seeds the first draft and does not rewrite later teacher edits.

### Futó albumok

A Futó album is one classroom execution of an album template version. It binds to the exact `AlbumTemplateVersionId` it was minted from. The teacher sets class and title, manages `Team`s and members, sets the current unit, activates runtime stickers or keeps them `tervezett`, can create an instance-only sticker, can duplicate / make a corrected runtime copy, and can upgrade the running album to a newer template version while preserving evidence.

`InstanceSticker.State` is lifecycle-only (`tervezett` / `aktiv`). Per-team work state is separate, on `InstanceStickerTeamProgress` (`varakozik`, `javitas`, `elkeszult`, `reflektalt`) — a sticker can be `aktiv` for the class while teams sit in different submission states.

### Evidence portfolio and feedback queue

Evidence is the team's learning trace. In the portfolio and feedback queue the teacher sees submissions, status, help-request flag, team, related sticker, student Reflexió, and teacher feedback. The queue separates `HelpRequested`-flagged evidence from free-form `TeamHelpRequest`s. In the feedback drawer the AI can draft, but never auto-saves; the teacher decides to request `javitas`, close (`elkeszult`), or note. Saving feedback clears the `HelpRequested` flag and updates the team-progress state. See [[Evidence]].

### Differenciálás

Differentiation thinks in three paths: `tamogatott` (more scaffolding/templates/checklists/sub-tasks), `alap` (normal teamwork and self-selection), `kihivas` (deeper comparison, own protocol, more complex product). Path texts are version-bound and editable per phase; on a running sticker they are assigned per team. This is teacher adaptation history, **not** a ranking.

### Pilot observation and Projektzárás

Each running-album unit has a lightweight pilot-observation pad (engagement signal, adaptation note, next small experiment). This is a frontend/localStorage bridge keyed by instance + unit, **not** a backend entity. At Projektzárás the teacher can merge these notes into the persisted `TeacherEffectLog` (Hatásnapló) via a `Beemelés` action that is review-required and editable. Closure contains a learning overview, final-product/album-map summary, evidence portfolio, team reflections, a closure checklist, the Hatásnapló, a printable/exportable closing package, and an AI closure-synthesis card. The synthesis surfaces patterns and reflection questions but does not score the class, rank teams, or decide next pedagogy. Pilot measurement framing is in [[matricas-pilot-merese]].

### Pedagógiai súgó

The teacher Pedagógiai súgó is a searchable, teacher-friendly background layer built from the project `agent-wiki` methodology projection. The runtime AI agent draws from the same committed knowledge store, but the teacher sees short, relevant pedagogical references rather than the internal wiki mechanics.

## Student side (current prototype)

The student side is not a full LMS — it is the running album's team view. Main routes: Aktuális matrica, Csapatunk, Bizonyítékaink, Visszajelzések, Reflexió, Segítség.

- **Team scope:** the student view is team-bound (`AlbumStore.studentTeamId`); with multiple teams the teacher can switch in preview. The shell shows the album poster, DrivingQuestion, current unit, and team focus.
- **Aktuális matrica:** the team sees the active sticker — instruction, student choice point, expected product/evidence, reflective question, and submission surface. Student-side AI gives only thought-provoking (Socratic) questions; it gives no solution and does not write the deliverable.
- **Evidence submission:** the team submits title, description, Reflexió, and an optional help request. A `Segítséget kérek a tanártól` checkbox maps to `Evidence.HelpRequested` and routes a structured signal into the teacher feedback queue — pilot-critical, because it shows not just whether a product was made but where the team got stuck.
- **Visszajelzés and Reflexió:** the student sees read-only teacher feedback; a `Csapatunk eddigi munkája` panel lists prior feedback-bearing submissions. The Reflexió page shows project-reflection prompts inherited from the active template version.

Role-aware drawers hide teacher-only sections (`TeacherSteps`, `BPlan`, `LowResource`, AI and Differenciálás tabs) in student mode and add a `Csapatunk állapota` card.

## AI role

The AI runs as a separate Python/FastAPI/Agno agent. The .NET API builds a minimized, sanitized state snapshot, passes it to the agent, and persists the answer as `AiAdvice` and `AiAdviceRun` records. Without a key a deterministic mock fallback runs; with a key the answer follows an OpenAI Structured Outputs schema. The agent receives only the sanitized snapshot — it cannot read the app database and cannot write `agent-wiki`. Targets: teacher advice, student Socratic advice, `pendingEvidenceDigest`, `helpRequest` triage, create-sticker, draft-feedback, `closureSynthesis`. Detail and guardrails: [[AiAdvice]], [[pedagogia-elobb-ai-masodik]].

## Technical architecture

| Layer | Technology | Role |
|---|---|---|
| Frontend | Angular 19 | teacher/student UI, hash-routed nav, signal-based `AlbumStore` |
| API | .NET 10 Minimal API, EF Core | domain operations, DTOs, migration, seed, AI snapshots |
| Database | PostgreSQL 17 | `matricas_album_v3` domain data |
| AI agent | Python FastAPI + Agno | advice generation, agent-wiki search, Structured Outputs / mock fallback |
| Web serving | nginx container | frontend + proxied API calls in Docker |

Docker Compose ports: Frontend `http://localhost:4300`, API `http://localhost:5080` (health `/health`), AI agent `http://localhost:8010` (health `/health`), PostgreSQL `localhost:5432`. The AI agent's in-Docker URL is `http://ai-agent:8000`. Reset old volumes with `docker compose down -v` (startup migrates but does not destructively delete).

The frontend's source of truth is the URL, the active instance, and the `AlbumStore` signal state. Progressive entry paths are primary in the Műhely; `Matricatár` / `Albumtervek` / `Futó albumok` are secondary management surfaces. The create drawer is context-aware (activity, block outline, or curriculum outline save language). Sticker reorder runs through a bulk `stickers/reorder` two-pass write so the unique `(versionId, Week, SortOrder)` index does not collide mid-swap.

## Demo data

On startup the API migrates the schema and seeds the demonstrator if the Matricatár is empty: a global mikroklíma sticker library, a `Városi mikroklíma nyomában` album template with concrete sticker versions, and a single `7.B mikroklíma projekt` running album with teams and evidence. This demo backs the 7-8th grade természettudományos pilot language.

## Prototype maturity

| Area | Status | Note |
|---|---|---|
| Teacher dashboard | working | Progressive starts + management/retrieval grouping. |
| Matricatár | working | Versioning, archive, detail view, activity-metadata bridge. |
| Albumtervek | working | Draft/publish versioning, inline editing, units, patterns. |
| Futó album | working | Instance, teams, runtime stickers, upgrade, current unit. |
| Student side | working | Team-scoped active matrica, evidence, feedback, Reflexió. |
| Evidence/feedback | working | Help request, progress, review drawer, AI draft. |
| Differenciálás | working | `tamogatott`/`alap`/`kihivas` paths + per-team assignment. |
| Projektzárás | working | Learning overview, effect log, checklist, export/print, AI synthesis. |
| AI agent | working | Mock fallback and OpenAI Structured Outputs path. |
| Product hierarchy | working (dark) | `Curriculum/Module/Topic/Block` reference-composed entities + builders + drill-down explorer behind `Features:Hierarchy:*` flags; additive, not yet wired to the mint. UI/metadata compatibility layer still drives the running app. |
| Pilot observation | partial | localStorage bridge; teacher-reviewed merge into closure. |
| Docs | up to date | architecture + user manual in the long-lived docs folder. |

## Deliberately out of scope now

- ~~No `Curriculum`, `Module`, `Topic`, `LearningUnit`, `Block` backend schema.~~ **Superseded 2026-06-02:** `Curriculum/Module/Topic/Block` now exist (reference-composed, versioned, behind flags); still out of scope is wiring them *into* the `AlbumInstance` mint path. `LearningUnit` (`Tanulási egység`) stays retired.
- No rename of `Week` / `WeekNumber` / `CurrentWeek` to `UnitIndex` (gating condition not met; see `backlog.md`).
- No global rename of `Matricás Album` to `Activity Studio` (or `ActivityResource` for DB/API).
- No broad community marketplace.
- No automatic activity-effectiveness scoring.
- No AI-saved, irreversible full curriculum/module/topic/block structure.
- No structured filter/adaptation logic on the temporary note-field metadata.
- No order/fulfillment scope behind the printable/package hint.

## Open risks and decisions

| Risk | Why it matters | Suggested handling |
|---|---|---|
| Concept duality: matrica vs Tevékenység | The old album metaphor and the new activity hierarchy coexist. | Keep the `Tevékenység (matrica)` bridge until the pilot shows which language is clearer. |
| Hierarchy schema timing | Early schema migration can break working versioning and evidence preservation. | Migration mapping + compatibility plan first, then new entities. |
| localStorage pilot observation | Fast but not durable data. | At pilot end, decide whether a backend `Observation` entity is needed or effect-log import suffices. |
| Activity-metadata text-note persistence | Fast bridge, not reliably queryable. | Dedicated schema before any structured filter/reporting. |
| AI advice freshness | Persisted advice can go stale if the snapshot changes. | Snapshot-drift/stale signal as a later AI roadmap item. |
| Teacher onboarding | The system knows a lot; it can overwhelm a beginner. | Keep progressive entry paths, the one mikroklíma demo, and the manual primary. |
| Pilot generalizability | The Lauder/science context is strong but not representative. | Treat heterogeneity separately; new segment only after validated runs. |
