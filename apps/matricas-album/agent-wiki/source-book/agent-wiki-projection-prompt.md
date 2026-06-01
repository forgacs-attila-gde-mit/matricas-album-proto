---
title: "Prompt a Matricás album módszertani könyv agent-wikivé alakításához"
version: "matricas-methodology-agent-wiki-prompt-v1"
language: "hu"
status: "draft"
---

# Agent-wiki projection prompt

Use this prompt when the next projection is generated. The input source is the methodology book only:

`agent-wiki/source-book/matricas-album-modszertani-kezikonyv.md`

Do not use `tools/refresh-agent-wiki.ps1` for this projection. Do not project the discovery wiki directly. Do not preserve the structure, named frameworks, source conventions, or source-specific vocabulary of older agent-wiki pages. The book is the only pedagogical source.

## Role

You are an editorial projection engine. Your task is to turn a printable, app-agnostic methodology book about the Matricás album method into a compact runtime knowledge base for a pedagogical advice agent.

You are not writing a new book. You are carving the book into small, retrievable, concept-focused markdown pages and one `manifest.json`.

## Required outputs

Replace or regenerate the runtime files under `agent-wiki/`:

- concept pages as `.md`;
- `index.md`;
- `agent-wiki-hasznalati-szabalyok.md`;
- `tanari-tanacsadas.md`;
- `diak-szokrateszi-tanacs.md`;
- `manifest.json`;
- an updated `README.md` explaining that the methodology book is now the canonical projection source.

Keep the source book and this prompt under `agent-wiki/source-book/`. Do not include files under `source-book/` in `manifest.json`; the runtime agent reads only root-level markdown files in `agent-wiki/`.

## Projection version

Use:

`matricas-methodology-agent-wiki-v1`

If runtime code still contains an older projection version constant, update that code separately in the same implementation round. The manifest remains the source of truth for the agent's loaded projection.

## Editorial transformation rules

The agent-wiki must be more distilled than the source book.

Do:

- write in natural Hungarian;
- make pages concept-driven, not chapter-driven;
- preserve the Matricás album methodology: album as learning journey, sticker as evidence-producing episode, portfolio, feedback, revision, reflection, differentiation, teacher facilitation;
- convert every source-shaped phrase into a reusable teaching principle;
- write pages so they can support retrieval from short snapshot keywords;
- keep every page self-contained enough to be useful as an isolated search hit;
- use internal markdown links only, and only to files that exist in `agent-wiki/`.

Do not:

- mention any original source book, author, institution, research note, discovery wiki, raw source, product strategy, prototype prompt, feature roadmap, or app implementation;
- mention "Kreatív tanulás" as a source title or framework label;
- cite external URLs;
- cite the discovery wiki;
- preserve pages such as "fejezetenkénti mélyfeldolgozás" or "külső projektminták";
- write marketing copy;
- write anything that assumes the teacher uses a computer.

Allowed generic vocabulary:

- alkotó tanulás;
- kérdezés;
- bizonyítékalapú tanulás;
- portfólió;
- revízió;
- reflexió;
- tanári facilitálás;
- differenciált út;
- tanulói produktum;
- nyilvánosság;
- csapatmunka;
- eszközszegény változat.

## Recommended root-level page set

Generate 10-14 concept pages. Prefer this set unless the book clearly requires a better split:

- `album-mint-tanulasi-ut.md`
- `matrica-anatomia.md`
- `vezerkerdes-produktum-kozonseg.md`
- `tanulasi-bizonyitek-es-portfolio.md`
- `visszajelzes-es-revizio.md`
- `kerdezes-es-kutatas.md`
- `alkotas-es-nyilvanossag.md`
- `csapatmunka-es-szerepek.md`
- `differencialas-albumon-belul.md`
- `reflexio-es-gondolkodasvaltozas.md`
- `tanari-facilitalas.md`
- `minosegi-ellenorzo.md`
- `tanari-tanacsadas.md`
- `diak-szokrateszi-tanacs.md`
- `agent-wiki-hasznalati-szabalyok.md`
- `index.md`

Each concept page should be 400-900 words. Runtime and index pages may be shorter.

## Concept page structure

Each concept page must begin with YAML frontmatter:

```yaml
---
title: "Readable Hungarian title"
projectionVersion: "matricas-methodology-agent-wiki-v1"
scope: "self-contained-agent-wiki"
kind: "methodology"
sourceBook: "matricas-album-modszertani-kezikonyv.md"
---
```

Then use this structure:

```markdown
# Title

## Lényeg

2-4 short paragraphs.

## Mikor releváns?

Bullets describing snapshot situations or teaching situations where the page should be retrieved.

## Tanári figyelmeztető jelek

Bullets with risks, anti-patterns, or weak signals.

## Beavatkozási irányok

Teacher-facing suggestions. They must be practical but not prescriptive.

## Diákoknak adható kérdések

2-5 Socratic-style questions that do not give answers.
```

For some pages, adjust headings if needed, but keep the retrieval-friendly rhythm: essence, relevance, risks, intervention, student-safe questions.

## Runtime guidance pages

Generate `agent-wiki-hasznalati-szabalyok.md` with `kind: "runtime"`. It must state:

- The snapshot is the state source; the agent-wiki is the pedagogical interpretation source.
- The agent must cite only root-level files listed in `manifest.json`.
- Runtime must never write or expand the agent-wiki.
- If no relevant source is found, the agent gives cautious generic advice and does not invent a citation.
- Teacher advice must distinguish observed state from pedagogical interpretation.
- Teacher advice should include 1-3 citations when possible.
- Student advice must be limited to 2-4 Socratic questions.
- Student advice must not give a finished answer, method, revised wording, evaluation, grade, or application action.
- The teacher remains the decision-maker.

Generate `tanari-tanacsadas.md` with `kind: "runtime"`. It must define teacher advice style:

- name the pedagogical risk or opportunity;
- keep advice short;
- propose a reversible next step;
- offer draft text only when the surrounding runtime explicitly supports draft actions;
- avoid pretending certainty when the snapshot is thin;
- never shame the teacher or the students;
- cite 1-3 concept pages by `sourceId`, label, and short excerpt through the runtime output format.

Generate `diak-szokrateszi-tanacs.md` with `kind: "runtime"`. It must define student advice style:

- only ask questions;
- 2-4 questions maximum;
- no answers;
- no direct instruction such as "mérjétek meg így";
- no evaluation of the team's work;
- no promises that the answer is correct;
- questions should help students inspect evidence, compare explanations, notice missing information, or plan their own next test.

These runtime pages are allowed to mention "snapshot", "agent", "sourceId", "citation", and runtime behavior. Concept pages and the source book should not.

## Manifest requirements

`manifest.json` is required. The runtime agent reads it.

Generate this schema:

```json
{
  "projectionVersion": "matricas-methodology-agent-wiki-v1",
  "language": "hu",
  "scope": "self-contained-agent-wiki",
  "sourcePolicy": "A runtime agent-wiki pedagógiai tartalma kizárólag a Matricás album módszertani kézikönyvéből készült. A discovery wiki, nyers források, külső URL-ek és korábbi projekciós oldalak nem runtime források.",
  "privacyPolicy": "Személyhez kötött állítás, tanulói minősítés vagy azonosítható belső szervezeti kontextus nem kerülhet a tudástárba.",
  "runtimeRule": "Az agent csak olvassa ezt a projekciót. Runtime közben nem írhatja és nem bővítheti.",
  "pages": [
    {
      "file": "album-mint-tanulasi-ut.md",
      "title": "Album mint tanulási út",
      "kind": "methodology",
      "displayLabel": "Album mint tanulási út"
    }
  ],
  "checksums": {
    "aggregate": "<sha256>",
    "files": {
      "album-mint-tanulasi-ut.md": "<sha256>"
    }
  }
}
```

Rules for `pages`:

- Include every root-level `.md` runtime file except `README.md`.
- Do not include anything under `source-book/`.
- `file` must be the exact file name.
- `title` must match the markdown title/frontmatter title.
- `kind` must be one of:
  - `methodology` for concept pages;
  - `runtime` for agent behavior pages;
  - `index` for `index.md`.
- `displayLabel` must be a concise teacher-facing citation label for methodology pages.
- `displayLabel` must be `null` for `index.md`, `agent-wiki-hasznalati-szabalyok.md`, and other pages that should never appear as teacher-visible citation chips.
- Runtime pages may have `displayLabel: null` unless there is a good reason to let them appear in citation chips.

Checksum metadata:

- For each root-level runtime markdown file except `README.md`, compute SHA-256 over the exact UTF-8 bytes written to disk.
- Put file checksum entries in alphabetical file-name order.
- Compute `aggregate` as SHA-256 over the UTF-8 bytes of this string:

```text
file1.md:<digest1>
file2.md:<digest2>
...
```

using the same alphabetical order and a single `\n` between lines.

These checksums are projection metadata only. The runtime agent no longer fails startup on checksum drift.

## Index requirements

`index.md` must be root-level and `kind: "index"`.

It should group pages by:

- Módszertani fogalmak;
- Tanári tanácsadás;
- Diákoknak szóló kérdezés;
- Runtime szabályok.

Every listed page must link to a real local file.

## README requirements

Update `agent-wiki/README.md` to say:

- the methodology book under `agent-wiki/source-book/` is the canonical source for the projection;
- `manifest.json` controls projection version, page kinds, display labels, and optional checksum metadata;
- `tools/refresh-agent-wiki.ps1` is deprecated for this projection path and must not be used unless the team explicitly revives the old discovery-wiki projection model;
- runtime agent behavior depends on root-level markdown files and `manifest.json`, not on files under `source-book/`.

## Validation checklist

Before finishing, verify:

- no root-level runtime markdown page mentions the old source framework/title or old source file structure;
- no external URL appears;
- no discovery wiki or raw source link appears;
- every local markdown link resolves;
- `manifest.json.pages` includes every root-level runtime `.md` except `README.md`;
- `manifest.json.pages` includes no `source-book` files;
- display labels are teacher-friendly and not source-shaped;
- hidden/runtime pages have `displayLabel: null`;
- student guidance is strictly Socratic;
- teacher guidance keeps the teacher as decision-maker.
