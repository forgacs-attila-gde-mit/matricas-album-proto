# Matricás album — improvements roadmap

Living document. Tracks what's planned next and the state of each item. Five top-level streams:

1. **Business functionality completeness** — fix CRUD gaps, decide on stub buttons.
2. **AI improvements** — make the AI advisor more useful.
3. **UX improvements** — polish, clarity, presentability.
4. **Product vision alignment / learning-loop readiness** — keep the product aligned with the 2026-05-26 vision: active learning, student choice, teacher facilitation, adaptive pedagogy, and feedback from real learning runs.
5. **Future activity-domain generalization** — architecture preparation for later Lecke.ai use-cases without changing the current Matricás album scope.

Companion files:
- `LOG.md` — chronological record of what was actually shipped.
- `backlog.md` — items we explicitly deferred, with trigger conditions for revisiting.
- `docs/architecture.md` (+ HTML snapshot) — current architecture truth.
- Product vision source: `../../raw/confluence/2026-05-26--matricas-album-termekvizio--722370562.md`.

## 2026-05-26 product vision guardrail

The Matricás Album should not drift back into a task list, badge system, or AI-generated pedagogy machine. The refreshed product vision frames it as a teacher-controlled learning journey where students act, choose, produce evidence, receive feedback, revise, and reflect.

The September/pilot slice stays deliberately narrow: make existing or teacher-authored activities easier to organize, run, observe, and learn from before broadening into a platform. New roadmap items should strengthen at least one of these primitives: active learning, student choice, evidence, feedback, reflection, or teacher adaptation.

**Status legend**

| Symbol | Meaning |
|---|---|
| ⬜ | Planned, not started |
| 🟡 | In progress |
| 🟢 | Done (link to LOG.md entry if landed) |
| ❓ | Decision needed before scoping |
| 💤 | Deferred — moved to `backlog.md` |
| 🗑 | Won't do |

---

## 1. Business functionality completeness

Audit basis: teacher-side menu items + drawers, scanned 2026-05-19 against current main.
Student-side (Aktuális matrica / Csapatunk / Bizonyítékaink / Visszajelzések / Reflexió / Segítség) was rebuilt in Phases A–D and is considered structurally complete; new items there will be tracked here only if they emerge.

### Műhely (`home`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | Stub button: **"Diák-nézet előnézet"** | Removed from `album-plan.component.html`. The existing role-switcher already lets teachers preview as student. (LOG 2026-05-19) |
| 🟢 | Pedagógiai súgó sidebar button | Wired to a new `teacher-help` placeholder ("Készül"). `TeacherPage` gained `'help'`; app shell + breadcrumbs + sidebar updated. (LOG 2026-05-19) |
| 🟢 | "Aktív futó album" panel duplication | Extracted to `shared/util/instance-progress.util.ts`. Both `teacher-dashboard` and `album-instances` use `instanceProgressPercent(instance)`. (LOG 2026-05-19) |
| 🟢 | **Vezetett mikroklíma bemutató** | Műhely CTA opens a global guided demo panel that walks through sticker creation → albumterv → futó album → student evidence/help → AI-backed teacher feedback → reflection → closure. (LOG 2026-05-21, Guided Mikroklíma Demo Journey.) |

### Matricatár (`stickerLibrary`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Sticker detail view** | New `sticker-resource-detail-drawer`. Cards became clickable buttons. (LOG 2026-05-19, Phase 1.) |
| 🟢 | **Sticker edit** | New-version flow: `openStickerWizardForNewVersion` opens the create-drawer prefilled from the latest version; submit calls `POST /api/stickers/{id}/versions`; the drawer reopens on the new version. (LOG 2026-05-20, Phase 3.) |
| 🟢 | **Sticker delete / archive** | Archive flag (`StickerResource.ArchivedAt`) with `PATCH /api/stickers/{id}/archive` toggle. Library defaults to hiding archived (with toggle); template-create wizard excludes them. (LOG 2026-05-20, Phase 2.) |
| 🟢 | Version history UI | Right-side clickable version list inside the detail drawer; "Legutóbbi" chip on the top entry. (LOG 2026-05-19, Phase 1.) |

### Albumtervek (`templates`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Template detail view** | New navigable `album-template-detail` page with metadata, weekly sticker plan, header `Kijelölés`, and read-only sticker drawer mode. (LOG 2026-05-20, Phase 1.) |
| 🟢 | **Template edit** | Inline edit mode on the detail page (no drawer): "Szerkesztés" flips fields to inputs, debounced (400ms) `PATCH /api/album-template-versions/{versionId}` writes to a draft. Chip-tag dispositions. Drawer-based template flow retired. (LOG 2026-05-20, Template inline editor.) |
| 🟢 | **New template as a page** | "Új albumterv" creates a draft-only template (`POST /album-templates` lands v1 with `IsDraft = true`) and routes to detail in edit mode. `DELETE /album-templates/{id}` hard-deletes when only a draft exists and no instances. Instance picker filters out draft-only templates. Lauder seeder publishes v1 right after creation. (LOG 2026-05-20, Template inline editor.) |
| 🟢 | **Template archive / delete replacement** | Hard delete stays out of scope. `ArchivedAt` toggle hides templates from the default Albumtervek list and from the new-instance picker; existing running albums keep working. (LOG 2026-05-20, Phase 2.) |
| 🟢 | Add/remove/reorder template stickers post-creation | Draft-versioned editing. Auto-save reorders go into a per-template draft (`AlbumTemplateVersion.IsDraft`); explicit Publikálás promotes the draft to the next published version, Elvetés discards. Embedded picker per week. (LOG 2026-05-20, Phase 4.) |
| 🟢 | **DurationType + flexible plan units** | `Duration` free-text replaced by `DurationType` (Hét / Óra / Fázis). "Heti vázlat" folded into the assigned-stickers section; each unit carries its title inline, add/remove buttons per unit, "Új X hozzáadása" appends. Sticker movement via drag-and-drop (Angular CDK) + arrow buttons (up/down between units, left/right within order). (LOG 2026-05-20, DurationType.) |

### Futó albumok (`instances`)

| Status | Item                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢     | **Instance edit** (title, className)                | `PATCH /api/album-instances/{id}` + inline edit card on the plan view. Subject / Grade / DurationType inherited from the bound template version (readonly). (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                                                        |
| 🟢     | **Team management**                                 | Full team CRUD + member CRUD endpoints. Hard-delete only when no Evidence / Progress / HelpRequest / Reflection rows reference the team; 409 with blocker counts otherwise. Teams page got a complete rewrite with color picker. `TeamDto.Members` reshaped to carry member IDs. (LOG 2026-05-20, Instance management.)                                                                                                                   |
| 🟢     | **Instance delete (archive)**                       | Resolved as `ArchivedAt` flag (mirrors template / sticker pattern). `PATCH /api/album-instances/{id}/archive` toggles. Instances list got an "Archivált is" toggle. (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                                                |
| 🟢     | **Template-version upgrade for a running instance** | `GET /upgrade-preview` + `POST /upgrade` with a transparent confirmation modal. Two-pass match: exact `StickerVersionId` then fallback `StickerResourceId` so evidence survives matrica-version swaps. `Deprecated` flag on `InstanceSticker` parks evidence-bearing removed stickers off the timeline without losing data. Atomic two-pass transaction sidesteps the unique-index collision. (LOG 2026-05-20, Template-version upgrade.) |
| 🟢     | **Per-instance unit title overrides**               | New `AlbumInstanceWeekPlan` child table + `PUT /api/album-instances/{id}/units`. Falls back to the template version's title for absent rows. Inline editor on the plan view's edit card. (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                           |
| 🟢     | **Current-unit control**                            | Unit stepper on the plan view's page-head with `albumUnitLabel`-aware ARIA labels; clamped to `1..unitCount` server-side. (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                                                                                          |
| 🟢     | **Archived template warning**                       | Plan view surfaces a warning chip when `templateArchivedAt != null` ("a sablonterv archivált — az album fut, de új példány nem indítható belőle"). (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                                                                 |

### Futó album / album plan (`plan`)

| Status | Item                                                                                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢     | **Repurpose "Frissítések publikálása" → "Sablonverzió átvétele"**                                                 | Replaced by the upgrade CTA + modal — shown only when a newer published version exists; hides itself after a successful commit. (LOG 2026-05-20, Template-version upgrade.)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 🟢     | **Stub: "Diák-nézet előnézet"**                                                                                   | Removed; the role-switcher in the topbar covers this (LOG 2026-05-19).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 🟢     | **Sticker drawer footer stubs**: "Duplikálás" + "Szerkesztés" | Instance-only flow shipped. `Duplikálás` creates a planned runtime copy without touching the template. `Szerkesztés` opens the create drawer prefilled from the current sticker; if the original has evidence/progress, the API creates a corrected planned copy instead of rewriting history. No `ActivityResource` rename or generalized UI copy. (LOG 2026-05-23, Instance-only matrica operations.) |
| 🟢     | Add a sticker to a running instance mid-flight                                                                    | Plan view now exposes "Új matrica"; `POST /api/album-instances/{id}/stickers` creates a sticker resource/version plus an instance-local `InstanceSticker`, leaving the template unchanged. (LOG 2026-05-23, Instance-only matrica operations.) |
| 🟢     | Deep-link to a specific sticker on the plan view                                                                  | Two-way sync: `?sticker=:id` query param. Opening the drawer writes to URL; refreshing restores the drawer. (LOG 2026-05-20, Instance management.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Futó matricák (`stickers`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Stub: "Szűrés"** button | Filter panel shipped for phase, sticker lifecycle state, team-progress aggregate, and deprecated/rejtett toggle. Method-family facet remains intentionally deferred until real activity-domain metadata exists. (LOG 2026-05-23, Instance-only matrica operations.) |
| 🟢 | Same edit/duplicate gap as plan | Fixed through the shared sticker-detail drawer. (LOG 2026-05-23, Instance-only matrica operations.) |

### Csapatok (`teams`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Team edit** | Inline edit on the team card: name, focus, color (palette picker). (LOG 2026-05-20, Instance management.) |
| 🟢 | Member add/remove | Per-member add/remove with name input. `TeamDto.Members` reshaped to carry IDs. (LOG 2026-05-20, Instance management.) |
| 🟢 | Hardcoded subtitle "7.B osztály — 4 csapat" | Now derived from `album.className + teams.length`. (LOG 2026-05-20, Instance management.) |
| ⬜ | Reassign evidence across teams | Edge case but plausible. Plan once edit lands. Need to also reassign the linked `InstanceStickerTeamProgress` / `TeamHelpRequest` / `AlbumInstanceTeamReflection` rows. |
| 🟢 | Help-request resolved-state UI polish | Open-help chip surfaces per team card (`{n} kérdés`). (LOG 2026-05-20, Instance management.) |

### Bizonyíték-portfólió (`evidence`)

| Status | Item                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢     | **Stub: "Export"** button                | Wired to `setPrintOpen('evidence')`; opens the print-preview overlay with an evidence table page. Browser print handles PDF save. (LOG 2026-05-20, Closure + Export.)                                                                                                                                                                                                                                                             |
| 🟢     | **Stub: "Nyomtatható összegzés"** button | Same destination as Export — both stubs converge on `evidence` scope. (LOG 2026-05-20, Closure + Export.)                                                                                                                                                                                                                                                                                                                         |
| 🟢      | **Evidence delete**                      | Resolved as conservative archive, not hard delete. `PATCH /api/evidence/{id}/archive` hides evidence from default views only while it has no teacher feedback; feedback-bearing rows stay audit-visible. Domain-generalization stayed out of scope. (LOG 2026-05-23, Evidence archive + quality edit.) |
| ⬜      | Bulk feedback actions                    | Mass-mark as done / mass-export. Mentioned in the audit; lower priority. Domain-generalization review: this is a generic evidence-inbox capability and should remain evidence-centric rather than album-specific when implemented.                                                                                                                                                                                                                                                            |
| 🟢     | Deep-link to a specific evidence         | Two-way sync shipped for the portfolio and feedback-queue pages: `?evidence=:id` restores the drawer on refresh, opening a card/button writes the query param, and closing the drawer removes it. (LOG 2026-05-22, Evidence deep-link two-way sync.)                                                                                                                                                                                         |

### Visszajelzési sor (`feedback`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | End-to-end workflow | Pending evidence → open drawer → write feedback → mark status → submit. Verified after Phase 3. |
| 🟢 | Standalone help requests | Added in Phase D. |
| 🟢 | **Stub: "Mind: AI-összegzés"** button | Wired to `AlbumStore.requestPendingEvidenceDigest`; the digest renders as an AI card at the top of the feedback queue. (LOG 2026-05-21, AI stream first pass.) |
| ⬜ | Bulk operations (mass-mark, mass-AI-draft) | Tied to the above. |

### Album minőségellenőrző (`quality`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Stub: "Riport PDF"** button | Wired to `setPrintOpen('quality')`; opens the print-preview overlay with the quality dimensions checklist on its own page. (LOG 2026-05-20, Closure + Export.) |
| 🟢 | Hardcoded success / warning narrative callouts | Static narrative replaced by `qualityDims`-driven strengths / attention-needed panels. If no dimension produces a clear signal, the page shows a neutral no-signal card instead of invented narrative. (LOG 2026-05-23, Evidence archive + quality edit.) |
| 🟢 | Teacher-editable quality assessment | Teachers can now edit score, state (`ok` / `warn` / `miss`) and a short reason per dimension. The update writes through `QualityDimension` and logs a `QualityDimensionChange` with trigger `teacherEdit`. (LOG 2026-05-23, Evidence archive + quality edit.) |

### Differenciálás (`diff`)

| Status | Item                                                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢      | **Vision-priority: "Testreszabás"** button on each path | Paths are now data-backed on `AlbumTemplateVersionDifferentiationPath`; the Differenciálás page lets the teacher edit support/base/challenge path text per phase and persists changes through `PUT /api/album-instances/{instanceId}/differentiation-paths`. Defaults still hydrate old versions. (LOG 2026-05-28, Adaptive differentiation + closure synthesis.) |
| 🟢      | **Vision-priority: assign a path to a specific team**  | `InstanceStickerTeamDifferentiationPath` persists per-sticker, per-team path assignment. The UI assigns/clears team paths without splitting the common album journey. (LOG 2026-05-28, Adaptive differentiation + closure synthesis.) |
| 🟢      | Show which path each team took historically            | The Differenciálás page now shows assigned teams per path and a per-sticker history list of team path choices. This is framed as teacher adaptation evidence, not student ranking. (LOG 2026-05-28, Adaptive differentiation + closure synthesis.) |

### Projektzárás (`closure`)

| Status | Item                                               | Notes                                                                                                                                                                  |
| ------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢      | **Stub: "Összegzés exportálása"** button           | Wired to `setPrintOpen('closure')`; opens the print-preview overlay with per-team reflections + checklist + stats. (LOG 2026-05-20, Closure + Export.) |
| 🟢      | Hardcoded reflection Q&A                           | Replaced by real per-team blocks driven by `AlbumInstanceTeamReflection.Text`. Empty-state per team when not yet written. Teacher reflection card dropped. (LOG 2026-05-20, Closure + Export.) |
| 🟢      | Closure checklist persistence                      | New `album_instance_closure_checklist_items` table; `PATCH /api/album-instances/{instanceId}/closure-checklist/{itemId}` toggles `Done`. 7 default items seeded on instance create + backfilled in the migration for existing instances. (LOG 2026-05-20, Closure + Export.) |
| 🟢      | Teacher reflection / effect log                    | Persisted `Tanári hatásnapló` on closure captures what worked, engagement signals, adaptation notes, and what to reuse next time; included in closure export and teacher AI snapshot prep. (LOG 2026-05-27, Teacher effect log for closure.) |
| 🟢      | Learning-loop / impact snapshot                    | Closure now has a descriptive read-only snapshot of stickers, evidence, help requests, feedback/revision, reflections, checklist progress, and teacher effect-log status. No automated success score. (LOG 2026-05-27, Product vision UX alignment + Teacher effect log for closure.) |

### Beállítások (`settings`)

| Status | Item | Notes |
|---|---|---|
| 🟢 | Demo cleanup buttons | Both wired (`clearAiAdvices`, `resetDemoData`). |
| 🟢 | Guided demo entry point | Settings also exposes "Vezetett bemutató indítása" for presenters who want to reset/start the scripted walkthrough from maintenance context. (LOG 2026-05-21, Guided Mikroklíma Demo Journey.) |
| ⬜ | Teacher preferences | Empty surface. Candidates: default audience for AI advice, default sticker phase, etc. Wait for real teacher pilots before designing. Domain-generalization review: do not add generalized defaults (method family, interaction mode, participant mode) before pilots prove they are useful. |

### Sidebar bottom: Pedagógiai súgó

| Status | Item | Notes |
|---|---|---|
| 🟢 | Pedagógiai súgó button has a handler | Wired by the routing round — the sidebar entry navigates to `/teacher/help`. (LOG 2026-05-20, Frontend routing.) |
| 🟢 | **Pedagógiai súgó content from methodology book** | `/teacher/help` now renders a searchable, TOC-based teacher-facing guide distilled from `agent-wiki/source-book/matricas-album-modszertani-kezikonyv.md`, without exposing agent-wiki/runtime mechanics. (LOG 2026-05-21, Source-book agent-wiki refresh.) |
| 🟢 | AI citation chips open Súgó topics | Advice citation chips show a short hover/focus preview and click through to the matching `/teacher/help?topic=...` section. (LOG 2026-05-21, Súgó citation chips.) |

---

## 2. AI improvements

Seed list — fill in details as we discuss. The current AI surface:
- Teacher: `POST /api/ai-advice/generate` produces persisted `AiAdvice` rows; teacher reviews & applies via drawer.
- Student: same endpoint with `audience='student'` produces Socratic questions only.
- Snapshot is sanitized (no personal names), routes through the Python/Agno agent and the agent-wiki projection.

Candidates we know about:

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Use the Phase B/C/D state in advice snapshots** | Teacher-instance snapshots carry per-team reflections (length-capped 800) + open / recent-resolved help requests, aliased. `PromptVersion` bumped to `phase3-v1` to invalidate cached runs. (LOG 2026-05-21, AI stream first pass.) |
| 🟢 | **Student-side AI gets per-team scoped Socratic prompts** | Snapshot now exposes explicit selected-team, active-sticker, team-progress, and team-recent-evidence context; student advice remains question-only and is cleared when team/sticker context changes. (LOG 2026-05-24, AI trust pass v1.) |
| 🟢 | **AI summary across pending evidence** | `targetType='pendingEvidenceDigest'` on `POST /ai-advice/generate`; snapshot restricts to pending rows + expands evidence cap to 30; one info-kind AiAdvice persisted and surfaced as the AI card at the top of the feedback queue. (LOG 2026-05-21, AI stream first pass.) |
| 🟢 | **AI-suggested feedback drafts for individual evidence** | Feedback drawer can request an evidence-targeted draft; snapshot includes `targetEvidence`, validation pins `draftFeedback.evidenceId` to the requested evidence, and applying the draft only fills editable teacher text. (LOG 2026-05-24, AI trust pass v1.) |
| 🟢 | **Vision-priority: AI closure synthesis** | `targetType='closureSynthesis'` now generates a teacher-facing closure card from the sanitized instance snapshot, including differentiation paths and team path assignments. The agent is instructed to surface patterns and reflection questions, not score, rank, grade, or decide pedagogy for the teacher. (LOG 2026-05-28, Adaptive differentiation + closure synthesis.) |
| 🟢 | **AI help-request triage** | `targetType='helpRequest'` + `targetId` on `POST /ai-advice/generate`. Snapshot adds a `targetHelpRequest` field. Each open help-request card in the feedback queue gets an "AI tanács" ghost button; returned Socratic questions render as a bulleted list under the request. (LOG 2026-05-21, AI stream first pass.) |
| ⬜ | **Advice freshness signals** | Advices persist forever today. Decide: auto-expire after N days, or mark "stale" if the snapshot hash has drifted significantly. |
| 🟢 | **Source-book agent-wiki projection** | Runtime projection regenerated as `matricas-methodology-agent-wiki-v1` from the methodology source-book; `manifest.json` excludes `README.md` checksums and the agent fails fast on undeclared root markdown. (LOG 2026-05-21, Source-book agent-wiki refresh.) |
| ⬜ | **Agent-wiki coverage audit** | Some pages have `displayLabel: null` (intentionally hidden from teachers). Periodically check that the source-book projection still covers the methodology concepts needed by real advice scenarios. Domain-generalization review: next audit should include the common activity-domain concepts (`MethodFamily`, activity-card, learning sequence, classroom run, evidence slots, rubric dimensions) without exposing internal architecture to teachers. |
| ❓ | **Multi-source advice** | Today the agent reads only the agent-wiki projection. Decide whether any future scenario needs an explicitly pinned extra source; default remains source-book-only runtime advice. Domain-generalization review: no change; do not pin discovery-wiki architecture pages into runtime advice by default. |

Open questions for the AI stream:
- What's the next *user-visible* AI win? Product-vision default: closure synthesis or differentiation support before broader pedagogy generation.
- Are the current Socratic questions teachers report as "useful" or "generic"? (Need pilot data; not actionable until we have it.)
- Token / latency budget — any complaints from real use? Should we cache more aggressively?

---

## 3. UX improvements

Seed list. The Diák nézet got a heavy rebuild in Phases A–D; the teacher side hasn't been polished as systematically.

Candidates we know about:

| Status | Item | Notes |
|---|---|---|
| 🟢 | **Frontend routing** | Hash-routed Angular Router. Role / active instance / template ID all bookmarkable. Shells (`TeacherShell` / `StudentShell` / `InstanceShell` / `StudentAlbumShell`) own the route → store glue; `page()` / `studentPage()` stay derived from the URL so existing breadcrumb logic keeps working. (LOG 2026-05-20, Frontend routing.) |
| 🟢 | **Guided Mikroklíma Demo Journey** | Opt-in presenter flow demonstrates the end-to-end philosophy without long typing or live AI latency; deterministic demo AI still persists advice through the normal review/apply surfaces. (LOG 2026-05-21, Guided Mikroklíma Demo Journey.) |
| 🟢 | **Guided demo active-mode banner** | Follow-up clarity layer for the shipped guided demo: when `Vezetett bemutató` mode is active, teacher and student shells show a persistent below-topbar banner with next-step CTA, panel reopen, and exit controls. (LOG 2026-05-24, Guided demo active banner.) |
| 🟢 | **First-use concept onboarding** | `Új albumterv mintából` now shows a dismissible `Módszertani keret` panel: album = tanulási út, matrica = bizonyítékos epizód, tanár = facilitátor. (LOG 2026-05-27, Product vision UX alignment.) |
| 🟢 | **Teacher dashboard "now what?" clarity** | Műhely now has a priority strip with one next action: open help requests → pending evidence → continue active album → start an instance. (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Drawer mode-switch confusion** | Role switcher now closes evidence/sticker/resource/advice/create/print/evidence-flow overlays before navigating, so role-aware drawers cannot re-render in the wrong mode. (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Stub buttons cause silent dead ends** | Presenter-facing stubs are hidden on the demo path (`Duplikálás`, `Szerkesztés`, `Szűrés`, `Testreszabás`); underlying feature rows stay planned. (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Locked-sticker tile copy** | Student locked/upcoming copy now consistently says the teacher opens the sticker at the right time, without promising a specific week. (LOG 2026-05-24, Student UX polish + reflection prompts.) |
| 🟢 | **Album poster overflow** | Student album poster now protects title/driving-question wrapping, content z-index, and mobile sizing. (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Feedback-queue help section ordering** | Verified in the existing page order: digest, open help requests, then pending evidence; no structural change needed. (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Bizonyítékaink filter pill clutter** | Student evidence filters are now a single compact chip strip with status/type/help filters and a reset chip when non-default filters are active. (LOG 2026-05-24, Student UX polish + reflection prompts.) |
| 🟢 | **Project reflection prompts on Reflexió page** | Project reflection prompts are configurable on the album template version, inherited by running instances through their minted version, and rendered on the student Reflexió page with defaults. (LOG 2026-05-24, Student UX polish + reflection prompts.) |
| 🟢 | **Student choice visibility** | The active student decision point is echoed in evidence submission, and teacher feedback review shows the sticker's `StudentChoice` as a learning decision context. Presentational only; no scoring semantics. (LOG 2026-05-27, Product vision UX alignment.) |
| 🟢 | **Toast for hard-to-undo demo resets** | Demo reset success now says: "Demo visszaállítva, tiszta kezdőállapot kész." (LOG 2026-05-22, Demo polish bundle.) |
| 🟢 | **Breadcrumb behavior** | Topbar breadcrumbs now shrink with ellipsis so long labels do not collide with role controls. (LOG 2026-05-22, Demo polish bundle.) |

Open questions for the UX stream:
- Should we batch-rename inconsistent button labels (e.g. "Bezárás" vs "Mégse")?
- Is there a need for a dark-mode pass, or is light-mode the only target for the pilot?
- Mobile / tablet support — explicitly in or out?

---

## 4. Product vision alignment / learning-loop readiness

Source: `../../raw/confluence/2026-05-26--matricas-album-termekvizio--722370562.md`.

This stream translates the 2026-05-26 Matricás Album product vision into roadmap pressure without broadening the pilot into a full platform. The guiding interpretation: the product should help teachers move from content delivery toward active, reflective, competency-oriented learning runs.

### 2026-05-29 high-priority product-plan deltas

Live Confluence inputs checked for this delta:
- Root vision page `722370562`, live version 4, updated 2026-05-28.
- Child pages: `1. Célcsoport`, `2. Pedagógiai működési modell`, `3. Rendszerstruktúra és alapfogalmak`, `4. Felhasználói élmény`.
- Placeholder child pages for `Tantervek`, `Modulok`, `Témakörök`, `Blokkok`, and `Tevékenységek` are currently empty, so they should not create detailed implementation rows yet.

The latest plan expands the roadmap pressure from album-only pilot alignment toward a broader pedagogical structure. Implementation must still remain progressive and pilot-safe: teachers should start from the next useful action, not from a mandatory full hierarchy.

| Status | Priority | Item                                           | Notes                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢      | High     | **Pilot target alignment**                     | Műhely now names the pilot focus as 7-8th grade science in autonomy-supportive schools, entry cards use science-oriented starter copy, template onboarding includes the pilot segment, and demo/default template grades are tuned to `7-8. évfolyam`. Keep broader subject expansion evidence-gated. (LOG 2026-05-31, Pilot target alignment.)                                          |
| 🟢      | High     | **Progressive entry experience**               | Műhely now exposes three entry paths: "Kezdj egy ötlettel", "Kezdj egy órával", and "Kezdj egy tantervvel". They open existing sticker/template flows with context-specific starter copy and presets; no hierarchy schema, route, or API change. (LOG 2026-05-29, Progressive entry paths.)                                                                                                                                       |
| 🟢     | High     | **Hierarchy mapping spike before schema work** | Consolidated into `docs/architecture.md`. Target hierarchy is `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`; `Témakör` contains `Tanulási egység`. Future schema work must wait for a dedicated schema slice, especially before adding `Curriculum`, `Module`, `Topic`, `LearningUnit`, `Block`, or renaming `Week` to `UnitIndex`. |
| 🟢      | High     | **Quick activity-from-idea flow**              | "Kezdj egy ötlettel" now opens an idea-first Matricatár drawer: the teacher enters a plain idea such as "papírrepülő sebességmérés", gets a local starter activity draft prefilled into the existing sticker fields, reviews/edits it, and must save explicitly. No API, schema, or automatic AI apply path. (LOG 2026-05-31, Quick activity-from-idea.)                                                                 |
| 🟢      | High     | **Block / lesson builder**                     | "Kezdj egy órával" now opens an órai blokk builder with 3-5 editable activities, minute allocation, reorder/remove/add controls, and teacher edits. It saves through the existing album-template unit titles as a pilot-safe lesson block; no API, schema, hierarchy entity, or route change. (LOG 2026-05-31, Block lesson builder.)                                                                                       |
| 🟢      | High     | **Activity metadata upgrade**                  | New sticker/activity creation now has optional planning metadata for subject, grade, competencies, NAT links, interaction mode, participant mode, estimated minutes, and real-world/home/community context. The slice persists this as teacher-facing notes in existing sticker fields, so there is no API, schema, migration, or read-model change. (LOG 2026-05-31, Activity metadata upgrade.)                                      |
| 🟢      | High     | **Pilot observation loop**                     | Running album plan now includes a lightweight per-unit pilot observation pad for engagement signals, adaptation notes, and next-step trial notes. It is descriptive only, stored locally by instance/unit for the pilot, and does not add automated effectiveness scoring or backend schema. (LOG 2026-05-31, Pilot observation loop.)                                                                                      |
| 🟢      | High     | **AI entry copilot guardrail**                 | Progressive entry drawers now make the teacher-review rule explicit: AI may suggest and prefill, but full curriculum/module/topic/block structures cannot become saved defaults without teacher review. The idea flow still prefills only editable sticker fields, and lesson/curriculum starters stay on existing template surfaces. (LOG 2026-05-31, AI entry copilot guardrail.)                                                                  |
| 🟢     | High     | **Decision resolved: `Témakör` is a level**    | `Témakör` is a distinct product/data level between `Modul` and `Tanulási egység`, not only a UX label. Future hierarchy modeling and navigation should treat it as a first-class level.                                                                                                                                                                                            |

### 2026-05-31 recursive Confluence re-check refinements

Live Confluence tree re-checked recursively on 2026-05-31:
- Root page `722370562`, live version 4, updated 2026-05-28, plus all 28 descendants under the Matricás Album product vision tree.
- Newest high-signal sources remain the 2026-05-29 creation and UX pages: `Tanterv létrehozása`, `Modulok létrehozása`, `Témakörök létrehozása`, `Blokkok létrehozása`, `Tevékenységek létrehozása`, `Tevékenységtípusok létrehozása`, and `4. Felhasználói élmény`.
- The five `áttekintése, funkciók` pages for tantervek, modulok, témakörök, blokkok, and tevékenységek are still empty placeholders. Do not derive detailed feature work from them yet.
- The archive branch (`Matricás album - Áron - archív`, user flow, pedagógiai alapelvek, scenario library, use cases, printable package) reinforces older sticker/album/week concepts, but the current prototype expectation is now the newer activity/block/topic/module/curriculum planning flow.

| Status | Priority | Item | Notes |
|---|---|---|---|
| 🟢 | High | **Progressive one-level-up handoff prompts** | The idea-first drawer now offers an optional handoff from drafted activity to órai blokk; the lesson builder shows the next placement ladder (`Blokk -> Témakör -> Modul -> Tanterv`) as editable planning context, not mandatory structure. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Fixed activity-type picker** | New activity creation now has a fixed system-owned type picker for `Felfedező`, `Kísérletező`, `Feldolgozó`, `Kommunikációs`, `Kollaboratív`, and `Reflektív`, separate from journey phase. Users cannot create or edit these types. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Context inheritance and prefill** | Activity creation now captures optional tanterv/modul/témakör/blokk context alongside subject, grade, NAT, competencies, and work context; idea drafts infer a topic/block seed. The data still lands through existing teacher-facing notes, with no schema/API change. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Use/adapt existing activity and block flows** | Creation drawers now expose explicit adaptation starts: existing stickers can prefill an activity draft, and existing album plans can prefill a new block/template draft. The teacher still reviews and saves a new artifact. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Block builder metadata refinement** | The órai blokk builder now includes placement context, per-activity required/optional/extra status, tools/resources, block-level reflection prompt, and alternative path notes while still saving through the current template surface. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Curriculum starter refinement** | `Kezdj egy tantervvel` now includes an editable module/topic preview with subject and grade on the same drawer. It remains a starter plan, not a mandatory full hierarchy or new schema. (LOG 2026-05-31, Product-tree refinement slice.) |
| 🟢 | High | **Hierarchy source reconciliation before schema** | Added the 2026-05-31 source reconciliation note to `docs/architecture.md`: current source mismatch is known, but implementation remains aligned with `Témakör` as a first-class level until schema work explicitly reconciles it. |
| 🟢 | High | **Printable/package signal as prototype context** | The curriculum starter now surfaces the printable package signal as context for later print/progress thinking, explicitly excluding ordering/fulfillment from the prototype scope. (LOG 2026-05-31, Product-tree refinement slice.) |

### 2026-05-31 workflow and UX coherence refinements

Consistency check basis: the live product hierarchy mapping, the refreshed roadmap rows above, the teacher dashboard entry paths, the create drawer, and the running-album pilot observation loop. These are planned high-priority refinements because they make the older Matricás Album execution model and the newer curriculum/activity planning model feel like one coherent workflow.

Unifying UX model: teachers should be able to start from the smallest useful planning move, shape it into a reusable activity/block/curriculum draft, run it as an album journey, then feed observations and evidence back into teacher-controlled reflection.

| Status | Priority | Item | Notes |
|---|---|---|---|
| 🟢 | High | **Vocabulary bridge: activity, matrica, album** | Creation and dashboard copy now introduce `Tevékenység (matrica)` as the current activity token, keep `Matricatár` as the library, and avoid `Album-minta` as the primary label for lesson/curriculum starts. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Entry-aware drawer labels and save actions** | Progressive starts now show context-aware primary actions: idea saves a `Tevékenység`, lesson saves a `Blokk-vázlat`, and curriculum saves a `Tantervi vázlat`, while all persistence still uses existing sticker/template APIs. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Visible `Tanulási egység` planning context** | Activity and lesson planning surfaces now include `Tanulási egység` as editable planning metadata between `Témakör` and `Blokk`; no schema, API, or route change. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **One expanded curriculum example** | The curriculum starter now shows one concrete hierarchy chain from module/topic through `Tanulási egység`, `Blokk`, and `Tevékenység` so the future structure is legible without requiring full-tree authoring. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Separate activity type from learning-journey phase** | The activity metadata panel now labels `Tevékenységtípus` as the kind of student work and relabels `Fázis` as `Tanulási út fázisa`, with helper copy explaining the difference. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Demote old album patterns to pedagogical patterns** | The old pattern picker is now a secondary `Pedagógiai minta` section, framed as a method focus rather than a competing hierarchy level. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Pilot observation to closure bridge** | Closure now detects local weekly pilot observations for the active run and offers to merge them into the persisted teacher effect-log fields before saving. Backend schema remains unchanged. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Dashboard workflow grouping** | Műhely copy now separates progressive starts from secondary `Kezelés és visszakeresés` surfaces, and the management cards describe library/plans/runs as retrieval and reuse areas. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Metadata ownership decision before filter/schema work** | Added a working metadata ownership hypothesis to `docs/architecture.md`; structured filters/adaptation logic should not depend on current text-note persistence. (LOG 2026-05-31, Workflow/UX coherence slice.) |
| 🟢 | High | **Printable/package signal placement** | The curriculum starter now frames the printable/package hint as a later print/export output signal, not as planning scope or ordering/fulfillment work. (LOG 2026-05-31, Workflow/UX coherence slice.) |

### Vision priorities

| Status | Item | Notes |
|---|---|---|
| 🟢 | First-use concept onboarding | Mirror the UX row above. Shipped as a dismissible concept panel in the album-template creation drawer. |
| 🟢 | Student choice visibility | Mirror the UX row above. Shipped as presentational visibility in student evidence submission and teacher evidence review. |
| 🟢 | Differentiation path customization | Mirror the diff rows above. Shipped as version-backed support/base/challenge path text plus per-team path assignment/history in the running album. |
| 🟢 | Learning-loop / impact snapshot | Mirror the closure row above. Shipped as a descriptive closure snapshot, extended with teacher effect-log status. |
| 🟢 | Teacher reflection / effect log | Mirror the closure row above. Shipped as persisted teacher-private closure reflection and export content. |
| 🟢 | AI closure synthesis | Mirror the AI row above. Shipped as a closure-page AI card that summarizes patterns and suggests reflective prompts while preserving teacher control over interpretation and next steps. |

### Not in scope because of the vision

| Temptation | Decision |
|---|---|
| Global rename from Matricás Album to Activity Studio | Not before pilot evidence. The product can be architecturally reusable while staying teacher-facing as Matricás Album. |
| Automatic activity-effectiveness scoring | Not yet. First collect descriptive learning-loop signals and teacher reflection. |
| AI-generated pedagogy as the default path | Not aligned. AI supports reflection, differentiation, feedback, and preparation; teachers decide. |
| Broad community/content marketplace | Not part of the immediate roadmap. Revisit only after teacher-authored activity runs produce reusable patterns. |

---

## 5. Future activity-domain generalization

This stream prepares the codebase for future Lecke.ai activity use-cases while keeping the current Matricás album product behavior unchanged. The 2026-05-26 product vision strengthens the case for an activity-run core, but it does not change the guiding rule: **no existing or already-planned Matricás album functionality changes because of this stream**. Any work here must be additive, mostly naming/metadata/architecture preparation, and should not make the September demo broader or more abstract.

Reference discovery note: `../../wiki/kutatasok/2026-05-22--kozos-activity-domain-matricas-album-architektura.md`.

### Domain direction

The reusable core is not the album metaphor. It is:

`activity card → learning sequence → classroom run → team progress → evidence → feedback/revision → reflection`

Current implementation already maps well:

| Future generic term | Current Matricás album term | Roadmap stance |
|---|---|---|
| ActivityResource | `StickerResource` | Conceptual alias only. Do not rename DB/API now. |
| ActivityVersion | `StickerVersion` | Keep using current sticker versioning; add metadata later. |
| LearningPathTemplate | `AlbumTemplateVersion` | Current template versioning remains the source of truth. |
| ClassroomRun / LearningRun | `AlbumInstance` | Current running-album flow remains unchanged. |
| RuntimeActivity | `InstanceSticker` | Current lifecycle semantics stay `tervezett | aktiv`. |
| Evidence / Submission | `Evidence` | Already generic enough. |
| TeamActivityProgress | `InstanceStickerTeamProgress` | Already generic enough. |
| SupportAdvice | `AiAdvice` | Already target-aware enough. |

### Planned preparation items

| Status | Item | Notes |
|---|---|---|
| 🟢 | Add developer-facing alias note to `docs/architecture.md` | Added as a conceptual alias note: `StickerResource` / `StickerVersion` are also the future reusable activity-card primitive, but DB/API/UI names stay Matricás album specific. (LOG 2026-05-23, Activity-domain guardrail.) |
| ⬜ | Add additive activity metadata to `StickerVersion` | Future fields: `MethodFamily`, `CompetencyTags`, `InteractionMode`, `ParticipantMode`, `EstimatedMinutes`. The product vision makes this more important because activity cards should express competency, collaboration, student choice, and real-world mode. This should be additive and optional; existing stickers must keep working. |
| ⬜ | Add structured rubric dimensions | Future `RubricDimensionsJson` or normalized child table. Use it to make 4K/6K evidence assessable without changing today's quality page. |
| ⬜ | Add evidence slots | Future support for productive failure / POE / critique-revision: `attempt`, `observation`, `claim`, `revision`, `reflection`. Not needed for the current Matricás album demo. |
| ⬜ | Keep generalized UI out of the current demo path | No "Activity Studio" navigation, no global renaming from matrica to activity, no broad method marketplace until a future use-case requires it. Product-vision alignment happens through learning-loop behavior, not rebranding. |

### Review of open roadmap items

| Existing open item | Change because of domain generalization? | Decision |
|---|---|---|
| Sticker drawer duplicate/edit | Small implementation note only. | Build as instance-local sticker/activity fork; keep Matricás labels. |
| Add sticker to running instance | Small implementation note only. | Keep as "Új matrica ehhez a futtatáshoz"; backend should not block later generic runtime activities. |
| Sticker list filters | Later method-family facet possible. | Do not wait for new metadata. |
| Evidence delete | No immediate change. | Revisit only if evidence slots are introduced. |
| Bulk feedback | No immediate change. | Treat as generic evidence inbox capability. |
| Quality callouts and teacher-editable quality | Small modeling note. | Keep `QualityDimension` owner-generic. |
| Differentiation paths | Shipped in the current Matricás layer, no scope broadening. | Keep as Matricás album template/instance feature; future generic method metadata should learn from this path customization + team assignment behavior before driving UI. |
| AI advice rows | Small prompt/snapshot guardrail. | Keep target/evidence/team scoped; avoid album-only assumptions in future prompt tuning. |
| Reflection prompts | Higher product priority, no schema change now. | Keep template-level now; use the shipped closure synthesis and teacher effect logs to learn before designing broader reflection primitives. |
| DurationType backlog | Generalization increases importance. | Finish unit-label ripple before using non-week activity templates broadly. |
| `Week` → `UnitIndex` rename backlog | Generalization strengthens trigger. | Still deferred; do during schema churn, not now. |

---

## Decision log

Append-only as we make planning decisions. Format: `## YYYY-MM-DD — <decision>`.

### 2026-05-19 — Roadmap document established

This file is the single source of truth for planned-but-unshipped work on Matricás album. `LOG.md` keeps shipped history, `backlog.md` keeps explicitly-deferred items with trigger conditions. Items in this roadmap progress: ⬜ → 🟡 → 🟢 (and on landing move into `LOG.md` as a normal change entry). Items that get deferred move to `backlog.md`; items dropped get 🗑 with a one-line reason.

### 2026-05-23 — Domain generalization is preparation, not Matricás album scope change

The common Lecke.ai activity-domain direction is accepted as a future-use preparation layer: activity cards, learning sequences, classroom runs, evidence, feedback, and reflection. Current and already-planned Matricás album functionality stays unchanged; no global rename from sticker/album to activity/run, no Activity Studio UI, and no new generalized domain objects unless an implementation item independently needs additive metadata.

### 2026-05-26 — Product vision alignment stays hybrid

The refreshed Matricás Album product vision adds roadmap pressure around active learning, student choice, teacher facilitation, adaptive pedagogy, and learning-loop feedback. Decision: keep the September/pilot slice narrow, but prioritize onboarding, visible student choice, differentiation customization, closure synthesis, teacher reflection, and descriptive impact snapshots before broader platform or marketplace work.

### 2026-05-29 — Live product plan expands the structural horizon

The live Confluence planning pages moved the roadmap pressure from album-only pilot alignment toward a broader pedagogical structure: target segment, progressive entry paths, and a hierarchy that now includes `Témakör` as a first-class level. Decision: treat these as high-priority planned deltas, but require a hierarchy mapping spike before schema work and keep implementation progressive, teacher-reviewed, and pilot-safe.

### 2026-05-29 — `Témakör` is a first-class level

Product decision: `Témakör` is a distinct product/data level between `Modul` and `Tanulási egység`, not just a UX label. Follow-up decision: `Témakör` contains `Tanulási egység`, so the target hierarchy is `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`.

### 2026-05-31 — Recursive product-tree re-check becomes prototype refinement input

The full Matricás Album Confluence subtree under page `722370562` was re-checked recursively. Decision: treat the May 29 creation/UX pages as the strongest current prototype expectation, prioritize progressive handoff prompts, fixed activity types, context prefill, adaptation flows, and richer block/curriculum starters, while keeping the empty overview/function pages and archive branch as non-driving context.
