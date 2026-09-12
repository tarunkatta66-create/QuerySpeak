"""Initial app metadata tables

Revision ID: 001_initial_app_metadata
Revises: 
Create Date: 2026-09-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_app_metadata'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    op.create_table(
        'db_connections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('host', sa.String(length=255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('database_name', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('encrypted_password', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_db_connections_id'), 'db_connections', ['id'], unique=False)
    op.create_index(op.f('ix_db_connections_user_id'), 'db_connections', ['user_id'], unique=False)

    op.create_table(
        'query_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('connection_id', sa.Integer(), nullable=False),
        sa.Column('natural_language_query', sa.Text(), nullable=False),
        sa.Column('generated_sql', sa.Text(), nullable=False),
        sa.Column('was_successful', sa.Boolean(), nullable=False),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['connection_id'], ['db_connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_query_history_connection_id'), 'query_history', ['connection_id'], unique=False)
    op.create_index(op.f('ix_query_history_id'), 'query_history', ['id'], unique=False)
    op.create_index(op.f('ix_query_history_user_id'), 'query_history', ['user_id'], unique=False)

    op.create_table(
        'saved_queries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('natural_language_query', sa.Text(), nullable=False),
        sa.Column('generated_sql', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_queries_id'), 'saved_queries', ['id'], unique=False)
    op.create_index(op.f('ix_saved_queries_user_id'), 'saved_queries', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_queries_user_id'), table_name='saved_queries')
    op.drop_index(op.f('ix_saved_queries_id'), table_name='saved_queries')
    op.drop_table('saved_queries')

    op.drop_index(op.f('ix_query_history_user_id'), table_name='query_history')
    op.drop_index(op.f('ix_query_history_id'), table_name='query_history')
    op.drop_index(op.f('ix_query_history_connection_id'), table_name='query_history')
    op.drop_table('query_history')

    op.drop_index(op.f('ix_db_connections_user_id'), table_name='db_connections')
    op.drop_index(op.f('ix_db_connections_id'), table_name='db_connections')
    op.drop_table('db_connections')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
