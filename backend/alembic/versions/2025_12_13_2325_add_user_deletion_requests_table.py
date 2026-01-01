"""add_user_deletion_requests_table

Revision ID: 152b16a54cb5
Revises: e89df6f9b07c
Create Date: 2025-12-13 23:25:06.268998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '152b16a54cb5'
down_revision: Union[str, None] = 'e89df6f9b07c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_deletion_requests table
    op.create_table(
        'user_deletion_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('requested_by_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='deletionrequeststatus'), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_deletion_requests_id'), 'user_deletion_requests', ['id'], unique=False)


def downgrade() -> None:
    # Drop user_deletion_requests table
    op.drop_index(op.f('ix_user_deletion_requests_id'), table_name='user_deletion_requests')
    op.drop_table('user_deletion_requests')
