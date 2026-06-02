# Matricás album — change log

Handoff log between coding agents. Entry granularity: one block per change session, summary level (not file-by-file). Newest entry on top.

Format:
```
## [YYYY-MM-DD] <verb> | <short title>
- Ask: what the user requested
- Change: what was done, at component/area level
- Why: root cause or rationale
- State another agent needs: env, DB, restart, follow-ups
```

---

## [2026-06-02] feat | Modul + Tanterv + drill-down — REFACTOR-001 Phase 6 — PHASE 6 COMPLETE (full hierarchy)

- Ask: start Phase 6 — the top of the hierarchy (Modul + Tanterv) + drill-down navigation.
- Change: `Module`/`ModuleVersion`/`ModuleTopicRelation` (`AddModules`) and `Curriculum`/`CurriculumVersion`/`CurriculumModuleRelation` (`AddCurricula`) entities + migrations, mirroring the topic/block reference-composition + versioning. Endpoints behind `Features:Hierarchy:{Module,Curriculum}`. `ModuleBuilderComponent` + `CurriculumBuilderComponent` (3-pane, mirror the topic builder) at „Modulok"/„Tantervek". `HierarchyExplorerComponent` — read-only lazy-loading drill-down over the whole chain, resolving the exact referenced version at each level („Felépítés" nav). `Topic/ModuleListItem.latestPublishedVersionId` added so parents reference published children. architecture.md got ER relationships + a "realized hierarchy" section.
- Why: complete the gold-standard `Tanterv → Modul → Témakör → Blokk → Tevékenység` chain as reference-composed, versioned entities — additively, dark behind flags, no change to the running app.
- State another agent needs: migrations apply on boot (6 new tables across Phases 4–6). `dotnet test` 61/61, `ng test` 40/40 green; **full chain drill-down verified live end-to-end** (Tanterv→…→4 activities). **Phase 6 complete → REFACTOR-001 Phases 1–6 core all done.** Deferrals (tracked in plan/backlog): mint-through-blocks rewire, `Week→UnitIndex` rename, Curriculum governance workflow (review/approved), suggest-only AI structure help, richer per-level fields, and a `/wiki` refresh of [[AlbumDomain]]/[[matricas-album-projekt-allapot]] + an ADR for the realized hierarchy.

## [2026-06-02] feat | Témakör (Topic) layer — REFACTOR-001 Phase 5 (Tasks 5.1–5.2) — PHASE 5 COMPLETE

- Ask: start Phase 5 — the Témakör (Topic) level composing Blocks by reference.
- Change: `Topic`/`TopicVersion`/`TopicBlockRelation` entities + `20260602120000_AddTopics` migration (mirrors block versioning: ≤1 draft, published-immutable; `Topic → Block` directly since `Tanulási egység` was retired). Reference composition: a topic version references `BlockVersion` rows (FK restrict, no copy; same block in many topics). Endpoints behind `Features:Hierarchy:Topic` (on in Development). `TopicBuilderComponent` (3-pane via `CreationShellComponent`): published-block library · drag-&-drop block references · progression preview; route `/teacher/topics` + „Témakörök" nav. `BlockListItem.latestPublishedVersionId` added so topics reference published blocks only.
- Why: introduce the Topic level bottom-up, additively, dark behind the flag — no change to the running app.
- State another agent needs: migration applies on boot (3 new tables). `dotnet test` 57/57, `ng test` 30/30 green; full topic flow verified live (reference 2 blocks, swap reorder, unknown block-version 400, publish, same block in two topics). **Task 5.3 (Week→UnitIndex rename) deferred** — gating condition (GATE-1 retires the week model) not met; kept in `backlog.md`. **Phase 5 complete.** Next: Phase 6 (`Modul` + `Tanterv`) + hierarchical drill-down, gated.

## [2026-06-01] feat | Evidence-safe template→Blocks derivation — REFACTOR-001 Phase 4 (Task 4.4) — PHASE 4 COMPLETE

- Ask: finish Phase 4 with Task 4.4 — map template units to Blocks without breaking running albums.
- Change: `TemplateBlockMapping.MapUnitsToBlocks` (pure, tested) maps a template version's per-unit (week) sticker groups → one published `Block` per non-empty unit (activities referenced in order, `primary` role). `BlockMaterializer.MaterializeAsync` (additive, idempotent by name) inserts only Block/BlockVersion/ActivityBlockRelation rows. `POST /api/album-templates/{id}/derive-blocks` (behind the flag) derives blocks from the latest published template version. architecture/plan/LOG updated.
- Why: deliver the gold-standard `template units → Blocks` mapping additively. **Deliberate scope decision:** the proven `InstanceSticker` mint path is left untouched (it already snapshots references at run); rewiring the mint *through* blocks waits until a template actually composes blocks (Phase 5/6) — doing it now would put live albums' evidence at risk for no benefit.
- State another agent needs: migration none (reuses Phase-4.1 tables). `dotnet test` 55/55, `ng test` 26/26 green; derive verified live (7 blocks from the seeded template, idempotent, running instance + 5 evidence rows intact). **Phase 4 complete (4.1–4.4).** Next: Phase 5 (`Témakör`/Topic) — `Topic → Block` directly (Tanulási egység removed), gated.

## [2026-06-01] feat | Blokk builder UI — REFACTOR-001 Phase 4 (Task 4.3)

- Ask: continue Phase 4 with Task 4.3 — the 3-pane drag-&-drop block builder.
- Change: `BlockBuilderComponent` (composes the reusable `CreationShellComponent`) — left searchable activity library (add-by-reference + role), center CDK drag-&-drop flow (reorder/role/remove), right live ordered preview. Block API client + models + DTO mappers in `album-api.service.ts`. Route `/teacher/blocks` + flag-gated „Blokkműhely" sidebar entry via new `core/tokens/features.ts` (`hierarchyBlock`). Added `PATCH /api/blocks/{id}/activities/{relationId}` (role change, unknown→400) to back the role selector. Archived blocks hidden from the picker.
- Why: give teachers a calm, visual way to assemble reusable blocks from activity references (the gold-standard 3-pane builder pattern), still dark behind the flag.
- State another agent needs: `ng test` 26/26, `dotnet test` 50/50; full block flow + role PATCH verified live; web + api rebuilt. Web flag is a plain constant (flip `FEATURES.hierarchyBlock` to hide). **Remaining in Phase 4: Task 4.4 — evidence-preserving AlbumInstance-mint migration (highest risk).**

## [2026-06-01] feat | Blokk (Block) API — REFACTOR-001 Phase 4 (Tasks 4.1–4.2)

- Ask: start REFACTOR-001 Phase 4 — the Blokk (Block) entity with reference composition + versioning.
- Change: new `Block` / `BlockVersion` / `ActivityBlockRelation` entities + `20260601150000_AddBlocks` migration. Mirrors album-template versioning (≤1 draft per block via partial unique index, published immutable; v1 starts as an editable draft). `BlockFlowTypes`/`BlockGroupings` (defaulted) + `BlockActivityRoles` (closed) domain values. Reference composition: a block version points at `StickerVersion` rows (FK restrict, no copy); the same activity version can be referenced by many blocks. Endpoints (list/create/detail/archive, draft/publish/discard, add/remove activity reference, two-pass reorder, version patch) gated behind `Features:Hierarchy:Block` — **on in Development, dark elsewhere**, and not yet wired into any UI.
- Why: introduce the gold-standard `Blokk` level bottom-up, additively, without touching the running app (feature-flagged + no UI entry point).
- State another agent needs: migration applies on boot (3 new tables). `dotnet test` 50/50 green; full block flow verified live. **Remaining in Phase 4: Task 4.3 (3-pane drag-&-drop block builder UI) and Task 4.4 (evidence-preserving AlbumInstance-mint migration — highest risk; touches running albums).** Block endpoints exist but no UI consumes them yet.

## [2026-06-01] feat | Activity model enrichment — REFACTOR-001 Phase 3

- Ask: continue REFACTOR-001 with Phase 3 — promote activity metadata from note-fields to structured columns.
- Change: `StickerVersion` gained additive/nullable structured columns (`Subject`, `GradeLevel`, `EstimatedMinutes`, `Modality`, `GroupSize`, `ContextMode`, `CompetenciesJson`, `NatReferencesJson`) + migration. `ActivityMetadataNotes.Parse` (pure, tested) lifts the legacy create-drawer note-lines into those fields and keeps the genuine teacher steps. The create drawer now sends a structured `metadata` object from the „Részletes tervezés" panel instead of serializing into note-lines; hierarchy context (`Tanterv → Blokk`) + free-text local context stay as note-lines until Block/Topic exist. Added a read-only `relations` model on the activity detail (`reusedIn` template usage + `derivedFrom` version lineage via the pure `StickerVersionLineage` helper). architecture.md mapping row updated.
- Why: move the Activity model toward the gold-standard structured shape and make planning metadata queryable instead of buried in free text.
- State another agent needs: migration `20260601140000_AddActivityStructuredMetadata` applies on boot. `dotnet test` 34/34, `ng test` 22/22 green; structured persist + legacy note-line promotion + relations verified live. Deferred (not invented): the `resources{}` group, `lifecycle{status,source}`, and hierarchy-as-entities (Phases 4–6). Next: Phase 4 (Blokk entity + reference composition + 3-pane flow builder), gated.

## [2026-06-01] feat | Tevékenységtípus (ActivityType) taxonomy — REFACTOR-001 Phase 2

- Ask: run REFACTOR-001 Phase 2 — formalize the closed `Tevékenységtípus` taxonomy (the one gold-standard piece that is alignment, not delta).
- Change: new `activity_types` reference table + `ActivityType` entity/catalog (6 system types, seeded idempotently on every boot); `StickerVersion.ActivityTypeKey` (additive, nullable, never backfilled with a guess); `GET /api/activity-types` (read-only) + `?activityType=` filter on the sticker list + unknown-type→400 on create/version. Web: single-sourced the 6-type taxonomy in `core/tokens/activity-types.ts`; the create-drawer picker now persists the type; Matricatár gained a type-filter facet + per-card type chip. Docs: `architecture.md` ER + API + new "Tevékenységtípus (ActivityType) Taxonomy" section; wiki Glossary confirmed matching. Also fixed the API Dockerfile to restore the API project (not the whole `.slnx`) so the new test project no longer breaks the image build.
- Why: move the app toward the gold-standard rendszerstruktúra with the dominant activity type as a real, filterable field; keep the taxonomy closed (users/AI classify, never invent).
- State another agent needs: migrations `20260601120000_AddActivityTypes` + `20260601130000_AddStickerVersionActivityType` apply on boot and seed exactly 6 rows. `dotnet test` 27/27, `ng test` 21/21 green; all 4 endpoint behaviors verified live on Postgres. Branch `gold-standard-ingest-refactor-plan`. Rebuild containers (`docker compose up --build -d`) to pick up the web facet. The 3 inferred type keys/pedagogyModels (`kommunikacios/kollaborativ/reflektiv`) are now seeded but still pending Confluence confirmation. Next: REFACTOR-001 Phase 3 (Activity metadata structuring), gated after this.

## [2026-06-01] docs | Clean docs folder

- Ask: clean out the `docs/` folder and only keep the architecture and user manual documents.
- Change: consolidated hierarchy mapping and schema guardrails into `docs/architecture.md`, removed one-off plans/code-review artifacts/render scripts from `docs/`, and updated `docs/README.md`, the project `README.md`, and active roadmap references.
- Why: keep `docs/` focused on long-lived architecture and user-facing manual artifacts instead of historical implementation notes.
- State another agent needs: docs cleanup only. Remaining docs are `architecture.md/html`, `felhasznaloi-kezikonyv.md/html`, and `README.md`.

## [2026-06-01] docs | Architecture and user manual refresh

- Ask: update the architecture documents and the user manual after the recent Matricás Album concept changes.
- Change: updated `docs/architecture.md` with the progressive planning compatibility layer, `Tevékenység (matrica)` vocabulary bridge, `Tanulási egység` planning context, local weekly observation to `TeacherEffectLog` bridge, and current frontend rules. Updated `docs/felhasznaloi-kezikonyv.md` with the three entry paths, hierarchy explanation, activity/block/curriculum language, and closure observation import.
- Why: the docs needed to match the current teacher workflow and UX terminology after the workflow/UX coherence slice.
- State another agent needs: docs-only plus refreshed HTML snapshots. No app code, API contract, DB schema, raw/wiki ingest, or agent-wiki change.

## [2026-05-31] feat | Workflow/UX coherence slice

- Ask: start implementing the high-priority workflow and UX coherence changes from the roadmap.
- Change: refined the Műhely and create drawer vocabulary around `Tevékenység (matrica)`, added context-aware save labels, surfaced `Tanulási egység` in activity/lesson planning metadata, added a curriculum hierarchy example, demoted old album patterns to `Pedagógiai minta`, bridged local weekly observations into the closure effect log, and documented metadata ownership before schema/filter work.
- Why: the prototype should feel like one progressive teacher workflow while the existing sticker/template/album APIs remain the compatibility layer.
- State another agent needs: frontend + docs slice. Angular build passed. No API contract, DB schema, migration, route, backend AI, raw/wiki ingest, or agent-wiki change.

## [2026-05-31] docs | Workflow and UX coherence roadmap

- Ask: plan the consistency-check recommendations on the roadmap with high priority.
- Change: added a high-priority roadmap subsection for vocabulary bridging, entry-aware labels, visible `Tanulási egység` context, hierarchy examples, type/phase separation, pattern demotion, observation-to-closure bridging, dashboard grouping, metadata ownership, and print/package signal placement.
- Why: the recent product-plan slices need a cleaner UX bridge between the original Matricás Album execution model and the newer curriculum/activity hierarchy.
- State another agent needs: roadmap/log only. No app code, API, DB schema, raw/wiki ingest, agent-wiki, or generated docs changed.

## [2026-05-31] feat | Product-tree refinement slice

- Ask: implement the high-priority items from the refreshed roadmap after the recursive Confluence product-tree re-check.
- Change: enriched the create drawer with optional activity-to-block handoff, fixed activity types, context inheritance fields, existing activity/template adaptation starts, richer block metadata, editable curriculum module/topic preview, and printable-package context. Added a hierarchy source-reconciliation note to the mapping doc and marked the May 31 refinement rows done.
- Why: the live product tree expects progressive, teacher-reviewed activity/block/topic/module/curriculum planning without forcing schema/API changes before the hierarchy is reconciled.
- State another agent needs: frontend/docs-only slice. No API contract, DB schema, migration, route, backend AI call, raw/wiki ingest, or agent-wiki change.

## [2026-05-31] feat | AI entry copilot guardrail

- Ask: continue after committing the pilot observation loop slice.
- Change: progressive template-entry drawers now show the teacher-review guardrail: AI may suggest/prefill, but full tanterv/modul/témakör/blokk structures cannot become saved defaults without teacher review.
- Why: the live product plan calls for AI-assisted entry without irreversible generated hierarchy; this keeps entry flows progressive and pilot-safe.
- State another agent needs: frontend copy/guardrail only. No API contract, DB schema, migration, route, backend AI call, raw/wiki ingest, or hierarchy entity changed.

## [2026-05-31] feat | Pilot observation loop

- Ask: continue after committing the activity metadata slice.
- Change: added a per-unit pilot observation pad to the running album plan for engagement signals, adaptation notes, and the next small trial; notes persist locally by instance/unit.
- Why: the learning loop should capture lightweight weekly teacher observations, not only project-closure reflection, while avoiding automated effectiveness scoring.
- State another agent needs: frontend-only/localStorage pilot slice. No API contract, DB schema, migration, route, backend AI call, raw/wiki ingest, or hierarchy entity changed.

## [2026-05-31] feat | Activity metadata upgrade

- Ask: continue after committing the lesson/block builder slice.
- Change: new sticker/activity creation now offers optional pilot metadata for subject, grade, competencies, NAT links, interaction mode, participant mode, estimated minutes, and real-world context; idea drafts prefill sensible metadata.
- Why: the product plan needs richer `Tevékenység` descriptors, but this slice keeps them additive by saving teacher-facing planning notes through existing sticker payload fields.
- State another agent needs: frontend-only creation-flow slice. No API contract, DB schema, migration, route, agent-wiki, or raw/wiki ingest changed.

## [2026-05-31] feat | Block lesson builder

- Ask: commit the previous slice and continue with the next 2026-05-29 high-priority product-plan delta.
- Change: "Kezdj egy órával" now includes an órai blokk builder with 3-5 editable activities, per-activity minutes, add/remove, reorder, and automatic sync into the existing albumvázlat units.
- Why: teachers can assemble a concrete lesson block without being pushed into the future tanterv/modul/témakör hierarchy or accepting generated structure as final.
- State another agent needs: frontend-only template-drawer slice. No API contract, DB schema, route, backend AI call, raw/wiki ingest, or hierarchy entity changed.

## [2026-05-31] feat | Quick activity-from-idea

- Ask: continue after committing the product-plan alignment checkpoint.
- Change: "Kezdj egy ötlettel" now opens an idea-first Matricatár flow with a local vázlatsegítő that prefills title, phase, description, student instruction, and evidence type from a plain teacher idea.
- Why: teachers can move from a lightweight idea to a reviewable `Tevékenység`/matrica without first choosing the full hierarchy or accepting an irreversible generated structure.
- State another agent needs: frontend-only activity draft helper. The teacher still edits and saves explicitly; no API contract, DB schema, route, backend AI call, or hierarchy entity changed.

## [2026-05-31] feat | Pilot target alignment

- Ask: continue the 2026-05-29 high-priority product-plan deltas after progressive entry paths.
- Change: surfaced the pilot target on the Műhely dashboard, tuned entry/onboarding copy toward 7-8th grade science teachers in autonomy-supportive schools, and aligned default/demo template grade labels to `7-8. évfolyam`.
- Why: the product plan names a narrower pilot segment, so the app should stop presenting the first slice as a generic all-subject tool.
- State another agent needs: string/default-data alignment only. No API contract, database schema, route, hierarchy entity, agent-wiki, or raw/wiki change.

## [2026-05-29] feat | Progressive entry paths

- Ask: continue the 2026-05-29 product-plan deltas after the hierarchy foundation.
- Change: added three Műhely entry cards ("Kezdj egy ötlettel", "Kezdj egy órával", "Kezdj egy tantervvel") wired to existing sticker/template creation flows; the template drawer now applies lesson/curriculum starter presets and context copy.
- Why: teachers can start from a useful next step without seeing or managing the full tanterv/modul/témakör hierarchy.
- State another agent needs: frontend-only + roadmap/log. No API, DB, route, schema, or agent change.

## [2026-05-29] docs | Product hierarchy mapping foundation

- Ask: start the 2026-05-29 high-priority product-plan deltas with the regression-safe foundation slice.
- Change: added `docs/product-hierarchy-mapping-2026-05-29.md`, linked it from `docs/architecture.md`, and marked the hierarchy mapping roadmap row done.
- Why: lock the target hierarchy (`Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`) before any schema, API, or navigation work.
- State another agent needs: docs-only. No runtime behavior, API, DB schema, frontend model, route, raw/wiki, or agent-wiki change; `architecture.html` was not regenerated.

## [2026-05-28] fix | Remove agent-wiki checksum drift guard

- Ask: remove the agent checksum drift check.
- Change: removed runtime checksum validation from the Python agent's `KnowledgeBase` startup path; manifest checksums can remain as projection metadata, but no longer fail agent startup.
- Why: agent-wiki edits should not be blocked by stale checksum metadata.
- State another agent needs: Agent code/docs only. `py_compile` passes.

## [2026-05-28] feat | Adaptive differentiation + closure synthesis

- Ask: implement the next Matricás Album roadmap phase from the product-vision plan.
- Change: added version-backed differentiation paths, running-sticker team path assignments/history, and a `closureSynthesis` AI target surfaced on the closure page.
- Why: adaptive pedagogy and learning-loop closure should be usable pilot behavior, with teacher control preserved instead of automatic scoring or grading.
- State another agent needs: API + Web + Agent + DB migration changed. Startup migration creates path tables; old templates hydrate default paths. API build, Angular build, and agent syntax check pass.

## [2026-05-27] feat | Teacher effect log for closure

- Ask: implement the next roadmap slice around teacher reflection / effect log, without adding AI closure synthesis yet.
- Change: added a persisted per-instance `Tanári hatásnapló` with four teacher reflection fields, closure-page editing, learning-loop snapshot status, print/export rendering, and teacher-only AI snapshot preparation.
- Why: pilot learning should capture teacher judgment on what worked, where students engaged, what needed adaptation, and what to reuse next time.
- State another agent needs: API + Web + DB migration changed. Startup migration creates `album_instance_teacher_effect_logs`; saving all four empty fields clears the row. `dotnet build ...Api.csproj --no-restore` and `npm --prefix src/MatricasAlbum.Web run build` pass.

## [2026-05-27] feat | Product vision UX alignment

- Ask: implement the first low-risk UX batch from the refreshed Matricás Album product vision.
- Change: added first-use concept onboarding in the album-template drawer, surfaced `StudentChoice` in student evidence submission and teacher evidence review, and added a read-only closure learning-loop snapshot.
- Why: keep the pilot scope narrow while making the product feel like a teacher-facilitated learning journey rather than a task/badge list.
- State another agent needs: frontend-only; no API/DB change in this entry. `npm --prefix src/MatricasAlbum.Web run build` passed during implementation.

## [2026-05-24] feat | AI trust pass v1

- Ask: implement the next roadmap slice: make student Socratic prompts and teacher evidence-feedback drafts more context-specific and trustworthy.
- Change: advice snapshots now expose selected-team / active-sticker / target-evidence context; agent/API validation keeps student advice question-only and pins `draftFeedback` actions to the requested evidence. The feedback drawer now requests and applies evidence-specific drafts as editable teacher text.
- Why: visible AI surfaces should support teacher/student judgment with scoped context before adding broader AI or activity-domain features.
- State another agent needs: API + Agent + Web changed; no migration or new endpoint. `PromptVersion` bumped to `phase4-v2`; API/Web builds and agent syntax check pass, containers rebuilt/restarted, smoke checks return 200.

## [2026-05-24] fix | Guided demo reflection prerequisite

- Ask: `Minta reflexió mentése` failed with `A matrica csak lezárás után reflektálható.`
- Change: the guided reflection step now repairs the teacher-feedback/progress prerequisite before saving the sample reflection, and demo feedback readiness is based on team progress rather than evidence status alone.
- Why: the API correctly gates sticker reflection on `TeamProgressState = elkeszult/reflektalt`; the guided demo could previously unlock the reflection step when evidence status and team progress drifted.
- State another agent needs: frontend-only; no API or DB change.

## [2026-05-24] feat | Guided demo active banner

- Ask: make it obvious when `Vezetett bemutató` mode is active, with a top-of-app banner for next step, panel reopen, and exit.
- Change: added a persistent below-topbar banner to teacher and student shells; `GuidedDemoService` now exposes next-step/progress helpers, and the start step stays completed once later demo progress exists.
- Why: closing the guided panel previously left presenters in a hidden mode with no clear next action.
- State another agent needs: frontend-only; no API or DB change. `npm --prefix src/MatricasAlbum.Web run build` passes; web container rebuilt/restarted and `http://localhost:4300` + `/api/album-instances` smoke checks return 200.

## [2026-05-23] tweak | Edit-time matrica placement

- Ask: the `Elhelyezés` selector should be editable when changing a running-instance sticker too.
- Change: added the placement selector to the edit drawer and passed `week` through the fork/edit API; no-work edits move the same `InstanceSticker`, while edits with evidence/progress create the corrected copy in the selected unit.
- Why: runtime corrections should include scheduling/phase placement, not only title/content fields.
- State another agent needs: API + Web changed; no migration. `dotnet build MatricasAlbum.slnx`, `npm --prefix src/MatricasAlbum.Web run build`, Docker API/Web rebuild, and `http://localhost:4300` + `/api/album-instances` smoke checks pass.

## [2026-05-23] tweak | Instance-only matrica placement selector

- Ask: when adding an instance-level sticker, choose the active phase/unit or one of the subsequent ones.
- Change: the runtime-sticker drawer now offers a placement selector for current-and-later album units, and the selected unit is sent through the existing create endpoint.
- Why: teachers may want to prepare one-off runtime stickers ahead of the current classroom moment without changing the template.
- State another agent needs: frontend-only; `npm --prefix src/MatricasAlbum.Web run build` passes; web container rebuilt/restarted and `http://localhost:4300` + `/api/album-instances` smoke checks return 200.

## [2026-05-23] fix | Instance-only sortOrder query translation

- Ask: runtime sticker add failed with EF translation error on `DefaultIfEmpty(0).MaxAsync()`.
- Change: rewrote `NextInstanceSortOrderAsync` to use nullable `MaxAsync` over `(int?)SortOrder` with `?? 0`, which Npgsql/EF can translate.
- Why: the previous default-if-empty aggregate shape is valid LINQ but not translatable by the current EF provider.
- State another agent needs: `dotnet build MatricasAlbum.slnx` and Docker API build pass; API container restarted and is healthy. No migration or frontend change.

## [2026-05-23] feat | Instance-only matrica operations

- Ask: implement the next logical roadmap slice without broad activity-domain scope creep.
- Change: added instance-only runtime sticker APIs and UI: "Új matrica" on the plan view, `Duplikálás`, and instance-only `Szerkesztés` from the sticker drawer. Edits with existing evidence/progress create a corrected copy instead of rewriting the original.
- Why: teachers need one-off mid-flight album adjustments while the template/version model remains stable.
- State another agent needs: API + Web changed; DB schema unchanged for this slice. `dotnet build MatricasAlbum.slnx`, `npm --prefix src/MatricasAlbum.Web run build`, Docker API/Web build, and `http://localhost:4300` / `/api/album-instances` smoke checks passed.

## [2026-05-23] feat | Evidence archive + quality edit

- Ask: close the conservative evidence-delete decision and replace hardcoded quality narratives with data-driven/editable quality dimensions.
- Change: added `Evidence.ArchivedAt` and `PATCH /api/evidence/{id}/archive` for no-feedback evidence; default views hide archived rows. Quality dimensions now carry an optional reason and can be edited from the quality panel; edits log `QualityDimensionChange`.
- Why: avoids hard delete while still letting teachers clean misfiled submissions, and makes the quality checker teacher-controlled rather than static report copy.
- State another agent needs: new migrations `20260523120000_AddEvidenceArchivedAt` and `20260523121000_AddQualityDimensionReason`; Docker stack is up and migrated after rebuild. `GET /api/album-instances/{id}` returns `archivedAt` on evidence and `reason` on quality dimensions.

## [2026-05-23] docs | Activity-domain guardrail

- Ask: prepare the Matricás album architecture for future shared activity-domain use-cases without changing existing scope.
- Change: added a developer-facing alias note to `docs/architecture.md` and marked the roadmap prep item done. The note treats `StickerResource` / `StickerVersion` as the current reusable activity-card primitive, but keeps DB/API/UI naming album-specific.
- Why: future generalization should be intentional and additive, not a premature rename in the demo product.
- State another agent needs: docs-only; `docs/architecture.html` was not regenerated.

## [2026-05-22] feat | Demo polish bundle

- Ask: implement the demo polish plan: clearer Műhely next action, hidden stubs, role-switch drawer cleanup, and small layout/copy fixes.
- Change: added the Műhely priority strip; hid presenter-facing stub buttons; role switching now closes evidence/sticker/resource/advice/create/print/evidence-flow overlays; hardened student album poster and topbar breadcrumb overflow; improved demo reset success toast.
- Why: the guided demo and recent AI flows made the app presentable, but the remaining silent controls and role-sensitive drawers could still create awkward demo moments.
- State another agent needs: frontend-only; no API/DB change. `npm --prefix src/MatricasAlbum.Web run build` passes; rebuilt/restarted `web` and smoke-checked `http://localhost:4300` + `/api/album-instances` (both 200).

## [2026-05-22] feat | Evidence deep-link two-way sync

- Ask: pick up the current Matricás album roadmap after the latest handoff.
- Change: completed the in-progress evidence deep-link row. `Bizonyíték-portfólió` and `Visszajelzési sor` now keep drawer state and `?evidence=:id` synchronized both ways: URL restore opens/closes the drawer, user-opened evidence writes the query param, and drawer close removes it.
- Why: one-way deep links survived refresh, but clicked evidence cards/buttons did not produce shareable URLs.
- State another agent needs: frontend build passes with `npm --prefix src/MatricasAlbum.Web run build`; rebuilt/restarted `web` and smoke-checked `http://localhost:4300` + `/api/album-instances` (both 200). No API/DB change.

## [2026-05-21] docs | Architecture HTML diagram refresh

- Ask: refresh the Matricás album HTML architecture diagram.
- Change: updated `docs/architecture.md` and regenerated `docs/architecture.html` from the source-of-truth markdown. Added the Lauder pilot slice, current source-book `agent-wiki` projection, pending-evidence digest flow, help-request triage flow, and newer runtime entities such as instance unit overrides, closure checklist items, deprecated instance stickers, and target-aware AI advice.
- State another agent needs: no code or DB change; this is documentation-only. Regenerate HTML with `docs/render-architecture-html.ps1` after future architecture edits.

## [2026-05-21] feat | Guided Mikroklíma Demo Journey

- Ask: build an opt-in guided demo that presents the full Matricás album workflow without long live typing or waiting for real AI calls.
- Change: added a global `GuidedDemoPanel` from Műhely and Beállítások, plus a frontend `GuidedDemoService` that creates the mikroklíma sticker set, albumterv, 7.B running album, teams, evidence, help request, feedback, reflections, and closure checklist moments through the existing APIs.
- Change: added `POST /api/demo-maintenance/guided-demo/reset` for an empty guided workspace and deterministic guided-demo AI responses on the normal `/api/ai-advice/generate` path when the frontend sends the guided-demo header.
- State another agent needs: guided reset intentionally clears demo data and suppresses automatic seed fallback until the normal demo reset is run; rebuild/restart API + Web before smoke testing the panel.

## [2026-05-21] feat | Súgó citation chips

- Ask: make recommendation citation chips useful by showing the related methodology detail or linking into the Pedagógiai súgó.
- Change: AI advice citation chips now render as interactive chips with hover/focus preview bubbles using teacher-facing Súgó topic summaries; clicking a chip closes the drawer and navigates to the matching `/teacher/help?topic=...` section.
- State another agent needs: topic mapping is frontend-only and follows the source-book projection source IDs.

## [2026-05-21] feat | Source-book agent-wiki refresh + Pedagógiai súgó

- Ask: replace the old source-shaped runtime agent-wiki with the methodology source-book projection, remove README checksum drift, refresh visible terminology, and build the full Pedagógiai súgó on a feature branch.
- Change: regenerated root `agent-wiki/*.md` as `matricas-methodology-agent-wiki-v1`, refreshed `manifest.json` without `README.md` checksums, updated API/Python prompt+projection constants to `phase4-v1`, and hardened agent startup against undeclared root markdown files.
- Change: replaced active UI wording around the quality checker/advice labels, and turned `/teacher/help` into a searchable TOC-based methodology guide distilled from the source-book.
- State another agent needs: branch `feature/sourcebook-agent-wiki`; restart `ai-agent`, `api`, and `web` containers after merging so health/cache keys/UI all reflect the new projection.

## [2026-05-20] docs | Agent-wiki source-book projection path

- Ask: replace the source-shaped agent-wiki generation approach with a distilled Matricás album methodology book and a prompt for turning that book into a cleaner runtime agent-wiki later.
- Change: added `agent-wiki/source-book/matricas-album-modszertani-kezikonyv.md`, `agent-wiki/source-book/agent-wiki-projection-prompt.md`, and a short source-book README; updated `agent-wiki/README.md` to mark the source-book path as canonical for the next projection and deprecate `tools/refresh-agent-wiki.ps1` for this model.
- Why: the current projection leaks old source structure and framework labels; the next agent-wiki should be concept-driven, manifest-aware, and generated only from the methodology book.
- State another agent needs: root-level runtime agent-wiki pages and `manifest.json` are not regenerated yet. Use the projection prompt when ready, then update runtime projection constants if the version changes.

## [2026-05-21] feat | AI stream first pass — snapshot extension + digest + help-request triage

Landed on branch `feature/ai-first-pass`. First substantive work in the AI stream (Section 2 of the roadmap). Plan doc: `docs/ai-first-pass-plan-2026-05-21.md`.

- Ask: thread the data the rest of the app produces (per-team reflections, help requests) into the AI advice snapshot, and deliver two concrete user-visible AI features for teachers — a cross-team digest of pending evidence on the feedback queue, and Socratic prompts attached to each open help request.
- Change:
  - **`PromptVersion`** bumped from `phase2-v1` → `phase3-v1`. The cache key includes `PromptVersion`, so existing cached runs invalidate on next call.
  - **Snapshot extension (teacher-only, instance owner)**: `BuildAdviceSnapshotAsync` now also loads `AlbumInstanceTeamReflection` rows (aliased team, text length-capped 800) and a recent window of `TeamHelpRequest` rows (open + resolved within 14 days, up to 20). Both threaded onto the JSON payload at top level: `teamReflections`, `helpRequests`. Student snapshots unchanged (byte-for-byte if `helpCount`/`reflectionCount` stay zero — only the teacher branch reaches the extra loads).
  - **Pending evidence digest target**: `POST /ai-advice/generate` now accepts `targetType='pendingEvidenceDigest'`. The snapshot for this target restricts the evidence list to actually-pending rows and expands the cap from 12 → 30 so the agent has a full "what's on the teacher's plate" picture. No new endpoint; the existing snapshot-hash cache handles dedup on the per-target key. Response persists as `AiAdvice` with `targetType='pendingEvidenceDigest'`.
  - **Help-request triage target**: `POST /ai-advice/generate` now accepts `targetType='helpRequest'` + `targetId=<helpRequestId>`. When set, the snapshot adds a `targetHelpRequest: { id, teamAlias, instanceStickerId, question, createdAt }` field so the agent knows which request to triage. Response persists with the same target shape; the agent's existing `Questions` field on `AgentAdviceItem` carries 1–N Socratic question strings.
  - **`AiTargetType`** TS union extended with `pendingEvidenceDigest` and `helpRequest`.
  - **Frontend**:
    - `AlbumStore.requestPendingEvidenceDigest()` + `pendingEvidenceDigest` computed signal that filters `teacherAdvices()` for the digest target.
    - `AlbumStore.requestHelpRequestTriage(id)` + `triageForHelpRequest(id)` lookup helper.
    - Feedback queue: the previously-stub "Mind: AI-összegzés" button now calls `requestPendingEvidenceDigest`. The page renders the digest as an `<ma-ai-card>` at the top (replacing the static "AI összegzés tanári ellenőrzéshez" placeholder); the placeholder shows only when no digest has been generated yet.
    - Each open help-request card gains an "AI tanács" ghost button alongside "Megoldva". Generated Socratic questions render as a bulleted list inside a primary-tinted box under the request.
- Why: the closure round produced two new datasources the agent could reason about, but they weren't being threaded in. The two user-facing surfaces are the natural first wins: the digest reduces the "where do I start?" feeling on the feedback queue, and the triage prompts give the teacher something concrete to ask back when a team flags a stuck moment.
- State another agent needs:
  - API + Web builds clean. No DB migrations.
  - The Python agent at `src/MatricasAlbum.Agent/app/main.py` consumes the new fields without changes — the snapshot → LLM contract is generic. If the digest or triage outputs feel too generic in real use, the right place to tune is the agent's system prompt, not the API. Out of scope for this round.
  - Cache: identical `(audience, ownerType, ownerId, targetType, targetId, targetKey, snapshotHash, promptVersion, projectionVersion)` returns the persisted run. After `PromptVersion` bump, the first call on any owner triggers a regenerate.
  - Backlog candidates: AI reflection prompts on closure (the 4th AI roadmap row), advice freshness signals, regenerate-digest toolbar that bypasses the cache, Python agent prompt tuning specifically for the new targets.

---

## [2026-05-20] feat | Closure + Export pipeline

Landed on branch `feature/closure-export`. Closes 6 connected roadmap rows: the 3 `Projektzárás` rows + the 3 export stubs scattered across `Bizonyíték-portfólió` / `Kreatív tanulási ellenőrző` / `Projektzárás`. Plan doc: `docs/closure-export-plan-2026-05-20.md`.

- Ask: turn the closure page from mocked content into real data (per-team reflections, persisted checklist), and converge the four scattered export buttons onto one print-preview-based pipeline.
- Change:
  - **Closure page — real reflections**: replaced the hardcoded `studentPrompts` / `studentAnswers` / `teacherPrompts` / `teacherAnswers` arrays with a `teamReflections` computed that surfaces one block per team from `AlbumInstanceTeamReflection.Text`. Empty-state per team ("Ez a csapat még nem írta meg a projekt-reflexióját."). Dropped the teacher reflection card entirely (data isn't captured in the model; if needed later, a small `TeacherClosureReflection` field on `AlbumInstance` is the right shape).
  - **Closure checklist persistence**: migration `20260520180000_AddAlbumInstanceClosureChecklist` adds a new `album_instance_closure_checklist_items` table with `(Id, AlbumInstanceId FK→cascade, SortOrder, Label, Done)` and a non-unique index on `AlbumInstanceId`. Backfills the 7 default items into every existing instance via the migration SQL itself. New instances get the seeds via `Program.cs` POST `/album-templates/{id}/instances` (a new `DefaultClosureChecklistItems()` helper).
  - **API**: `PATCH /api/album-instances/{instanceId}/closure-checklist/{itemId}` toggles `Done`, returns the refreshed `AlbumInstanceDetailDto`. The detail DTO gained a `ClosureChecklist` array (mirrored to `closureChecklist: ClosureChecklistItem[]` on the frontend snapshot model + an `AlbumStore.closureChecklist` signal).
  - **Convergent export pipeline**: `PrintScope` extended from `'weekly' | 'closure' | null` to `'weekly' | 'evidence' | 'quality' | 'closure' | null`. The print-preview overlay's title and per-scope page contents are now scope-aware:
    - `weekly` (existing): unchanged.
    - `evidence`: a table of all evidence rows (team / sticker / title / status / date).
    - `quality`: the existing `qualityDims` checklist rendered on its own page.
    - `closure`: per-team reflection blocks + the checklist with done states + closure stats header.
  - **Stub buttons wired**:
    - `Bizonyíték / Export` → `setPrintOpen('evidence')`
    - `Bizonyíték / Nyomtatható összegzés` → `setPrintOpen('evidence')` (same destination)
    - `Quality / Riport PDF` → `setPrintOpen('quality')`
    - `Closure / Összegzés exportálása` → `setPrintOpen('closure')`
    - Print-preview toolbar's `PDF letöltése` + `Nyomtatás` both call `window.print()`. A `@media print` stylesheet hides the overlay chrome so the browser print dialog only sees the white pages.
- Why: the closure page was the demo-iest screen in the app (4 hardcoded Q&A blocks + 7 unticking checklist items). The export buttons had been mute since the start. Both fixed with the same minimal investment: real data on the closure page, browser print as the export mechanism (no new dependencies).
- State another agent needs:
  - API + Web builds clean. New migration runs on next startup; the migration backfills the 7 default checklist items for every existing instance, so the demo album shows the same content after restart.
  - Lauder seeder unaffected.
  - The `print-preview` evidence table uses `e.submittedAt.slice(0, 10)` to avoid pulling in the Angular `DatePipe`; if a future round wants `hu-HU` formatting, the right move is to import `DatePipe`.
  - Backlog candidates: teacher-editable checklist (add/remove/reorder), CSV export codec, server-side PDF for richer fidelity, teacher closure reflection field if pilots need one.

---

## [2026-05-20] feat | Template-version upgrade for a running instance

Landed on branch `feature/instance-template-upgrade`. Closes the Phase 7 carry-over from the prior round (the big architectural item the instance-management round explicitly deferred). Plan doc: `docs/template-version-upgrade-plan-2026-05-20.md`.

- Ask: A running `AlbumInstance` is bound to one `AlbumTemplateVersionId` frozen at create time. When a teacher publishes a newer version of the source template, there was no opt-in path to rebind the running instance. Deliver that path with a transparent preview and an atomic commit, preserving in-flight evidence / progress.
- Change:
  - **Schema**: migration `20260520170000_AddInstanceStickerDeprecated` adds `Deprecated bool default false` on `instance_stickers`. Set to `true` when a template-version upgrade removed this sticker from the source template but the instance kept it to preserve evidence.
  - **Reconciliation helper**: pure C# helper `Domain/Upgrades/InstanceUpgradePlanner.ComputeUpgradePlan(instance, oldVersion, newVersion)` returns a categorized `UpgradePlan`. Two-pass match:
    1. Pair by exact `StickerVersionId` — the simple "carried" case.
    2. Pair remaining by `StickerResourceId` — same matrica, newer version → "Repointed" (evidence preserved, `StickerVersionId` updated).
    3. Remaining instance-side rows split into `RemovedNoEvidence` (hard-deleted) and `RemovedKeptForEvidence` (flagged `Deprecated`).
    4. Remaining new-version-side rows become `Added`.
    Also computes `CurrentWeekClamp`, `DurationType` change, unit count change.
  - **Preview API**: `GET /api/album-instances/{id}/upgrade-preview` — idempotent diff between the instance's bound version and the template's latest published version. Returns 404 if no template, no version, or no newer published version exists; otherwise returns the full `UpgradePlanDto` (including `isNoOp` for the case where the instance is already at the latest).
  - **Commit API**: `POST /api/album-instances/{id}/upgrade` — recomputes the plan server-side and applies inside a single transaction. Two-pass write to dodge the unique `(AlbumInstanceId, Week, SortOrder)` index: pass 1 bumps every surviving `InstanceSticker.SortOrder` into a scratch range (100_000+), pass 2 applies the real target values per case. Deprecated rows are parked at `Week = 9999` so they fall off the normal timeline. Rebinds `AlbumTemplateVersionId`, clamps `CurrentWeek`, prunes stale `WeekPlanOverrides`. 400 if no newer published version.
  - **Domain + DTO**: `InstanceSticker.Deprecated` property; `InstanceStickerDto` gets the field; `Sticker` model on the frontend gets `deprecated: boolean`.
  - **Frontend**:
    - `AlbumStore.fetchUpgradePlan()` + `commitInstanceUpgrade()`.
    - `instance-upgrade-modal` component — sections per case (Added / RemovedKept / RemovedNoEvidence / Moved / Repointed / Unchanged) with item counts, version numbers, before/after positions, and badges for DurationType / unit count / CurrentWeek changes.
    - `album-plan` view: an "Új sablonverzió érhető el" chip + `Sablonverzió átvétele` primary button surfaces only when the preview indicates a non-empty plan. The modal opens on click; the button hides again after a successful commit (preview re-fetches and the no-op case is hidden).
    - `<ma-sticker-card>` shows a "Sablonból eltávolítva" chip and dimmed style when `sticker.deprecated`.
    - `currentStickerForStudent` filters out deprecated stickers so they never become the active card; `album-plan.stickersForWeek` defensively does the same.
- Why: instance-template binding was designed to freeze for safety, but that left no upgrade path. The two-pass match (StickerVersionId then StickerResourceId) is the load-bearing decision: it keeps the simple "carried" case simple while preserving evidence in the "matrica swapped to a newer version" case that would otherwise look like delete-then-add.
- State another agent needs:
  - API + Web builds clean. New migration runs on next startup.
  - Lauder seeder unaffected (only creates).
  - Edge case to watch in real use: when a teacher swaps a matrica version on the template, the **only** way the running instance keeps evidence on that sticker is the resource-id fallback match in pass 2. The planner's logic is the contract — change it cautiously.
  - Follow-up backlog: two-way URL sync for `?evidence=` (from the prior round); partial / cherry-pick upgrades; rolling-back an upgrade.

---

## [2026-05-20] feat | Futó albumok instance management round (phases 1–5)

Landed on branch `feature/instance-management`. Closes most of the roadmap's Futó albumok section (the template-version upgrade flow stays a separate next round). Plan doc: `docs/instance-management-plan-2026-05-20.md`.

- Ask: make `AlbumInstance` first-class editable. Edit title / className / current-unit cursor, manage teams and their members, override unit titles per instance, soft-archive instances. Surface a warning when the source template was archived after the instance was minted.
- Change:
  - **API endpoints**: `PATCH /api/album-instances/{id}` (title / className / currentWeek, clamped to unit count); `PATCH /api/album-instances/{id}/archive` (toggle `ArchivedAt`); `PUT /api/album-instances/{id}/units` (replace per-instance unit-title overrides); team CRUD (`POST` / `PATCH` / `DELETE /api/album-instances/{instanceId}/teams`, plus `POST` / `DELETE .../teams/{teamId}/members`). Hard-delete a team only when no Evidence / Progress / HelpRequest / Reflection rows reference it; 409 with a `TeamDeleteBlockerDto` listing the blocker counts otherwise.
  - **DB**: migration `20260520150000_AddAlbumInstanceWeekPlan` adds `album_instance_week_plans (Id, AlbumInstanceId, WeekNumber, Title)` with a unique index on `(AlbumInstanceId, WeekNumber)` and cascade delete from `AlbumInstance`. Migration `20260520160000_AddAlbumInstanceArchivedAt` adds `AlbumInstance.ArchivedAt`.
  - **DTO reshape**: `TeamDto.Members` changed from `IReadOnlyList<string>` to `IReadOnlyList<TeamMemberDto>` (carrying member IDs so the frontend can remove a specific member). The few consumers (`team-chip`, `teams-list`, `student-team`) now map `m.name` for display; the mock data palette was rewritten with stable IDs. `AlbumInstanceDetailDto` gained `TemplateArchivedAt` + `ArchivedAt`; `AlbumInstanceListItemDto` gained `ArchivedAt`.
  - **Read path**: `MapInstanceDetailAsync` now merges per-instance unit-title overrides on top of the template version's titles via a new `MergeInstanceWeekPlans` helper. Absent rows fall back to the template; consumers see the same `WeekPlanDto` shape.
  - **Frontend**:
    - `AlbumStore.updateInstance` / `stepCurrentUnit` / `createTeam` / `updateTeam` / `deleteTeam` / `addTeamMember` / `removeTeamMember` / `replaceUnitTitles` / `toggleInstanceArchive`. All flush through `applySnapshot` so derived signals update consistently.
    - `album-plan`: inline edit card (title / className + per-unit title overrides), a unit-stepper in the page-head (`Egy {{albumUnitLabel}}gel előre/vissza` with disabled edges), archive toggle, "archivált" + "sablonterv archivált" warning chips.
    - `teams-list`: full rewrite. Create / edit / delete teams, add / remove members, color picker, open-help-request chip per team. Class subtitle now pulls from `album.className + teams.length` instead of being hardcoded.
    - `album-instances`: "Archivált is" toggle, archived count chip, archived rows are dimmed and tagged.
  - **Deep-linkable drawer state**:
    - `/teacher/instances/:id/plan?sticker=:stickerId` — two-way sync: opening / closing the sticker drawer updates the URL; refreshing the URL restores the drawer.
    - `/teacher/instances/:id/evidence?evidence=:id` and `/teacher/instances/:id/feedback?evidence=:id` — one-way (URL → store) so deep links survive a refresh. Two-way sync deferred to follow-up.
- Why: this is the "an instance is finally editable" baseline. The template-version upgrade flow (Phase 7 in the plan doc) needs this foundation to be in place before it lands.
- State another agent needs:
  - API + Web builds clean. Two new migrations run on next startup.
  - The Lauder seeder doesn't exercise any of these flows (only creates), still works end-to-end.
  - Follow-up rounds: template-version upgrade flow (`feature/instance-template-upgrade` per the plan doc); two-way sync for the evidence query param.

---

## [2026-05-20] feat | Frontend routing — URL-driven role / instance / detail IDs

Landed on branch `feature/frontend-routing`.

- Ask: replace the in-memory `page` / `studentPage` signal switch with real Angular Router so URLs are bookmarkable and deep linking works (jump straight to a template, a running album, a student page).
- Change:
  - **Route tree** in `app.routes.ts`: lazy-loaded routes under `/teacher`, `/student`, `/closure`. Hash routing kept (`#/teacher/templates/:id`). Wildcard redirect to `/teacher` for unknown paths. All feature components loaded via `loadComponent`.
  - **Shell components** (new in `layout/`):
    - `TeacherShellComponent`: topbar + teacher-sidebar + outlet. Sets `role = 'teacher'` on entry via effect. Subscribes to `NavigationEnd` to derive `store.page()` from the URL so the existing breadcrumb computed and other consumers keep working without rewriting.
    - `InstanceShellComponent`: parent route for `/teacher/instances/:instanceId/*`. Reads `:instanceId` from `paramMap` and calls `store.selectInstance(id)` so the active instance follows the URL.
    - `StudentShellComponent`: outer shell for `/student/*`. Sets `role = 'student'`. Mirrors `studentPage()` from URL. Auto-redirects `/student/home` to `/student/instances/:firstInstanceId/current` once the store has an active instance.
    - `StudentAlbumShellComponent`: replaces the old `student-album` wrapper. Renders team picker + poster + outlet, binds `:instanceId` to the store.
  - **AppComponent** stripped down to a global `<router-outlet />` + the singleton overlays (drawers, toast, print preview). Topbar / sidebar / role-aware content all live inside the shells now.
  - **Sidebars** rewritten to use `routerLink` + `routerLinkActive`. Teacher sidebar's instance-scoped items disappear when no instance is active (since their `__id__` placeholder would resolve to `undefined`). Each item exposes a precomputed `routerLink` array because Angular templates don't parse spread.
  - **Store**: `AlbumStore` now injects `Router`. `startNewTemplate`, `discardFreshTemplate`, `requestTeacherAdvice` navigate explicitly instead of calling `setPage`. `selectInstance` no longer mutates `page()` — the URL handles it.
  - **Role switcher** navigates to the role's URL home (`/teacher/instances/:id/plan` or `/student/instances/:id/current` if an instance is active, else `/teacher` or `/student/home`). The shell effect picks up the new role from the URL.
  - **Callers updated**: `album-instances` (open instance → router.navigate), `album-templates` (open template → router.navigate), `album-template-detail` (`backToList` → router.navigate; `ngOnInit` reads `:templateId` and calls `store.openAlbumTemplate(id)`), `teacher-dashboard` (entry cards become `<a routerLink>`; the two action buttons resolve to `/instances/:id/plan` and `/instances/:id/feedback`), `sticker-detail-drawer` (`closeAndReview` navigates), `student-feedback` (`goToRevision` navigates).
  - **Backwards compat**: `store.page()` and `store.studentPage()` are kept and remain in sync with the URL via the shell subscriptions, so any unfound consumers continue to work. Eventual cleanup tracked in backlog.
- Why: the in-memory page switch made the app un-bookmarkable. Hash routing was chosen for zero nginx config changes. URL-driven role + active-instance keeps the URL as the single source of truth and makes deep links first-class.
- State another agent needs:
  - Web build clean (`ng build`). Lazy-loaded route chunks are now visible in the bundle output.
  - No API changes.
  - Backlog candidate: drop `setPage` / `setStudentPage` and the `page` / `studentPage` signals once all consumers (mostly breadcrumb logic in the shells) read the URL directly. The old `student-album` component is now unused but still referenced for its SCSS by `student-album-shell`; safe to remove the .ts / .html if a future cleanup pass moves the styles.

---

## [2026-05-20] feat | DurationType + restructured plan section + sticker move controls

Landed on branch `feature/template-duration-type`.

- Ask: the hardcoded 4-week plan + free-text `Duration` were restrictive. Replace `Duration` with a constrained `DurationType` (Hét / Óra / Fázis); drop the separate "Heti vázlat" section and fold week-titles into the assigned-stickers section; per-unit add/remove. Replace fiddly per-row Week / Sort number inputs with drag-and-drop + up/down/left/right arrow buttons.
- Change:
  - **Schema**: `AlbumTemplate.DurationType` + `AlbumTemplateVersion.DurationType` (`varchar(20)` default `'het'`). Migration `20260520140000_ReplaceDurationWithDurationType` adds both columns then drops the legacy `Duration` column from both tables. Existing data backfills to `'het'`.
  - **Domain**: `DurationTypes` static class (`Week = "het"`, `Hour = "ora"`, `Phase = "fazis"`, plus `IsValid`). `LatestTemplateVersion` synthetic fallback carries the template's `DurationType`. `NormalizeDurationType` helper guarantees a valid value on every read/write path.
  - **DTOs**: `Duration` → `DurationType` on `CreateAlbumTemplateRequest`, `UpdateTemplateVersionMetadataRequest`, `AlbumTemplateListItemDto` (+ new `UnitCount`), `AlbumTemplateDetailDto`, `AlbumTemplateVersionDto`, `AlbumInstanceListItemDto` (+ `UnitCount`), `AlbumInstanceDetailDto`. The list endpoints now expose the unit count alongside the type so the frontend can render `"6 hét"` etc.
  - **Instance list endpoint** was rewritten to materialize before projection because the new `NormalizeDurationType` call inside the projection couldn't be translated by EF Core.
  - **Frontend models**: new `DurationType` union (`'het' | 'ora' | 'fazis'`) on `AlbumTemplateListItem`, `AlbumTemplateDetail`, `AlbumTemplateVersionView`, `AlbumInstanceListItem`, `AlbumMeta`. The display string `duration` (e.g. `"6 hét"`) is derived in `album-api.service.ts` by a new `formatDuration(type, count)` helper and stays on the model so the many "Subject · Grade · Duration" surfaces don't need touching.
  - **Detail page UI** (`album-template-detail`):
    - Metadata sub-grid in edit mode now has above-input labels (Tantárgy / Évfolyam / Időegység). The free-text Időtartam input is replaced by a 3-option `<select>`.
    - The standalone "Heti vázlat" section is gone. Each unit in the plan section now carries its own title input inline. Section header label adapts to the chosen DurationType ("Hetek" / "Órák" / "Fázisok").
    - Each unit has a trash button (in edit mode) to remove it; at the bottom of the section a dashed-outline "Új X hozzáadása" button appends a new unit. Both operations go through `scheduleTemplateMetadataPatch({ weekTitles })` so the auto-save debounce still applies; `addUnit` calls `ensureTemplateDraft` first so a brand-new edit lands in the draft.
    - Per-sticker number inputs are gone. Replaced by a row of arrow buttons (up/down move between units, left/right reorder within a unit) plus the existing delete button. Buttons are disabled at the edges.
  - **Drag-and-drop**: added `@angular/cdk@^19.0.0`. Each unit's sticker grid is a `cdkDropList` with `cdkDropListConnectedTo` set to every other unit's list ID so cross-unit drops work. `onStickerDropped` rebuilds the destination unit's order and patches sortOrders for affected stickers; on cross-unit moves it also renumbers the source unit so gaps don't accumulate. Disabled outside draft view (`cdkDragDisabled` / `cdkDropListDisabled`).
  - **Drawer**: the legacy `newTemplateVersion` flow's "Időtartam" text input is replaced by a DurationType `<select>` so it stops sending stale free-text.
  - **Instance / student ripple**: `AlbumStore.albumUnitLabel` getter returns the singular unit label from `album.durationType`. `album-plan` weekly head and `student-current` chip use it. Full ripple across the other ~21 surfaces showing "Hét" is left as a backlog item — seeded demo data is week-based, so the gap is invisible in practice (only visible on templates explicitly switched to Óra/Fázis).
  - **Lauder seeder**: replaces `Duration = "6 hét"` with `DurationType = "het"`; sends the new `durationType` field in the POST body.
- Why: the prior model conflated "how many units" and "what kind of unit" into one free-text string while constraining the unit count via a fixed row count. Splitting type vs. count gives real expressivity (hour-based microlessons or open-ended phase work) while per-unit add/remove removes the 4-row ceiling. Drag-drop + arrows is the standard pattern for ordering things; per-row Week/Sort number inputs were a UX rough edge.
- State another agent needs:
  - API + Web builds clean.
  - DB: new migration runs on next startup.
  - **Backlog**: rename `Week` → `UnitIndex` on the DB / DTO / model surfaces, and finish the ripple across the remaining ~21 student/instance surfaces ("Hét" → `albumUnitLabel`). Both deferred to keep this round scoped to the template-editing UX.
  - Lauder seed verified to send the new payload shape.

---

## [2026-05-20] feat | Template inline editor — Új albumterv as a page

Landed on branch `feature/template-inline-editor`.

- Ask: replace the drawer-based create/edit flow for albumtervek with an in-place edit mode on the detail page, mirroring the matrica resource flow. "Új albumterv" should open the same page in edit mode, not the wizard.
- Change:
  - **Phase A (in-place edit on existing templates)** already shipped in the prior session: `PATCH /api/album-template-versions/{versionId}` for draft metadata; `editingTemplate` signal + `enterTemplateEdit` / `exitTemplateEdit` / `scheduleTemplateMetadataPatch` (400ms debounce) on `AlbumStore`; detail page toggles between read and edit renderings (title input, sub-grid, vezérkérdés / záró produktum / közönség textareas, chip-tag dispozíciók with add/remove, per-week inline title inputs).
  - **Phase B.1 — POST creates draft v1**: `POST /api/album-templates` now stamps the initial version with `IsDraft = true`. The list endpoint returns a new `isDraftOnly` flag (true when `template.Versions.All(v => v.IsDraft)`); the instance-create drawer's `assignableTemplates` filters those out alongside archived ones. `AlbumTemplateListItemDto` + TS model + mock seed updated.
  - **Phase B.2 — DELETE for fresh drafts**: new `DELETE /api/album-templates/{id}` hard-deletes only when (a) no instances and (b) the sole version is a draft. Returns 409 otherwise, with explicit Hungarian error messages. `AlbumApiService.deleteTemplate` + `AlbumStore.discardFreshTemplate` (navigates back to the list).
  - **Phase B.3 — Új albumterv as a page**: `AlbumStore.startNewTemplate()` creates the template (with the legacy client-side defaults), routes to the detail page in edit mode. The detail page's draft banner specialises copy for fresh drafts ("Új albumterv vázlat — csak publikálás után indítható futó albumként"); the banner's `Elvetés` button is hidden for fresh drafts since "Mégse" in the header invokes the hard-delete path. `isFreshDraft(template)` = exactly one version and it's a draft.
  - **Phase B.4 — drawer template mode**: removed `openTemplateWizard()`, the drawer's `@case ('template')` chip/title/body/submit-label branches, and the submit() `mode === 'template'` arm. `WorkspaceCreateMode` keeps the literal in the union (still referenced by guard checks like `canSubmit` and `reset`) but no UI path activates it.
  - **Lauder seeder**: `tools/load-lauder-example.ps1` now POSTs `/album-templates/{id}/draft/publish` immediately after `POST /album-templates` so subsequent sticker assignments and instance creation hit a real published v1 (the assign-sticker and instance endpoints still go through `LatestTemplateVersion`, which filters drafts). Without this the seeder would attach stickers/instances to the synthetic fallback version row.
- Why: the drawer was a leftover from the prototype era; the matrica resource already moved to a page-based flow last round, so albumtervek now follow the same shape. Forcing fresh templates through the draft pattern means instance creation can never accidentally bind to an unfinished template — the front-end filter and the synthetic-fallback semantics together enforce this without extra checks.
- State another agent needs:
  - API + Web builds clean (`dotnet build` + `ng build`).
  - DB: no new migrations this round.
  - Lauder seed verified against the new flow.
  - Follow-up to consider: drop `'template'` from `WorkspaceCreateMode` union once we're confident nothing else flips it (and prune `selectedStickerVersions` / `toggleLibrarySticker` if so).

---

## [2026-05-20] feat | Albumtervek Phase 4 — sticker management with draft versioning

Landed on branch `feature/template-library-crud`. Closes the Albumtervek round.

- Ask: let the teacher add, remove, and reorder stickers on an existing template, with auto-save. Reconcile auto-save with the consistency-with-stickers versioning principle from Phase 3. The version-explosion open question was resolved as **Option B (draft version)**.
- Change:
  - **Schema**: `AlbumTemplateVersion.IsDraft` bool default false. Migration `20260520130000_AddAlbumTemplateVersionIsDraft` adds the column and a partial unique index enforcing **at most one draft per template** at the DB level (`WHERE "IsDraft" = TRUE`).
  - **API**:
    - `POST /api/album-templates/{id}/draft` — idempotent. Creates a draft cloning the latest published version (metadata + dispositions + weeks + sticker assignments) at `VersionNumber = max+1` with `IsDraft = true`. Returns the refreshed detail.
    - `POST /api/album-templates/{id}/draft/publish` — flips `IsDraft = false`, bumps `UpdatedAt`. The previously-assigned `VersionNumber` becomes the new published number.
    - `DELETE /api/album-templates/{id}/draft` — discards the draft.
    - `POST /api/album-template-versions/{versionId}/stickers` — add a sticker (week, sortOrder). 409 if the version isn't a draft.
    - `PATCH /api/album-template-versions/{versionId}/stickers/{templateStickerId}` — update week/sortOrder. Same 409 guard.
    - `DELETE /api/album-template-versions/{versionId}/stickers/{templateStickerId}` — remove. Same guard.
  - **Existing Szerkesztés guard**: `POST /api/album-templates/{id}/versions` (Phase 3's metadata-edit-creates-version flow) now returns 409 if a draft exists ("Először mentsd vagy vesd el a matricavázlatot."). Prevents conflicts on the unique (templateId, versionNumber) index.
  - **`LatestTemplateVersion`** helper filters out drafts; new `DraftTemplateVersion(template)` returns the draft if any. `MapTemplateDetailAsync` continues to expose **all** versions (including draft) on the detail DTO so the UI can render the draft banner.
  - **DTOs**: `AlbumTemplateVersionDto.IsDraft` boolean.
  - **Frontend**:
    - `AlbumTemplateVersionView.isDraft` mirrors the DTO.
    - `AlbumStore` gained `currentTemplateDraft()`, `ensureTemplateDraft(templateId)` (idempotent create), `publishTemplateDraft`, `discardTemplateDraft`, `addStickerToTemplateDraft`, `removeStickerFromTemplateDraft`, plus a debounced (400ms) `scheduleTemplateStickerPatch` that batches week/sortOrder edits per row so an auto-save burst flushes to a single PATCH.
    - **`album-template-detail` page** updates:
      - When the template has a draft, the page shows a primary-tinted **"Vázlat" banner** at the top with `Publikálás` and `Elvetés` buttons.
      - `selectedVersion` defaults to the draft if one exists (was: always latest); the version dropdown still lets the user inspect previous published versions read-only.
      - In draft view, each sticker card grows an inline edit row with `Hét` / `Sorrend` number inputs (auto-save on change) and a delete icon. The per-week `+ Matrica` button is now wired: clicking it calls `ensureTemplateDraft` (creates the draft on first interaction) and opens an embedded sticker picker scoped to that week.
      - Picker renders the Matricatár grid (non-archived stickers only) inline below the section; clicking a sticker adds it to the draft at the section's week (server picks next free sortOrder) and closes the picker.
- Why: closes the last Albumtervek roadmap row and resolves the version-explosion open question chosen as Option B.
- State another agent needs:
  - Rebuild API + web: `docker compose build api web && docker compose up -d`. New migration runs on startup.
  - One draft per template at the DB level. If a teacher tries to use Szerkesztés (metadata edit) while a draft exists, the API returns 409. UI should add a guard in a follow-up — currently the toast surfaces the error from the failed request.
  - The new sticker-management endpoints are all gated on `IsDraft = true`. Mutating a published version is impossible by API (defense in depth on top of the UI which never exposes the edit controls outside draft view).
  - The version selector dropdown shows drafts the same as any other version. Since we don't have multi-user collaboration, a teacher always sees their own draft. Multi-user filtering is a future concern.

---

## [2026-05-20] feat | Albumtervek Phase 2 — template archive toggle

Landed on branch `feature/template-library-crud`. Uses the `AlbumTemplate.ArchivedAt` column introduced by Phase 3.

- Ask: finish the planned archive behavior for Albumtervek without hard-deleting templates that may have running albums.
- Change:
  - **API**: new `PATCH /api/album-templates/{id}/archive` teacher-only toggle. It flips `ArchivedAt`, bumps `UpdatedAt`, and returns the refreshed template detail.
  - **Frontend API/store**: added `toggleTemplateArchive(id)` and mirrored the archived flag into both `activeAlbumTemplate` and the cached template list.
  - **Albumtervek list**: added "Archivált is" toggle, archived count badge, archived chip/dimmed row styling, and empty-state copy matching Matricatár.
  - **Template detail**: header shows an "Archivált" chip and the archive action toggles between `Archiválás` and `Visszaállítás`.
  - **Instance wizard**: archived templates are filtered out, so teachers cannot start a new running album from an archived template.
- Why: resolves the Template delete decision by choosing the safer archive path. Existing running albums and historical template versions remain readable.
- State another agent needs:
  - Verified: `dotnet build .\MatricasAlbum.slnx --no-restore`; `npm --prefix .\src\MatricasAlbum.Web run build`; Docker rebuild/restart with `COMPOSE_BAKE=false`; API smoke toggled the seeded template archived → restored.
  - The only remaining Albumtervek roadmap row in this round is add/remove/reorder template stickers.

## [2026-05-20] feat | Albumtervek Phase 3 — template versioning + edit flow

Landed on branch `feature/template-library-crud`. Continues the Albumtervek round after the Phase 1 detail page.

- Ask: continue the planned Albumtervek work by making template edits versioned, so existing running albums keep the template version they were created from.
- Change:
  - **Schema/domain**: added `AlbumTemplateVersion` plus version-scoped dispositions, week plans, and template stickers. `AlbumInstance` now points at `AlbumTemplateVersionId`; `ArchivedAt` is present on the template resource for the later archive UI.
  - **Migration + seed**: backfills existing template content into v1 rows and seeds the demo template through the new version tables. Old template content tables are left in place as compatibility scaffolding for this round.
  - **API**: list/detail endpoints now source template content from the latest version; create-template creates v1; create-instance snapshots the latest version; new `POST /api/album-templates/{id}/versions` creates v+1 and clones the sticker assignments.
  - **Frontend**: detail page gained a version selector; `Szerkesztés` opens the existing create drawer prefilled from the latest version; submitting creates a new template version and returns to the detail page on the new top version.
- Why: mirrors the Matricatár resource/version model for templates and unblocks safe template editing before archive UI and sticker-management phases.
- State another agent needs:
  - Rebuild API + web: `docker compose build api web && docker compose up -d`. New migration runs on startup.
  - Verified: `dotnet build .\MatricasAlbum.slnx --no-restore`; `npm --prefix .\src\MatricasAlbum.Web run build`; Docker rebuild/restart with `COMPOSE_BAKE=false`; API smoke confirmed the seeded template returns v1 with 4 stickers.
  - Archive toggle UI/API and add/remove/reorder template stickers are still pending Phases 2 and 4.

## [2026-05-20] feat | Albumtervek Phase 1 — template detail page

Landed on branch `feature/template-library-crud`. Opens the Albumtervek roadmap round.

- Ask: implement the safe frontend-only first slice from `docs/template-library-plan-2026-05-20.md`: navigable albumterv detail page, no backend/schema changes yet.
- Change:
  - **Frontend API/model**: added `AlbumTemplateDetail` and `TemplateStickerView` models plus `AlbumApi.getAlbumTemplate(id)` mapping the existing `GET /api/album-templates/{id}` response.
  - **`AlbumStore`**: added `activeAlbumTemplate`, `albumTemplateLoading`, `openAlbumTemplate(id)`, `closeAlbumTemplate()`, and `openStickerResourceReadOnly(id)`. Normal Matricatár opens explicitly reset the drawer to editable mode.
  - **Albumtervek list**: cards are now navigable buttons. The inline `Kijelölés` button moved out of the card.
  - **New detail page**: `album-template-detail` shows header actions, metadata cards, dispositions, week outline, and assigned stickers grouped by week in Matricatár-style cards. Header `Kijelölés` still works; `Szerkesztés`, `Archiválás`, and `+ Matrica` show "hamarosan" toasts for later phases.
  - **Sticker resource drawer**: new `readOnly` input hides Archive and `Új verzió létrehozása` when a sticker is opened from the template detail page. Matricatár opens still show the full footer.
- Why: closes the read-only template-detail foundation before archive/versioning/sticker-management changes.
- State another agent needs:
  - Web container rebuild only: `docker compose build web && docker compose up -d web`.
  - No API, DB, agent, or architecture-doc change.

## [2026-05-20] feat | Matricatár Phase 3 — new-version creation flow

Landed on branch `feature/sticker-library-crud`. Closes the last open Matricatár roadmap row.

- Ask: let teachers edit a sticker by creating a new version (existing template / instance assignments keep pointing at the prior version). Backend endpoint `POST /api/stickers/{id}/versions` already existed — the UI work was making the wizard reusable.
- Change:
  - **API service**: typed `createStickerVersion(parentResourceId, payload)` against the existing endpoint; returns the freshly-updated `StickerResourceDetail`.
  - **`AlbumStore`**: new `WorkspaceCreateMode = 'newVersion'` variant; new `newVersionPrefill = signal<NewVersionPrefill | null>(null)` carrying `{ parentResourceId, parentResourceTitle, latestVersion }`. New methods:
    - `openStickerWizardForNewVersion(detail)` — sets mode + prefill, opens wizard, closes the detail drawer so the form gets full attention.
    - `createStickerVersion(parentId, payload)` — calls the API, refreshes the library list (to pick up the new latest version number), closes the wizard, **reopens the detail drawer on the new top version**, fires a `Új verzió létrejött` toast.
  - **`album-create-drawer`**:
    - New `effect()` that prefills the sticker form fields (title, phase, short, instruction, evidence type) whenever `newVersionPrefill` is set.
    - `canSubmit` and `reset` treat `'newVersion'` like `'sticker'` (title-required validation; clear fields on success).
    - New `submitNewVersion()` builds the full `CreateStickerPayload` from the form **plus the parent's non-editable fields** (`teacherSteps`, `studentChoice`, `expectedProduct`, `reflectionPrompt`, `bPlan`, `lowResource`) so they don't silently regress.
    - Template: new `@case ('newVersion')` clones the sticker form. Header shows `Új verzió létrehozása` with a subtitle pointing at the parent + parent's version number. Body has a short hint explaining the inheritance rule. Footer button reads `Új verzió mentése`.
  - **`sticker-resource-detail-drawer`**: footer's `Új verzió létrehozása` button (was a "Hamarosan" toast in Phase 1) now calls `store.openStickerWizardForNewVersion(detail)`.
- Why: closes the Matricatár "Sticker edit" roadmap row. All four Matricatár items are now 🟢.
- State another agent needs:
  - Web container rebuild: `docker compose build web && docker compose up -d web`. No API, DB, agent change.
  - The new-version form intentionally only edits 5 fields (title, phase, short, instruction, evidence type). Other fields inherit from the parent — see `submitNewVersion`. If future demand needs all fields editable, expand the create-drawer form for both `sticker` and `newVersion` simultaneously rather than diverging.
  - After save the detail drawer reopens on the new top version. The version history list reflects the bump automatically because the drawer reads `r.versions` (server-sorted descending).

---

## [2026-05-20] feat | Matricatár Phase 2 — sticker archive flag

Landed on branch `feature/sticker-library-crud`.

- Ask: let teachers archive (hide from default library view + exclude from template-create wizard) a sticker resource without breaking existing assignments. Hard delete is unsafe because of `OnDelete(Restrict)` FK from `AlbumTemplateSticker` and `InstanceSticker`.
- Change:
  - **Schema**: new `StickerResource.ArchivedAt: DateTimeOffset?` column. Migration `20260519170000_AddStickerResourceArchivedAt` (idempotent SQL).
  - **API**: new endpoint `PATCH /api/stickers/{id}/archive` — teacher-only toggle. Sets `ArchivedAt` to `now` if currently null, clears it otherwise; bumps `UpdatedAt`. Returns the updated `StickerResourceDetailDto`. The list endpoint `GET /api/stickers` returns the field on every item; `GET /api/stickers/{id}` also exposes it.
  - **DTOs**: `StickerResourceListItemDto` and `StickerResourceDetailDto` both gained nullable `ArchivedAt`.
  - **Frontend**:
    - Model + API service: `StickerLibraryItem.archivedAt` and `StickerResourceDetail.archivedAt` threaded through.
    - `AlbumStore.toggleStickerArchive(id)` calls the API; updates both the active drawer's `activeStickerResource` and the cached `stickerLibrary` list (no full refetch). Toast indicates direction.
    - `sticker-library` page: header gains an "Archivált is" toggle (with a count badge); archived cards render dimmed with an extra "Archivált" chip; empty-state copy adapts when only archived rows exist and the toggle is off.
    - `sticker-resource-detail-drawer`: header shows "Archivált" badge when set; footer button toggles between "Archiválás" and "Visszaállítás" (icons archive / unarchive).
    - `album-create-drawer` (template wizard): new `assignableStickers` computed filters out archived stickers from both the chip count and the picker checkboxes — archived stickers cannot be added to a new template. Existing template assignments to a sticker that later gets archived continue to work (FK Restrict is still in play).
- Why: closes the "Sticker delete / archive" roadmap row. Templates that reference archived stickers keep working; only new template authoring excludes them.
- State another agent needs:
  - Rebuild API + web: `docker compose build api web && docker compose up -d`. New migration runs on startup.
  - Reset endpoint does not need to wipe anything new — `ArchivedAt` defaults to null on a fresh seed.
  - Old AI advice / instance-sticker rows are not affected by archiving.
  - Phase 3 (new-version creation flow) still pending; the "Új verzió létrehozása" drawer button still shows a "Hamarosan" toast.

---

## [2026-05-19] feat | Matricatár Phase 1 — sticker detail drawer + version history

Landed on branch `feature/sticker-library-crud`.

- Ask: Matricatár cards were static `<article>` elements with no click handler — no way to see a sticker's full content or its version history without dropping into the create-template flow.
- Change:
  - **API service**: typed `getStickerResource(id)` method against the existing `GET /api/stickers/{id}` endpoint; added `StickerResourceDetailDto` + `StickerVersionDto` wire types and `toStickerResourceDetail` / `toStickerVersionView` mappers.
  - **Frontend model**: new `StickerVersionView` + `StickerResourceDetail` interfaces.
  - **`AlbumStore`**: new `activeStickerResource` signal + `stickerResourceLoading` flag + `openStickerResource(id)` / `closeStickerResource()` methods. Failure path raises a toast.
  - **New `sticker-resource-detail-drawer`** with a two-column layout: left = full content of the selected version (instruction, teacher steps, döntési pont, várható produktum, evidence type, reflektív kérdés, B terv, low resource); right = clickable version history pills (most recent on top, "Legutóbbi" chip on the current one). Drawer header shows phase + version chip + title + short. Footer carries **"Archiválás"** and **"Új verzió létrehozása"** buttons that currently show a "Hamarosan" toast (Phases 2 and 3 wire them).
  - **`sticker-library`** cards became clickable `<button>` elements with focus-visible styling and hover/box-shadow. Open via `store.openStickerResource(sticker.id)`.
  - **App shell**: `<ma-sticker-resource-detail-drawer />` mounted next to the existing drawers.
- Why: closes the "Sticker detail view" + "Version history UI" roadmap rows. Lays groundwork for the Phase 2 (archive) and Phase 3 (new version) actions, which only need to wire the footer buttons now that the drawer scaffold + store integration exist.
- State another agent needs:
  - Rebuild only the `web` container: `docker compose build web && docker compose up -d web`.
  - No API or DB change.
  - The detail drawer reads from the live `GET /api/stickers/{id}` endpoint each time a card is clicked — there's no caching across opens, but the load is light. If the library grows, consider memoizing.
  - The drawer's selected-version state lives in the component (signal), not the store — it resets to the latest version on each open via an `effect`.

---

## [2026-05-19] feat | Műhely cleanup — first roadmap items shipped

Three items off the Műhely row in `roadmap.md`:

- **Removed stub "Diák-nézet előnézet" button** from `album-plan.component.html`. The existing role-switcher in the topbar already lets a teacher preview the album as a student — the stub button was redundant and inactive.
- **Wired the "Pedagógiai súgó" sidebar button to a placeholder page**. `TeacherPage` type now includes `'help'`. New `features/teacher-help` component renders a "Készül" card with a short description of what the page will eventually carry (alapfogalmak, ajánlott munkamenetek, Kreatív tanulás kapcsolódás). App shell `@switch` and breadcrumbs (`Műhely › Pedagógiai súgó`) updated; the sidebar button is now a real nav control with active-class binding.
- **Extracted shared instance-progress helper**. `shared/util/instance-progress.util.ts` exports `instanceProgressPercent(instance)`. Both `teacher-dashboard` and `album-instances` now call it instead of holding their own copy of `Number.parseInt(duration) / currentWeek` math.

Roadmap rows marked 🟢. No DB or API changes. Only the `web` container needs rebuilding (`docker compose build web && docker compose up -d web`).

State another agent needs:
- The Pedagógiai súgó page is intentionally a placeholder. The next pass should decide what content actually goes there (curated knowledge base, pointer to discovery wiki, in-app tutorial — see roadmap section 1 Műhely row for the open question).
- `instanceProgressPercent` assumes `duration` parses as a leading integer (e.g. "6 hét" → 6), falling back to 4. Same behavior as before the extraction.

---

## [2026-05-19] docs | Roadmap living document established

- Ask: persistent planning surface for "what to improve next" with three streams (business completeness, AI, UX) and a way to track progress without overloading `LOG.md` or `backlog.md`.
- Change: new `roadmap.md` at the project root.
  - Section 1 — Business functionality completeness — populated from a full audit of teacher-side menu items (`teacher-dashboard`, `sticker-library`, `album-templates`, `album-instances`, `album-plan`, `stickers-list`, `teams-list`, `evidence-portfolio`, `feedback-queue`, `quality-panel`, `differentiation`, `closure`, `settings`) and drawer coverage. Surfaces CRUD gaps (no edit/delete on stickers, templates, instances, teams), stub buttons (Frissítések publikálása, Diák-nézet előnézet, Duplikálás, Szerkesztés, Szűrés, Testreszabás, Export, Riport PDF, Mind: AI-összegzés, Összegzés exportálása), and the entirely-dead Pedagógiai súgó sidebar button.
  - Section 2 — AI improvements — seed candidates (snapshot enrichment with Phase C/D state, per-team Socratic verification, cross-team AI summary, draft-feedback quality tune, closure synthesis, help-request triage, advice freshness, agent-wiki coverage audit).
  - Section 3 — UX improvements — seed candidates (dashboard "next action" surfacing, stub-button dead-end fix, locked-sticker week labels, drawer mode-switch verification, filter pill clutter, breadcrumb overflow).
  - Status legend ⬜🟡🟢❓💤🗑 and a decision log at the bottom.
- Why: the three companion files now have distinct roles — `LOG.md` = chronological history of what shipped, `backlog.md` = deferred work with trigger conditions, `roadmap.md` = planned-but-unshipped work being actively scoped.
- State another agent needs:
  - When picking up an item: move its status to 🟡, work, then on landing add a normal `LOG.md` entry and mark 🟢 in the roadmap.
  - When explicitly deferring: move the item to `backlog.md` with a trigger condition; mark 💤 with a pointer in the roadmap.
  - Several items still need 🟢/❓ decisions — see the section-1 rows tagged ❓ and the "Open questions" lists in section 2 and 3.

---

## [2026-05-19] feat | Phase D — Segítség page + standalone TeamHelpRequest signal (teacher surfacing)

Landed on branch `feature/student-view-pages`.

- Ask: the Phase 3 `Evidence.HelpRequested` flag only works when a team has something to submit. Students who are stuck before any submission need a standalone help channel.
- Change:
  - **Schema**: new table `team_help_requests` keyed on `(AlbumInstanceId, TeamId)` with optional `InstanceStickerId`, free-text `Question`, `CreatedAt`, nullable `ResolvedAt`. Migration `20260519160000_AddTeamHelpRequests`.
  - **Endpoints**:
    - `POST /api/help-requests { albumInstanceId, teamId, instanceStickerId?, question }` — student-only; validates team+sticker belong to the instance.
    - `PATCH /api/help-requests/{id}/resolve` — teacher-only **toggle**: flips `ResolvedAt` between `now` and `null` (no response text required, per the agreed lifecycle).
  - **DTOs**: `TeamHelpRequestDto`, `CreateTeamHelpRequest`. `AlbumInstanceDetailDto.HelpRequests` carries the per-instance list sorted by `CreatedAt desc`.
  - **DemoSeeder.ResetAsync**: wipes `team_help_requests` before reseed.
  - **Frontend**:
    - `TeamHelpRequest` model. `AlbumStore` loads `helpRequests` from snapshot and exposes `helpRequestsForTeam`, `submitHelpRequest(question, stickerId?)`, `toggleHelpRequestResolved(id)`.
    - **`student-help` page** now functional: composer (with optional per-sticker target dropdown) + history list with open/resolved chips + static project vocabulary section (matrica, vezérkérdés, evidence, reflexió, csapathaladás).
    - **Teacher `feedback-queue`** gets a top "Nyitott segítségkérések" section above the evidence cards: orange-highlighted card listing each open help request with team name, question, optional sticker label, and a "Megoldva" button that calls the toggle endpoint.
- Why: closes the backlog entry *"Standalone 'help needed' signal independent of evidence submission"*. Students can now ask for help without first submitting evidence; teachers see and resolve those requests next to the regular feedback queue.
- State another agent needs:
  - Rebuild API + web: `docker compose build api web && docker compose up -d`.
  - New migration runs on startup. Reset endpoint covers the new table.
  - Teacher resolve is a true toggle; clicking again flips a resolved request back to open. UI label changes to reflect.
  - Backlog updates: "Standalone help signal" resolved (removed from backlog); "Final reflection submission → reflektalt" resolved by Phase C (removed); a new follow-up *Help-request teacher response text* was added — when teachers want a written response on the record, not just a toggle.

---

## [2026-05-19] feat | Phase C — Reflexió page (per-sticker + project-level)

Landed on branch `feature/student-view-pages`.

- Ask: surface and capture the team's meta-learning. Until now the `reflektalt` state on `InstanceStickerTeamProgress` was a target with no UI flow.
- Change:
  - **Schema**:
    - New columns on `instance_sticker_team_progress`: `Reflection text NULL`, `ReflectedAt timestamptz NULL`.
    - New table `album_instance_team_reflections` (unique on `(AlbumInstanceId, TeamId)`) for project-level reflections.
    - Migration `20260519150000_AddTeamReflections` (idempotent SQL).
  - **Endpoints**:
    - `POST /api/instance-stickers/{stickerId}/teams/{teamId}/reflection { text }` — upserts `Reflection` + `ReflectedAt` on the progress row, transitions state from `elkeszult` (or `reflektalt`) to `reflektalt`. Rejects if the team's progress state isn't a closed one.
    - `POST /api/album-instances/{instanceId}/teams/{teamId}/project-reflection { text }` — upserts the per-team project-level reflection. Both endpoints student-role only.
  - **DTOs**: `TeamStickerProgressDto` gains `reflection`, `reflectedAt`; new `AlbumInstanceTeamReflectionDto`; `AlbumInstanceDetailDto.TeamReflections` carries the flat list.
  - **DemoSeeder.ResetAsync**: now wipes `AlbumInstanceTeamReflections` before reseeding.
  - **Frontend**:
    - `TeamStickerProgress` model gains `reflection`/`reflectedAt`. New `AlbumInstanceTeamReflection` interface.
    - `AlbumStore`: `teamReflections` signal populated from snapshot; `projectReflectionForTeam(teamId)`, `saveStickerReflection(stickerId, text)`, `saveProjectReflection(text)`.
    - **`student-reflection` page** now actually does something: header card with team's reflected-ratio chip; per-closed-sticker reflection cards driven by the sticker's `reflection` prompt (composer for unreflected, read-only display with edit button for reflected); project-level reflection card with three vezérkérdés prompts + composer/edit.
- Why: closes the pedagogical gap flagged in `wiki/koncepciok/projekterettsegi.md` — *"Reflektív: nem csak az számít, mi készült el, hanem az is, hogyan változott a tanulói gondolkodás."* Resolves the backlog entry "Final reflection submission → reflektalt transition".
- State another agent needs:
  - Rebuild API + web: `docker compose build api web && docker compose up -d`.
  - New migration runs on startup. After upgrade `Invoke-RestMethod -Method Post -Uri 'http://localhost:5080/api/demo-maintenance/reset'` to seed clean.
  - The Reflexió page only shows stickers in `elkeszult` / `reflektalt`. Seeded demo has `Observation: reflektalt` and `Perspective: elkeszult` for all four teams — so right after a reset, every team will see those two as candidates to reflect on, but their `reflection` column is null (seeder doesn't pre-populate text).
  - `backlog.md` entry "Final reflection submission → reflektalt transition" can be marked resolved when this branch merges.
  - Phase D (Segítség) remains pending.

---

## [2026-05-19] feat | Phase B — Csapatunk progress map + Bizonyítékaink portfolio + Visszajelzések unread state

Landed on branch `feature/student-view-pages`.

- Ask: Phase A's v0 versions of Csapatunk / Bizonyítékaink / Visszajelzések were placeholder content. Phase B fills them with the planned UX.
- Change:
  - **API + DB**: new column `Evidence.SeenByTeamAt` (nullable timestamp) + migration `20260519140000_AddEvidenceSeenByTeamAt`. New endpoint `PATCH /api/evidence/{id}/seen` is idempotent — sets the timestamp to UTC now if currently null. Demo-auth requires the student role. `EvidenceDto` exposes the field.
  - **Frontend `AlbumStore`**: `markEvidenceSeen(evidenceId)` optimistically flips local state and calls the new endpoint; rolls back on failure.
  - **Csapatunk** (`student-team`): replaced the done/upcoming dual-list with a single **progress map** grouped by week. Five-chip stats strip up top ("X matrica összesen / lezárt / folyamatban / még nem indult / később nyílik"). Each row shows phase chip + sticker title + short + the team's progress state pill, clickable to open the sticker detail drawer.
  - **Bizonyítékaink** (`student-evidence`): single chronological list of all the team's evidence with three filter rows — status (`Mind` / `Visszajelzésre vár` / `Javítás kérve` / `Lezárt`), type (`Mind` / `Fotó` / `Mérés` / `Jegyzet` / `Prezentáció`), and a `Csak segítségkérés` toggle. Each row shows type + status chips, help-request chip when set, and a clamped feedback excerpt when present. Visible count shown as `X / Y`.
  - **Visszajelzések** (`student-feedback`): unread state derived from `Evidence.SeenByTeamAt`; counter chip up top ("N új"); each row shows a `Új` chip when unread; clicking a row marks it seen via the store. Revision rows (`progress.state === 'javitas'`) show a "Új beküldés ehhez a matricához" button that jumps to Aktuális matrica.
- Why: closes the structural carve-out from Phase A with the real student-facing functionality.
- State another agent needs:
  - Rebuild API + web containers: `docker compose build api web && docker compose up -d`.
  - Run the new migration (auto on startup). After upgrade, optionally reset: `Invoke-RestMethod -Method Post -Uri 'http://localhost:5080/api/demo-maintenance/reset'`. The seeded evidence rows have `SeenByTeamAt = null`, so the Visszajelzések page will show every feedbacked seed row as **unread** until the student clicks each one. That's the intended behavior, but operators may want to know.
  - The mark-seen endpoint is student-role only (matches the per-team semantics — teachers don't toggle this).
  - Phase C (Reflexió) and Phase D (Segítség) still pending on this branch.

---

## [2026-05-19] feat | Phase A — Diák nézet menu items become real pages (routing skeleton)

Landed on branch `feature/student-view-pages` (off main after merge of `feature/student-view-team-state`).

- Ask: every student-sidebar item (Aktuális matrica, Csapatunk, Bizonyítékaink, Visszajelzések, Reflexió, Segítség) toggled the `studentPage` signal but the app shell rendered the same monolithic `<ma-student-album/>` for every page. Phase A makes navigation real.
- Change:
  - **`StudentPage` type** in `album.store.ts` extended with `'help'` (was missing; the Segítség button at the bottom of the sidebar wasn't wired to a page at all).
  - **Refactored `student-album.component`** into a **shell** that renders the team picker + album poster + a `@switch (store.studentPage())` over six inner page components.
  - **Six new feature components** under `src/app/features/`:
    - `student-current` — owns the active sticker card + evidence form (placeholder per `evidenceType`) + AI Socratic card. Default page.
    - `student-team` — team identity card (name, focus, members) + "Megszerzett matricák" + "Hátralévő matricák".
    - `student-evidence` — pending evidence list + team history list combined.
    - `student-feedback` — team history list filtered to entries with non-empty `teacherFeedback`.
    - `student-reflection` — placeholder "Készül" card (Phase C fills).
    - `student-help` — placeholder "Készül" card (Phase D fills).
  - **Sidebar** now renders the Segítség button as a real navigation control (`(click)="store.setStudentPage('help')"`, active-class bound), and the identity card reads `store.selectedStudentTeam()` instead of hardcoded `teams[0]`.
  - **Breadcrumbs** for student role now show three crumbs: `Diák nézet › <album title> › <page label>`. Page-label table covers all six pages.
- Why: pure structural prerequisite for Phase B / C / D. No new functionality, no regressions — existing sections are distributed across pages rather than packed into a single scroll. Each new component owns a focused responsibility.
- State another agent needs:
  - Rebuild only the `web` container: `docker compose build web && docker compose up -d web`.
  - All page components share the existing `student-album.component.scss` via `styleUrl: '../student-album/student-album.component.scss'`. If a page grows its own styles, give it a sibling `.scss` file under its own feature folder.
  - The team picker stays in the shell, visible on every page. The album poster also stays in the shell — both are global to the student view.
  - No API, agent, or DB change. Demo data and reset behavior unchanged.
  - Phases B / C / D follow on the same feature branch and replace the placeholder/v0 content with the planned features (team progress map, filtered evidence portfolio, persisted unread state, reflection state machine, help-request channel).

---

## [2026-05-19] docs | Refresh architecture doc + forward-port load-lauder script

- Ask: bring `docs/architecture.md` (+ HTML snapshot) in line with the three Phase commits, and update `tools/load-lauder-example.ps1` for the changed evidence-submit response shape.
- Change:
  - `docs/architecture.md`: introduced `InstanceStickerTeamProgress` and the `tervezett | aktiv` lifecycle vs per-team submission split in the architecture summary. Added the entity, its FKs, and an updated `EVIDENCE` shape (with `HelpRequested`) to the ER diagram. New "Per-Team Submission State Machine" section with a Mermaid `stateDiagram-v2` and the student banner mapping table. Rewrote the "Evidence And Feedback" sequence so it shows the upsert of `InstanceStickerTeamProgress`, clearing of `HelpRequested` on feedback save, and the `{ evidence, progress }` response. Updated the public API table (POST `/evidence` and POST `/evidence/{id}/feedback` carry the new response shape; PATCH `/instance-stickers/{id}/state` is lifecycle-only). Expanded "Versioning And Ownership Rules" and "Frontend Architecture" rules to cover team picker, role-aware drawers, help signal, and team history panel.
  - `docs/architecture.html`: regenerated via `docs/render-architecture-html.ps1` from the updated markdown.
  - `tools/load-lauder-example.ps1`: the script's evidence-submit loop now reads `$submission.evidence` and `$submission.progress.state` from the new `{ evidence, progress }` response. The body carries `helpRequested` (defaults to `$false`). UTF-8 BOM + UTF-8 byte body remain in place from the prior encoding fix. Currently the dataset has `Evidence = @()` so the loop is dormant, but the script is forward-safe for future entries.
- Why: keep the docs honest about Phase 1–3 changes; prevent the next reuse of the Lauder loader from silently breaking on the new response shape.
- State another agent needs:
  - `docs/architecture.html` is a regenerated snapshot. Do not edit by hand. Re-run `docs/render-architecture-html.ps1` whenever `architecture.md` changes.
  - Lauder script preserves the UTF-8-with-BOM encoding required by Windows PowerShell 5.1. Do not re-save without the BOM (status bar in VS Code must read "UTF-8 with BOM").

---

## [2026-05-19] feat | Phase 3 of Diák nézet rework — form ergonomics + help signal + AI clear-on-switch

Landed on branch `feature/student-view-team-state`. Plan: `docs/student-view-plan-2026-05-18.html`.

- Ask: evidence form pre-filled with mikroklíma demo strings; `askTeacher()` slammed hardcoded text into the help field; no structured help signal reached the teacher's queue; student AI Socratic advice persisted across team switches.
- Change:
  - **Evidence form defaults emptied**: removed hardcoded mikroklíma title/description/help/reflection strings from `student-album.component.ts`. The form now opens empty. Per-field placeholders are driven by the active sticker's `evidenceType` via a new `placeholdersFor()` helper (foto / meres / jegyzet / prezentacio variants + a default). `helpRequest` and `reflection` are now optional (required validators dropped).
  - **`Evidence.HelpRequested` boolean**: new column with EF migration `20260519130000_AddEvidenceHelpRequested` (default `false`, idempotent SQL). Threaded through:
    - `EvidenceDto` exposes it.
    - `CreateEvidenceRequest` accepts it.
    - `POST /api/evidence` writes it.
    - `POST /api/evidence/{id}/feedback` clears it (`HelpRequested = false`) on save — the agreed clear-on-save semantics.
  - **Student form gets a "Segítséget kérek a tanártól ehhez a beküldéshez" checkbox**. `askTeacher()` no longer auto-writes text into `helpRequest`; it just opens the form and pre-checks the new box. The toast changed to match.
  - **Teacher feedback queue**:
    - Every pending evidence card now shows a "Segítség kérve" danger chip and an orange border highlight when `helpRequested` is true.
    - Subtitle now reports both the pending count and the help-request count.
    - A "Csak segítségkérések" filter toggle in the header filters the list; disabled when no help requests exist (and not currently filtering).
    - Feedback drawer header also surfaces the chip when the teacher opens an evidence with a help request.
  - **AI Socratic clear-on-switch**: `AlbumStore.setStudentTeam` now clears `studentAdvices` to `[]` when the team changes. The user clicks "Kérdések frissítése" to regenerate. Snapshot already carries per-team progress from Phase 1.
  - **Mock data**: `INITIAL_EVIDENCE` entries got `helpRequested: false` so the offline mock fallback still type-checks.
- Why: removes a class of demo-leakage UX bugs (everyone's first submission inherited mikroklíma text), gives the teacher a clean structured handle on which submissions are blocked, and stops the AI card from showing stale Socratic questions for the wrong team.
- State another agent needs:
  - Rebuild API + web containers: `docker compose build api web && docker compose up -d`.
  - Run the new migration on existing dev DBs (auto-runs on startup via `MigrateAsync`). After upgrade, `POST /api/demo-maintenance/reset` to confirm seed integrity — seeded evidence keeps `helpRequested = false`.
  - **API shape change**: `EvidenceDto.HelpRequested` and `CreateEvidenceRequest.HelpRequested` are new required fields. Loader scripts / other clients posting evidence need to send `helpRequested: false` (or true) explicitly. Lauder loader script already sends optional fields; we'd accept `false` as the missing default.
  - Validators on the form's optional `helpRequest` / `reflection` text fields were dropped. If a future flow needs them required, restore via `Validators.required` per-field.

---

## [2026-05-19] feat | Phase 2 of Diák nézet rework — student-appropriate drawers + team history

Landed on branch `feature/student-view-team-state`. Plan: `docs/student-view-plan-2026-05-18.html`.

- Ask: pending evidence row in Diák nézet was opening the teacher's feedback-editor drawer; sticker detail drawer leaked teacher-only content (TeacherSteps, B terv, Erőforrástakarékos változat, AI jelzések, Differenciálás) to the student; no per-team history of past evidence with feedback was visible.
- Change:
  - **`FeedbackDrawerComponent`**: gained a `mode: 'teacher' | 'student'` input. In `student` mode the AI summary card, rubric reminder, feedback textarea, and next-step choice cards are hidden; a read-only "Tanári visszajelzés" card is shown if `evidence.teacherFeedback` is present; footer becomes a single "Bezárás" button. Header status chip now derives from `teamProgress` (or evidence.status as fallback) — labels: "Visszajelzésre vár", "Javítás kérve", "Lezárt", "Lezárt, reflektálva".
  - **App shell**: `<ma-feedback-drawer [mode]="store.role() === 'student' ? 'student' : 'teacher'" />` — single drawer instance, role-driven.
  - **`StickerDetailDrawerComponent`**: new `isStudent` computed; in student role the tabs row is hidden (single pedagogy view), `Tanári facilitáció` / `B terv` / `Erőforrástakarékos változat` are hidden, footer becomes "Bezárás" only. A new "Csapatunk állapota" card at the top shows the team's progress state for this sticker and (when set) a "Beküldés megnyitása" button that closes the sticker drawer and opens the latest evidence in student-mode feedback drawer.
  - **Team history panel** in `student-album.component.html`: new section "Csapatunk eddigi munkája" appears between the AI card and "Megszerzett matricák" when the selected team has any evidence rows with non-empty `teacherFeedback`. Rows show title + sticker + teacher feedback excerpt (clamped to 3 lines) + status chip; clicking opens the evidence in the student-mode drawer.
  - **`sticker-card.component.scss`**: rolled in the chip-strip wrap fix from the earlier UX note — `.row-between, .row` inside `.sticker` get `flex-wrap: wrap; row-gap: 6px` so the aggregate chip + state pill no longer overflow narrow cards in the album-plan grid.
  - **`backlog.md`**: created at project root. First entries: (1) split `feedback-drawer` into separate `StudentEvidenceDrawer` + `TeacherEvidenceDrawer` once mode-gated component grows past ~150 lines, (2) standalone "help needed" signal independent of evidence submission, (3) final reflection submission → `reflektalt` transition, (4) locked sticker week labels, (5) team identity strip. Each entry includes its trigger condition for "now is the time."
- Why: makes Diák nézet self-consistent — no teacher-only controls leak into the student-facing surface, and the team's prior feedback loop becomes visible without leaving the album view.
- State another agent needs:
  - Rebuild only the `web` container: `docker compose build web && docker compose up -d web`.
  - No API / DB / agent changes. Demo data and reset behavior unchanged from Phase 1.
  - The team history panel filters by `teacherFeedback` being present, not by progress state. If a team has progress=`elkeszult` but no `teacherFeedback` (shouldn't happen in normal flow, but the seeded synthetic state for weeks 1–2 on Stones/Clouds/Water does this), those items won't appear in the history. Acceptable — only "real" closed loops surface.
  - Phase 3 (form ergonomics + help-needed flag + AI snapshot enrichment) is the next planned commit on the same branch.

---

## [2026-05-19] feat | Phase 1 of Diák nézet rework — per-team progress state

Landed on branch `feature/student-view-team-state`. Plan: `docs/student-view-plan-2026-05-18.html`.

- Ask: per-team submission progress modeled on the API/DB so the student view no longer shows "Beküldtétek" for everyone once a single team submits.
- Change:
  - **Domain + DB**: new `InstanceStickerTeamProgress` entity ((`InstanceStickerId`, `TeamId`) unique, FK cascades from both parents). State values: `varakozik | javitas | elkeszult | reflektalt` (`TeamProgressStates` in `DomainValues.cs`). New migration `20260519120000_AddInstanceStickerTeamProgress` runs on the existing `matricas_album_v3` schema.
  - **API endpoints**:
    - `POST /api/evidence` upserts a progress row to `varakozik` (was: setting `InstanceSticker.State = "varakozik"`). Returns `EvidenceSubmissionDto { evidence, progress }` (breaking shape change — internal API only).
    - `POST /api/evidence/{id}/feedback` upserts the progress row to `javitas` or `elkeszult` based on `nextStep`. Same `EvidenceSubmissionDto` response.
    - `InstanceSticker.State` is now lifecycle-only — endpoints stop touching it for submission state.
  - **Instance detail DTO**: gains `teamProgress: TeamStickerProgressDto[]` (flat list of `{ instanceStickerId, teamId, state, latestEvidenceId, updatedAt }`).
  - **Advice snapshot**: each sticker now carries `TeamProgressCounts` (by state) and `SelectedTeamState` so the AI agent can see per-team state without needing a separate snapshot.
  - **DemoSeeder**: lifecycle states for seeded stickers normalized to `tervezett | aktiv`. New `SeedTeamProgress` writes a coherent multi-team story — weeks 1–2 closed for all four teams, week 3 (measurement) has Shade/Stones/Clouds in `varakozik` and Water with no progress row (= not started); week 4 untouched. `ResetAsync` wipes the new table before reseed.
  - **Frontend `AlbumStore`**: new `teamProgress = signal<TeamStickerProgress[]>([])` populated from snapshot. Added `progressFor(stickerId, teamId)`, `currentStudentProgress`, `upsertTeamProgress`. `currentStickerForStudent` now considers the selected team's progress. `submitEvidence` / `submitFeedback` consume `{ evidence, progress }` and stop pushing fake state into `Sticker.state`.
  - **Student view**: banner reads `currentStudentProgress` (not `sticker.state`); `done` filters by the team's progress; submit/edit buttons gated on the team's progress state.
  - **Teacher view**: `ma-sticker-card` gained `[showProgressAggregate]` input — when true, renders an aggregate chip ("X/N beküldte" / "X/N javít" / "N/N kész" / "0/N csapat") computed from the store's `teamProgress`. Flag flipped on in album-plan.
- Why: today's data model conflated lifecycle and submission. With the split, the same sticker can correctly show different banners per team, and the teacher dashboard can read an aggregate at a glance.
- State another agent needs:
  - **Schema upgrade**: existing dev DBs need the new migration. Either run with EF auto-migration on startup (current pattern, no action needed), or wipe with `docker compose down -v` and start fresh. After upgrade, **reset** via `Invoke-RestMethod -Method Post -Uri 'http://localhost:5080/api/demo-maintenance/reset'` to seed the new per-team progress rows.
  - **Volume reset risk**: if a dev DB has data but no per-team progress rows, all team banners will show "Töltsétek fel..." until a reset reseeds. That's correct behavior under the "no row = not started" convention, but operators may be surprised.
  - **Endpoint shape change**: `POST /api/evidence` and `POST /api/evidence/{id}/feedback` now return `{ evidence, progress }` instead of bare `evidence`. Frontend already updated. Any other clients (Lauder loader script, Postman collections) need adjustment.
  - **`Sticker.state` semantics narrowed**: it's now strictly `tervezett | aktiv`. Anything still treating it as a submission state will misread. Frontend usages were updated; teacher dashboard / sticker-list / closure flows weren't audited deeply — Phase 2 / 3 will catch any drift.
  - **Open**: AI student-advice still doesn't currently propagate the team into the agent's prompt as a structured field (snapshot now contains team state, but the agent's wiki search doesn't use it). Phase 3 picks that up.

---

## [2026-05-18] feat | Team picker in student view (Diák nézet)

- Ask: "Diák nézet" was hardcoded to the first team in the album. With multiple teams this was confusing — the teacher couldn't preview what each team would see. Need a way to switch which team's student view is rendered.
- Change:
  - `AlbumStore`: replaced the dead `teamId` field with a reactive `studentTeamId = signal<string | null>(...)` plus a `selectedStudentTeam` computed signal and a `setStudentTeam(id)` setter. `refreshStudentAdvice` and the existing `applySnapshot` migration logic now use the selected team. When a new snapshot arrives, the current selection is preserved if still valid; otherwise it falls back to the first team.
  - `StudentAlbumComponent`: `team` now reads `store.selectedStudentTeam` instead of `store.teams[0]`. All existing usages (`pendingForTeam`, `submitEvidence`, banner, evidence form gating) automatically follow the selected team.
  - Template (`student-album.component.html`): added a pill-style team picker row at the top of the student view, rendered only when there are 2+ teams. Each pill shows the team's color dot + name; the active pill fills with the team color. ARIA-wired as `role="radiogroup"` / `radio`.
  - SCSS: added `.team-picker` and `.team-pill` / `.team-pill-active` styles using a `--team-color` custom property fed from `team.color`.
- Why: lets the teacher demo / inspect each team's student-side experience without code or seed changes.
- State another agent needs:
  - Rebuild only the `web` container: `docker compose build web && docker compose up -d web`.
  - No API, agent, or DB schema change. `AiAdvice` student-audience generation still keyed by `instanceId` (not team), so per-team Socratic questions aren't yet team-specific — that would be a separate change touching `refreshStudentAdvice` to thread the team into the snapshot.
  - Single-team albums show no picker (intentional, to avoid clutter).

---

## [2026-05-18] tweak | Drop "· projected/curated" suffix from AI citation chips

- Ask: chip text like "Kreatív tanulás (részletek) · projected" still leaked the internal taxonomy. Teachers don't need to know if a source is "projected" or "curated".
- Change: `ai-advice-drawer.component.html` — chip template no longer appends `' · ' + citation.kind`. Now just `{{ citation.label }}`.
- Why: `kind` is an internal agent-wiki classification (projected snapshot of discovery wiki vs. hand-curated agent guideline) with no teacher-facing meaning.
- State another agent needs:
  - Rebuild only the `web` container: `docker compose build web && docker compose up -d web`.
  - `AiCitationDto.Kind` is unchanged on the API/agent side and still in the JSON payload — only the chip render hides it. Anything else consuming the field still works.

---

## [2026-05-18] fix | Hungarian diacritics mangled by load-lauder-example.ps1

- Ask: running `tools/load-lauder-example.ps1` loaded the demo dataset but every Hungarian diacritic in titles, names, and prompts arrived at the API as garbage (Mojibake).
- Change:
  - `Invoke-AlbumApi` in `tools/load-lauder-example.ps1` now converts the serialized JSON body to UTF-8 bytes (`[System.Text.Encoding]::UTF8.GetBytes(...)`) before handing it to `Invoke-RestMethod`. Sending a string body in Windows PowerShell 5.1 force-encodes it as ISO-8859-1 regardless of `charset=utf-8` in Content-Type.
  - Re-saved `tools/load-lauder-example.ps1` as UTF-8 **with BOM**. Without a BOM, Windows PowerShell 5.1 reads .ps1 files using the system code page (CP1252 on this machine), corrupting every diacritic in inline string literals before the script even runs.
- Why: the script was failing on two independent Windows-PowerShell-5.1 encoding quirks simultaneously — source-file decode and request-body encode. The fix is robust in both PS 5.1 and PS 7.
- State another agent needs:
  - The script writes through the public API, so any garbage already in the DB stays there. Reset with `Invoke-RestMethod -Method Post -Uri 'http://localhost:5080/api/demo-maintenance/reset'` before re-running the loader.
  - The BOM is invisible in editors but **must be preserved**. If another agent re-saves this file, use UTF-8-with-BOM (in VS Code: status bar → "UTF-8 with BOM"). Saving as plain UTF-8 will re-introduce the bug.
  - No code change needed for any other component.

---

## [2026-05-18] feat | Teacher-facing displayLabel for agent-wiki citation chips

- Ask: AI advice citation chips were showing discovery-wiki page titles (e.g. "Matricás albumhoz hasonló funkcióminták", "Kreatív tanulás: fejezetenkénti mélyfeldolgozás"). Those titles read fine in the discovery wiki but are jargon or misleading on a teacher-facing chip.
- Change:
  - Added a `displayLabel: string | null` field per page in `agent-wiki/manifest.json`. Null marks agent-meta pages (operational guidance, index, internal feature-pattern catalog) that should NOT surface as teacher-visible citations.
  - Agent (`MatricasAlbum.Agent`): `KnowledgeBase` now loads a `display_labels` map from the manifest and exposes `display_label(source_id, fallback)`. `validate_response` and `mock_response` swap the citation `label` for the teacher-facing displayLabel and drop citations whose displayLabel is `null`.
  - The internal `KnowledgeHit.label` (long Hungarian title) is unchanged — the LLM still sees it in the user payload for reasoning, traces still log it for audit. Only the outgoing `AdviceCitation.label` is rewritten.
  - `tools/refresh-agent-wiki.ps1`: each `$pages` and `$customPages` entry now carries a `DisplayLabel` field, and the script emits `displayLabel` into `manifest.json` so regenerations stay in sync.
- Why: keeps the agent's pedagogical reasoning grounded in full wiki titles while presenting short, teacher-readable concept names in the UI. Avoids leaking internal wiki-meta pages (e.g. "Matricás albumhoz hasonló funkcióminták") to teachers.
- State another agent needs:
  - `ai-agent` container must be rebuilt to pick up the Python changes: `docker compose build ai-agent && docker compose up -d ai-agent`. Web/API unchanged.
  - Hidden citations: `index`, `agent-wiki-hasznalati-szabalyok`, `matricas-albumhoz-hasonlo-funkciomintak`. They still participate in LLM reasoning but never reach the teacher chip.
  - Manifest checksums were not touched (content of the .md files didn't change). Running `tools/refresh-agent-wiki.ps1` later will regenerate the manifest cleanly with the new field.
  - No DB or API schema change. `AiCitationDto.Label` is now the displayLabel for new advices; existing rows in `AiAdvice.CitationsJson` retain their old labels until regenerated.

---

## [2026-05-18] fix | Butterfly logo missing in top-left brand mark

- Ask: butterfly logo not visible in top-left when the app starts.
- Change: copied `butterfly-mark.svg` from `src/MatricasAlbum.Web/original_design/assets/` into `src/MatricasAlbum.Web/src/assets/` so Angular's asset pipeline serves it.
- Why: `BrandComponent` references `assets/butterfly-mark.svg`, but `src/assets/` was empty — the SVG only existed in the `original_design/` reference folder, which is not in `angular.json` `assets`. Result was a 404 and invisible img.
- State another agent needs:
  - Dev server / docker `web` image must be rebuilt to pick up the new asset (`npm start` restart or `docker compose build web && docker compose up -d web`).
  - SVG uses `fill="currentColor"`; loaded as `<img>` it renders black (SVG-document default). If brand color is wanted later, switch `BrandComponent` to inline SVG so `currentColor` picks up CSS color from `.mark`.
  - No DB, API, or agent-wiki changes.
## 2026-05-24 - Student UX polish + reflection prompts
- Added template-version project reflection prompts with migration/backfill, API DTO exposure, draft metadata patching, and student rendering from the active instance.
- Polished student locked/upcoming copy and compressed the Bizonyítékaink filters into a resettable chip strip.
- Verified `dotnet build MatricasAlbum.slnx` and `npm --prefix src/MatricasAlbum.Web run build`.
