"""align ERD: document_pages, page_lines, summary tables

Revision ID: c3d4a1b2e5f6
Revises: bf120d8b684f
Create Date: 2026-11-24 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c3d4a1b2e5f6"
down_revision: Union[str, None] = "bf120d8b684f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _now():
    return sa.text("now()")


def upgrade() -> None:
    op.create_table(
        "document_pages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("text_len", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "page_number", name="uq_document_pages_doc_page"),
    )
    op.create_index("ix_document_pages_document_id", "document_pages", ["document_id"])

    op.create_table(
        "page_lines",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("page_id", sa.UUID(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("line_no", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("bbox_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["page_id"], ["document_pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("page_id", "line_no", name="uq_page_lines_page_line"),
    )
    op.create_index("ix_page_lines_document_id", "page_lines", ["document_id"])
    op.create_index("ix_page_lines_page_id", "page_lines", ["page_id"])

    op.create_table(
        "summary_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("run_type", sa.String(), nullable=False),
        sa.Column("style", sa.String(), nullable=False),
        sa.Column("length", sa.String(), nullable=False),
        sa.Column("bullet_count", sa.Integer(), nullable=True),
        sa.Column("evidence_per_bullet", sa.Integer(), nullable=True),
        sa.Column("mode", sa.String(), nullable=True),
        sa.Column("model_provider", sa.String(), nullable=True),
        sa.Column("model_name", sa.String(), nullable=True),
        sa.Column("embedding_model", sa.String(), nullable=True),
        sa.Column("reranker_model", sa.String(), nullable=True),
        sa.Column("temperature", sa.Float(), nullable=True),
        sa.Column("seed", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "summary_run_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("summary_run_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["summary_run_id"], ["summary_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("summary_run_id", "document_id", name="uq_run_document"),
    )
    op.create_index("ix_summary_run_documents_summary_run_id", "summary_run_documents", ["summary_run_id"])
    op.create_index("ix_summary_run_documents_document_id", "summary_run_documents", ["document_id"])

    op.create_table(
        "summary_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("summary_run_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=True),
        sa.Column("item_order", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["summary_run_id"], ["summary_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("summary_run_id", "item_order", name="uq_summary_item_order"),
    )
    op.create_index("ix_summary_items_summary_run_id", "summary_items", ["summary_run_id"])
    op.create_index("ix_summary_items_document_id", "summary_items", ["document_id"])

    op.create_table(
        "evidences",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("summary_item_id", sa.UUID(), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False),
        sa.Column("page_no", sa.Integer(), nullable=False),
        sa.Column("line_start", sa.Integer(), nullable=False),
        sa.Column("line_end", sa.Integer(), nullable=False),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("method", sa.String(), nullable=True),
        sa.Column("supported", sa.Boolean(), nullable=True),
        sa.CheckConstraint("line_start <= line_end", name="ck_evidences_line_range"),
        sa.ForeignKeyConstraint(["summary_item_id"], ["summary_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_evidences_summary_item_id", "evidences", ["summary_item_id"])
    op.create_index("ix_evidences_document_id", "evidences", ["document_id"])


def downgrade() -> None:
    op.drop_table("evidences")
    op.drop_table("summary_items")
    op.drop_table("summary_run_documents")
    op.drop_table("summary_runs")
    op.drop_table("page_lines")
    op.drop_table("document_pages")
