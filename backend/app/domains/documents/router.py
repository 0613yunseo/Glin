import os
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.domains.documents import ingest, schemas, service
from app.domains.documents.models import Document, DocumentPage, PageLine

router = APIRouter(prefix="/documents", tags=["documents"])

# 공개 데모 서버라 DB가 무한히 커지지 않도록 문서 수를 제한한다 (환경변수로 조정 가능)
MAX_DOCUMENTS = int(os.getenv("MAX_DOCUMENTS", "100"))


@router.post("/", response_model=schemas.DocumentResponse)
def create_document(document: schemas.DocumentCreate, db: Session = Depends(get_db)):
    if service.get_document_by_path(db, file_path=document.file_path):
        raise HTTPException(status_code=409, detail="Document with this file path already exists")
    doc = service.create_document(db=db, document=document)
    return service.to_response(doc, 0)


@router.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """PDF를 받아 텍스트를 추출하고 페이지/라인으로 저장한다. 같은 파일(해시)이면 기존 문서를 돌려준다."""
    name = os.path.basename(file.filename or "document.pdf")[:200]
    if not name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 올릴 수 있습니다.")

    data = file.file.read(ingest.MAX_BYTES + 1)
    if len(data) > ingest.MAX_BYTES:
        raise HTTPException(status_code=413, detail="파일이 너무 큽니다. (최대 10MB)")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="올바른 PDF 파일이 아닙니다.")

    import hashlib

    existing = service.get_document_by_hash(db, hashlib.sha256(data).hexdigest())
    if existing:
        return service.to_response(existing, service.line_counts(db, [existing.id]).get(existing.id, 0))

    if service.count_documents(db) >= MAX_DOCUMENTS:
        raise HTTPException(status_code=429, detail="데모 서버의 문서 저장 한도에 도달했습니다.")

    try:
        pages = ingest.extract_lines(data)
    except ingest.IngestError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    doc = service.create_document_from_pages(db, name, data, pages)
    return service.to_response(doc, sum(len(p) for p in pages))


@router.get("/", response_model=List[schemas.DocumentResponse])
def read_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    docs = service.get_documents(db, skip=skip, limit=limit)
    counts = service.line_counts(db, [d.id for d in docs])
    return [service.to_response(d, counts.get(d.id, 0)) for d in docs]


@router.get("/{document_id}", response_model=schemas.DocumentResponse)
def read_document(document_id: UUID, db: Session = Depends(get_db)):
    doc = service.get_document(db, document_id=document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return service.to_response(doc, service.line_counts(db, [doc.id]).get(doc.id, 0))


@router.get("/{document_id}/pages", response_model=List[schemas.DocumentPageResponse])
def read_document_pages(document_id: UUID, db: Session = Depends(get_db)):
    if not service.get_document(db, document_id=document_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return (
        db.query(DocumentPage)
        .filter(DocumentPage.document_id == document_id)
        .order_by(DocumentPage.page_number.asc())
        .all()
    )


@router.get("/{document_id}/lines", response_model=List[schemas.DocumentLineResponse])
def read_document_lines(
    document_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    if not service.get_document(db, document_id=document_id):
        raise HTTPException(status_code=404, detail="Document not found")
    return (
        db.query(PageLine)
        .filter(PageLine.document_id == document_id, PageLine.page_number == page)
        .order_by(PageLine.line_number.asc())
        .limit(limit)
        .all()
    )
