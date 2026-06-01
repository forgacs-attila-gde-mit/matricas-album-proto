---
description: Operate the Matricás Album LLM wiki — ingest a raw source, lint the wiki, or ask a question
argument-hint: "ingest <raw/file> | lint | <question>"
allowed-tools: Read Write Edit Bash
---

<!-- Pattern: LLM Wiki by Andrej Karpathy https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f -->

## Raw File Guard

`docs/llm-wiki/raw/` files are **human-owned**. Outside of this command, AI agents must never modify them.

**Within this command:** if the user explicitly requests a change to a `raw/` file, ask for confirmation before proceeding, then apply the change.

## Apps Guard

Do **not** read or write `apps/` during wiki work. Never confuse `apps/matricas-album/agent-wiki/` (a runtime asset with `manifest.json`) with `docs/llm-wiki/` (this wiki) — they are different artifacts with no runtime coupling. See `AGENTS.md` §6.

## Language Policy (read `AGENTS.md` §1 for the full rule)

Documentation is split by role and **never translated**. Pedagogy / product / business-requirement pages = **Hungarian** (`lang: hu`); technical / implementation pages = **English** (`lang: en`/`mixed`, where `mixed` = English prose with Hungarian domain tokens verbatim). Hungarian domain tokens and persisted enums stay Hungarian everywhere, including English pages and code. [[Glossary]] is the hu↔en bridge.

@docs/llm-wiki/index.md

## Operation

The argument follows the hint: `ingest <raw/file> | lint | <question>`.

- Starts with **`ingest`** → run ingest on the specified raw file.
- Is **`lint`** → run lint.
- Otherwise → treat as a query question.

---

### Ingest

1. Read the specified `docs/llm-wiki/raw/` file. (If the human hasn't added it yet, ask them to — never create raw files.)
2. Identify entities, concepts, and summary content — new or updated relative to existing wiki pages.
3. Decide the page's **`lang`** from its role: pedagogy/product/BRD → `hu`; technical/implementation → `en` or `mixed`. **Never translate Hungarian domain content into English.** For technical pages, write English prose but keep Hungarian domain tokens verbatim.
4. **Glossary first:** if the source introduces a new Hungarian domain term, add it to `wiki/entities/Glossary.md` (hu term | en gloss | definition | code/enum) **before** using it, and link `[[Glossary]]` on first mention in any `en`/`mixed` page.
5. Create or update pages under `wiki/entities/` (PascalCase), `wiki/concepts/` (kebab-case), `wiki/summaries/` (mirror raw filename), plus `wiki/ADRs/` / `wiki/prompts/` / a `wiki/features.md` row as fitting. Required frontmatter: `title`, `type`, `sources`, `updated`, `lang`. Use `[[Slug]]` links by filename (ASCII slugs; Hungarian diacritics allowed in `title`/headings/body).
6. Update the relevant tables in `docs/llm-wiki/index.md`.
7. Append an entry to `docs/llm-wiki/log.md` (`## [YYYY-MM-DD] ingest | <title>` — source, pages created/updated, contradictions).
8. Report contradictions with existing pages; do **not** auto-resolve. Prefer extending an existing page over creating a new thin one.

Cadence: **one source at a time** — summarize takeaways and confirm before spawning new pages.

---

### Lint

Check each; report grouped by category; do **not** auto-fix:

- **Broken links** — `[[Slug]]` whose target file does not exist under `wiki/`.
- **Missing frontmatter** — pages missing any of `title`, `type`, `sources`, `updated`, or **`lang`**.
- **Orphan index rows** — index entries with no corresponding file.
- **Orphan pages** — wiki files not listed in any index table.
- **Dead sources** — `sources` pointing to `raw/` (or `apps/`) files that no longer exist.
- **Language drift** — a page whose prose language contradicts its `lang`/type (e.g. an `en` ADR written in Hungarian prose, or a `hu` concept drifting into English).
- **Translation leak** — English prose that paraphrases/renames a Glossary Hungarian term instead of citing the token verbatim.
- **Missing Glossary rows** — Hungarian domain tokens used in pages but absent from `[[Glossary]]`; also flag duplicate Glossary rows.

---

### Query

1. Read the index tables to find relevant entity/concept/summary pages.
2. Read those pages (and their cited `raw/` sources for evidence).
3. Answer using only wiki information; state explicitly if the wiki has no data on the topic. Cite pages.
4. If the answer is non-obvious synthesis not in any page, offer to save it as a new concept page (with `lang` set per the policy).
