import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    CheckConstraint,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class SummaryRun(Base):
    """요약 1회 실행. 재현성을 위해 모델·옵션을 같이 기록한다."""

    __tablename__ = "summary_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    run_type: Mapped[str] = mapped_column(String, nullable=False)  # SINGLE / MULTI
    style: Mapped[str] = mapped_column(String, nullable=False, default="bullet")
    length: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    bullet_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evidence_per_bullet: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # deterministic / best_effort
    model_provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    model_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    embedding_model: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reranker_model: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)  # SUCCESS / FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    documents: Mapped[List["SummaryRunDocument"]] = relationship(
        back_populates="summary_run", cascade="all, delete-orphan", passive_deletes=True
    )
    items: Mapped[List["SummaryItem"]] = relationship(
        back_populates="summary_run", cascade="all, delete-orphan", passive_deletes=True
    )


class SummaryRunDocument(Base):
    """MULTI 요약에서 어떤 문서들이 들어갔는지."""

    __tablename__ = "summary_run_documents"
    __table_args__ = (UniqueConstraint("summary_run_id", "document_id", name="uq_run_document"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    summary_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("summary_runs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )

    summary_run: Mapped["SummaryRun"] = relationship(back_populates="documents")


class SummaryItem(Base):
    __tablename__ = "summary_items"
    __table_args__ = (UniqueConstraint("summary_run_id", "item_order", name="uq_summary_item_order"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    summary_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("summary_runs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # SINGLE 요약은 필수, MULTI 통합 요약은 비어 있을 수 있다
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=True
    )
    item_order: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    summary_run: Mapped["SummaryRun"] = relationship(back_populates="items")
    evidences: Mapped[List["Evidence"]] = relationship(
        back_populates="summary_item", cascade="all, delete-orphan", passive_deletes=True
    )


class Evidence(Base):
    """요약 bullet 하나에 붙는 원문 근거 (page / line 범위 + 인용문)."""

    __tablename__ = "evidences"
    __table_args__ = (CheckConstraint("line_start <= line_end", name="ck_evidences_line_range"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    summary_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("summary_items.id", ondelete="CASCADE"), index=True, nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    page_no: Mapped[int] = mapped_column(Integer, nullable=False)
    line_start: Mapped[int] = mapped_column(Integer, nullable=False)
    line_end: Mapped[int] = mapped_column(Integer, nullable=False)
    quote: Mapped[str] = mapped_column(Text, nullable=False)

    # PRD v1.1 옵션 필드
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # embed+rerank
    supported: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    summary_item: Mapped["SummaryItem"] = relationship(back_populates="evidences")
