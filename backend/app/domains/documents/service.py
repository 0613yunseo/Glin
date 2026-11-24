import hashlib
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domains.documents.models import Document, DocumentPage, DocumentStatus, PageLine
from app.domains.documents.schemas import DocumentCreate


def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id).first()


def get_document_by_path(db: Session, file_path: str) -> Optional[Document]:
    return db.query(Document).filter(Document.file_path == file_path).first()


def get_document_by_hash(db: Session, file_hash: str) -> Optional[Document]:
    return db.query(Document).filter(Document.file_hash == file_hash).first()


def count_documents(db: Session) -> int:
    return db.query(func.count(Document.id)).scalar() or 0


def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    return db.query(Document).order_by(Document.ingested_at.desc()).offset(skip).limit(limit).all()


def line_counts(db: Session, document_ids: List[UUID]) -> dict:
    if not document_ids:
        return {}
    rows = (
        db.query(PageLine.document_id, func.count(PageLine.id))
        .filter(PageLine.document_id.in_(document_ids))
        .group_by(PageLine.document_id)
        .all()
    )
    return {doc_id: n for doc_id, n in rows}


def to_response(doc: Document, lines: int) -> dict:
    return {
        "id": doc.id,
        "file_path": doc.file_path,
        "file_name": doc.file_name,
        "file_hash": doc.file_hash,
        "page_count": doc.page_count,
        "status": doc.status,
        "ingested_at": doc.ingested_at,
        "updated_at": doc.updated_at,
        "lines": lines,
    }


def create_document(db: Session, document: DocumentCreate) -> Document:
    db_document = Document(
        file_path=document.file_path,
        file_name=document.file_name,
        file_hash=document.file_hash,
        page_count=document.page_count,
        status=document.status,
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def create_document_from_pages(db: Session, file_name: str, data: bytes, pages: List[List[str]]) -> Document:
    """추출된 페이지/라인을 한 트랜잭션으로 저장한다. (원본 PDF는 저장하지 않고 텍스트만 보관)"""
    sha = hashlib.sha256(data).hexdigest()
    doc = Document(
        file_path=f"uploads/{sha[:16]}/{file_name}",
        file_name=file_name,
        file_hash=sha,
        page_count=len(pages),
        status=DocumentStatus.INGESTED,
    )
    db.add(doc)
    db.flush()
    for page_no, lines in enumerate(pages, start=1):
        page = DocumentPage(
            document_id=doc.id,
            page_number=page_no,
            text="\n".join(lines),
            text_len=sum(len(x) for x in lines),
        )
        db.add(page)
        db.flush()
        db.add_all(
            PageLine(
                document_id=doc.id,
                page_id=page.id,
                page_number=page_no,
                line_number=line_no,
                text=text,
            )
            for line_no, text in enumerate(lines, start=1)
        )
    db.commit()
    db.refresh(doc)
    return doc
