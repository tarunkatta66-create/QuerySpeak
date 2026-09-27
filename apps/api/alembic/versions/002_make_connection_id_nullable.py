"""Make connection_id nullable in query_history

Revision ID: 002_make_connection_id_nullable
Revises: 001_initial_app_metadata
Create Date: 2026-09-27 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_make_connection_id_nullable'
down_revision: Union[str, None] = '001_initial_app_metadata'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('query_history', 'connection_id',
               existing_type=sa.Integer(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('query_history', 'connection_id',
               existing_type=sa.Integer(),
               nullable=False)
