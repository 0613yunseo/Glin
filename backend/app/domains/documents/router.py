from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.api.deps import get_db
from app.domains.documents import service, schemas

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
    documents = service.get_documents(db, skip=skip, limit=limit)
    return documents

@router.get("/{document_id}", response_model=schemas.DocumentResponse)
def read_document(document_id: UUID, db: Session = Depends(get_db)):
    db_document = service.get_document(db, document_id=document_id)
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_document
