# Matricás album — backlog

Deferred work items. Each entry should state the trigger condition that means "now is the time to do this." When a coding agent finishes the item, move it to `LOG.md` instead of leaving it here.

---

## Finish DurationType ripple across student / instance surfaces

Phase 6 of the DurationType round only updated `album-plan` (weekly head) and `student-current` (the active sticker chip). ~21 other components still hardcode "hét" or "Heti" in user-facing text — see the grep snapshot in the DurationType LOG entry. Trigger: first template seeded with `DurationType = "ora"` or `"fazis"`, a user complaint about "Aktuális hét" showing on an óra-based instance, or any serious move toward a future generic activity-domain surface where unit labels cannot be week-specific.

Touchpoints to revisit (non-exhaustive):
- `album-instances.component.ts`, `teacher-dashboard.component.html`, `closure.component.{ts,html}`
- `student-team`, `student-reflection`, `student-evidence`, `student-help`, `student-album`
- `print-preview.component.{ts,html}`, `quality-panel.component.ts`, `feedback-queue.component.ts`
- `sticker-detail-drawer.component.html`, `differentiation.component.ts`, `teams-list.component.ts`
- `measurement-table.component.ts`, `argument-map.component.ts`

Pattern to apply: replace literal `". hét"` (and "Hét léptetése" copy) with bindings to `store.albumUnitLabel`.

---

## Rename `Week` → `UnitIndex` across DB / DTOs / models

The DurationType round kept the `Week` / `WeekNumber` / `CurrentWeek` column and field names everywhere because renaming touches a lot of code and the conceptual switch from "week" to "unit index" landed cleanly through the new DurationType field alone. Trigger: when a coding agent is already doing other schema churn near these tables, when a future maintainer trips on "Week=8 with DurationType=ora" semantics, OR before the same schema is reused for non-album activity-domain use-cases.

Scope: rename in `Album.cs`, `AlbumDbContext.cs` configuration, migration to rename columns, `WeekPlanDto.WeekNumber` → `Unit.Index`, frontend `weeks`/`week`/`weekNumber` → `units`/`unitIndex`. Big-bang refactor, no behavior change. Domain-generalization note: this is the main deferred refactor that would make the current model read naturally as a future `LearningSequence` / `ClassroomRun`, but it should not be pulled forward just for naming cleanliness.

---

## Split `feedback-drawer` into `StudentEvidenceDrawer` + `TeacherEvidenceDrawer`

- **Why deferred**: Phase 2 introduced a `mode: 'teacher' | 'student'` input on `feedback-drawer.component`. Right now this is the cleanest path — the two modes share the header, evidence body, and (in student mode) the teacher's saved feedback card. Splitting now would duplicate that shared rendering.
- **Trigger to act**: when the mode-gated template grows past ~150 lines, when the two modes start diverging in non-trivial ways (e.g. different styles, different store interactions, or one needs lifecycle behavior the other doesn't), or when a third audience appears. Domain-generalization note: future activity-domain naming alone is not a trigger.
- **Plan when triggered**: extract the shared header/body into `EvidenceSummaryCardComponent`, then `StudentEvidenceDrawer` renders the summary + student footer; `TeacherEvidenceDrawer` renders the summary + AI summary / rubric / feedback form / next-step choices. Both drawers can coexist in the app shell controlled by the role signal — no behavioral changes needed in the store.
- **Affected files**: `src/MatricasAlbum.Web/src/app/features/feedback-drawer/*`, `src/MatricasAlbum.Web/src/app/app.component.ts` (drawer instances).

---

## Locked sticker tiles show their planned week

- **Why deferred**: Phase 1 left the "Hátralévő matrica" tiles with generic "a tanár nyitja meg" copy. The seeded data has a `week` per sticker, so we already know when each unlocks.
- **Trigger to act**: when a student pilot reports confusion about timeline ("when does this open?"). Low priority polish.
- **Plan when triggered**: add a unit-aware chip next to the lock icon on each `.locked-sticker` row, using `store.albumUnitLabel` / `DurationType` rather than hardcoded `{{ s.week }}. hét`.
- **Affected files**: `student-album.component.html` only.

---

## Team identity strip (members + focus) below the team picker

- **Status**: **resolved** by Phase A of `feature/student-view-pages` — the team identity card (name, focus, members) lives on the new Csapatunk page. Keeping the entry as a marker; remove on the next backlog cleanup.

---

## Help-request teacher response text

- **Why deferred**: Phase D ships a toggle-only resolution flow (`PATCH /api/help-requests/{id}/resolve` flips `ResolvedAt`). The teacher cannot leave a written response on the help-request record itself.
- **Trigger to act**: when teachers want a paper-trail of the answer they gave (especially if the conversation didn't happen face-to-face), or when students need a written reply visible on the Segítség page.
- **Plan when triggered**: add `TeamHelpRequest.TeacherResponse: string?` + extend `PATCH /api/help-requests/{id}` to accept the text. Student Segítség page renders it next to the resolved chip. Domain-generalization note: this remains valid for future activity-runs because it is attached to team help requests, not album-specific copy.
- **Affected files**: Domain + migration, `Program.cs` endpoint, `student-help` UI, teacher `feedback-queue` UI.
