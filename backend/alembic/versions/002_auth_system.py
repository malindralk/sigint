"""Auth system schema migration.

Revision ID: 002_auth_system
Revises: 001_initial
Create Date: 2024-04-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_auth_system"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Modify users table - make oauth fields nullable and add auth fields
    op.alter_column("users", "oauth_provider", nullable=True)
    op.alter_column("users", "oauth_id", nullable=True)
    op.alter_column("users", "role", server_default="user")

    # Add new columns to users table
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"))
    op.add_column("users", sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"))
    op.add_column("users", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True))

    # Add unique index on email
    op.create_index("ix_users_email", "users", ["email"], unique=True, postgresql_where=sa.text("email IS NOT NULL"))

    # Create sessions table
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("refresh_token_hash", sa.String(64), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text, nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_activity", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_sessions_user", "sessions", ["user_id"])
    op.create_index("ix_sessions_token", "sessions", ["token_hash"])
    op.create_index("ix_sessions_expires", "sessions", ["expires_at"])

    # Create oauth_connections table
    op.create_table(
        "oauth_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("provider_email", sa.String(255), nullable=True),
        sa.Column("provider_metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_oauth_connections_user", "oauth_connections", ["user_id"])
    op.create_index("ix_oauth_connections_provider", "oauth_connections", ["provider", "provider_user_id"])
    op.create_unique_constraint(
        "uq_oauth_provider_user",
        "oauth_connections",
        ["provider", "provider_user_id"],
    )

    # Create password_reset_tokens table
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_password_reset_tokens_user", "password_reset_tokens", ["user_id"])
    op.create_index("ix_password_reset_tokens_hash", "password_reset_tokens", ["token_hash"])

    # Modify articles table - add author and publishing fields
    op.add_column("articles", sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.add_column("articles", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("articles", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("articles", sa.Column("is_published", sa.Boolean, nullable=False, server_default="true"))
    op.create_index("ix_articles_author", "articles", ["author_id"])

    # Create analytics_events table
    op.create_table(
        "analytics_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("page", sa.String(500), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("session_id", sa.String(100), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_analytics_events_type", "analytics_events", ["event_type"])
    op.create_index("ix_analytics_events_user", "analytics_events", ["user_id"])
    op.create_index("ix_analytics_events_timestamp", "analytics_events", ["timestamp"])

    # Create site_settings table
    op.create_table(
        "site_settings",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )


def downgrade() -> None:
    # Drop new tables
    op.drop_table("site_settings")
    op.drop_table("analytics_events")
    op.drop_index("ix_articles_author", table_name="articles")
    op.drop_column("articles", "is_published")
    op.drop_column("articles", "published_at")
    op.drop_column("articles", "updated_at")
    op.drop_column("articles", "author_id")
    op.drop_table("password_reset_tokens")
    op.drop_table("oauth_connections")
    op.drop_table("sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "updated_at")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "is_active")
    op.drop_column("users", "password_hash")
    op.alter_column("users", "oauth_provider", nullable=False)
    op.alter_column("users", "oauth_id", nullable=False)
    op.alter_column("users", "role", server_default="reader")
