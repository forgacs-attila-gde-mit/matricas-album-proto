from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import time
from pathlib import Path
from typing import Any, Callable, Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

try:
    from agno.agent import Agent  # type: ignore
    from agno.models.openai import OpenAIChat  # type: ignore
except Exception:  # pragma: no cover - optional integration guard
    Agent = None
    OpenAIChat = None

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - deterministic mock still works
    OpenAI = None


PROMPT_VERSION = "phase4-v2"
DEFAULT_PROJECTION_VERSION = "matricas-methodology-agent-wiki-v1"
MAX_USER_PAYLOAD_CHARS = int(os.getenv("MAX_USER_PAYLOAD_CHARS", "16000"))
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "25"))
ADVICE_TRACE_ENABLED = os.getenv("ADVICE_TRACE_ENABLED", "true").strip().lower() not in {"0", "false", "no", "off"}
ADVICE_TRACE_WIKI_CANDIDATE_LIMIT = int(os.getenv("ADVICE_TRACE_WIKI_CANDIDATE_LIMIT", "12"))
ADVICE_TRACE_MATCHED_TERM_LIMIT = int(os.getenv("ADVICE_TRACE_MATCHED_TERM_LIMIT", "12"))

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(message)s")
logger = logging.getLogger("matricas-agent")


class AdviceCitation(BaseModel):
    sourceId: str
    label: str
    excerpt: str | None = None
    kind: str | None = None


class AdviceActionPayload(BaseModel):
    title: str | None = None
    phase: str | None = None
    shortDescription: str | None = None
    studentInstruction: str | None = None
    teacherSteps: list[str] = Field(default_factory=list)
    studentChoice: str | None = None
    expectedProduct: str | None = None
    evidenceTypeLabel: str | None = None
    reflectionPrompt: str | None = None
    bPlan: str | None = None
    lowResource: str | None = None
    week: int | None = None
    sortOrder: int | None = None
    evidenceId: str | None = None
    draft: str | None = None


class AdviceAction(BaseModel):
    type: str
    label: str
    payload: AdviceActionPayload = Field(default_factory=AdviceActionPayload)


class AdviceItem(BaseModel):
    targetType: str
    targetId: str | None = None
    targetKey: str | None = None
    kind: Literal["check", "suggestion", "risk", "info"] = "suggestion"
    severity: Literal["igen", "figyelmet", "hianyzik", "info"] = "figyelmet"
    message: str
    recommendation: str | None = None
    questions: list[str] = Field(default_factory=list)
    citations: list[AdviceCitation] = Field(default_factory=list)
    action: AdviceAction | None = None


class AdviceResponse(BaseModel):
    advices: list[AdviceItem]


class AdviceRequest(BaseModel):
    traceId: str | None = None
    audience: Literal["teacher", "student"]
    ownerType: str
    ownerId: str
    targetType: str | None = None
    targetId: str | None = None
    targetKey: str | None = None
    promptVersion: str = PROMPT_VERSION
    projectionVersion: str = DEFAULT_PROJECTION_VERSION
    snapshot: dict[str, Any] = Field(default_factory=dict)


class KnowledgeHit(BaseModel):
    sourceId: str
    label: str
    excerpt: str
    score: int
    matchedTerms: list[str] = Field(default_factory=list, exclude=True)


class KnowledgeDocument:
    def __init__(self, path: Path, kind: str = "projected"):
        self.path = path
        self.text = path.read_text(encoding="utf-8-sig")
        self.source_id = path.stem
        self.kind = kind
        self.label = self._read_title()
        self.term_counts = count_terms(self.text)
        self.tokens = set(self.term_counts)

    def _read_title(self) -> str:
        match = re.search(r"^title:\s*(.+)$", self.text, re.MULTILINE)
        if match:
            return match.group(1).strip().strip('"')
        heading = re.search(r"^#\s+(.+)$", self.text, re.MULTILINE)
        return heading.group(1).strip() if heading else self.source_id

    def hit(self, query_tokens: set[str], idf: dict[str, float]) -> KnowledgeHit | None:
        matched_tokens = sorted(query_tokens.intersection(self.tokens))
        score = sum(self.term_counts[token] * idf.get(token, 1.0) for token in matched_tokens)
        if score <= 0:
            return None
        excerpt = " ".join(line.strip() for line in self.text.splitlines() if line.strip() and not line.startswith("---"))[:420]
        return KnowledgeHit(
            sourceId=self.source_id,
            label=self.label,
            excerpt=excerpt,
            score=int(score * 1000),
            matchedTerms=matched_tokens[:ADVICE_TRACE_MATCHED_TERM_LIMIT],
        )


def tokenize(value: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+", value.lower())


def count_terms(value: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for token in tokenize(value):
        if len(token) < 3:
            continue
        counts[token] = counts.get(token, 0) + 1
    return counts


class KnowledgeBase:
    def __init__(self, root: Path):
        self.root = root
        manifest_path = root / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig")) if manifest_path.exists() else {}
        self.projection_version = manifest.get("projectionVersion", DEFAULT_PROJECTION_VERSION)
        manifest_pages = [
            page
            for page in manifest.get("pages", [])
            if page.get("file")
        ]
        declared_files = [Path(page["file"]).name for page in manifest_pages]
        if declared_files:
            if any(page["file"] != Path(page["file"]).name for page in manifest_pages):
                raise RuntimeError("Agent-wiki manifest pages must be root-level markdown files")
            declared_set = set(declared_files)
            root_markdown = {path.name for path in root.glob("*.md") if path.name.lower() != "readme.md"}
            missing = sorted(declared_set - root_markdown)
            extra = sorted(root_markdown - declared_set)
            if missing:
                raise RuntimeError(f"Agent-wiki manifest references missing files: {', '.join(missing)}")
            if extra:
                raise RuntimeError(f"Agent-wiki undeclared root markdown files: {', '.join(extra)}")
            document_paths = [root / file_name for file_name in sorted(declared_files)]
        else:
            document_paths = sorted(path for path in root.glob("*.md") if path.name.lower() != "readme.md")
        self.page_kinds = {
            Path(page.get("file", "")).stem: page.get("kind", "projected")
            for page in manifest_pages
            if page.get("file")
        }
        self.display_labels: dict[str, str | None] = {
            Path(page.get("file", "")).stem: page.get("displayLabel")
            for page in manifest_pages
            if page.get("file") and "displayLabel" in page
        }
        self.documents = [
            KnowledgeDocument(path, self.page_kinds.get(path.stem, "projected"))
            for path in document_paths
        ]
        self.document_ids = {doc.source_id for doc in self.documents}
        self._validate_links()
        self.idf = self._build_idf()
        self.guidance = next(
            (doc for doc in self.documents if doc.source_id == "agent-wiki-hasznalati-szabalyok"),
            None,
        )

    def search(self, request: AdviceRequest, trace: Callable[[str, dict[str, Any] | None], None] | None = None) -> list[KnowledgeHit]:
        snapshot_json = json.dumps(request.snapshot, ensure_ascii=False)
        snapshot_query = snapshot_search_text(request.snapshot)
        query = snapshot_query
        query += f" {request.audience} {request.targetType or ''} {request.targetKey or ''}"
        tokens = set(tokenize(query))
        emit_trace(
            trace,
            "wiki_search_started",
            {
                "projectionVersion": self.projection_version,
                "snapshotChars": len(snapshot_json),
                "snapshotSearchChars": len(snapshot_query),
                "queryTokenCount": len(tokens),
                "documentCount": len(self.documents),
                "targetType": request.targetType,
                "targetKey": request.targetKey,
            },
        )
        hits = [hit for doc in self.documents if (hit := doc.hit(tokens, self.idf))]
        hits.sort(key=lambda item: item.score, reverse=True)
        candidate_limit = max(0, ADVICE_TRACE_WIKI_CANDIDATE_LIMIT)
        emit_trace(
            trace,
            "wiki_search_ranked",
            {
                "scannedDocumentCount": len(self.documents),
                "matchedDocumentCount": len(hits),
                "truncatedCandidateCount": max(0, len(hits) - candidate_limit),
                "candidates": [knowledge_hit_trace(hit) for hit in hits[:candidate_limit]],
            },
        )
        fallback = False
        if not hits:
            fallback = True
            fallback_ids = ["agent-wiki-hasznalati-szabalyok", "diak-szokrateszi-tanacs", "tanari-tanacsadas"]
            fallback_docs = [doc for source_id in fallback_ids for doc in self.documents if doc.source_id == source_id]
            hits = [
                KnowledgeHit(
                    sourceId=doc.source_id,
                    label=doc.label,
                    excerpt=doc.text[:420],
                    score=0,
                )
                for doc in fallback_docs[:3]
            ]
            emit_trace(
                trace,
                "wiki_search_fallback_selected",
                {"fallbackSourceIds": [hit.sourceId for hit in hits]},
            )
        selected = hits[:4]
        emit_trace(
            trace,
            "wiki_search_completed",
            {
                "fallback": fallback,
                "selectedCount": len(selected),
                "selected": [knowledge_hit_trace(hit) for hit in selected],
            },
        )
        return selected

    def citation_kind(self, source_id: str) -> str:
        return self.page_kinds.get(source_id, "projected")

    def display_label(self, source_id: str, fallback: str) -> str | None:
        """Audience-facing chip label for a citation.

        Returns None for pages explicitly marked as agent-meta (hidden from teachers).
        Returns the manifest displayLabel when present, else the agent-side fallback
        (typically the internal title) so existing behavior survives missing entries.
        """
        if source_id in self.display_labels:
            return self.display_labels[source_id]
        return fallback

    def _build_idf(self) -> dict[str, float]:
        document_count = max(len(self.documents), 1)
        document_frequency: dict[str, int] = {}
        for doc in self.documents:
            for token in doc.tokens:
                document_frequency[token] = document_frequency.get(token, 0) + 1
        return {
            token: math.log((document_count + 1) / (frequency + 1)) + 1
            for token, frequency in document_frequency.items()
        }

    def _validate_links(self) -> None:
        markdown_link = re.compile(r"\[[^\]]+\]\(([^)]+\.md)\)")
        for doc in self.documents:
            for target in markdown_link.findall(doc.text):
                target_name = Path(target).name
                if target_name not in {f"{source_id}.md" for source_id in self.document_ids}:
                    raise RuntimeError(f"Dangling agent-wiki link in {doc.path.name}: {target}")


class AdviceEngine:
    def __init__(self, knowledge: KnowledgeBase):
        self.knowledge = knowledge
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key, timeout=OPENAI_TIMEOUT_SECONDS, max_retries=0) if self.api_key and OpenAI is not None else None
        self._agno_agent = self._create_agno_agent()

    def _create_agno_agent(self) -> Any | None:
        if not self.api_key or Agent is None or OpenAIChat is None:
            return None
        try:
            return Agent(
                model=OpenAIChat(id=self.model),
                instructions=[
                    "Matricás album módszertani pedagógiai tanácsadó vagy.",
                    "Csak a kapott statikus agent-wiki találatokra és album snapshotra támaszkodj.",
                    "Diáknak csak szókratészi kérdéseket adj, direkt megoldást soha.",
                    "Minden felhasználónak látható magyar szöveget ékezetesen írj.",
                ],
                markdown=False,
            )
        except Exception:
            return None

    def advise(self, request: AdviceRequest) -> AdviceResponse:
        started = time.perf_counter()
        run_id = self._run_id(request)
        trace_sequence = 0

        def trace(step: str, details: dict[str, Any] | None = None, level: str = "info") -> None:
            nonlocal trace_sequence
            trace_sequence += 1
            self._trace(level, run_id, started, trace_sequence, step, details)

        trace(
            "advice_started",
            {
                "audience": request.audience,
                "ownerType": request.ownerType,
                "ownerId": request.ownerId,
                "targetType": request.targetType,
                "targetId": request.targetId,
                "targetKey": request.targetKey,
                "promptVersion": request.promptVersion,
                "projectionVersion": self.knowledge.projection_version,
                "model": self.model,
                "openaiClientAvailable": self.client is not None,
                "agnoRuntimeActive": self._agno_agent is not None,
                "snapshotHash": snapshot_hash(request.snapshot),
            },
        )
        hits = self.knowledge.search(request, trace=trace)
        fallback = False
        result: AdviceResponse

        if self.client is None:
            fallback = True
            trace("llm_skipped", {"reason": "openai_client_unavailable", "usingMockFallback": True})
            result = self.mock_response(request, hits)
        else:
            try:
                result = self.openai_response(request, hits, trace)
            except Exception as exc:
                fallback = True
                trace(
                    "llm_fallback_started",
                    {"errorType": type(exc).__name__, "error": str(exc), "usingMockFallback": True},
                    "warning",
                )
                self._log("warning", run_id, request, hits, started, fallback, error=str(exc))
                result = self.mock_response(request, hits)

        trace(
            "response_validation_started",
            {
                "rawAdviceCount": len(result.advices),
                "allowedSourceIds": [hit.sourceId for hit in hits if hit.sourceId in self.knowledge.document_ids],
            },
        )
        result = self.validate_response(result, request, hits)
        trace(
            "response_validation_completed",
            {
                "adviceCount": len(result.advices),
                "citationCount": sum(len(item.citations) for item in result.advices),
                "actionTypes": [item.action.type for item in result.advices if item.action is not None],
                "fallback": fallback,
            },
        )
        self._log("info", run_id, request, hits, started, fallback)
        trace("advice_completed", {"fallback": fallback, "latencyMs": elapsed_ms(started)})
        return result

    def openai_response(
        self,
        request: AdviceRequest,
        hits: list[KnowledgeHit],
        trace: Callable[[str, dict[str, Any] | None], None] | None = None,
    ) -> AdviceResponse:
        system = (
            "Matricás album módszertani tanácsadó vagy. "
            "Minden felhasználónak látható magyar szöveget ékezetesen írj. "
            "A tanároknak adott tanács legyen konkrét, de tanári döntést támogató. "
            "A diáknak adott tanács kizárólag 2-4 szókratészi kérdés lehet. "
            "Diáknak csak a snapshot selectedTeam, activeSticker, selectedTeamProgress és studentRecentEvidence adatait használd. "
            "Ha a kérés targetType=evidence, akkor a targetEvidence az egyetlen értékelendő beküldés; "
            "draftFeedback akció payload.evidenceId értéke egyezzen a request.targetId értékével. "
            "Ha targetType=closureSynthesis, akkor mintázatokat és reflexiós kérdéseket adj a projektzáráshoz; "
            "ne pontozd, ne rangsorold a csapatokat, és ne dönts a tanár helyett. "
            "Ne találj ki forrást; csak a megadott agent-wiki találatokra hivatkozz. "
            "Akció csak createSticker vagy draftFeedback lehet. "
            "Tartsd be az agent-wiki használati szabályokat: a snapshot az állapotforrás, "
            "az agent-wiki a pedagógiai értelmezés forrása, külső vagy fő-wiki hivatkozás nem megengedett."
        )
        user_payload = {
            "request": request.model_dump(exclude={"snapshot", "traceId"}),
            "snapshot": request.snapshot,
            "wikiUsageRules": self.knowledge.guidance.text if self.knowledge.guidance is not None else None,
            "knowledgeHits": [hit.model_dump() for hit in hits],
        }
        payload_json = json.dumps(user_payload, ensure_ascii=False)
        payload_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()[:16]
        emit_trace(
            trace,
            "llm_payload_prepared",
            {
                "provider": "openai",
                "api": "responses.parse",
                "model": self.model,
                "responseFormat": "AdviceResponse",
                "systemChars": len(system),
                "payloadChars": len(payload_json),
                "maxPayloadChars": MAX_USER_PAYLOAD_CHARS,
                "payloadHash": payload_hash,
                "knowledgeHitIds": [hit.sourceId for hit in hits],
            },
        )
        if len(payload_json) > MAX_USER_PAYLOAD_CHARS:
            emit_trace(
                trace,
                "llm_payload_rejected",
                {
                    "reason": "payload_too_large",
                    "payloadChars": len(payload_json),
                    "maxPayloadChars": MAX_USER_PAYLOAD_CHARS,
                    "payloadHash": payload_hash,
                },
            )
            raise ValueError("snapshot token budget exceeded")

        llm_started = time.perf_counter()
        emit_trace(
            trace,
            "llm_call_started",
            {
                "provider": "openai",
                "api": "responses.parse",
                "model": self.model,
                "inputMessageCount": 2,
                "payloadHash": payload_hash,
            },
        )
        try:
            response = self.client.responses.parse(
                model=self.model,
                input=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": payload_json},
                ],
                text_format=AdviceResponse,
            )
        except Exception as exc:
            emit_trace(
                trace,
                "llm_call_failed",
                {"errorType": type(exc).__name__, "error": str(exc), "latencyMs": elapsed_ms(llm_started)},
            )
            raise
        parsed = response.output_parsed
        emit_trace(
            trace,
            "llm_call_completed",
            {
                "provider": "openai",
                "api": "responses.parse",
                "model": self.model,
                "responseId": getattr(response, "id", None),
                "latencyMs": elapsed_ms(llm_started),
                "usage": openai_usage_summary(response),
                "parsed": parsed is not None,
                "adviceCount": len(parsed.advices) if parsed is not None else 0,
            },
        )
        if parsed is None:
            emit_trace(trace, "llm_parse_empty", {"usingMockFallback": True})
        return parsed if parsed is not None else self.mock_response(request, hits)

    def validate_response(self, response: AdviceResponse, request: AdviceRequest, hits: list[KnowledgeHit]) -> AdviceResponse:
        allowed_sources = {hit.sourceId for hit in hits}.intersection(self.knowledge.document_ids)

        def teacher_label(source_id: str, fallback: str) -> str | None:
            return self.knowledge.display_label(source_id, fallback)

        fallback_citations: list[AdviceCitation] = []
        for hit in hits:
            if hit.sourceId not in allowed_sources:
                continue
            label = teacher_label(hit.sourceId, hit.label)
            if label is None:
                continue
            fallback_citations.append(
                AdviceCitation(
                    sourceId=hit.sourceId,
                    label=label,
                    excerpt=hit.excerpt[:180],
                    kind=self.knowledge.citation_kind(hit.sourceId),
                )
            )
            if len(fallback_citations) == 3:
                break

        cleaned: list[AdviceItem] = []
        for item in response.advices[:4]:
            rewritten: list[AdviceCitation] = []
            for citation in item.citations:
                if citation.sourceId not in allowed_sources:
                    continue
                label = teacher_label(citation.sourceId, citation.label)
                if label is None:
                    continue
                rewritten.append(
                    AdviceCitation(
                        sourceId=citation.sourceId,
                        label=label,
                        excerpt=(citation.excerpt or "")[:180] or None,
                        kind=self.knowledge.citation_kind(citation.sourceId),
                    )
                )
                if len(rewritten) == 3:
                    break
            item.citations = rewritten or fallback_citations[:2]

            if request.audience == "student":
                questions = [question.strip() for question in item.questions if question.strip()]
                if not questions and item.message.strip().endswith("?"):
                    questions = [item.message.strip()]
                questions = [ensure_question(question) for question in questions][:4]
                while len(questions) < 2:
                    questions.append(DEFAULT_STUDENT_QUESTIONS[len(questions)])
                item.questions = questions[:4]
                item.message = "Gondolkodtató kérdések az aktuális bizonyítékhoz."
                item.recommendation = None
                item.action = None
                item.kind = "suggestion"
            elif item.action and item.action.type not in {"createSticker", "draftFeedback"}:
                item.action = None
            elif item.action and item.action.type == "draftFeedback":
                draft = (item.action.payload.draft or "").strip()
                if not draft:
                    item.action = None
                elif request.targetType == "evidence" and request.targetId:
                    item.targetType = "evidence"
                    item.targetId = request.targetId
                    item.action.payload.evidenceId = request.targetId
                    item.action.payload.draft = draft

            cleaned.append(item)

        return AdviceResponse(advices=cleaned or self.mock_response(request, hits).advices)

    def mock_response(self, request: AdviceRequest, hits: list[KnowledgeHit]) -> AdviceResponse:
        citations: list[AdviceCitation] = []
        for hit in hits:
            label = self.knowledge.display_label(hit.sourceId, hit.label)
            if label is None:
                continue
            citations.append(
                AdviceCitation(
                    sourceId=hit.sourceId,
                    label=label,
                    excerpt=hit.excerpt[:180],
                    kind=self.knowledge.citation_kind(hit.sourceId),
                )
            )
            if len(citations) == 3:
                break
        snapshot = request.snapshot
        if request.audience == "student":
            title = safe_snapshot_title(
                find_in_snapshot(snapshot, "activeStickerTitle") or find_in_snapshot(snapshot, "title")
            )
            return AdviceResponse(
                advices=[
                    AdviceItem(
                        targetType=request.targetType or "instanceSticker",
                        targetId=request.targetId,
                        kind="suggestion",
                        severity="info",
                        message=f"Gondoljatok rá vissza: mit bizonyít a(z) {title} kapcsán a mostani munkátok?",
                        questions=DEFAULT_STUDENT_QUESTIONS,
                        citations=citations[:2],
                    )
                ]
            )

        if request.targetType == "evidence" and request.targetId:
            evidence_title = safe_snapshot_title(find_in_snapshot(snapshot.get("targetEvidence", {}), "EvidenceTitle"))
            return AdviceResponse(
                advices=[
                    AdviceItem(
                        targetType="evidence",
                        targetId=request.targetId,
                        kind="suggestion",
                        severity="info",
                        message=f"A(z) {evidence_title} beküldéshez célzott, szerkeszthető tanári visszajelzés készült.",
                        recommendation="Ismerd el a konkrét bizonyítékot, majd kérj vissza egy javítható döntést vagy pontosítást.",
                        citations=citations[:2],
                        action=AdviceAction(
                            type="draftFeedback",
                            label="Feedback draft használata",
                            payload=AdviceActionPayload(
                                evidenceId=request.targetId,
                                draft="Jó, hogy konkrét bizonyítékot hoztatok, és látszik, min gondolkodtatok. A következő körben válasszatok ki egy pontot, amit pontosabban alátámasztotok: milyen adat, megfigyelés vagy forrás erősítené meg az állításotokat?",
                            ),
                        ),
                    )
                ]
            )

        if request.targetType == "closureSynthesis":
            return AdviceResponse(
                advices=[
                    AdviceItem(
                        targetType="closureSynthesis",
                        targetId=request.targetId,
                        kind="info",
                        severity="info",
                        message="A projektzáró mintázat alapján a legerősebb tanulási jel az, ahol bizonyíték, tanári visszajelzés és reflexió egymásra épült.",
                        recommendation="A zárásban ne sikerpontszámot keress, hanem emelj ki 2-3 tanulási fordulópontot, és kösd őket a következő futtatás tanári adaptációihoz.",
                        questions=[
                            "Melyik csapatdöntésből lett látható tanulási bizonyíték?",
                            "Hol kellett más támaszt adni, mint amit előre terveztél?",
                            "Melyik differenciálási út maradjon meg a következő albumhoz, és melyiket módosítanád?",
                        ],
                        citations=citations,
                    )
                ]
            )

        pending_evidence_id = find_in_snapshot(snapshot, "pendingEvidenceId")
        advices: list[AdviceItem] = [
            AdviceItem(
                targetType="quality",
                targetKey="bizonyit",
                kind="suggestion",
                severity="figyelmet",
                message="A bizonyítékgyűjtés látszik, de érdemes jobban elválasztani a megfigyelést, a következtetést és a bizonytalanságot.",
                recommendation="Illessz be egy rövid mikromatricát, amely a mérési protokollt és a reflexiót erősíti meg.",
                citations=citations,
                action=AdviceAction(
                    type="createSticker",
                    label="Mikromatrica-draft megnyitása",
                    payload=AdviceActionPayload(
                        title="Bizonyíték-erősítő gyorskör",
                        phase="cselekves",
                        shortDescription="Rövid ellenőrző kör a mérés, bizonyíték és következtetés szétválasztására.",
                        studentInstruction="Nézzétek meg a bizonyítékaitokat, és jelöljétek, mi megfigyelés, mi következtetés, és hol maradt bizonytalanság.",
                        teacherSteps=[
                            "Válassz ki egy friss csapatbeküldést közös mintának.",
                            "Kérj három színű jelölést: megfigyelés, következtetés, bizonytalanság.",
                            "Zárásnak minden csapat írjon egy javított bizonyíték-mondatot.",
                        ],
                        studentChoice="Döntsétek el, melyik bizonyítékot érdemes megerősíteni vagy újramérni.",
                        expectedProduct="Javított bizonyíték-mondat vagy rövid mérési kiegészítés.",
                        evidenceTypeLabel="Rövid jegyzet vagy mérési kiegészítés",
                        reflectionPrompt="Mi lett pontosabb a gondolkodásotokban a jelölés után?",
                        bPlan="Ha nincs új mérésre idő, egy korábbi adatot elemezzetek újra.",
                        lowResource="Papíron, táblázat nélkül is működik három jelöléssel.",
                        week=snapshot.get("currentWeek", 1),
                    ),
                ),
            )
        ]

        if pending_evidence_id:
            advices.append(
                AdviceItem(
                    targetType="evidence",
                    targetId=pending_evidence_id,
                    kind="suggestion",
                    severity="info",
                    message="A beküldésben van tanulói bizonytalanság, erre érdemes támogató, javításra hívó feedbacket adni.",
                    recommendation="A visszajelzés kérdezzen rá a mérési döntésre, és jelöljön ki egy javítható pontot.",
                    citations=citations[:2],
                    action=AdviceAction(
                        type="draftFeedback",
                        label="Feedback draft használata",
                        payload=AdviceActionPayload(
                            evidenceId=pending_evidence_id,
                            draft="Jó, hogy jeleztétek a bizonytalanságot. Melyik mérési döntésetek befolyásolhatta leginkább az eredményt, és mit próbálnátok meg ugyanígy megismételve?",
                        ),
                    ),
                )
            )

        return AdviceResponse(advices=advices)

    def _log(
        self,
        level: str,
        run_id: str,
        request: AdviceRequest,
        hits: list[KnowledgeHit],
        started: float,
        fallback: bool,
        error: str | None = None,
    ) -> None:
        payload = {
            "event": "advice",
            "runId": run_id,
            "audience": request.audience,
            "ownerType": request.ownerType,
            "ownerId": request.ownerId,
            "promptVersion": request.promptVersion,
            "projectionVersion": self.knowledge.projection_version,
            "model": self.model,
            "fallback": fallback,
            "latencyMs": round((time.perf_counter() - started) * 1000),
            "citations": [
                {"sourceId": hit.sourceId, "kind": self.knowledge.citation_kind(hit.sourceId), "score": hit.score}
                for hit in hits
            ],
        }
        if error:
            payload["error"] = error
        getattr(logger, level)(json.dumps(payload, ensure_ascii=False))

    def _trace(
        self,
        level: str,
        run_id: str,
        started: float,
        sequence: int,
        step: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        if not ADVICE_TRACE_ENABLED:
            return
        payload = {
            "event": "advice_trace",
            "runId": run_id,
            "sequence": sequence,
            "step": step,
            "elapsedMs": elapsed_ms(started),
        }
        if details:
            payload["details"] = details
        getattr(logger, level)(json.dumps(payload, ensure_ascii=False, default=str))

    def _run_id(self, request: AdviceRequest) -> str:
        if request.traceId and request.traceId.strip():
            return re.sub(r"[^a-zA-Z0-9_.:-]", "-", request.traceId.strip())[:80]
        return hashlib.sha256(
            f"{request.audience}:{request.ownerType}:{request.ownerId}:{time.time_ns()}".encode("utf-8")
        ).hexdigest()[:12]


def emit_trace(
    trace: Callable[[str, dict[str, Any] | None], None] | None,
    step: str,
    details: dict[str, Any] | None = None,
) -> None:
    if trace is not None:
        trace(step, details)


def knowledge_hit_trace(hit: KnowledgeHit) -> dict[str, Any]:
    return {
        "sourceId": hit.sourceId,
        "label": hit.label,
        "score": hit.score,
        "matchedTerms": hit.matchedTerms,
    }


def snapshot_hash(snapshot: dict[str, Any]) -> str:
    payload = json.dumps(snapshot, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def snapshot_search_text(value: Any) -> str:
    if isinstance(value, dict):
        return " ".join(snapshot_search_text(child) for child in value.values())
    if isinstance(value, list):
        return " ".join(snapshot_search_text(child) for child in value)
    if value is None:
        return ""
    return str(value)


def elapsed_ms(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)


def openai_usage_summary(response: Any) -> dict[str, Any] | None:
    usage = getattr(response, "usage", None)
    if usage is None:
        return None
    if hasattr(usage, "model_dump"):
        return drop_none(usage.model_dump(exclude_none=True))
    if isinstance(usage, dict):
        return drop_none(usage)

    summary = {
        "input_tokens": getattr(usage, "input_tokens", None),
        "output_tokens": getattr(usage, "output_tokens", None),
        "total_tokens": getattr(usage, "total_tokens", None),
        "input_tokens_details": getattr(usage, "input_tokens_details", None),
        "output_tokens_details": getattr(usage, "output_tokens_details", None),
    }
    return drop_none(summary)


def drop_none(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: drop_none(child) for key, child in value.items() if child is not None}
    if isinstance(value, list):
        return [drop_none(child) for child in value]
    return value


def find_in_snapshot(value: Any, key: str) -> str | None:
    if isinstance(value, dict):
        if key in value and value[key]:
            return str(value[key])
        for child in value.values():
            found = find_in_snapshot(child, key)
            if found:
                return found
    if isinstance(value, list):
        for child in value:
            found = find_in_snapshot(child, key)
            if found:
                return found
    return None


DEFAULT_STUDENT_QUESTIONS = [
    "Melyik megfigyelésetek támasztja alá legjobban az állításotokat?",
    "Mi az a rész, ahol még bizonytalanok vagytok?",
    "Mit változtatna a következtetésen egy másik mérés vagy példa?",
]


def ensure_question(value: str) -> str:
    cleaned = value.strip()
    return cleaned if cleaned.endswith("?") else f"{cleaned}?"


def safe_snapshot_title(value: str | None) -> str:
    if not value:
        return "az aktuális matrica"
    cleaned = value.strip()
    name_like = re.search(r"\b[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+ [A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+\b", cleaned)
    if name_like or "@" in cleaned:
        return "az aktuális matrica"
    return cleaned[:80]


app = FastAPI(title="Matricás Album AI Agent", version="2.0.0")
knowledge = KnowledgeBase(Path(os.getenv("AGENT_WIKI_PATH", "/app/agent-wiki")))
engine = AdviceEngine(knowledge)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "projectionVersion": knowledge.projection_version,
        "documents": len(knowledge.documents),
        "model": engine.model,
        "mock": not bool(engine.api_key),
        "agnoAvailable": Agent is not None,
        "agnoRuntimeActive": engine._agno_agent is not None,
        "adviceTraceEnabled": ADVICE_TRACE_ENABLED,
        "adviceTraceWikiCandidateLimit": ADVICE_TRACE_WIKI_CANDIDATE_LIMIT,
    }


@app.post("/advise", response_model=AdviceResponse)
def advise(request: AdviceRequest) -> AdviceResponse:
    if request.projectionVersion != knowledge.projection_version:
        request.projectionVersion = knowledge.projection_version
    return engine.advise(request)
