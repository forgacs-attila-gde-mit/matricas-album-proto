---
name: adr-writer
description: Use when capturing an architecture or design decision that has lasting consequences — a tradeoff was made, an alternative was rejected, an invariant was set, a scope boundary was drawn, or a coding agent made a non-trivial design call worth preserving. Triggers in this wiki, in any delivery package, and in any future PMS codebase where ADRs live alongside source.
---

# ADR Writer

## Overview

An ADR (Architecture Decision Record) is a durable artifact: a future engineer reading it years later must be able to reconstruct what was decided, why it was chosen over alternatives, what it costs to undo, and when to reconsider it. Anything less is a note, not a decision record.

**Core principle:** A decision without a named decider, dated alternatives, reversibility cost, revisit trigger, and follow-up actions is not an ADR — it's an opinion. The discipline of writing all five forces the team to actually decide rather than drift.

## When to Use

Write an ADR when any of these is true:

- The decision sets or changes an invariant (e.g., "audit fields are token-derived, never client-supplied").
- The decision rejects one or more alternatives that a future engineer would plausibly propose again.
- The decision constrains a contract, schema, or boundary that other work depends on.
- The decision was made in a meeting/session and lives only in someone's memory.
- A coding agent made a meaningful design call during implementation (capture it before context is lost).
- A constraint was lifted or added in scope (e.g., "Keycloak provisioning deferred to phase N+1").

Do **not** write an ADR for:

- Routine code-style picks (use a lint rule or CLAUDE.md/AGENTS.md note).
- Pure refactors with no behavioral change (commit message is enough).
- Reversible-in-an-hour choices in throwaway code.
- Decisions already captured in a higher-level ADR (link, don't duplicate).

If in doubt: write the ADR. Cheap to keep, expensive to recover.

## ADR vs Decision Log Entry vs Wiki Page

| Artifact | When to use | Where it lives |
|---|---|---|
| **Standalone ADR** | Architectural decision with lasting effect across components or teams | `wiki/decisions/<slug>.md` (or `<repo>/docs/adr/NNNN-<slug>.md` in a codebase) |
| **Decision log entry** | Small project-bound decision, traceable inside a delivery package | `delivery/<project>/09-decision-log.md` (append to the curated log) |
| **Concept/domain page edit** | The decision is the page itself (e.g., a domain model choice) | The relevant `wiki/concepts/` or `wiki/domains/` page; mention the decision inline |
| **Log line only** | One-line change with no rationale needed | `wiki/log.md` (append-only chronological log) |

When ambiguous, write a standalone ADR — it is the most durable form.

## The Template (mandatory — every section is load-bearing)

```markdown
---
title: <Title Case, descriptive, ≤70 chars>
type: decision
tags: [<domain>, <topic>, <status: draft|accepted|superseded|rejected>]
created: YYYY-MM-DD                # date the decision was TAKEN, not today
updated: YYYY-MM-DD
decided_by: <person, role, or session — never blank>
sources: [<source-slug-1>, ...]    # raw sources that informed this
related: [<page-slug-1>, ...]      # other wiki pages; use bare slug form consistently
supersedes: [<adr-slug>]           # omit if none
superseded_by: [<adr-slug>]        # omit if none
---

# <Title>

One-paragraph summary that stands alone: what was decided, in plain language, in 2–4 sentences. A reader who reads only this paragraph and nothing else must come away knowing what the decision is.

## Status

- **Status:** draft | accepted | superseded | rejected
- **Decided on:** YYYY-MM-DD
- **Decided by:** <person / role / session>
- **Scope:** <what this applies to — components, phases, teams>

## Context

What problem prompted this decision. Include the *forces* in tension: constraints, prior commitments, stakeholder asks, sources. Link to relevant concept pages, sources, and prior ADRs. A reader should finish this section understanding why a decision was needed *now*.

## Decision

What was decided, precisely. Prefer concrete language: field names, enum values, contract shapes, scope boundaries. If a behavior or invariant is set, state it as a rule, not a wish.

## Alternatives Considered

For each alternative that a future engineer might plausibly propose, name it and say why it was rejected:

- **<Alternative name>** — <one-paragraph description>. **Rejected because:** <specific reason tied to context/drivers>.
- **<Alternative name>** — …

At least one alternative MUST be listed. If you cannot name an alternative, the decision is either obvious (don't write an ADR) or under-explored (do more thinking before writing).

## Consequences

**Positive:**
- <effect, with the *why* if non-obvious>

**Accepted trade-offs:**
- <thing that gets worse or harder, and why we accept it>

These are not predictions — they are commitments. Things the team has agreed to live with.

## Risks

What could go wrong *because of this decision*, distinct from accepted trade-offs:

- <risk>: <mitigation or "accepted, monitored via X">
- <risk>: …

If there are no risks, write "None identified" and move on — but pause first, because that is rare.

## Reversibility

How expensive is it to undo this decision later?

- **Cost class:** cheap (hours) | moderate (days, single PR) | expensive (migration + coordination) | one-way door (effectively irreversible)
- **What undoing involves:** <data migration, contract change, retraining, customer comms>
- **What we'd lose by undoing:** <data, history, learnings>

This section forces the team to be honest about door type. One-way doors deserve more deliberation than they usually get.

## Revisit Trigger

When should this decision be re-examined?

- **By date:** YYYY-MM-DD (optional — only if the decision is time-bound)
- **By event:** <e.g., "when AWS migration completes", "when we reach 10 tenants", "if Keycloak adds X feature">
- **By signal:** <e.g., "if cross-App leakage incidents exceed 0", "if support tickets about X cross threshold">

At least one trigger MUST be present. "Never" is not a valid trigger — every decision can become wrong.

## Follow-Up Actions

Concrete work items this decision creates. Each item has an owner and a tracker link or ticket reference (or `(unassigned)` if not yet assigned — but flag those for the next planning pass).

- [ ] <action> — owner: <name>, tracker: <link or ticket>
- [ ] <action> — owner: <name>, tracker: <link or ticket>

If there are no follow-ups, write "None — fully captured in spec/code." Be sure that is true before writing it.

## See Also

- [[<related-page-slug>]]
- [[<source-slug>]]
- [[<prior-or-superseded-adr-slug>]]
```

## Mandatory Wiki Updates (do not skip)

After writing the ADR file, you MUST also:

1. **Update `wiki/index.md`** — add the new ADR to the Decisions section with a one-line description. If a section count is shown (e.g. "Decisions (3)"), increment it.
2. **Append to `wiki/log.md`** — a one-line entry in the project's log style:
   ```
   ## [YYYY-MM-DD] decision | <Title>
   <one-sentence summary>
   ```
3. **Update related pages' frontmatter** — every page in `related:` must have this ADR's slug added to *its* `related:` block. ADRs are bidirectional.
4. **If the ADR supersedes another:** set `superseded_by:` on the old ADR, set its body Status to `superseded`, and add a top-line note pointing here.

The ADR is not finished until these four updates land in the same commit.

## Naming Convention

- Filename: `kebab-case.md` matching the title's key noun phrase.
- Prefer noun-phrase over verb-phrase: `pms-application-management-mode.md`, not `decide-management-mode.md`.
- For codebases that prefer numbered ADRs: `NNNN-<slug>.md` with monotonically increasing N (don't gap, don't re-use).
- Do NOT include dates in the filename — the frontmatter handles that.

## Frontmatter Consistency Rules

- `related:` uses **bare slugs only** (no `path/...|Title` form, no path prefix). If a slug collides, qualify by section in the link body, not the frontmatter.
- `tags:` does not encode status (Status is its own field and body section).
- `created:` is the date the decision was taken, not the date the file was written. If you're writing an ADR for a decision made earlier, backdate `created` and set `updated` to today.
- `decided_by:` is required and never blank. Use a person, a role, or a named session (e.g., `2026-05-07 PMS planning session`).

## Quick Reference: ADR Section Audit

When reviewing an ADR (yours or someone else's), check each section against this test:

| Section | Passing question |
|---|---|
| One-paragraph summary | Could a stranger restate the decision after reading only this? |
| Status | Are decider, date, and scope all present? |
| Context | Is the *why-now* clear, with named forces in tension? |
| Decision | Is it stated as a rule/invariant, not as an aspiration? |
| Alternatives | At least one named alternative with a specific rejection reason? |
| Consequences | Are accepted trade-offs explicit (not hidden as "minor" caveats)? |
| Risks | Distinct from trade-offs and tied to mitigations? |
| Reversibility | Cost class named (one-way door called out if so)? |
| Revisit trigger | Date, event, or signal — at least one named? |
| Follow-up actions | Owners assigned or explicitly flagged unassigned? |
| Wiki updates | index.md + log.md + related-pages backlinks landed? |

A "no" on any row means the ADR is not done.

## Common Mistakes

- **Decision without alternatives** — "we will do X" without naming the rejected Y and Z. Future engineers cannot tell whether the alternatives were considered or ignored.
- **Consequences without trade-offs** — only listing positives. Every real decision has a downside; if you cannot name one, you have not finished thinking.
- **No revisit trigger** — the ADR becomes immortal and load-bearing without anyone re-examining it. Even "accepted forever" decisions should have a trigger like "if a new tenant model emerges."
- **Reversibility hand-waved** — "easy to change later." Quantify: hours, days, migration, or one-way door. Be honest.
- **Forgetting wiki updates** — the ADR file lands but `index.md` and `log.md` don't, and the related pages don't backlink. The ADR becomes an orphan and dies. The 4-step mandatory update list above prevents this.
- **Writing today's date as `created`** — wrong if the decision was taken earlier. Backdate `created` to when the call was actually made; set `updated` to today.
- **"None identified" used to skip Risks/Follow-ups without pausing** — these sections are checkpoints to slow you down. If you write "None," pause for 30 seconds first.

## Red Flags — STOP, ADR Is Not Ready

- Alternatives section is empty or contains only strawmen
- Reversibility says "easy" without a cost class
- Decided_by is blank or "the team"
- No revisit trigger
- Follow-up actions all `(unassigned)` with no flag for the next planning pass
- Status is `accepted` but the related pages have not been updated
- The summary paragraph cannot be read in isolation
- The decision is written as a wish ("we should…", "ideally…") instead of a rule

All of these mean: the ADR is a draft, not an accepted decision. Either complete it or mark Status `draft` and stop calling it final.

## See Also

- `AGENTS.md` (wiki schema) — ADRs live in `wiki/decisions/`; this skill adds discipline on top of that location
- `wiki/decisions/aws-migration-readiness-assumption.md` — an existing ADR with an explicit revisit trigger; use as a positive example for that section
- `wiki/log.md` — where to append the one-line log entry after writing an ADR
- `pms-task-packet` — the PMS skill that explicitly requires agents to surface deviations; those deviations are often ADR-worthy
