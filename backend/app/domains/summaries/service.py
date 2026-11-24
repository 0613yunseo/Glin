import time
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.domains.documents.models import Document, PageLine
from app.domains.summaries import engine, llm
from app.domains.summaries.models import Evidence, SummaryItem, SummaryRun, SummaryRunDocument

METHOD = "tfidf+rerank"
EMBEDDING_MODEL = "tfidf-char-bigram-v1"
RERANKER_MODEL = "lexical-coverage-v1"


def load_pages(db: Session, document_id) -> Dict[int, List[str]]:
    rows = (
        db.query(PageLine.page_number, PageLine.line_number, PageLine.text)
        .filter(PageLine.document_id == document_id)
        .order_by(PageLine.page_number, PageLine.line_number)
        .all()
    )
    pages: Dict[int, List[str]] = {}
    for page_no, _line_no, text in rows:
        pages.setdefault(page_no, []).append(text)
    return pages


def generate(
    db: Session,
    doc: Document,
    bullets: int = 5,
    top_k: int = 2,
    mode: str = "deterministic",
    style: str = "bullet",
    length: str = "medium",
) -> SummaryRun:
    started = time.perf_counter()
    pages = load_pages(db, doc.id)
    if not pages:
        raise ValueError("텍스트가 없는 문서입니다.")

    index = engine.Index(engine.build_windows(pages))
    temperature = 0.0 if mode == "deterministic" else 0.4

    text = "\n".join(line for p in sorted(pages) for line in pages[p])
    llm_bullets = llm.summarize(text, bullets, temperature)
    if llm_bullets:
        texts, provider, model = llm_bullets, "gemini", llm.model_name()
    else:
        texts, provider, model = engine.extractive_bullets(index, pages, bullets), "local", "extractive-tfidf"
    if not texts:
        raise ValueError("요약할 내용을 찾지 못했습니다.")

    run = SummaryRun(
        run_type="SINGLE",
        style=style,
        length=length,
        bullet_count=len(texts),
        evidence_per_bullet=top_k,
        mode=mode,
        model_provider=provider,
        model_name=model,
        embedding_model=EMBEDDING_MODEL,
        reranker_model=RERANKER_MODEL,
        temperature=temperature,
        status="SUCCESS",
    )
    db.add(run)
    db.flush()
    db.add(SummaryRunDocument(summary_run_id=run.id, document_id=doc.id))

    for order, bullet in enumerate(texts, start=1):
        item = SummaryItem(summary_run_id=run.id, document_id=doc.id, item_order=order, text=bullet)
        db.add(item)
        db.flush()
        for cand in engine.pick_evidence(index, bullet, top_k):
            w = cand.window
            db.add(
                Evidence(
                    summary_item_id=item.id,
                    document_id=doc.id,
                    page_no=w.page,
                    line_start=w.start,
                    line_end=w.end,
                    quote=w.text,
                    score=cand.rerank_score,
                    retrieval_score=cand.retrieval_score,
                    rerank_score=cand.rerank_score,
                    method=METHOD,
                    supported=cand.supported,
                )
            )

    run.latency_ms = int((time.perf_counter() - started) * 1000)
    db.commit()
    db.refresh(run)
    return run


MAX_RUNS_PER_DOCUMENT = 10


def run_count(db: Session, document_id) -> int:
    return db.query(SummaryRun).join(SummaryItem, SummaryItem.summary_run_id == SummaryRun.id).filter(
        SummaryItem.document_id == document_id
    ).distinct().count()


def latest_run(db: Session, document_id) -> Optional[SummaryRun]:
    return (
        db.query(SummaryRun)
        .join(SummaryItem, SummaryItem.summary_run_id == SummaryRun.id)
        .filter(SummaryItem.document_id == document_id, SummaryRun.status == "SUCCESS")
        .order_by(SummaryRun.created_at.desc())
        .first()
    )


def to_payload(db: Session, run: SummaryRun, doc: Document) -> dict:
    items = (
        db.query(SummaryItem).filter(SummaryItem.summary_run_id == run.id).order_by(SummaryItem.item_order).all()
    )
    out_items = []
    for it in items:
        evs = (
            db.query(Evidence)
            .filter(Evidence.summary_item_id == it.id)
            .order_by(Evidence.score.desc(), Evidence.page_no, Evidence.line_start)
            .all()
        )
        out_items.append(
            {
                "id": str(it.id),
                "item_order": it.item_order,
                "text": it.text,
                "evidences": [
                    {
                        "id": str(e.id),
                        "summary_item_id": str(e.summary_item_id),
                        "document_id": str(e.document_id),
                        "page_no": e.page_no,
                        "line_start": e.line_start,
                        "line_end": e.line_end,
                        "quote": e.quote,
                        "score": e.score or 0.0,
                        "method": e.method,
                        "supported": bool(e.supported),
                        "retrieval_score": e.retrieval_score,
                        "rerank_score": e.rerank_score,
                    }
                    for e in evs
                ],
            }
        )
    return {
        "summary_run": {
            "id": str(run.id),
            "run_type": run.run_type,
            "document_id": str(doc.id),
            "document_name": doc.file_name,
            "style": run.style,
            "length": run.length,
            "summary_bullets": run.bullet_count or len(out_items),
            "evidence_top_k": run.evidence_per_bullet or 1,
            "mode": run.mode or "deterministic",
            "status": "ready",
            "created_at": run.created_at.isoformat(),
            "latency_ms": run.latency_ms or 0,
            "model_provider": run.model_provider,
            "model_name": run.model_name,
            "embedding_model": run.embedding_model,
            "reranker_model": run.reranker_model,
        },
        "items": out_items,
    }
