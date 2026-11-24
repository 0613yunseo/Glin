from pydantic import BaseModel, ConfigDict, computed_field
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
    lines: int = 0  # 문서 전체 라인 수

    model_config = ConfigDict(from_attributes=True)


class DocumentPageResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    text: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def pageNo(self) -> int:  # 프론트 PageMeta 호환
        return self.page_number


class DocumentLineResponse(BaseModel):
    id: UUID
    document_id: UUID
    page_number: int
    line_number: int
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def lineNo(self) -> int:  # 프론트 Line 호환
        return self.line_number
