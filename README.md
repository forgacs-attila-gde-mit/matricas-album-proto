# Matricás Album

A working **Lecke.ai** prototype that treats learning not as isolated tasks but as a teacher-controlled, multi-step learning path: a `Tevékenység (matrica)` is an evidence-bearing learning episode with a student decision point, teamwork, evidence, teacher feedback, revision, and reflection.

This repository was spun out of the broader Lecke.ai discovery knowledge base to let the Matricás Album evolve as its own product with its own focused documentation.

## Two halves

| Path | What it is |
|------|-----------|
| `apps/matricas-album/` | The product: Angular 19 web + .NET 10 API + Python (FastAPI/Agno) AI agent + PostgreSQL 17, orchestrated with Docker Compose. |
| `docs/llm-wiki/` | An LLM-maintained wiki (entities / concepts / summaries / ADRs / prompts / features) scoped to this product. Maintained via the `/wiki` command. |

> `apps/matricas-album/agent-wiki/` is a **runtime asset** the AI agent loads at startup — it is *not* the same thing as `docs/llm-wiki/` and the two have no runtime coupling. See `AGENTS.md` §6.

## Run the app

From `apps/matricas-album/`:

```bash
cp .env.example .env        # then set OPENAI_API_KEY (optional; a deterministic mock runs without a key)
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web (Angular via nginx) | http://localhost:4300 |
| API (.NET) | http://localhost:5080 (health: `/health`) |
| AI agent (Python) | http://localhost:8010 (health: `/health`) |
| PostgreSQL | localhost:5432 (`matricas_album_v3`) |

The API seeds a demo on first run (the "mikroklíma" science album). For a clean reset: `docker compose down -v`. See `apps/matricas-album/README.md` and `apps/matricas-album/docs/architecture.md` for details.

## Use the wiki

`/wiki ingest <raw/file>` · `/wiki lint` · `/wiki <question>`. The command lives in `.claude/commands/wiki.md`; conventions are in `AGENTS.md`.

## Language policy (read before writing docs)

Documentation is split by role and **not translated**:

- **Hungarian** for pedagogy / product / business-requirement knowledge (the Hungarian education-domain vocabulary is the content).
- **English** for technical / implementation knowledge — but Hungarian domain tokens and enums (`matrica`, `Tevékenység`, `het|ora|fazis`, `tervezett|aktiv`, …) are kept **verbatim** even inside English prose and code.
- [[Glossary]] (`docs/llm-wiki/wiki/entities/Glossary.md`) is the hu↔en bridge. Full policy in `AGENTS.md` §1.
