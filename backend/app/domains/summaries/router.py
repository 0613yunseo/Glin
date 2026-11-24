from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.domains.documents import service as documents
from app.domains.summaries import service

router = APIRouter(prefix="/ai", tags=["summary"])


class SummaryRequest(BaseModel):
    document_id: UUID
    style: str = "bullet"
    length: str = "medium"
    summary_bullets: int = Field(5, ge=3, le=10)
    evidence_top_k: int = Field(2, ge=1, le=3)
    mode: str = Field("deterministic", pattern="^(deterministic|best_effort)$")


def _doc_or_404(db: Session, document_id: UUID):
    doc = documents.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/summary/{document_id}")
def get_summary(document_id: UUID, db: Session = Depends(get_db)):
    """가장 최근 요약. 아직 없으면 기본 옵션으로 한 번 만들어 돌려준다."""
    doc = _doc_or_404(db, document_id)
    run = service.latest_run(db, document_id)
    if run is None:
        try:
            run = service.generate(db, doc)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    return service.to_payload(db, run, doc)


@router.post("/summary")
def create_summary(req: SummaryRequest, db: Session = Depends(get_db)):
    doc = _doc_or_404(db, req.document_id)
    if service.run_count(db, doc.id) >= service.MAX_RUNS_PER_DOCUMENT:
        raise HTTPException(status_code=429, detail="이 문서의 요약 재실행 한도에 도달했습니다.")
    try:
        run = service.generate(
            db,
            doc,
            bullets=req.summary_bullets,
            top_k=req.evidence_top_k,
            mode=req.mode,
            style=req.style,
            length=req.length,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return service.to_payload(db, run, doc)
