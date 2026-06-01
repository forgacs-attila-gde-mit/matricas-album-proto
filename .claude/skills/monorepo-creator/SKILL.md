---
name: monorepo-creator
description: Scaffold a technology-agnostic monorepo structure in this repository. Use when the user asks to create a monorepo, set up a monorepo structure, or initialize the apps/ directory.
allowed-tools: Read Write Edit Bash
compatibility: Designed for Claude Code. Technology-agnostic — no framework assumptions.
---

## Goal

Scaffold a technology-agnostic monorepo skeleton. The skill creates directories and universal config files only — no framework code, no package managers, no language-specific files. Those are added separately when apps are built.

### Layout (always created)

```
.claude/          ← keep if already exists
apps/
  web/            ← frontend app placeholder
  api/            ← backend API placeholder
  services/       ← background workers / cron jobs placeholder
docs/             ← project documentation
packages/         ← shared libraries (placeholder)
.gitignore
AGENTS.md
README.md
```

**Never create at root:**
- `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or any language-specific file
- Any framework config (e.g. `next.config.js`, `vite.config.ts`)

---

## Step 1 — Check for conflicts

Run `ls apps/ 2>/dev/null`. If `apps/web` or `apps/api` already exists, warn the user and ask whether to continue or abort.

---

## Step 2 — Create directories

```bash
mkdir -p apps/web apps/api apps/services docs packages
```

Add a `.gitkeep` inside `apps/services` and `packages` so git tracks the empty directories.

---

## Step 3 — Create `AGENTS.md`

```markdown
# Agents

Instructions for AI agents working in this repository.

## Structure

| Directory | Purpose |
|-----------|---------|
| `apps/web` | Frontend application |
| `apps/api` | Backend API |
| `apps/services` | Background services and workers |
| `packages/` | Shared libraries consumed by apps |
| `docs/` | Project documentation |

## Rules

- Never create technology-specific config files at the repo root.
- Each app in `apps/` is independently runnable and deployable.
- Shared code goes in `packages/` — apps must never import from each other.
```

---

## Step 4 — Create root `.gitignore`

OS-level entries only — no technology-specific patterns. Each app manages its own `.gitignore`.

```
# macOS
.DS_Store
.AppleDouble

# Linux
*~

# Windows
Thumbs.db
```

---

## Step 5 — Create `docs/README.md`

```markdown
# Documentation

Project documentation lives here.
```

---

## Step 6 — Create root `README.md`

```markdown
# <repo name>

## Structure

| Path | Purpose |
|------|---------|
| `apps/web` | Frontend application |
| `apps/api` | Backend API |
| `apps/services` | Background services |
| `packages/` | Shared libraries |
| `docs/` | Documentation |

## Getting started

See each app's own `README.md` for setup and development instructions.
```

---

## Step 7 — Verify

1. Run `ls apps/web apps/api apps/services docs packages` and confirm all exist.
2. Run `ls` at the repo root and confirm no language-specific files are present.
3. Report a summary of what was created.

---

## Rules

- Create structure only — no framework scaffolding, no dependency installation.
- Never create language-specific files at the repo root.
- Never delete or overwrite existing files; warn and ask first.
- `apps/web`, `apps/api`, and `apps/services` are independent — they must not import from each other.
