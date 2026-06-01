# Matricás album working app

Ez a mappa a Matricás album demonstrátor működő alkalmazása. A `UX prototype/` továbbra is vizuális és flow referencia; a futtatható, adatbázisos rendszer a `src/` alatt él.

## Projektstruktúra

- `UX prototype/`: referencia Angular prototípus, nem ezt deployoljuk.
- `src/MatricasAlbum.Api/`: .NET 10 minimal API, EF Core, PostgreSQL.
- `src/MatricasAlbum.Agent/`: Python/FastAPI/Agno AI tanácsadó service.
- `src/MatricasAlbum.Web/`: Angular 19 frontend, API-ra kötve.
- `agent-wiki/`: statikus, commitolt agent-tudástár; aktuális projekciója a `source-book/` módszertani könyvből készült.
- `docker-compose.yml`: PostgreSQL, API, AI agent és frontend/nginx.
- `docs/`: csak a hosszú életű architektúra dokumentáció és magyar felhasználói kézikönyv Markdown + HTML snapshot párjai.

## Domain modell

A demonstrátor három külön fogalmat kezel:

- `StickerResource` / `StickerVersion`: globális, verziózott matricatár.
- `AlbumTemplate`: újrahasználható albumterv, amely konkrét matrica-verziókat rendel hetekhez.
- `AlbumInstance`: egy albumterv osztályhoz/csapathoz kötött futtatása saját csapatokkal, evidence-szel, állapotokkal és AI jelzésekkel.
- `AiAdvice` / `AiAdviceRun`: persistált AI tanácsok és generálási audit az agent-hívásokhoz.

Fontos: a Phase 2 app a `matricas_album_v3` adatbázist használja, hogy régi Docker volume ne törje el az indulást. Teljesen tiszta volume-hoz:

```powershell
docker compose down -v
docker compose up --build
```

## AI tanácsadó

Az AI funkciók külön `ai-agent` konténerben futnak. A .NET API készíti el a minimalizált album-state snapshotot, hívja az agentet, majd eltárolja az eredményt `AiAdvice` rekordként.

- Agent URL Dockerben: `http://ai-agent:8000`
- Agent URL lokálisan: `http://localhost:8010`
- Agent health: `http://localhost:8010/health`
- OpenAI env: `OPENAI_API_KEY`
- Modell env: `OPENAI_MODEL`, default `gpt-4o-mini`
- Trace env: `ADVICE_TRACE_ENABLED=true`, `ADVICE_TRACE_WIKI_CANDIDATE_LIMIT=12`

Kulcs nélkül az agent determinisztikus mock fallbacket ad, így a demonstrátor offline is tesztelhető. Kulccsal OpenAI Structured Outputs sémát használ.

Minden `/advise` hívás JSON logban kap egy `advice_trace` eseménysort. Az API az `AiAdviceRun.Id` értékét `traceId`-ként adja át, ezért a DB audit rekord és az `ai-agent` konténerlog ugyanazzal a `runId` értékkel kereshető. A trace a wiki keresés indulását, rangsorolt találatait, kiválasztott forrásait, az OpenAI Responses API hívás méreteit/latenciáját/tokenhasználatát, a fallbacket és a válaszvalidálást naplózza, teljes snapshot vagy prompt nélkül.

Az `agent-wiki/` statikus és commitolt. Runtime közben az agent csak olvassa, nem írja, és nem hivatkozik vissza a fő discovery wikire vagy a nyers forrásrétegre. Az aktuális runtime projekció `matricas-methodology-agent-wiki-v1`; kanonikus forrása az `agent-wiki/source-book/matricas-album-modszertani-kezikonyv.md` módszertani könyv.

Ehhez a projekcióhoz ne futtasd a `tools/refresh-agent-wiki.ps1` scriptet. A gyökérszintű agent-wiki oldalakat és a `manifest.json` fájlt az `agent-wiki/source-book/agent-wiki-projection-prompt.md` alapján kell frissíteni. A manifest runtime szerződés: projection version, page kind és display label információkat hordoz; checksum mezők maradhatnak projekciós metaadatként, de az agent startup már nem bukik checksum drift miatt.

## Architektúra dokumentáció

- Forrás: `docs/architecture.md`
- HTML snapshot: `docs/architecture.html`
- Felhasználói kézikönyv: `docs/felhasznaloi-kezikonyv.md`
- Felhasználói kézikönyv HTML snapshot: `docs/felhasznaloi-kezikonyv.html`

Az architektúra Markdownot és a Mermaid diagramokat minden architektúrát érintő változásnál frissíteni kell. Ha a HTML snapshotra is szükség van, ugyanabban a dokumentációs passzban tartsd szinkronban a Markdown forrással.

Történeti implementációs tervek, code review-k és átmeneti jegyzetek nem kerülnek a `docs/` mappába; ezek helye a `LOG.md`, `roadmap.md` vagy `backlog.md`.

## Előfeltételek

- Docker Desktop
- .NET SDK 10
- Node.js és npm

Ezen a gépen a működő Node NVM4W alatt található:

```powershell
C:\nvm4w\nodejs\node.exe
C:\nvm4w\nodejs\npm.cmd
```

Ha a shellben a `node` vagy `npm` nem látszik:

```powershell
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
node --version
npm --version
```

## Futtatás Dockerrel

Első indítás vagy séma-refaktor utáni reset:

```powershell
docker compose down -v
docker compose up --build
```

Normál indítás:

```powershell
docker compose up --build
```

Ha Docker build közben `buildx`/`bake` hiba jön az ékezetes projektútvonal miatt:

```powershell
$env:COMPOSE_BAKE = 'false'
docker compose up --build
```

Ugyanerre van projekt script is:

```powershell
.\docker-up.ps1
```

Futó szolgáltatások:

| Szolgáltatás | URL / port |
| --- | --- |
| Frontend | http://localhost:4300 |
| API | http://localhost:5080 |
| API health | http://localhost:5080/health |
| OpenAPI JSON | http://localhost:5080/openapi/v1.json |
| AI agent | http://localhost:8010 |
| AI agent health | http://localhost:8010/health |
| PostgreSQL | localhost:5432 |

Leállítás:

```powershell
docker compose down
```

Csak újraindítás meglévő image-ekkel:

```powershell
docker compose up -d
```

API, AI agent és web image újraépítése:

```powershell
$env:COMPOSE_BAKE = 'false'
docker compose build api ai-agent web
docker compose up -d api ai-agent web
```

Konténerek és logok:

```powershell
docker compose ps
docker compose logs api --tail 120
docker compose logs ai-agent --tail 120
docker compose logs web --tail 120
docker compose logs db --tail 120
```

## Lokális fejlesztői futtatás

Csak adatbázis Dockerben:

```powershell
docker compose up -d db
```

API lokálisan:

```powershell
dotnet run --project .\src\MatricasAlbum.Api\MatricasAlbum.Api.csproj --urls http://localhost:5080
```

Alapértelmezett connection string:

```text
Host=localhost;Port=5432;Database=matricas_album_v3;Username=postgres;Password=postgres
```

AI agent lokálisan:

```powershell
cd .\src\MatricasAlbum.Agent
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
$env:AGENT_WIKI_PATH = '..\..\agent-wiki'
$env:OPENAI_MODEL = 'gpt-4o-mini'
.\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8010
```

Frontend első install:

```powershell
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
npm --prefix '.\src\MatricasAlbum.Web' ci
```

Frontend dev server:

```powershell
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
npm --prefix '.\src\MatricasAlbum.Web' start -- --port 4300
```

A frontend dev server a `src/MatricasAlbum.Web/proxy.conf.json` alapján az `/api` és `/health` hívásokat a `http://localhost:5080` API-ra proxyzza.

## Build és ellenőrzés

.NET:

```powershell
dotnet build .\MatricasAlbum.slnx --no-restore
dotnet test .\MatricasAlbum.slnx --no-restore
```

Jelenleg még nincs külön test project, ezért a `dotnet test` solution-szintű sanity check.

Angular:

```powershell
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
npm --prefix '.\src\MatricasAlbum.Web' run build
```

Docker build:

```powershell
$env:COMPOSE_BAKE = 'false'
docker compose build api ai-agent web
```

Smoke tesztek futó stack mellett:

```powershell
Invoke-RestMethod -Uri 'http://localhost:5080/health'
Invoke-RestMethod -Uri 'http://localhost:8010/health'
Invoke-RestMethod -Uri 'http://localhost:4300/api/stickers' | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri 'http://localhost:4300/api/album-templates' | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri 'http://localhost:4300/api/album-instances' | ConvertTo-Json -Depth 4
Invoke-RestMethod -Method Post -Uri 'http://localhost:4300/api/ai-advice/generate' -ContentType 'application/json' -Body '{"ownerType":"instance","ownerId":"11000000-0000-0000-0000-000000000001","audience":"teacher","targetType":"albumInstance","targetId":"11000000-0000-0000-0000-000000000001"}' | ConvertTo-Json -Depth 6
Invoke-WebRequest -Uri 'http://localhost:4300' -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

## Fontos API útvonalak

- `GET /health`
- `GET /api/stickers`
- `POST /api/stickers`
- `GET /api/stickers/{id}`
- `POST /api/stickers/{id}/versions`
- `GET /api/album-templates`
- `POST /api/album-templates`
- `GET /api/album-templates/{id}`
- `POST /api/album-templates/{id}/stickers`
- `POST /api/album-templates/{id}/instances`
- `GET /api/album-instances`
- `GET /api/album-instances/{id}`
- `GET /api/album-instances/{id}/quality`
- `GET /api/evidence/pending`
- `POST /api/evidence`
- `POST /api/evidence/{id}/feedback`
- `PATCH /api/instance-stickers/{id}/state`
- `POST /api/album-instances/{id}/micro-stickers/measurement-basics`
- `POST /api/ai-advice/generate`
- `GET /api/ai-advice?ownerType=&ownerId=&audience=`
- `PATCH /api/ai-advice/{id}/status`
- `POST /api/ai-advice/{id}/apply`
- `DELETE /api/demo-maintenance/ai-advice`
- `POST /api/demo-maintenance/reset`

## Demo adat

Az API induláskor migrálja a sémát, majd seedeli a demót, ha még nincs matricatár.

Seedelt adatok:

- globális matricatár a mikroklíma projekt meglévő matricáiból;
- `Városi mikroklíma nyomában` albumterv konkrét matrica-verziókkal;
- `7.B mikroklíma projekt` egyetlen futó album csapatokkal és evidence-szel.

Tiszta állapothoz:

```powershell
docker compose down -v
docker compose up --build
```

## Domain guardrail

A matrica itt nem jutalom-badge, hanem tanulási epizód. Hasznos matrica esetén van tanulói cselekvés, látható evidence, tanári feedback és reflexió.
