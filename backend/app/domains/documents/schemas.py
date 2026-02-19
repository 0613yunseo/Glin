from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.domains.documents.models import DocumentStatus

class DocumentBase(BaseModel):
    file_path: str
    file_name: str
    file_hash: Optional[str] = None
    page_count: Optional[int] = None
    status: DocumentStatus = DocumentStatus.INGESTED

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_hash: Optional[str] = None
    page_count: Optional[int] = None
    status: Optional[DocumentStatus] = None

class DocumentResponse(DocumentBase):
    id: UUID
    ingested_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
