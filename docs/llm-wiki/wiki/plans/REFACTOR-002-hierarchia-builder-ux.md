---
title: "REFACTOR-002 — Hierarchia-építők UX-igazítása a Matrica/Albumterv mintához"
type: plan
sources:
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-create-drawer/album-create-drawer.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-template-detail/album-template-detail.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/sticker-library/sticker-library.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/block-builder/block-builder.component.ts
  - wiki/plans/REFACTOR-001-gold-standard-rendszerstruktura.md
updated: 2026-06-02
lang: mixed
---

# REFACTOR-002 — Hierarchia-építők UX-igazítása a Matrica/Albumterv mintához

**Purpose**: Make the five gold-standard hierarchy surfaces (Blokkműhely, Témakörök, Modulok, Tantervek, Felépítés) feel like the rest of the product — i.e. adopt the calm, guided, preview-driven UX of the `Tevékenység (matrica)` create flow and the `Albumterv` editor — for a mostly non-tech-savvy teacher audience.
**Audience**: Matricás Album dev team (Angular Web); pilot teachers; product owner.
**Status**: Draft

---

## Background

REFACTOR-001 (Phases 4–6) shipped the full `Tanterv → Modul → Témakör → Blokk → Tevékenység` hierarchy as reference-composed, versioned entities, with one builder page per level plus a read-only drill-down explorer ([[AlbumDomain]], [[ADR004-hivatkozas-alapu-hierarchia]]). They are gated behind the Beállítások **béta funkciók** switch (REFACTOR-001 follow-up).

Those builders were shipped function-first and are **UX-plain**: a bare `<select>` to pick/create, a raw 3-pane `CreationShellComponent` with hand-rolled list rows, terse buttons, no progressive disclosure, and a plain right-pane preview. They do **not** match the two polished creation surfaces the product already has:

- **`Tevékenység (matrica)` create** (`album-create-drawer.component.ts`): essential-first fields + a single „Részletes tervezés" disclosure (`advancedOpen`), a **live preview** (`matrica-preview.component.ts`), plain-language Hungarian labels, consistent verbs (`Mentés`/`Publikálás`/`Elvetés`).
- **`Albumterv` editor** (`album-template-detail.component.ts`): sectioned with a „Részletek" disclosure (`detailsOpen`), live album preview, debounced save, draft/publish controls.
- **`Matricatár`** (`sticker-library.component.ts`): a calm **card-grid browse** view with a filter facet and an „Új matrica" affordance, separate from the editor (a drawer).

The four level-builders are also ~95% identical (pick/create → add child reference → drag-reorder → publish), so the cleanest path to consistency is a **single shared builder kit** that all four configure, rather than four divergent hand-rolled pages.

## Goal

When done: each hierarchy level is browsed as a calm card list (Matricatár-style) and edited in a consistent 3-pane workspace that reuses one shared, preview-driven, progressively-disclosed builder — visually and interaction-wise indistinguishable in "feel" from the matrica/albumterv flows — with plain-language Hungarian copy and consistent verbs. No API or domain changes; behaviour (reference composition, versioning, reorder, publish) is identical, only the UX layer changes.

---

## Scope

### In Scope
- A shared, config-driven **`HierarchyBuilderComponent`** (3-pane reference-list builder) + a shared **reference preview** component, lifting the matrica/albumterv visual language and patterns.
- A **browse/editor split** per level: a card-grid list page (like Matricatár) → an editor (the shared builder), replacing the single bare-`<select>` page.
- Migrating all four level builders (`block`/`topic`/`module`/`curriculum`) onto the shared kit.
- Progressive disclosure of advanced fields (e.g. Blokk `flowType`/`grouping`) behind a „Részletes beállítások" toggle; essential-first layout.
- Plain-language Hungarian labels + one-line helper microcopy + consistent verbs (`Mentés`/`Publikálás`/`Elvetés`/`Hozzáadás`) + friendly empty states.
- Aligning the **Felépítés** explorer's visual style with the album-plan/template-detail look.
- Web specs for the shared component + each migrated level.

### Out of Scope
- Any **API / DTO / domain / migration** change (REFACTOR-002 is web-only).
- The REFACTOR-001 **deferrals**: mint-through-blocks rewire, `Week→UnitIndex` rename, Curriculum `draft/review/approved/published` governance workflow, suggest-only AI structure help, richer per-level fields.
- The béta-features switch itself (already shipped).
- Mobile/responsive redesign beyond the existing breakpoints; theming changes.

---

## Acceptance criteria
- [ ] **UX-1**: Each level (Blokk/Témakör/Modul/Tanterv) is browsed as a card list with a clear „Új …" affordance and opens into the shared editor — the same browse→edit shape as `Matricatár` → drawer.
- [ ] **UX-2**: The four level editors are rendered by **one** shared `HierarchyBuilderComponent`; per-level differences are pure config (labels, child noun, API callbacks). No level hand-rolls its own pane markup.
- [ ] **UX-3**: Advanced/secondary fields sit behind a single disclosure; ≤ the essentials are visible by default (mirrors „Részletes tervezés").
- [ ] **UX-4**: Every editor shows a live, student/teacher-facing-styled **preview** consistent with `matrica-preview` (ordered children + counts/roles), updating as references change.
- [ ] **UX-5**: Consistent verbs, plain-language labels, helper microcopy, and friendly empty states across all five surfaces; no raw enum keys shown to teachers.
- [ ] **UX-6**: No behaviour regression — create, add-by-reference, drag-reorder (two-pass), role/flow/grouping edit, draft/publish/discard, archived-filtering all still work, verified by specs + a live click-through.
- [ ] **UX-7**: The Felépítés drill-down adopts the shared visual language (cards/rows, chips, spacing) rather than bespoke tree styling.

## What does NOT change
- API surface, DTOs, feature flags, server-side gating (`Features:Hierarchy:*`), and the béta switch.
- Reference-composition + versioning semantics (≤1 draft, published-immutable, two-pass reorder, published-only references).
- The matrica/albumterv flows themselves (they are the *reference*, not a target of change) — except for **extracting** any shared bits (e.g. the disclosure pattern, preview shell) without altering their behaviour.
- Hungarian domain tokens / persisted enums stay verbatim; UI shows localized labels over them.

## Known limitations / accepted trade-offs
- A config-driven generic builder trades a little indirection for strong consistency + DRY; acceptable because the four levels are near-identical.
- The level editors stay **full pages** (not drawers): they are 3-pane workspaces, so they align with the `Albumterv` *editor* (a page), while *browse* aligns with `Matricatár` (a list). Create opens the editor on a fresh draft rather than a modal drawer.
- No data-model help for "which hierarchy level equals an Albumterv" — that mapping is a REFACTOR-001 deferral and stays out of scope here.

---

## Architecture

**New shared components (under `shared/ui/hierarchy-builder/`):**

- `HierarchyBuilderComponent` — presentational 3-pane workspace, composes the existing `CreationShellComponent`. Inputs/outputs (signal-based):
  - `input title`, `input childNoun` (e.g. „blokk", „témakör"), `input libraryTitle`.
  - `input libraryItems: HierarchyLibraryItem[]` (id, name, sub-line, addable flag), `input references: HierarchyRefItem[]` (id, name, sub-line, optional role).
  - `input isDraft`, `input busy`, `input advancedTpl?` (projected advanced-settings slot, behind the disclosure), `input previewTpl?` (projected preview, defaults to the shared `HierarchyPreviewComponent`).
  - `output add(libraryItemId)`, `output remove(refId)`, `output reorder(orderedRefIds)`, `output publish()`, `output createDraft()`.
  - Owns: search box, the „Részletes beállítások" disclosure, CDK drag-drop reorder, consistent verbs + empty states. No domain logic / no `AlbumApi` call.
- `HierarchyPreviewComponent` — ordered, chip-annotated preview styled like `matrica-preview` (reuse `ma-chip`, spacing tokens).
- Each level component (`block`/`topic`/`module`/`curriculum`) becomes a **thin adapter**: maps its `AlbumApi` calls + models to the shared inputs/outputs (a small `HierarchyLevelConfig`), and projects a level-specific advanced slot (e.g. Blokk flow/grouping selects) + preview row template.

**Browse/editor split (routing):**

- `…/blocks` (and topics/modules/curricula) becomes a **list** route (card grid like `sticker-library`), with „Új …" and archived-toggle; selecting/creating navigates to `…/blocks/:id` (editor) — mirrors `templates` → `templates/:id`. The list reuses a shared `HierarchyListComponent` (cards + filter + new), config-driven.
- Update `app.routes.ts` + the sidebar labels accordingly (the béta entries already exist).

**State**: stays component-local with direct `AlbumApi` calls (as today); no new store. The shared components are dumb/presentational, so they unit-test without HTTP.

**Reuse, do not fork**: lift the disclosure pattern + verb/label conventions from `album-create-drawer`; lift the card-grid + empty-state styling from `sticker-library`; lift preview styling from `matrica-preview`. Keep the matrica/albumterv components behaviourally untouched.

## Tests
*(Web specs; no API tests — REFACTOR-002 is web-only.)*
- **HierarchyBuilder.disclosure_hides_advanced_by_default** (unit): advanced slot hidden until toggled.
- **HierarchyBuilder.add_remove_reorder_emit** (unit): UI actions emit the right outputs; drop emits reordered ids (two-pass parity).
- **HierarchyBuilder.preview_reflects_reference_order** (unit): preview list follows reference order.
- **HierarchyBuilder.empty_and_published_states** (unit): empty-state copy; controls disabled when not a draft.
- **HierarchyList.cards_and_new_affordance** (unit): renders cards, „Új …", archived-toggle filters.
- **Block/Topic/Module/CurriculumBuilder.adapter_wires_api** (unit, per level): adapter maps inputs/outputs to the right `AlbumApi` calls (add → addXById with the published version id, reorder → reorderX, publish → publishXDraft).
- **HierarchyExplorer.visual_alignment** (unit, light): still resolves referenced versions after restyle (no behaviour change).
- **Regression**: existing `*-builder.component.spec.ts` behaviours preserved (migrated, not deleted).
- Live e2e (manual click-through): browse → create → add references → reorder → publish, per level, behind the béta switch.

## Documentation update
- [ ] `apps/matricas-album/docs/architecture.md`, Frontend Architecture section: note the shared hierarchy-builder kit + browse/editor split. Path: `apps/matricas-album/docs/architecture.md`
- [ ] `LOG.md` entry per shipped phase. Path: `apps/matricas-album/LOG.md`
- [ ] `/wiki` refresh of [[matricas-album-projekt-allapot]] UX-state line after Phase 3.

---

## Task breakdown

### Phase 1 — Shared builder kit + Blokkműhely proof
> **Releasable**: after this phase, Blokkműhely runs on the shared kit with the new calm UX; the other three are untouched. This is the pattern other levels copy.

#### Task 1.1 — `HierarchyPreviewComponent`
- [ ] **File**: `shared/ui/hierarchy-builder/hierarchy-preview.component.ts`
- **Depends on**: nothing
- **Description**: Presentational ordered preview: takes `items: { title: string; sub?: string; badge?: string }[]`, renders an ordered list with `ma-chip` badges, styled to match `matrica-preview` (tokens, spacing, empty state). No domain logic.
- **Releasable**: a reusable preview other builders embed.
- **Tests (TDD)** — `hierarchy-preview.component.spec.ts`: `renders_items_in_order`, `empty_state`. Checkpoint: `ng test --include='**/hierarchy-preview.*'`

#### Task 1.2 — `HierarchyBuilderComponent` (shared 3-pane shell)
- [ ] **File**: `shared/ui/hierarchy-builder/hierarchy-builder.component.ts`
- **Depends on**: Task 1.1, existing `CreationShellComponent`
- **Description**: Config-driven presentational builder per the Architecture inputs/outputs. Left = searchable library (add buttons), center = CDK drag-drop reference list (remove + projected per-row controls), right = preview (default `HierarchyPreviewComponent` or projected). Owns search, the „Részletes beállítások" disclosure, consistent verbs, busy/disabled + empty states. Emits `add/remove/reorder/publish/createDraft`; **no `AlbumApi`**.
- **Releasable**: the shared workspace any level can adopt.
- **Tests (TDD)** — `hierarchy-builder.component.spec.ts`: `disclosure_hides_advanced_by_default`, `add_remove_reorder_emit`, `preview_reflects_reference_order`, `empty_and_published_states`. Checkpoint: `ng test --include='**/hierarchy-builder.*'`

#### Task 1.3 — Migrate `BlockBuilderComponent` onto the shared kit
- [ ] **File**: `features/block-builder/block-builder.component.ts` (+ spec)
- **Depends on**: Task 1.2
- **Description**: Reduce the block builder to a thin adapter: provide config (title „Blokkműhely", childNoun „tevékenység"), wire `AlbumApi` (library = published activities, references = draft activities) to the shared inputs/outputs, project the role select per row + the flow/grouping selects into the advanced slot. Plain-language labels + verbs. No behaviour change.
- **Releasable**: Blokkműhely has the aligned UX end-to-end.
- **Tests (TDD)**: `adapter_wires_api` (add → `addBlockActivity` with role; reorder → `reorderBlockActivities`; setRole → `updateBlockActivityRole`; publish → `publishBlockDraft`); keep prior drag/role/preview specs green. Checkpoint: `ng test --include='**/block-builder.*'`

### Phase 2 — Migrate Témakörök, Modulok, Tantervek
> **Releasable**: after each task, that level runs on the shared kit; after the phase all four level editors are consistent.

- **Task 2.1** — Migrate `TopicBuilderComponent` to the shared kit (childNoun „blokk"; library = published blocks; preview shows block + activity count). Tests: adapter wiring + preserved specs.
- **Task 2.2** — Migrate `ModuleBuilderComponent` (childNoun „témakör"). Tests as above.
- **Task 2.3** — Migrate `CurriculumBuilderComponent` (childNoun „modul"). Tests as above.

### Phase 3 — Browse/editor split, explorer alignment, plain-language pass
> **Releasable**: the full set browses + edits like the rest of the product.

- **Task 3.1** — Shared `HierarchyListComponent` (card grid + „Új …" + archived-toggle), config-driven; add list routes `…/{level}` and editor routes `…/{level}/:id`; update `app.routes.ts` + sidebar. Tests: cards render, new affordance navigates, archived filter.
- **Task 3.2** — Point each level's list + editor at the new routes; create flows from the list („Új …" → editor on a fresh draft). Tests: per-level browse→create→edit smoke.
- **Task 3.3** — Restyle `HierarchyExplorerComponent` (Felépítés) to the shared card/row + chip language; keep referenced-version resolution. Tests: `visual_alignment` (behaviour preserved).
- **Task 3.4** — Plain-language + verb-consistency + empty-state copy pass across all five surfaces; helper microcopy under non-obvious controls. Tests: `labels_present` smoke.
- **Task 3.5** — Docs: architecture.md Frontend section + LOG entry + `/wiki` projekt-állapot UX-state refresh.
