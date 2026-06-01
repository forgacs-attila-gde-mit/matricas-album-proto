---
title: AiAdvice
type: entity
sources:
  - apps/matricas-album/docs/architecture.md
updated: 2026-06-01
lang: en
---

# AiAdvice

`AiAdvice` and `AiAdviceRun` are the domain entities for the Matricás Album AI layer: persisted, target-aware AI advice plus its audit trail. The defining property is that **advice is lifecycle-bearing and never auto-applied** — it materializes the [[pedagogia-elobb-ai-masodik|pedagógia előbb, AI második]] guardrail. Hungarian domain tokens here are canonical — see [[Glossary]] on first use. The surrounding objects are on [[AlbumDomain]]; the full prototype state is [[matricas-album-projekt-allapot]].

## How the AI runs

The AI runs as a **separate** Python/FastAPI/Agno agent. The .NET API builds a minimized, sanitized state snapshot, passes it to the agent, and persists the returned advice. The agent receives only the sanitized snapshot — it **cannot read the app database and cannot write `agent-wiki`**. Team and member data are aliased/pseudonymized and text lengths are capped before the snapshot leaves the API.

- Without an `OPENAI_API_KEY`, the agent returns a **deterministic mock fallback**, so the demonstrator is testable offline.
- With a key, the answer follows an **OpenAI Structured Outputs** schema (model env `OPENAI_MODEL`, default `gpt-4o-mini`).
- The agent grounds advice in the static methodology `agent-wiki` projection (`matricas-methodology-agent-wiki-v1`) via local keyword search.

## Target-aware advice

Advice is target-aware: every target shares the same persisted `AiAdvice` / `AiAdviceRun` lifecycle but differs in audience, snapshot, and guardrail. Generation is `POST /api/ai-advice/generate`; listing is `GET /api/ai-advice?ownerType=&ownerId=&audience=`.

| AI target | Purpose | Guardrail |
|---|---|---|
| teacher advice | general teacher advice for a Futó album | suggestion, not decision |
| student Socratic advice | thought-provoking questions for a team/sticker context | no finished solution; 2-4 Socratic questions only |
| `pendingEvidenceDigest` | summary of outstanding [[Evidence|bizonyíték]] | the teacher decides what to do with it |
| `helpRequest` triage | question ideas for an open help request | does not solve the task |
| create-sticker | a runtime `Tevékenység (matrica)` suggestion | the teacher edits and explicitly saves |
| draft-feedback | a feedback text draft for an evidence | never auto-saves |
| `closureSynthesis` | Projektzárás patterns + reflection questions | no automatic scoring, no team ranking |

Student advice cards render only Socratic questions for the active team/sticker, and clear automatically when the selected team changes (the user must re-click `Kérdések frissítése`). The pending-evidence digest renders above pending rows and is cached by `SnapshotHash` + prompt version + projection version. Help-request triage renders Socratic questions inline under the request. Closure synthesis intentionally does not score the class, rank teams, or decide next pedagogy.

## Lifecycle and statuses

`AiAdvice` is lifecycle-bearing: its `Status` moves through `uj | elfogadott | elutasitott | alkalmazott | hibas`. Action payloads (`ActionType`, `ActionPayloadJson`) stay **drafts** until a teacher applies them. Status changes via `PATCH /api/ai-advice/{id}/status`; actionable advice is applied via `POST /api/ai-advice/{id}/apply` (currently create-sticker or draft-feedback).

- **create-sticker apply** creates a `StickerResource` + `StickerVersion`, then an `InstanceSticker` only in the current `AlbumInstance`, and marks the advice `alkalmazott`.
- **draft-feedback** pre-fills the feedback drawer; it never saves teacher feedback automatically.

Teacher advice cards are persisted `AiAdvice` records and can open an edit-before-apply drawer.

## Records and audit (advice_trace)

| Entity | Role |
|---|---|
| `AiAdviceRun` | one generation run: `Audience`, `OwnerType`/`OwnerId`, `TargetType`/`TargetId`, `SnapshotHash`, `Status`, `PromptVersion`, `ProjectionVersion` |
| `AiAdvice` | one advice row from a run: `Audience`, owner/target identity, `TargetKey`, `Kind`, `Severity`, `Status`, `QuestionsJson`, `CitationsJson`, `ActionType`, `ActionPayloadJson` |

The API passes `AiAdviceRun.Id` to the agent as `traceId`. The agent emits JSON `advice_trace` log events with the same `runId`, so the DB audit record and the `ai-agent` container log are searchable by one identifier. The trace logs the wiki-search start, ranked candidates, selected sources, the OpenAI Responses API call's sizes/latency/token use, the fallback path, and response validation — without the full snapshot or prompt. `AiAdviceRun` reuses a cached run when `SnapshotHash` + prompt/projection versions match (notably for the pending-evidence digest).

`AiNote` (`OwnerType`+`OwnerId`, `TargetType`/`TargetId`/`TargetKey`, `Kind`, `Severity`) is the lighter, instance-owned note primitive alongside advice.

## Guardrail: pedagogy first, AI second

The AI co-pilot may help and pre-fill, but it cannot generate a full `Tanterv`/`Modul`/`Témakör`/`Blokk` structure as an irreversible default, and it makes no pedagogical decision. The teacher reviews every save. Closure synthesis remains descriptive and teacher-facing. No `agent-wiki` or AI prompt projection change is implied by hierarchy terminology alone. This is the persisted-entity expression of [[pedagogia-elobb-ai-masodik]]; the mock fallback also means the [[matricas-album]] demo never depends on a live model to tell a coherent story.
