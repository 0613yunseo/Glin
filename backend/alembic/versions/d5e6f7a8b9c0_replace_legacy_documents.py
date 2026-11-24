"""replace legacy documents table (different schema from an older Glin version)

Revision ID: d5e6f7a8b9c0
Revises: c3d4a1b2e5f6
Create Date: 2026-11-25 09:00:00

예전 개발 때 만든 documents 테이블이 지금 모델과 컬럼이 다른 DB(file_path 없음)에서만 동작한다.
기존 테이블은 삭제하지 않고 documents_legacy로 이름만 바꿔 보관하고, 새 구조로 다시 만든다.
"""
import importlib.util
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c3d4a1b2e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HERE = os.path.dirname(__file__)

# documents를 참조하는 새 테이블들 (c3d4에서 만든 것, 모두 비어 있음)
DEPENDENT_TABLES = [
    "evidences",
    "summary_items",
    "summary_run_documents",
    "summary_runs",
    "page_lines",
    "document_pages",
]


def _load(filename: str):
    spec = importlib.util.spec_from_file_location(filename[:-3], os.path.join(HERE, filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if not insp.has_table("documents"):
        return
    columns = {c["name"] for c in insp.get_columns("documents")}
    if "file_path" in columns:
        return  # 이미 현재 구조

    for table in DEPENDENT_TABLES:
        op.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')

    op.execute("ALTER TABLE documents RENAME TO documents_legacy")
    # 인덱스·제약 이름이 새 테이블과 겹치지 않도록 같이 바꾼다
    rows = bind.execute(
        sa.text("SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = 'documents_legacy'")
    ).fetchall()
    for (name,) in rows:
        op.execute(f'ALTER INDEX "{name}" RENAME TO "legacy_{name}"')
    has_type = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'documentstatus'")).first()
    if has_type:
        op.execute("ALTER TYPE documentstatus RENAME TO documentstatus_legacy")

    # documents(e6a2)와 나머지 테이블(c3d4)을 현재 구조로 다시 만든다
    _load("e6a2eaa395d3_init_documents.py").upgrade()
    _load("c3d4a1b2e5f6_align_erd_pages_lines_summaries.py").upgrade()


def downgrade() -> None:
    pass
