---
title: "ADR001: A shared activity domain (no per-method bounded context)"
type: adr
sources:
  - apps/matricas-album/docs/architecture.md
  - raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md
updated: 2026-06-01
lang: mixed
---

# ADR001: A shared activity domain (no per-method bounded context)

Status: accepted

## Context

The 4K/6K market research catalogued a large set of evidence-backed teaching methods (see [[aktivitas-csaladok]]): produktív kudarc, guided inquiry/5E, Peer Instruction, argument-driven inquiry/CER, strukturált kollaboratív problémamegoldás, metakognitív önszabályozás, design challenge, Geo-Inquiry/learning expedition, and more. The naive reading is that each method deserves its own application module — a dedicated Peer Instruction polling engine, a separate debate platform, a separate lab notebook, a PBL board, a portfolio product, a question-generator module.

That reading is wrong. The research found that the methods do **not** differ in structure; they differ only in surface metadata. Underneath, they share one repeating pedagogical cycle (the six-element loop from [[aktivitas-csaladok]]): kihívás/kérdés → tanulói döntési pont → tanári scaffold → látható [[Evidence|evidence]] → feedback és revízió → progress és reflexió (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

The Matricás Album prototype already implements exactly this loop. Its core domain entities — `StickerResource`/`StickerVersion`, `AlbumTemplate`/`AlbumTemplateVersion`, `AlbumInstance`, `InstanceSticker`, `Evidence`, `InstanceStickerTeamProgress`, `TeamHelpRequest`, `QualityDimension`, and `AiAdvice` — together form a general activity-run engine, not an album-only feature (([architecture](../../../../apps/matricas-album/docs/architecture.md))). The `StickerVersion` fields (`StudentInstruction`, `TeacherSteps`/`StickerVersionTeacherStep`, `StudentChoice`, `ExpectedProduct`, evidence-type label, `ReflectionPrompt`, `BPlan`, `LowResource`) already cover the activity-card payload every method needs.

A second key affordance is the unit row type: `AlbumTemplateVersion.DurationType` is one of `het | ora | fazis` (see [[Glossary]]). The same template/sequence model therefore already spans a többhetes album, a 3-fázisú design challenge, and a single-óra inquiry — without per-format code.

## Decision

**Do not build a per-method bounded context. The Sticker / Album / Instance / Evidence core IS the common activity-run engine.** A method is a `Pattern` / `MethodFamily` value plus template logic — not a separate module, schema island, or service.

Concretely:

1. **One domain, methods as data.** A pedagogical method is expressed as `PatternKey`/`PatternName` template metadata and (future) a `MethodFamily` field on the activity card, not as a new bounded context. The currently persisted `AlbumTemplatePatterns` enum (`altalanos | produktiv-hibazas | kutatas-bizonyitas`, see [[Glossary]]) is the seed of this: a pattern preconfigures the first draft's unit structure, sticker order, and reflection prompts, then steps out of the way.
2. **Keep the Matricás Album architectural spine.** Versioning (`AlbumTemplateVersion`), instance execution (`AlbumInstance` + `InstanceSticker`), per-team evidence/progress (`Evidence`, `InstanceStickerTeamProgress`), help/feedback, and `AiAdvice` are a good general foundation and stay as the engine.
3. **The next domain growth is structured activity metadata, not UI chrome.** When enrichment is needed, add general, parameterizing fields to `StickerVersion`-as-`ActivityVersion`: `MethodFamily`/`Pattern`, `CompetencyTags` (4K/6K/transzformatív), `InteractionMode` (artifact, poll, debate, prototype, model, fieldwork, reflection), `ParticipantMode` (individual, pair, team, whole-class), `EstimatedMinutes`, `EvidenceSlots`, `RubricDimensions`. These parameterize the same card; they do not split the domain.
4. **Specialized UIs are views over one runtime model.** Album view, in-lesson activity view, feedback inbox, and teacher planner all read the same `AlbumInstance` runtime — they are not separate products.
5. **Don't try to cover the whole catalogue in the pilot.** An eight-family MVP set (guided inquiry/5E, CER/argument-driven inquiry, design challenge, matematikai modellezés, strukturált kollaboratív problémamegoldás, Studio Thinking/critique-revision, Geo-Inquiry/place-based inquiry, strukturált akadémiai vita/SSI) maximizes learning with minimal architectural divergence.

Product-language consequence: "Matricás Album" should not become the mandatory metaphor for every activity. The matrica is a student-facing UX and motivation wrapper over the activity card; the engine beneath is a general tanári activity workflow-core. The current product deliberately bridges this for teachers as `Tevékenység (matrica)` (see [[Glossary]]) — the DB/API naming stays `Sticker*`, while "tevékenység" is the product-planning language. There is **no** `ActivityResource` rename and **no** Activity Studio UI in the pilot.

## Consequences

**Positive**

- Most catalogued methods are covered first-class with no new code: guided inquiry/5E, CER, design challenge, Studio Thinking, scaffolded PBL, learning expedition/Geo-Inquiry, matematikai modellezés, strukturált kollaboratív problémamegoldás, SSI, and simple jigsaw all map onto `kártya → csapatmunka → evidence → feedback → revízió/reflexió`.
- A second tier (produktív kudarc, Predict-Observe-Explain, metakognitív önszabályozás, Peer Instruction) is reachable with small, general additions — `EvidenceSlots`, `InteractionMode`, `ParticipantMode`, `RubricDimensions` — rather than bespoke subsystems.
- The same engine serves a single-lesson activity, a multi-lesson inquiry, and a multi-week learning expedition, because `DurationType` already abstracts the unit row type. This makes [[matricas-album|Matricás Album]] a strong, demo-friendly beachhead for a much wider workflow-core.
- Less surface area to test, secure, and maintain; the pilot stays shippable.

**Negative / costs and limits**

- Some methods genuinely want extra structure the current `Evidence` (one submission) does not yet model. Productive failure, POE, critique-revision, and CER imply multiple evidence moments per activity (`attempt`, `observation`, `claim`, `revision`, `reflection`); MVP can model these as successive activity cards, but the cleaner shared abstraction is `EvidenceSlot`. This is deferred, accepted debt.
- `QualityDimension` is a usable rubric anchor but needs to be made more structured (kritériumkód, leírás, evidence-kapcsolat, minimum-elvárás, optional AI-check) before competencies stop being decorative labels.
- Truly real-time or specialized interactions (a live Peer Instruction vote distribution, a dedicated debate platform, a lab notebook, individual learner journaling) are explicitly **out of scope for v1** and only become later specialized views over the same activity-run domain.

**Guardrails preserved**

- This decision changes no domain language in v1: it stays `AlbumTemplate`, `StickerVersion`, `AlbumInstance`, `Evidence`, `Feedback`, `Reflexió`. It is not a method marketplace or generalized activity platform yet.
- Pedagogy-first holds: the engine supports the teacher's intent and keeps the tanulói döntési pont intact; it does not let the AI author the whole activity (the [[pedagogia-elobb-ai-masodik|pedagógia előbb, AI második]] guardrail).

For the project-state view of how this engine sits in the current build, see [[matricas-album-projekt-allapot]]. The full domain object map is [[AlbumDomain]].
