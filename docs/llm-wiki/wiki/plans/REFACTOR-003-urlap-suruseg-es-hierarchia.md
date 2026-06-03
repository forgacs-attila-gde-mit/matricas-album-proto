---
title: "REFACTOR-003 — Űrlapsűrűség csökkentése és vizuális hierarchia a form/drawer felületeken"
type: plan
sources:
  - apps/matricas-album/src/MatricasAlbum.Web/src/styles.scss
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/shared/ui/btn/btn.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/shared/ui/drawer/drawer.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-create-drawer/album-create-drawer.component.ts
  - apps/matricas-album/src/MatricasAlbum.Web/src/app/features/album-template-detail/album-template-detail.component.ts
updated: 2026-06-03
lang: mixed
---

# REFACTOR-003 — Űrlapsűrűség csökkentése és vizuális hierarchia a form/drawer felületeken

**Purpose**: Reduce visual density and fix information hierarchy on every field-dense form/drawer surface (required-first ordering, collapsed optional sections, labeled groups, one visual primary action, WCAG AA labels) by introducing the missing shared form primitives into the in-house design system — shared-first, per-screen second.
**Audience**: Matricás Album dev team (Angular Web); pilot teachers benefit.
**Status**: Complete (executed 2026-06-03 on branch `design-improvement`)

---

## Background

A 2026-06-03 design critique of the running app found the entity-creation drawers and form pages cluttered: optional fields mixed with required ones (often above them), no required indicators, 11px uppercase grey labels failing AA contrast, multiple primary-looking actions per screen, and ad-hoc one-off button styles. The Step 0 inventory confirmed the design system had **no** form-field, section, or disclosure primitive — the `label.field` CSS pattern was copy-pasted into 5 components; spacing was hardcoded px; `.card-section-title` (`--n-400`, ≈2.5:1) failed WCAG AA; five drawer close buttons had no accessible name.

Product-owner decisions (2026-06-03): work happens on the **`design-improvement`** branch (created off `main` for exactly this); the signals/ngModel + hand-rolled `canSubmit()` validation convention is **kept** (the single ReactiveForms screen, `student-current`, stays reactive); no migration to Reactive Forms. Karma test infrastructure was ported from `origin/gold-standard-ingest-refactor-plan` (Task 0) so every change is spec-covered.

## Goal

Every form/drawer screen shows only required fields plus its primary decision by default; optional fields sit in one collapsed, keyboard-accessible „Opcionális részletek" disclosure; fields are chunked into labeled sections with token-driven spacing; required fields are marked (visible `*` + ARIA) and ordered first; exactly one filled primary button per screen; all labels/help/placeholder text meet AA 4.5:1 — implemented via four shared design-system primitives, with screens reduced to thin consumers. Saved payloads are byte-identical to before (spec-asserted for the create drawer).

---

## Scope

### In Scope (all shipped)
- Design-system additions: `--space-*` tokens, `--label-fg/--help-fg/--placeholder-fg`, `.sr-only`, `.form-group-label`; `ma-field`, `ma-form-section`, `ma-disclosure`; `ma-btn` `iconOnly`/`ariaLabel`; `ma-drawer` on CDK `cdkTrapFocus`.
- Restructured screens: `album-create-drawer` (all 7 wizard modes), `album-template-detail` (new „Részletek" disclosure), `feedback-drawer`, `teams-list`, `album-plan`, `student-current` (reactive), `student-help`, `student-reflection`.
- One-off button styles eliminated (`adapt-btn`, `handoff-action`, `lesson-icon-btn`, `concept-dismiss`, `icon-btn` ×9, `unit-remove-btn`, `project-prompt-remove`) → `ma-btn` variants; one visual primary per refactored screen.
- Footer hint in `aria-live="polite"`; required markers with `aria-required`; ≥40px icon-button targets.

### Out of Scope
- Reactive-forms migration (explicitly rejected); API/DTO/payload changes; theming redesign.
- The gold-standard branch's hierarchy builders (separate branch; its REFACTOR-002 plan consumes these primitives after merge).
- Full action-hierarchy normalization of non-form screens (see Flagged follow-ups).

---

## Acceptance criteria — verification status
- [x] **AC-1** Required + primary decision visible by default; optional set in one collapsed `ma-disclosure`; save works without expanding (spec: `save_without_expanding_optional`, sticker + template modes).
- [x] **AC-2** Visible `*` + sr-only „(kötelező)" + `aria-required`; required fields precede the optional region in DOM order (spec: `required_fields_first`).
- [x] **AC-3** 2–4 labeled `ma-form-section`s per screen; `--space-lg` inside, `--space-2xl` between; two-up grid only for pairs (Tantárgy+Évfolyam).
- [x] **AC-4** One `variant="primary"` per refactored screen (spec-asserted on the drawer + teams-list); AI actions demoted on `album-plan` (pedagógia-előbb).
- [x] **AC-5** Label/help/placeholder ≥4.5:1 via tokens (audit table below).
- [x] **AC-6** `ma-disclosure` keyboard + `aria-expanded`/`aria-controls`; CDK FocusTrap; `aria-live` footer; 40px icon targets + aria-labels (5 close buttons previously unnamed).
- [x] **AC-7** Create-drawer payload key-set spec-asserted unchanged; full suite 37/37 + build green.

---

## Contrast audit (computed, WCAG 2.x relative luminance)

| Text | Before | On | Ratio before | After | Ratio after |
|---|---|---|---|---|---|
| `.card-section-title` 11px uppercase | `--n-400` #a3a3a3 | white | **2.49 — FAIL** | `--n-600` #525252, 12px | **7.46 ✓** |
| `.field > span` labels 11px uppercase | `--n-500` #737373 | white / `--n-50` / tinted | 4.77 / 4.56 / ~4.4 borderline-FAIL | `ma-field` label 13px 600 `--label-fg` #404040 | **10.04 / 9.6 / ~9.2 ✓** |
| `.help` 12px | `--n-500` #737373 | tinted panels (#f0f9ff, #f0fdf4, `--n-50`) | ~4.4–4.6 borderline | `--help-fg` #525252 12.5px | **~6.9–7.1 ✓** |
| placeholders | browser default (unset) | white | undefined | `--placeholder-fg` #525252 | **7.46 ✓** |
| `ma-btn` primary text | white on `--primary-500` #9333ea | — | 5.37 ✓ (unchanged) | — | 5.37 ✓ |
| `.form-group-label` (new) | — | white | — | `--label-fg` #404040 | **10.04 ✓** |

All fixes land in tokens/shared component styles; zero inline overrides.

## What shipped where (commit trail, branch `design-improvement`)
- `5584c92` Task 0 — karma infra port (from origin/gold-standard, file extraction)
- `7ed36e9`–`d39c2ef` Phase 1 — tokens + `ma-field`/`ma-form-section`/`ma-disclosure`/btn+drawer (cherry-picked, identical bases)
- `1302b29`, `e880271` — feedback-drawer + teams-list, student screens (cherry-picked)
- `ed5f98b` — create drawer, all 7 modes (hand-done against this base; payload spec)
- `cc17628` — album-template-detail „Részletek" disclosure
- `04fb159`, `0a7b10e` — album-plan + global icon-btn/primary sweep

## Flagged follow-ups (not in this round)
- **Multi-primary non-form screens**: `sticker-detail-drawer` (6 primaries), `teacher-dashboard` (3), `closure` (3), `album-instances` (2), `album-templates`/`sticker-library`/`differentiation`/`feedback-queue`/`settings` (1–2 each) — per-screen primary-action decisions need product input; the mechanical demotion pattern is established.
- `student-reflection` per-sticker saves demoted to secondary; if a future audit prefers per-card primaries, revisit.
- The gold-standard branch merge will bring the hierarchy builders; apply `ma-field` + the single-primary rule there (its REFACTOR-002 builder kit should consume `ma-disclosure`/`ma-field`).

## Tests
37 specs green: smoke (2), field (4), form-section (3), disclosure (4), btn (2), drawer (3), create-drawer (11: disclosure/required-first/save-collapsed/payload-shape per mode family), template-detail (3), teams-list (2), student-current (3). Checkpoint: `npm test` + `npm run build` in `src/MatricasAlbum.Web`.

## Documentation update
- [x] This plan page (+ wiki `index.md` Plans section, `log.md` entry).
- [x] `apps/matricas-album/LOG.md` entry.
- [ ] Live click-through at `localhost:4300` (web image rebuild) — owner: product owner; the runtime verification beyond specs/build is manual.
