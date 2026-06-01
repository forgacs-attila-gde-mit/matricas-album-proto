# AGENTS.md — Matricás Album

This repository holds the **Matricás Album** prototype (a Lecke.ai / DPA learning-experience product) **and** an LLM-maintained wiki scoped to it. It was spun out of the broader Lecke.ai discovery knowledge base so the prototype can evolve as its own product with its own focused documentation.

This file is the operating manual. Read it before doing anything else.

---

## 0. Repository layout

```
.
├── AGENTS.md                  # this file
├── CLAUDE.md                  # @-includes AGENTS.md
├── README.md
├── .claude/commands/wiki.md   # the /wiki command (ingest | lint | query)
├── apps/
│   └── matricas-album/        # the working prototype (product code) — see §6
└── docs/
    └── llm-wiki/              # the LLM-maintained wiki (this manual governs it)
        ├── index.md           # catalog of all wiki pages
        ├── log.md             # append-only operation log
        ├── raw/               # human-owned immutable sources
        └── wiki/{entities,concepts,summaries,prompts,ADRs}/ + features.md
```

Two things named "wiki" live here and **must never be confused** (§6): `docs/llm-wiki/` is this maintained wiki; `apps/matricas-album/agent-wiki/` is a **runtime asset** the product's AI agent loads. They have no runtime coupling.

---

## 1. Language policy — the hu/en seam (most important rule)

Documentation is **split by document role**, not duplicated and not translated. The Hungarian education-system domain language is the moat; it must never be translated to English. Technical/implementation prose is English so coding agents stay fluent.

**Language-by-domain rule**

- **Hungarian (`lang: hu`)** = pedagogy / product / business-requirement knowledge. The specialized Hungarian education vocabulary *is* the content.
  → all `concepts/`, all `summaries/`, persona/org `entities/` (`Lauder`, `KreativKiserletezoTanar`), `apps/matricas-album/README.md`, `docs/felhasznaloi-kezikonyv.md`, and the entire `apps/matricas-album/agent-wiki/`.
- **English (`lang: en`, or `mixed`)** = technical / implementation knowledge.
  → domain-object `entities/` (`Evidence`, `AiAdvice`, `AlbumDomain`), `ADRs/`, the technical state-mirror summary, `features.md` columns, `apps/matricas-album/docs/architecture.md`.
- **Tie-break:** about *why / teaching value* → hu; about *how it is built/persisted/served* → en. **Pedagogy wins ties.**

**`lang` frontmatter** — every wiki page declares `lang: hu | en | mixed`. `mixed` means **English prose with Hungarian domain tokens kept verbatim** — never half-translated.

**Glossary bridge** — [[Glossary]] (`wiki/entities/Glossary.md`) is the canonical hu→en table. An `en`/`mixed` page writes the Hungarian token verbatim and links `[[Glossary]]` on first use; it never invents an English noun for a domain concept. New Hungarian domain terms enter the Glossary **first**.

**Domain proper-noun / enum invariant** — Hungarian stays Hungarian **everywhere, including English docs and code**:
- Persisted enums/state strings (`tervezett|aktiv`, `het|ora|fazis`, `tamogatott|alap|kihivas`, `uj|elfogadott|elutasitott|alkalmazott|hibas`, `ok|warn|miss`, `altalanos|produktiv-hibazas|kutatas-bizonyitas`) are stored in Postgres and matched case-insensitively — **never translate or rename**; docs cite them verbatim.
- Hierarchy levels (`Tanterv→Modul→Témakör→Tanulási egység→Blokk→Tevékenység`), domain object names (`Tevékenység (matrica)`, `Album`, `Albumterv`, `Futó album`, `Matricatár`, `Műhely`, `Reflexió`) and UI labels (`Publikálás`, `Elvetés`, `Projektzárás`, `Hatásnapló`) stay Hungarian in prose, headings, and UI.
- Code convention: C#/TS/Python identifiers, comments, routes = English; Hungarian only where it is a domain term or user-facing string.

---

## 2. Wiki conventions

Every `docs/llm-wiki/wiki/` page starts with frontmatter:

```yaml
---
title: <human-readable title>
type: entity | concept | summary | prompt | adr
sources:                       # raw/ mirrors or apps/ files this page draws on
  - raw/confluence/<file>.md
updated: 2026-06-01            # ISO date of last edit
lang: hu | en | mixed
---
```

**Naming & location**

| Type | Convention | Location |
|------|-----------|----------|
| Entity | `PascalCase.md` (a noun/thing: domain object, person, org, persona) | `wiki/entities/` |
| Concept | `kebab-case.md` (an idea/principle) | `wiki/concepts/` |
| Summary | mirrors the raw filename | `wiki/summaries/` |
| Prompt | `kebab-case.md` | `wiki/prompts/` |
| ADR | `ADR###-short-name.md` | `wiki/ADRs/` |
| Feature | a **row** in `wiki/features.md` (not a page) | `wiki/features.md` |

**Links** — Obsidian-style `[[Slug]]` by **filename** (PascalCase for entities, kebab for the rest). Alias with `[[Slug|display text]]`. Filenames stay **ASCII** (no diacritics) for tool safety; the display title in frontmatter `title` may carry Hungarian diacritics, as may headings and body. `[[wikilinks]]` are language-agnostic and cross hu↔en freely.

**Cite every claim** that originates from a source; point `sources` at the backing `raw/` mirror (or `apps/` file for technical pages). **Don't invent** entities, dates, or quotes — if it isn't in a source, say so. **Extend/merge over proliferate**: a wiki of well-cross-linked pages beats many thin ones; split a section only when it grows past ~400 words and stands alone.

There is no `szintezis`/`attekintes`/`ellentmondasok`/`kerdesek` here as in the origin. Contradictions and open questions live as **sections inside** the relevant concept/ADR/summary; personas/orgs are `entities/`; product features are rows in `features.md`.

---

## 3. The `/wiki` operations

Run via `.claude/commands/wiki.md` — `ingest <raw/file> | lint | <question>`.

- **ingest** — read the raw source, create/update `entities`/`concepts`/`summaries` pages (+ `ADRs`/`prompts`/`features` rows as fitting), set frontmatter incl. `lang`, add `[[links]]`, register any new Hungarian domain term in [[Glossary]] first, update `index.md`, append to `log.md`, and flag (not auto-resolve) contradictions.
- **lint** — report (do not auto-fix): broken `[[links]]`, missing frontmatter incl. `lang`, orphan pages / index drift, dead `sources`, plus the language checks (prose language vs `lang`/type; English prose that paraphrases a Glossary Hungarian term instead of citing the token; domain tokens missing from the Glossary).
- **query** — answer from wiki pages only; offer to save non-obvious synthesis as a new page.

**Ingest cadence: one source at a time.** Summarize key takeaways and confirm with the user before spawning new pages. Batch only on explicit request.

---

## 4. `log.md` format

Append-only. Each entry: `## [YYYY-MM-DD] <verb> | <title>` (verbs: `ingest`, `lint`, `query`, `note`, `refactor`). Body 2–6 lines: what changed, pages touched, contradictions, next step.

---

## 5. `raw/` guard

`docs/llm-wiki/raw/` is **human-owned and immutable**. AI agents (including `/wiki`) **never create, edit, move, or delete** `raw/` files. `/wiki` may **read** raw to write/refresh summaries and cite provenance; ingest assumes the raw mirror already exists (or asks the human to add it). The only exception: an explicit user request to change a raw file, after confirmation.

---

## 6. `apps/` guard and build constraints

- **Do not touch `apps/` during wiki work.** Wiki operations read/write only under `docs/llm-wiki/`. Inspect or modify `apps/` only when explicitly asked to work on the product.
- **`apps/matricas-album/agent-wiki/` is a runtime dependency, not documentation.** The AI-agent image bakes it in (`COPY agent-wiki ./agent-wiki`), loads only `manifest.json`-listed pages, and fails on dangling local links. Never merge it into `docs/llm-wiki/`, never edit its pages without updating `manifest.json`, and never run the deprecated `tools/refresh-agent-wiki.ps1` (removed in this repo). Its canonical source is `agent-wiki/source-book/`.
- **Build context = app root.** All three Dockerfiles use context `.` at `apps/matricas-album/` and COPY by relative path. `docker-compose.yml` and `MatricasAlbum.slnx` must stay at `apps/matricas-album/` beside `src/` and `agent-wiki/`.
- **ASCII path.** The directory is `apps/matricas-album/` (no space, no accent) — the old `Matricás album` path broke Docker buildx/bake. Re-verify bake before removing the `COMPOSE_BAKE=false` workaround in `docker-up.ps1`.
- **Secrets / state never travel:** no real `.env` (only `.env.example`), no `node_modules/bin/obj/dist/.angular/__pycache__`, no Postgres volume (the app pins DB `matricas_album_v3`; reset with `docker compose down -v`).

---

## 7. Defaults

- Hungarian diacritics in body/headings always; filenames stay ASCII.
- Don't write end-of-response summaries unless asked; the user prefers terse output.
- Prefer extending an existing page over creating a new one when unsure.
- Convert relative dates to absolute (ISO) when recording them.
