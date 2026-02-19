from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.domains.documents.models import Document, DocumentStatus
from app.domains.documents.schemas import DocumentCreate

def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id).first()

def get_document_by_path(db: Session, file_path: str) -> Optional[Document]:
    return db.query(Document).filter(Document.file_path == file_path).first()

def get_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    return db.query(Document).order_by(Document.ingested_at.desc()).offset(skip).limit(limit).all()

def create_document(db: Session, document: DocumentCreate) -> Document:
    db_document = Document(
        file_path=document.file_path,
        file_name=document.file_name,
        file_hash=document.file_hash,
        page_count=document.page_count,
        status=document.status
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document
