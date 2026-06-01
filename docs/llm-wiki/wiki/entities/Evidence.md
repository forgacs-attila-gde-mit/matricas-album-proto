---
title: Evidence
type: entity
sources:
  - apps/matricas-album/docs/architecture.md
updated: 2026-06-01
lang: en
---

# Evidence

`Evidence` is the domain entity that carries a team's learning trace against one runtime sticker. It is the persistence of the `bizonyíték` (see [[Glossary]]) and the technical anchor of the product's central invariant: a `matrica` is an **evidence-bearing learning episode**, not a reward badge. The pedagogy behind this is [[tanulasi-bizonyitek-evidence]]; the surrounding domain objects are on [[AlbumDomain]]; the full prototype state is [[matricas-album-projekt-allapot]].

## What evidence is

A learning evidence is any visible student trace from which thinking, choice, attempt, collaboration, or progress can be inferred. It is **not** the same as a finished solution: it can be a photo, a measurement table, an argument map, a draft, a prototype, a failed first attempt, a revised version, a reflective note, or a response to teacher feedback. The evidence portfolio is the ordered collection of these — a learning story, not a document store: it shows what question students started from, what evidence they brought, what they changed, and where they arrived.

This is why a `matrica` differs from a badge system: a meaningful matrica has student action, a visible evidence, teacher feedback, and Reflexió behind it. Domain guardrail (verbatim from the app): "a matrica itt nem jutalom-badge, hanem tanulási epizód."

## The `Evidence` record

`Evidence` is a team's submission against an `InstanceSticker`. Key fields:

| Field | Meaning |
|---|---|
| `InstanceStickerId` (FK) | the runtime sticker the submission answers |
| `TeamId` (FK) | the submitting `Team` |
| `Type` | evidence type (photo, measurement, argument map, draft, etc.) |
| `Status` | submission status (e.g. `varakozik`) |
| `Title`, `Description` | the team's submission content |
| `HelpRequest` | free-text help text, when the team asks for help |
| `HelpRequested: bool` | **structured** student-side help signal |
| `Reflection` | the team's Reflexió on this episode |
| `TeacherFeedback` | the teacher's saved feedback (read-only for students) |
| `SubmittedAt`, `FeedbackAt` | timestamps |
| `SeenByTeamAt` | first time the student side rendered the feedback (stops "new" flagging) |

Evidence and teams always belong to an `AlbumInstance`, never to a template, and stay attached to runtime stickers and teams across a template-version upgrade.

## HelpRequested — the structured help signal

`Evidence.HelpRequested` is the most pilot-significant flag on the entity. The student evidence form has a `Segítséget kérek a tanártól` checkbox that maps to it. The teacher feedback queue surfaces flagged rows with a danger chip and orange border plus a `Csak segítségkérések` filter. **Saving teacher feedback clears the flag** (`HelpRequested = false`). This is pilot-critical: it shows not just whether a product was made, but where a team got stuck — a learning-activity signal, not just a usage signal.

A separate, free-form `TeamHelpRequest` (scoped optionally to an instance sticker, with `Question`, `CreatedAt`, and `ResolvedAt` where null = still open) handles help that is not tied to a specific submission. The feedback queue keeps the two kinds distinct.

## The feedback → revision cycle

Teacher feedback is **not** automatic scoring. On `POST /api/evidence/{id}/feedback` the teacher decides the next step, which drives `InstanceStickerTeamProgress`:

- `nextStep = javitas` → team progress goes to `javitas` (revision requested);
- `nextStep = lezar` → progress goes to `elkeszult` (closed);
- `nextStep = megj` → progress stays `varakozik` (note only).

A resubmit (`POST /api/evidence`) moves a team from `javitas` back to `varakozik`. The student sees the feedback read-only; a `Csapatunk eddigi munkája` panel lists prior feedback-bearing submissions. Note that `InstanceStickerTeamProgress.State` (per-team work state: `varakozik | javitas | elkeszult | reflektalt`) is distinct from `InstanceSticker.State` (lifecycle-only `tervezett | aktiv`) — a sticker can be `aktiv` for the class while teams sit in different submission states. `InstanceStickerTeamProgress` is the single source of truth for per-team standing; see [[AlbumDomain]] for its state machine.

## Why it matters for the pilot

The evidence portfolio is a strong anchor for [[matricas-pilot-merese|pilot measurement]]: it shows not only that the system was used, but that student activity, revision, Reflexió, and teacher adaptation actually happened. The [[AiAdvice|AI]] can produce a `pendingEvidenceDigest` over outstanding evidence and a `draft-feedback` for a specific submission, but it never auto-saves teacher feedback — the [[pedagogia-elobb-ai-masodik]] guardrail keeps the teacher in control of the feedback that drives revision.
