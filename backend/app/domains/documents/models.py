import uuid
from enum import Enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    func,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class DocumentStatus(str, Enum):
    INGESTED = "INGESTED"
    PROCESSING = "PROCESSING"
    FAILED = "FAILED"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    file_path: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)

    file_hash: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    status: Mapped[DocumentStatus] = mapped_column(
        SQLEnum(DocumentStatus),
        nullable=False,
        default=DocumentStatus.INGESTED,
    )

    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    pages: Mapped[List["DocumentPage"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    lines: Mapped[List["PageLine"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DocumentPage(Base):
    __tablename__ = "document_pages"
    # 같은 문서 안에서 페이지 번호는 한 번만
    __table_args__ = (UniqueConstraint("document_id", "page_number", name="uq_document_pages_doc_page"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # 1-based page number
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # 페이지 전체 텍스트
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    text_len: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="pages")
    lines: Mapped[List["PageLine"]] = relationship(
        back_populates="page",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PageLine(Base):
    """페이지 안의 라인. 같은 PDF는 항상 같은 line_no가 나오도록 (page_id, line_no)를 유니크로 묶는다."""

    __tablename__ = "page_lines"
    __table_args__ = (UniqueConstraint("page_id", "line_no", name="uq_page_lines_page_line"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_pages.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # API 응답은 기존 이름(page_number, line_number)을 유지한다. 조회 속도를 위해 page_number를 함께 저장.
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    line_number: Mapped[int] = mapped_column("line_no", Integer, nullable=False)

    text: Mapped[str] = mapped_column(Text, nullable=False)
    bbox_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="lines")
    page: Mapped["DocumentPage"] = relationship(back_populates="lines")


# 이전 이름 호환 (router/schemas가 DocumentLine을 import)
DocumentLine = PageLine
