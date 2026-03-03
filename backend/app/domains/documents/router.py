from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db
from app.domains.documents import service, schemas
from app.domains.documents.models import Document, DocumentPage, DocumentLine

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)


@router.post("/", response_model=schemas.DocumentResponse)
def create_document(document: schemas.DocumentCreate, db: Session = Depends(get_db)):
    db_document = service.get_document_by_path(db, file_path=document.file_path)
    if db_document:
        raise HTTPException(status_code=409, detail="Document with this file path already exists")
    return service.create_document(db=db, document=document)


@router.get("/", response_model=List[schemas.DocumentResponse])
def read_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_documents(db, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=schemas.DocumentResponse)
def read_document(document_id: UUID, db: Session = Depends(get_db)):
    db_document = service.get_document(db, document_id=document_id)
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_document


# =========================
# ✅ 상세페이지에서 필요한 추가 API
# =========================

@router.get("/{document_id}/pages", response_model=List[schemas.DocumentPageResponse])
def read_document_pages(document_id: UUID, db: Session = Depends(get_db)):
    # 문서 존재 확인(없으면 프론트가 "Document not found" 받게)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pages = (
        db.query(DocumentPage)
        .filter(DocumentPage.document_id == document_id)
        .order_by(DocumentPage.page_number.asc())
        .all()
    )
    # pages가 없으면 [] 반환(정상)
    return pages


@router.get("/{document_id}/lines", response_model=List[schemas.DocumentLineResponse])
def read_document_lines(
    document_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    lines = (
        db.query(DocumentLine)
        .filter(
            DocumentLine.document_id == document_id,
            DocumentLine.page_number == page,
        )
        .order_by(DocumentLine.line_number.asc())
        .limit(limit)
        .all()
    )
    return lines