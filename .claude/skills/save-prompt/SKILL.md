---
name: save-prompt
description: Save a prompt (or the last corrected/fixed prompt from a conversation) to docs/prompts/history.md. Also supports searching saved prompts. Use when the user says "save this prompt", "save the fixed prompt", "save prompt as <name>", "search prompts", "find prompt", or any request to persist or look up a prompt.
argument-hint: "[<prompt text>] | search <query>"
allowed-tools: Read Write Edit Bash
compatibility: Designed for Claude Code
---

## Purpose

Save prompts to `docs/prompts/history.md` organized by date sections. Search them by keyword or date.

## Operation dispatch

- If the argument starts with **`search`** (or `find`): run the **Search** operation.
- Otherwise: run the **Save** operation.

---

## Save operation

### What to save

- If an argument is provided: save that text as the prompt.
- If no argument: look back in the conversation for the most recent **Corrected version** block (output from `/english-teacher` or any skill). Use that corrected text. If none found, ask the user to provide the prompt text.

### File structure

Target file: `docs/prompts/history.md`

The file is organized into date sections. Each section header is the current date in `## YYYY-MM-DD` format (no time, no extra text).

Example structure (newest date first):

```markdown
# Prompt History

## 2026-05-19

Second prompt saved today.

---

First prompt saved today.

---

## 2026-05-18

A prompt from yesterday.

---
```

### How to save

1. Get today's date: `date '+%Y-%m-%d'`
2. Check if `docs/prompts/history.md` exists.
   - If it does not exist: create the `docs/prompts/` directory and the file with a `# Prompt History` heading.
3. Read the file and check if a section `## <today>` already exists.
   - If the section **exists**: insert the new prompt text followed by `\n\n---\n` immediately after the `## <today>` heading line (making it the first entry in that section).
   - If the section **does not exist**: insert `\n## <today>\n\n<prompt text>\n\n---\n` immediately after the `# Prompt History` heading line (making today's section the first section in the file).

### Confirmation

After saving, report:
- The date section the prompt was saved under.
- The prompt text that was saved.
- Whether it was taken from a corrected version in the conversation.

---

## Search operation

### Argument parsing

`search <query>` — the query can be:
- A keyword or phrase
- A date: `search 2026-05-19` or `search 2026-05`

### How to search

1. Check if `docs/prompts/history.md` exists. If not, say "No prompts saved yet."
2. For keyword search: `grep -in "<query>" docs/prompts/history.md` then show surrounding context.
3. For date search: look for the `## <date>` section and display its contents.

### Output format

Show matching prompts with their date section heading. If no results: say "No prompts found matching `<query>`."
