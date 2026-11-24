"""evidences: retrieval_score, rerank_score

Revision ID: e7f8a9b0c1d2
Revises: d5e6f7a8b9c0
Create Date: 2026-11-25 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("evidences", sa.Column("retrieval_score", sa.Float(), nullable=True))
    op.add_column("evidences", sa.Column("rerank_score", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("evidences", "rerank_score")
    op.drop_column("evidences", "retrieval_score")
