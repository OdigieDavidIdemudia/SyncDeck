"""add_promotion_requests_table

Revision ID: a9f3c2e1d4b7
Revises: 152b16a54cb5
Create Date: 2025-12-14 01:59

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9f3c2e1d4b7'
down_revision: Union[str, None] = '152b16a54cb5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create promotion_requests table
    op.create_table(
        'promotion_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('requested_by_id', sa.Integer(), nullable=True),
        sa.Column('target_role', sa.Enum('member', 'unit_head', 'backup_unit_head', 'group_head', name='userrole'), nullable=True),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='promotionrequeststatus'), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('reviewed_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_promotion_requests_id'), 'promotion_requests', ['id'], unique=False)


def downgrade() -> None:
    # Drop promotion_requests table
    op.drop_index(op.f('ix_promotion_requests_id'), table_name='promotion_requests')
    op.drop_table('promotion_requests')
