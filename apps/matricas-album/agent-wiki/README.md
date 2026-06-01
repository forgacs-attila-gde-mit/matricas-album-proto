# Matricás album agent-wiki

This directory contains the static, committed runtime knowledge base used by the Matricás album AI agent.

## Canonical source

The canonical editorial source for the current projection is `source-book/matricas-album-modszertani-kezikonyv.md`. The projection prompt is `source-book/agent-wiki-projection-prompt.md`.

Root-level markdown files are the runtime projection generated from that source-book. Files under `source-book/` are editorial inputs and are not read by the runtime agent.

## Manifest contract

`manifest.json` controls the projection version, page kinds, teacher-facing citation labels, and optional checksum metadata for root-level runtime markdown files. Runtime startup does not fail on checksum drift.

## Runtime behavior

The agent reads root-level markdown files listed in `manifest.json.pages`, validates that declared root markdown files and local links are consistent, and then builds its local search index. Runtime code must not write, expand, or regenerate this directory.

Teacher advice should be short, decision-supporting, and grounded in the current snapshot plus relevant methodology pages. Student advice should remain Socratic: 2-4 questions, no finished answers, no evaluation, and no direct method instructions.

## Deprecated path

Do not use `tools/refresh-agent-wiki.ps1` for this projection path. That script belongs to the older discovery-wiki projection model and preserves too much source structure and vocabulary. Revive it only if the team explicitly decides to return to that model.
