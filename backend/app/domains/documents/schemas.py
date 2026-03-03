from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List
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


# ✅ 상세 페이지용: pages / lines 응답 스키마
class DocumentPageResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    text: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentLineResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    line_number: int
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)