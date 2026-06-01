---
title: "REFACTOR-001 — Gold-standard rendszerstruktúra alignment + creation-UX simplification"
type: plan
sources:
  - apps/matricas-album/docs/architecture.md
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/_manifest.md
updated: 2026-06-01
lang: mixed
---

# REFACTOR-001 — Gold-standard rendszerstruktúra alignment + creation-UX simplification
**Purpose**: Move the Matricás Album app toward the ingested Confluence gold-standard system structure (`Tanterv → Modul → Témakör → Blokk → Tevékenység` as real, reference-composed, versioned entities + a closed `Tevékenységtípus` taxonomy + a mode-chooser / 3-pane builder creation UX) **and** simplify the cramped creation screens (Albumterv, "Matrica"/Tevékenység) for a non-tech-savvy teacher audience.
**Audience**: Matricás Album dev team (.NET API, Angular Web, Python agent); product owner (decision gates).
**Status**: Draft

---

## Background

The Confluence `726106121` ("3. Rendszerstruktúra és alapfogalmak") subtree was ingested on 2026-06-01 as the product's gold standard. Target model (full detail in `docs/llm-wiki/wiki/summaries/2026-06-01-rendszerstruktura-gold-standard.md`, raw mirror `docs/llm-wiki/raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/`):

- Five **real, versioned entities** — `Curriculum / Module / Topic / Block / Activity` — composed **by reference** (loosely coupled; a child is independently reusable across many parents), not by copy.
- A closed, **system-defined** `Tevékenységtípus` (`ActivityType`) taxonomy of six: `Felfedező / Kísérletező / Feldolgozó / Kommunikációs / Kollaboratív / Reflektív`. Exactly one dominant type per `Activity`; users/AI cannot create types (AI only classifies).
- A repeated **creation-UX pattern**: not a linear form but a *mode chooser* (üres / AI / adaptálás / könyvtár / kontextusból) → a *3-pane builder* (left nav/library · center editor/flow-builder · right live preview + AI suggestions) → versioned save.

The current app (`docs/llm-wiki/wiki/summaries/matricas-album-projekt-allapot.md`, `docs/llm-wiki/wiki/entities/AlbumDomain.md`, `docs/architecture.md`) implements **none** of the hierarchy entities. It is a `StickerResource/StickerVersion` + `AlbumTemplate(+Version)` + `AlbumInstance/InstanceSticker` **compatibility layer** that copies/freezes rather than references, and the hierarchy exists only as UI/metadata serialized into teacher note-fields. `roadmap.md` already anticipates this direction (Stream 4 "Product vision alignment", Stream 5 "Future activity-domain generalization") and locked the guardrails: pilot-safe, compatibility-first, teacher-reviewed AI, evidence preservation, no forced full hierarchy, no premature DB/API rename.

Two pain points motivate the UX half: the last feature rounds (activity-metadata panel, pattern picker, placement ladders, inline template editor) left the **Albumterv** detail editor and the **`Tevékenység (matrica)` create drawer** crammed and confusing — the opposite of what the gold-standard UX prescribes and what the mostly non-tech-savvy target teachers need.

The gold-standard pages are **still heavily developed** and carry live contradictions (see "Known limitations" C1–C5). This plan therefore front-loads a **decision gate** and keeps schema work behind it.

## Goal

When this plan is complete: (1) a teacher can create a `Tevékenység` and an `Albumterv` through a calm, guided, mode-chooser + 3-pane interface with live preview and optional-advanced disclosure; and (2) the domain has migrated, phase by phase and without losing evidence or breaking running albums, from the sticker/template/instance compatibility layer to the gold-standard `Curriculum/Module/Topic/Block/Activity` reference-composed, versioned hierarchy with the formal `Tevékenységtípus` taxonomy — with every contradiction resolved by an explicit product decision rather than silently by code.

---

## Scope

### In Scope
- Creation-UX simplification of the **`Tevékenység (matrica)`** create flow and the **`Albumterv`** (`AlbumTemplate`/`AlbumTemplateVersion`) editor on the *current* data model (Phase 1 — no schema change).
- A product **decision memo** resolving contradictions C1–C5 (Phase 2) that gates all schema work.
- Formalizing **`Tevékenységtípus`** as a persisted `ActivityType` enum/field (Phase 2 — the one confirmed-aligned piece).
- Phased introduction of hierarchy **entities** bottom-up (`Activity` enrichment → `Block` → `Témakör/Topic` → `Modul/Module` → `Tanterv/Curriculum`), each with a migration mapping from the compatibility layer, **reference composition**, per-level **versioning**, and the **3-pane builder** UX (Phases 3–6).
- Standing up the missing **test projects** (.NET + Angular specs) so the plan's TDD tasks are runnable.
- Documentation updates (`docs/architecture.md`, wiki summary, `roadmap.md`, `LOG.md`).

### Out of Scope
- **Re-litigating C1–C5.** Resolved by product on 2026-06-01 (ADR002/ADR003); this plan executes the decided model and does not reopen it.
- The PNG-only **`Feladat`** sub-level (C4): uncertain, not on Confluence — not built until it lands on Confluence.
- Global rename **Matricás Album → Activity Studio** and DB/API rename to `ActivityResource` (roadmap "Not in scope"); product-facing name stays Matricás Album even as internals gain `Activity`/`Block`/etc.
- Automatic activity-effectiveness scoring, AI-authored irreversible structure, broad community marketplace (roadmap guardrails).
- Python agent re-architecture: the agent keeps consuming a sanitized snapshot; snapshot shape evolves additively only.
- Real authentication (the demo `X-Demo-Token`/`X-Demo-Role` scheme stays).

---

## Acceptance criteria
- [ ] **UX-1**: The `Tevékenység (matrica)` create flow opens with a mode chooser (üres / AI / meglévőből / könyvtár / kontextusból) and lands in a layout where only essential fields are visible by default; advanced planning metadata sits behind an explicit "Részletes tervezés" disclosure.
- [ ] **UX-2**: The `Tevékenység` and `Albumterv` editors show a **live preview** of the student/teacher-facing result alongside editing.
- [ ] **UX-3**: A first-pilot teacher can create a publishable `Albumterv` with ≥1 `Tevékenység` without encountering more than ~7 simultaneous input fields on any single pane (measured against the redesigned screens).
- [ ] **UX-4**: No regression — every `roadmap.md`-🟢 creation/edit capability (versioning, draft/publish, archive, reorder, instance binding) still works after the UX restructure.
- [x] **GATE-1**: Product resolved C1–C5 on 2026-06-01 — hierarchy `Tanterv → Modul → Témakör → Blokk → Tevékenység` (`Tanulási egység` removed); `matrica` stays the learning atom; ChatGPT diagram disregarded. Recorded in [[ADR002-temakor-elso-osztalyu-szint|ADR002]] (updated) + [[ADR003-matrica-tanulasi-atom|ADR003]].
- [ ] **FN-1**: `Tevékenységtípus` is a persisted, validated, case-insensitive `ActivityType` value on the activity record (6 system-defined keys), surfaced and filterable in the UI, with no user/AI type creation.
- [ ] **FN-2**: `Block`, `Topic`, `Module`, `Curriculum` exist as entities composed **by reference**; creating/editing one does not copy or mutate its children; a child can be referenced by multiple parents.
- [ ] **FN-3**: Every hierarchy level is versioned; a published version is immutable while referenced by a running `AlbumInstance`.
- [ ] **FN-4**: A running `AlbumInstance` minted before the migration still loads and its evidence/progress/feedback/reflections are intact after each phase (proven by an upgrade/migration test).
- [ ] **FN-5**: The `Blokk` editor is a 3-pane drag-&-drop flow builder of `Activity` references with per-reference roles (`primary/supporting/optional/transition/assessment`).

---

## What does NOT change
- **The not-a-badge guardrail.** `Tevékenység (matrica)` stays an evidence-bearing learning episode; the spec's "matrica = jutalmazási elem" reading is **rejected** (ADR003). Evidence → feedback → revision → reflection loop is preserved.
- **Teacher-in-control / AI guardrail** ([[pedagogia-elobb-ai-masodik]]): AI suggests/prefills/classifies; never auto-saves structure, never scores. `AiAdvice` lifecycle (`uj/elfogadott/elutasitott/alkalmazott/hibas`) unchanged.
- **Persisted Hungarian domain tokens stay verbatim** (`tervezett|aktiv`, `het|ora|fazis`, `tamogatott|alap|kihivas`, `varakozik|javitas|elkeszult|reflektalt`, …); new tokens enter [[Glossary]] first.
- **Evidence/instance integrity**: `Evidence`, `InstanceStickerTeamProgress`, `TeamHelpRequest`, `AlbumInstanceTeamReflection`, closure/`TeacherEffectLog` semantics preserved across every migration.
- DB pinned `matricas_album_v3`; Docker context/`COMPOSE_BAKE=false` workaround; ASCII path; `agent-wiki/` runtime asset + `manifest.json` contract (no edits driven by this plan).
- Existing `roadmap.md` guardrails and the "no forced full hierarchy before a teacher can create/run one activity" rule.

---

## Known limitations / accepted trade-offs
- **C1–C5 resolved by the 2026-06-01 product decision** (see [[ADR002-temakor-elso-osztalyu-szint|ADR002]] for the hierarchy, [[ADR003-matrica-tanulasi-atom|ADR003]] for the matrica/platform stance). The schema phases (3–6) build to the decided model below. Task signatures remain *indicative* (the source spec is still developing), but the hierarchy is now settled.
  - **C1 → decided**: hierarchy is `Tanterv → Modul → Témakör → Blokk → Tevékenység` (the detail-page reading) — `Témakör` first-class, `Tanulási egység` removed.
  - **C2 → decided**: `Tanulási egység` is removed; ADR002 updated (Resolution 2026-06-01).
  - **C3 → decided**: `matrica` stays the learning atom; the reward reframing is **rejected** (ADR003). The not-a-badge guardrail holds.
  - **C4 → decided**: the ChatGPT diagram (and its `Feladat` level) is disregarded for now — no `Feladat` until it lands on Confluence.
  - **C5 → decided**: the platform rendszerstruktúra is a superordinate layer, mapped to the product selectively (ADR003).
- The spec composes **by reference**; the current model **copies/freezes**. Reference composition for running instances must still freeze a referenced version at mint time to keep `AlbumInstance` reproducible — we adopt "reference in planning, snapshot at run" rather than pure reference everywhere.
- `Tanulási egység` is currently `AlbumTemplateVersionWeekPlan`/`AlbumInstanceWeekPlan` (`Week`/`WeekNumber`, `DurationType`). Its fate depends on GATE-1; the `Week → UnitIndex` rename stays in `backlog.md` until schema churn (Phase 5/6).
- No test project exists today (`dotnet test` is a solution sanity check); Task 1.1 stands one up, so early UX tasks may ship with thinner coverage than later phases.

---

## Architecture

**Target entities (spec, English identifiers per the adatmodell pages).** Introduced additively, newest beside the compatibility layer, never replacing it in a single step:

- `Curriculum { id, name, modules:[ModuleRef], subjects, gradeLevels, competencyFramework, learningOutcomes, progressionModel, assessmentPolicy, curriculumStandards, versioning, governance }`
- `Module { id, name, topics:[TopicRef], learningGoals, competencies, curriculumAlignment, progression, outcomes, … }`
- `Topic (Témakör) { id, name, blocks:[BlockRef], activities?, learningGoals, competencies, curriculumAlignment, progression }`
- `Block (Blokk) { id, name, activities:[ActivityBlockRelation], structure, pedagogyContext, flowType(linear|cyclical|exploratory|project_based|mixed), grouping(individual|pair|group|whole_class|dynamic), rules, outcomes }`
- `Activity (Tevékenység) { id, name, instruction, type(→ActivityType.key), metadata{shortDescription,estimatedTime,difficulty,groupSize,modality}, pedagogy{competencies,methods,reflectionPrompts}, context{subject,gradeLevel,topics,natReferences}, resources{tools,materials,attachments,externalLinks}, relations{blocks,versions,derivedFrom,reusedIn}, lifecycle{status:draft|active|archived, source:manual|ai|adapted|library} }`
- `ActivityType { key(felfedezo|kiserletezo|feldolgozo|kommunikacios|kollaborativ|reflektiv), name, pedagogyModel, interactionModel, cognitiveFocus, structureFlexibility, defaultGroupForm, allowedActivityPatterns, compatibility, examples }` — **system-defined, seeded, read-only to users.**

**Mapping from the compatibility layer** (the migration spine; see `AlbumDomain` + architecture.md mapping table):

| Spec entity | Current carrier | Migration stance |
|---|---|---|
| `Activity` | `StickerResource`/`StickerVersion` (+`StickerVersionTeacherStep`) | enrich in place (Phase 3); keep `Sticker*` names unless GATE-1 says rename |
| `ActivityType` | fixed UI picker over note-fields (already the same 6 names) | promote to persisted `ActivityType` + `Activity.type` (Phase 2) |
| `Block` | `AlbumTemplateVersion` unit rows + lesson-builder notes | new `Block` entity + `Block`↔`Activity` relation (Phase 4) |
| `Topic` | placement-context notes | new `Topic` entity referencing `Block`s (Phase 5) |
| `Module`/`Curriculum` | curriculum-starter notes | new entities, reference composition + versioning (Phase 6) |
| run/exec | `AlbumInstance`/`InstanceSticker`/`Evidence`/progress | unchanged; "snapshot at run" freezes referenced versions |

**Composition rule**: planning references children (`*Ref` join rows, no copy); `AlbumInstance` minting **snapshots** the referenced published versions into runtime rows (today's `InstanceSticker` pattern generalized). Per-level versioning reuses the proven `AlbumTemplateVersion` draft/publish machinery (≤1 draft, partial unique index, published-immutable-while-running).

**Frontend**: a reusable `CreationShellComponent` (mode chooser + 3-pane layout: `left=nav/library`, `center=editor|flow-builder`, `right=preview + Ai-suggestions`) that the Matrica, Blokk, Témakör, Modul, Tanterv creators all compose, replacing today's monolithic `album-create-drawer` and the crammed inline `album-template-detail` editor. State stays in the signal-based `AlbumStore`; URL stays source of truth.

**Config/flags**: feature-flag each new entity behind `features:hierarchy.<level>` (API config + Angular environment) so phases ship dark until enabled. Default `false`.

**API contracts** (indicative; per-phase): `GET/POST /api/activity-types` (read-only list); `POST /api/blocks`, `POST /api/blocks/{id}/activities` (add reference w/ role), `POST /api/blocks/{id}/activities/reorder`; `POST /api/topics`, `…/blocks`; analogous for modules/curricula; each level gets `/draft`, `/draft/publish`, `/versions` mirroring the album-template endpoints.

## Tests
*(Complete list across the plan; per-task detail below. New: `MatricasAlbum.Api.Tests` xUnit project + Angular `.spec.ts` specs.)*

- **test_test_projects_build** (infra): `dotnet test` + `ng test` run green on an empty/smoke suite.
- **CreationShell.mode_chooser_routes** (unit, web): each mode selects the correct initial editor state.
- **MatricaCreate.essential_fields_only_by_default** (unit, web): advanced metadata hidden until disclosure toggled.
- **MatricaCreate.preview_reflects_edits** (unit, web): preview pane updates on field change.
- **AlbumtervEditor.sections_collapse_and_persist** (unit, web): section disclosure + debounced PATCH still writes draft.
- **AlbumtervEditor.no_regression_publish_flow** (e2e, web): create → edit → add activity → Publikálás → instantiable.
- **ActivityType.normalize_accepts_six_rejects_unknown** (unit, api): case-insensitive, unknown→validation error.
- **ActivityType.seed_idempotent** (integration, api): seeding twice yields exactly 6 rows.
- **Activity.type_persisted_and_filterable** (integration, api): set/read `Activity.type`; filter endpoint returns by type.
- **Block.create_references_not_copies** (integration, api): adding an activity to a block creates a relation row; the activity row is untouched and reusable in a second block.
- **Block.roles_and_reorder** (integration, api): role enum enforced; two-pass reorder avoids unique-index collision.
- **Block.builder_dragdrop** (e2e, web): drag activity into block, set role, save, preview shows order.
- **Topic.references_blocks** / **Module.references_topics** / **Curriculum.references_modules** (integration, api): reference composition, no cascade copy.
- **Versioning.published_immutable_while_running** (integration, api): editing a published level used by an instance is blocked / creates a draft.
- **Migration.instance_survives_each_phase** (integration, api): a pre-migration seeded instance loads with evidence/progress intact after each phase migration.
- **Migration.compat_mapping_roundtrip** (integration, api): compatibility-layer template maps to new entities without data loss.
- **live e2e: smoke_create_to_run** (live e2e): against the running stack, create activity → block → template → instance via API.

## Documentation update
- [ ] `docs/architecture.md`, section: Product Hierarchy Mapping + ER diagram + Public API — per phase as entities land. Path: `apps/matricas-album/docs/architecture.md`
- [ ] `docs/felhasznaloi-kezikonyv.md`, section: Tevékenység/Albumterv létrehozás — after Phase 1 UX. Path: `apps/matricas-album/docs/felhasznaloi-kezikonyv.md`
- [ ] Wiki state-mirror [[matricas-album-projekt-allapot]] + [[AlbumDomain]] + [[Glossary]] — via `/wiki` after each phase (not edited directly during app work). Path: `docs/llm-wiki/...`
- [ ] `roadmap.md` decision-log entry + Stream 4/5 pointers to this plan; `LOG.md` entry per shipped phase. Path: `apps/matricas-album/roadmap.md`, `apps/matricas-album/LOG.md`
- [ ] ADR002 update after GATE-1 (via `/wiki`). Path: `docs/llm-wiki/wiki/ADRs/ADR002-temakor-elso-osztalyu-szint.md`

---

## Task breakdown

### Phase 1 — Creation-UX simplification (current model, no schema)
> **Releasable**: after each task; the phase as a whole ships a calmer, guided Matrica + Albumterv creation experience with zero schema/API change. This is the immediate teacher-facing win and is **not** gated by C1–C5.

#### Task 1.1 — Stand up test projects
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Api.Tests/MatricasAlbum.Api.Tests.csproj` (xUnit + `Microsoft.AspNetCore.Mvc.Testing` + EF Core InMemory/Testcontainers); add to `MatricasAlbum.slnx`. Confirm Angular `ng test` (Karma/Jasmine) runs.
- **Depends on**: nothing
- **Description**: WebApplicationFactory harness booting the minimal API against a disposable Postgres (Testcontainers) or InMemory provider; one smoke test per layer. Add `npm test`/`ng test --watch=false` CI-friendly script.
- **Releasable**: `dotnet test` and `ng test` execute a green smoke suite.
- **Tests (TDD)**: Unit `test_api_factory_boots_health_ok`; Unit (web) `app.component.spec` smoke. Checkpoint: `dotnet test apps/matricas-album/MatricasAlbum.slnx` ; `npm --prefix apps/matricas-album/src/MatricasAlbum.Web test -- --watch=false`

#### Task 1.2 — `CreationShellComponent` (mode chooser + 3-pane scaffold)
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Web/src/app/shared/ui/creation-shell/creation-shell.component.ts`
- **Depends on**: Task 1.1
- **Description**: Presentational shell. Inputs: `modes: CreationMode[]` (`ures|ai|adaptalas|konyvtar|kontextus`), `left/center/right` content projection (`ng-content` slots), `previewTpl`. Emits `modeSelected`. Renders a calm mode-chooser step first, then the 3-pane layout (collapsible left/right on narrow screens). No domain logic.
- **Releasable**: a reusable shell other creators compose.
- **Tests (TDD)** — `creation-shell.component.spec.ts`: `mode_chooser_routes` (emits selected mode), `panes_render_projected_content`, `narrow_screen_collapses_side_panes`. Checkpoint: `ng test --include='**/creation-shell.*'`

#### Task 1.3 — Reframe `Tevékenység (matrica)` create into the shell + progressive disclosure
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-create-drawer/album-create-drawer.component.ts` (+ template)
- **Depends on**: Task 1.2
- **Description**: Wrap the existing sticker-create path in `CreationShellComponent`. Center pane shows only essential fields (név, instrukció, evidence típus, `Tevékenységtípus`); move the activity-metadata panel (subject, grade, NAT, competencies, interaction/participant mode, placement ladder) behind a single **"Részletes tervezés"** disclosure (still serialized to note-fields exactly as today — no persistence change). Plain-language labels + helper microcopy. Keep all existing store calls (`openStickerWizard`, `POST /api/stickers`).
- **Releasable**: the matrica creator shows ≤7 default fields; advanced metadata is opt-in.
- **Tests (TDD)** — `album-create-drawer.component.spec.ts`: `essential_fields_only_by_default`, `disclosure_reveals_advanced_metadata`, `submit_still_calls_create_sticker`, `note_field_serialization_unchanged`. Checkpoint: `ng test --include='**/album-create-drawer.*'`

#### Task 1.4 — Live preview pane for the matrica creator
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-create-drawer/matrica-preview.component.ts`
- **Depends on**: Task 1.3
- **Description**: Right-pane component rendering a student-facing preview of the in-progress `StickerVersion` (reusing `sticker-stamp`/`phase-chip`/`evidence-card`). Bound to the draft signal; read-only.
- **Releasable**: editing fields updates a live preview.
- **Tests (TDD)** — `matrica-preview.component.spec.ts`: `preview_reflects_edits`, `empty_state_renders_placeholder`. Checkpoint: `ng test --include='**/matrica-preview.*'`

#### Task 1.5 — Restructure the `Albumterv` editor (album-template-detail) into sectioned 3-pane
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-templates/album-template-detail.component.ts` (+ template)
- **Depends on**: Task 1.2
- **Description**: Re-lay the inline editor into `CreationShellComponent`: left = unit/sticker navigation; center = focused editor for the selected unit's sticker plan; right = album preview. Collapse metadata (`DurationType`, dispositions, `Pedagógiai minta`, reflection prompts) into labeled disclosures. Preserve the debounced (400ms) `PATCH /api/album-template-versions/{vid}`, draft/publish, archive, and CDK drag-drop + `stickers/reorder`.
- **Releasable**: a decluttered, sectioned template editor with preview; no API change.
- **Tests (TDD)** — `album-template-detail.component.spec.ts`: `sections_collapse_and_persist`, `debounced_patch_still_fires`, `reorder_routes_through_bulk_endpoint`, `publish_flow_intact`. Checkpoint: `ng test --include='**/album-template-detail.*'`

#### Task 1.6 — Plain-language pass + label consistency on creation surfaces
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-create-drawer/*`, `.../album-templates/*` (copy only)
- **Depends on**: Tasks 1.3, 1.5
- **Description**: Replace jargon with teacher-plain Hungarian; consistent button verbs (`Mentés`/`Mégse`/`Publikálás`/`Elvetés`); one-line helper under each non-obvious field; ensure `Tevékenységtípus` vs `Tanulási út fázisa` distinction copy stays. No logic change.
- **Releasable**: consistent, readable creation copy.
- **Tests (TDD)** — extend specs: `labels_present_for_required_fields`. Checkpoint: `ng test --include='**/album-create-drawer.*'`

### Phase 2 — Decision gate + `Tevékenységtípus` formalization
> **Releasable**: Task 2.2–2.4 ship `Tevékenységtípus` as a real, filterable field independently; Task 2.1 produces decisions that **unblock Phases 3–6**.

#### Task 2.1 — Contradiction decision (GATE) — ✅ DONE (2026-06-01)
- [x] **Recorded in the wiki** (per the plans-in-wiki rule, not an `apps/.../decisions/` memo): [[ADR002-temakor-elso-osztalyu-szint|ADR002]] (Resolution 2026-06-01) + [[ADR003-matrica-tanulasi-atom|ADR003]] (new) + the [[2026-06-01-rendszerstruktura-gold-standard]] „6. Ellentmondások és döntések" section.
- **Decision**: hierarchy `Tanterv → Modul → Témakör → Blokk → Tevékenység` (`Témakör` first-class, `Tanulási egység` removed); `matrica` stays the learning atom (reward reframing rejected); ChatGPT diagram / `Feladat` disregarded for now; the platform spec is a superordinate layer mapped selectively.
- **Effect**: Phases 3–6 are **unblocked** and build to this model.

#### Task 2.2 — `ActivityType` entity + seed (system-defined taxonomy)
- [ ] **File**: `apps/matricas-album/src/MatricasAlbum.Api/Domain/ActivityType.cs`, `Domain/DomainValues.cs` (`ActivityTypeKeys`), `Data/AlbumDbContext.cs`, `Migrations/<ts>_AddActivityTypes.cs`, `Data/DemoSeeder.cs`
- **Depends on**: Task 1.1
- **Description**: `ActivityType` entity (`Key, Name, PedagogyModel, InteractionModel, CognitiveFocusJson, StructureFlexibility, DefaultGroupForm, AllowedActivityPatternsJson, CompatibilityJson`). `ActivityTypeKeys.All` = `{felfedezo, kiserletezo, feldolgozo, kommunikacios, kollaborativ, reflektiv}` with `Normalize(string?)` (case-insensitive; unknown→`null`/validation error, **no fallback invention**). Seed exactly 6 rows idempotently. Verify the three inferred keys against product before locking (ties to Glossary footnote).
- **Releasable**: 6 seeded, queryable activity types.
- **Tests (TDD)** — `ActivityTypeTests.cs`: `normalize_accepts_six_rejects_unknown`, `normalize_is_case_insensitive`, `seed_idempotent`. Checkpoint: `dotnet test --filter ActivityType`

#### Task 2.3 — `Activity.type` field + read/filter endpoint + UI wiring
- [ ] **File**: `Domain/Sticker.cs` (`StickerVersion.ActivityTypeKey`), `Migrations/<ts>_AddStickerVersionActivityType.cs`, `Program.cs` (`GET /api/activity-types`, filter param on sticker list), `Contracts/*`, web `album-api.service.ts` + the type picker in `album-create-drawer`
- **Depends on**: Task 2.2, Task 1.3
- **Description**: Persist the dominant type on the activity record (additive, nullable; backfill from the existing note-field picker value where present). `GET /api/activity-types` returns the read-only list. Wire the existing fixed picker to the persisted field; add a type facet to the Matricatár filter. No user/AI type creation.
- **Releasable**: activity type is a real, filterable field end-to-end.
- **Tests (TDD)** — `ActivityTypeEndpointTests.cs`: `list_returns_six`, `set_type_persists`, `filter_by_type_returns_subset`, `reject_unknown_type_400`; web `type_picker_lists_system_types_only`. Checkpoint: `dotnet test --filter ActivityType` ; `ng test --include='**/album-create-drawer.*'`

#### Task 2.4 — Register taxonomy in docs/wiki
- [ ] **File**: `apps/matricas-album/docs/architecture.md` (+ ER) ; wiki [[Glossary]] already has it (confirm keys) via `/wiki`
- **Depends on**: Task 2.2
- **Description**: Document `ActivityType` in architecture.md; confirm the 3 inferred Glossary keys against the seeded values; note the `Phase` vs `Tevékenységtípus` distinction.
- **Releasable**: docs match the shipped enum.
- **Tests (TDD)**: N/A (docs). Checkpoint: architecture.md ER includes `ACTIVITY_TYPE`.

### Phase 3 — `Activity` model enrichment (gated by Task 2.1)
> **Releasable**: after this phase, `StickerVersion` carries the spec's structured `Activity` fields as real columns/child tables (additive), with the creator UX reading them — existing stickers keep working.

#### Task 3.1 — Promote activity metadata from note-fields to structured columns
- [ ] **File**: `Domain/Sticker.cs`, `Migrations/<ts>_AddActivityStructuredMetadata.cs`, `Data/AlbumDbContext.cs`
- **Depends on**: Task 2.1, Task 2.3
- **Description**: Add `metadata` (`ShortDescription, EstimatedMinutes, Difficulty, GroupSize, Modality`), `pedagogy` (`CompetenciesJson, MethodsJson, ReflectionPromptsJson`), `context` (`Subject, GradeLevel, TopicsJson, NatReferencesJson`), `resources` (`ToolsJson, MaterialsJson, AttachmentsJson, ExternalLinksJson`), `lifecycle` (`Status, Source`) — all additive/nullable. One-time backfill parses today's note-field serialization where parseable; unparseable text retained in a `LegacyNotes` field (no data loss).
- **Releasable**: structured activity metadata persisted and queryable.
- **Tests (TDD)** — `ActivityMetadataTests.cs`: `new_columns_default_null`, `backfill_parses_known_notes`, `unparseable_notes_preserved`, `existing_sticker_loads_unchanged`. Checkpoint: `dotnet test --filter ActivityMetadata`

#### Task 3.2 — `Activity.relations` (`derivedFrom`, `reusedIn`) read model
- [ ] **File**: `Program.cs` (activity detail DTO), `Contracts/*`
- **Depends on**: Task 3.1
- **Description**: Surface `relations.blocks/reusedIn/derivedFrom` (derivable once `Block` exists; pre-Phase-4 returns sticker-version lineage + template usage). Read-only.
- **Releasable**: activity detail shows lineage/reuse.
- **Tests (TDD)**: `relations_reports_template_usage`, `derivedFrom_tracks_new_version_source`. Checkpoint: `dotnet test --filter ActivityRelations`

#### Task 3.3 — Creator reads structured fields (replace note-field disclosure)
- [ ] **File**: web `album-create-drawer` advanced disclosure (from Task 1.3) + `album-api.service.ts`
- **Depends on**: Task 3.1
- **Description**: Switch the "Részletes tervezés" disclosure from note-field serialization to the new structured fields; keep the calm default/disclosure layout from Phase 1.
- **Releasable**: advanced metadata edits persist as structured data.
- **Tests (TDD)**: `advanced_fields_bind_to_structured_api`, `phase1_layout_preserved`. Checkpoint: `ng test --include='**/album-create-drawer.*'`

### Phase 4 — `Blokk` (Block) entity + reference composition + flow-builder UX (gated)
> **Releasable**: after this phase, blocks are reusable entities of activity references with roles, edited in a 3-pane drag-&-drop builder; lesson-builder notes migrate to real blocks.

- **Task 4.1** — `Block` + `BlockVersion` entities (mirror album-template versioning: draft/publish, ≤1 draft) — `Domain/Block.cs`, migration, DbContext. Tests: version draft/publish/immutability.
- **Task 4.2** — `ActivityBlockRelation` (reference, not embed) with `Role(primary|supporting|optional|transition|assessment)`, `SortOrder`, `flowType`/`grouping`/`rules` on the block version — migration + endpoints `POST/DELETE /api/blocks/{id}/activities`, two-pass `/reorder`. Tests: `create_references_not_copies`, `roles_enforced`, `reorder_no_collision`, `same_activity_in_two_blocks`.
- **Task 4.3** — Block builder UX in `CreationShellComponent`: left=activity library (search + AI suggest), center=drag-&-drop flow canvas, right=preview. Tests (e2e): `builder_dragdrop`, `assign_role`, `preview_order`.
- **Task 4.4** — Migration mapping: existing `AlbumTemplateVersion` unit rows + lesson-builder notes → `Block`s referenced by the template; `AlbumInstance` mint snapshots block→activity references into `InstanceSticker` rows (preserve evidence). Tests: `instance_survives_each_phase`, `compat_mapping_roundtrip`.

### Phase 5 — `Témakör` (Topic) entity + reference composition (depends on Phase 4)
> **Releasable**: topics group blocks by reference; topic UX is a block-organizing/navigation layer.

- **Task 5.1** — `Topic` + `TopicVersion` entities + `TopicBlockRelation` (reference). Per the 2026-06-01 decision the `Tanulási egység` level is removed: `Topic → Block` **directly**. The current `AlbumTemplateVersionWeekPlan`/`AlbumInstanceWeekPlan` unit rows map onto the `Block` layer in the migration (not a separate level). Tests: reference composition, versioning.
- **Task 5.2** — Topic UX (strukturáló/navigációs réteg): block library + ordering + progression preview in `CreationShellComponent`. Tests: reference add/reorder, drill-down nav.
- **Task 5.3** — `Week`/`WeekNumber`/`CurrentWeek` → `UnitIndex` rename (pull the `backlog.md` item now, during this schema churn) iff GATE-1 retires the week model. Tests: rename round-trip, no behavior change, instance survives.

### Phase 6 — `Modul` (Module) + `Tanterv` (Curriculum) + per-level versioning + navigation (gated)
> **Releasable**: full `Tanterv → … → Tevékenység` chain exists as reference-composed, versioned entities with hierarchical drill-down; teachers still start from the smallest useful move (no forced full hierarchy).

- **Task 6.1** — `Module` + `ModuleVersion` + `ModuleTopicRelation`; Module UX (topic flow/timeline builder). Tests: reference composition, versioning.
- **Task 6.2** — `Curriculum` + `CurriculumVersion` + `CurriculumModuleRelation`; Curriculum UX (validation-driven structural planner per the spec's Tanterv-UX, incl. `draft/review/approved/published` states). Tests: reference composition, status workflow.
- **Task 6.3** — Hierarchical drill-down navigation `Tanterv → Modul → Témakör → Blokk → Tevékenység` + breadcrumb; AI structure suggestions (suggest-only, no auto-save). Tests: nav drill-down, AI suggestion never auto-persists.
- **Task 6.4** — Architecture/wiki/roadmap final reconciliation: `docs/architecture.md` hierarchy section reflects shipped entities; `/wiki` refresh of [[AlbumDomain]] + [[matricas-album-projekt-allapot]]; ADR for the realized hierarchy. Tests: N/A (docs).
