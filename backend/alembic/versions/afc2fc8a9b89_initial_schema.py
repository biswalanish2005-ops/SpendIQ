"""initial_schema

Revision ID: afc2fc8a9b89
Revises: 
Create Date: 2026-09-08 21:08:48.672617

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'afc2fc8a9b89'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False, server_default=''),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. accounts
    op.create_table(
        'accounts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('type', sa.String(50), nullable=False, server_default='CHECKING'),
        sa.Column('institution_name', sa.String(100), nullable=False, server_default='Manual'),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('balance', sa.Numeric(12, 2), nullable=False, server_default='0.00'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_accounts_user_id', 'accounts', ['user_id'])

    # 3. categories
    op.create_table(
        'categories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('group', sa.String(50), nullable=False, server_default='Discretionary'),
        sa.Column('icon', sa.String(50), nullable=False, server_default='Tag'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_categories_user_id', 'categories', ['user_id'])

    # 4. transactions
    op.create_table(
        'transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_id', sa.String(36), sa.ForeignKey('accounts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category_id', sa.String(36), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category_name', sa.String(100), nullable=False, server_default='Uncategorized'),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('direction', sa.String(20), nullable=False, server_default='EXPENSE'),
        sa.Column('merchant_name', sa.String(255), nullable=False, server_default='Unknown Merchant'),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('source', sa.String(50), nullable=False, server_default='MANUAL'),
        sa.Column('external_id', sa.String(255), nullable=True),
        sa.Column('import_job_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'])
    op.create_index('ix_transactions_account_id', 'transactions', ['account_id'])
    op.create_index('ix_transactions_category_id', 'transactions', ['category_id'])
    op.create_index('ix_transactions_category_name', 'transactions', ['category_name'])
    op.create_index('ix_transactions_occurred_at', 'transactions', ['occurred_at'])
    op.create_index('ix_transactions_direction', 'transactions', ['direction'])
    op.create_index('ix_transactions_merchant_name', 'transactions', ['merchant_name'])
    op.create_index('ix_transactions_external_id', 'transactions', ['external_id'])
    op.create_index('ix_transactions_import_job_id', 'transactions', ['import_job_id'])
    op.create_index('ix_transactions_user_occurred', 'transactions', ['user_id', 'occurred_at'])
    op.create_index('ix_transactions_user_category', 'transactions', ['user_id', 'category_name'])

    # 5. forecast_runs
    op.create_table(
        'forecast_runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_metric', sa.String(50), nullable=False, server_default='TOTAL_SPENDING'),
        sa.Column('horizon_days', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('model_name', sa.String(100), nullable=False, server_default='Holt-Winters'),
        sa.Column('model_version', sa.String(20), nullable=False, server_default='1.0.0'),
        sa.Column('metrics_json', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_forecast_runs_user_id', 'forecast_runs', ['user_id'])

    # 6. forecast_points
    op.create_table(
        'forecast_points',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('run_id', sa.String(36), sa.ForeignKey('forecast_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period_date', sa.Date(), nullable=False),
        sa.Column('predicted_value', sa.Numeric(12, 2), nullable=False),
        sa.Column('lower_bound', sa.Numeric(12, 2), nullable=True),
        sa.Column('upper_bound', sa.Numeric(12, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_forecast_points_run_id', 'forecast_points', ['run_id'])
    op.create_index('ix_forecast_points_period_date', 'forecast_points', ['period_date'])

    # 7. anomalies
    op.create_table(
        'anomalies',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('transaction_id', sa.String(36), sa.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('anomaly_score', sa.Float(), nullable=False),
        sa.Column('expected_value', sa.Numeric(12, 2), nullable=False),
        sa.Column('deviation_factor', sa.Float(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False, server_default=''),
        sa.Column('status', sa.String(30), nullable=False, server_default='DETECTED'),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_anomalies_user_id', 'anomalies', ['user_id'])
    op.create_index('ix_anomalies_transaction_id', 'anomalies', ['transaction_id'], unique=True)
    op.create_index('ix_anomalies_status', 'anomalies', ['status'])

    # 8. ai_insights
    op.create_table(
        'ai_insights',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(50), nullable=False, server_default='SPENDING_ACCELERATION'),
        sa.Column('headline', sa.String(255), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('metric_ref', sa.String(100), nullable=False, server_default=''),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.95'),
        sa.Column('status', sa.String(30), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_ai_insights_user_id', 'ai_insights', ['user_id'])

    # 9. budget_goals
    op.create_table(
        'budget_goals',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', sa.String(36), sa.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('target_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('period', sa.String(20), nullable=False, server_default='MONTHLY'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_budget_goals_user_id', 'budget_goals', ['user_id'])
    op.create_index('ix_budget_goals_category_id', 'budget_goals', ['category_id'])

    # 10. import_jobs
    op.create_table(
        'import_jobs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False, server_default='statement.csv'),
        sa.Column('total_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('imported_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duplicate_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_rows', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(30), nullable=False, server_default='COMPLETED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_import_jobs_user_id', 'import_jobs', ['user_id'])


def downgrade() -> None:
    op.drop_table('import_jobs')
    op.drop_table('budget_goals')
    op.drop_table('ai_insights')
    op.drop_table('anomalies')
    op.drop_table('forecast_points')
    op.drop_table('forecast_runs')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('accounts')
    op.drop_table('users')
