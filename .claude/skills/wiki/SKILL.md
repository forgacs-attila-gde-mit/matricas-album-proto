---
description: Operate the LLM wiki — ingest a raw source, lint the wiki, or ask a question
argument-hint: "ingest <raw/file> | lint | <question>"
allowed-tools: Read Write Edit Bash
---

<!-- Pattern: LLM Wiki by Andrej Karpathy https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f -->

## Raw File Guard

`docs/llm-wiki/raw/` files are **human-owned**. Outside of this skill, AI agents must never modify them.

**Within this skill:** if the user explicitly requests a change to a `raw/` file, ask for confirmation before proceeding, then apply the change.

@docs/llm-wiki/index.md

## Operation

The argument string the user passed follows the hint: `ingest <raw/file> | lint | <question>`.

- If the argument starts with **`ingest`**: run the ingest operation on the specified raw file.
- If the argument is **`lint`**: run the lint operation.
- Otherwise: treat the argument as a query question and run the query operation.

---

### Ingest

1. Read the specified `raw/` file.
2. Identify entities, concepts, and summary content — new or updated relative to existing wiki pages.
3. Create or update pages under `wiki/entities/`, `wiki/concepts/`, `wiki/summaries/` with required frontmatter (`title`, `type`, `sources`, `updated`) and `[[WikiLink]]` cross-references.
4. Update the entity, concept, and summary tables in `docs/llm-wiki/index.md`.
5. Append an entry to `docs/llm-wiki/log.md` (operation, source, pages created/updated, contradictions found).
6. Report any contradictions with existing pages to the user; do not auto-resolve them.

---

### Lint

Check each of the following; report findings grouped by category; do not auto-fix anything:

- **Broken links** — `[[WikiLink]]` references whose target file does not exist under `wiki/`.
- **Missing frontmatter** — wiki pages missing any of `title`, `type`, `sources`, or `updated`.
- **Orphan index rows** — index table entries that have no corresponding file in `wiki/`.
- **Orphan pages** — wiki files not listed in any index table.
- **Dead sources** — `sources` frontmatter fields pointing to `raw/` files that no longer exist.

---

### Query

1. Read the index tables to identify entity and concept pages relevant to the question.
2. Read those pages.
3. Answer using only information from wiki pages; state explicitly if the wiki has no data on the topic.
4. If the answer contains non-obvious synthesis not captured in any existing page, offer to save it as a new concept page.
