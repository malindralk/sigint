"""Audit logging for security events."""

import json
import logging
from datetime import datetime
from typing import Any

# Configure audit logger
audit_logger = logging.getLogger("audit")


def log_auth_event(
    event_type: str,
    user_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Log an authentication event.

    Args:
        event_type: Type of event (login_success, login_failure, etc.)
        user_id: User ID if available
        ip_address: Client IP address
        user_agent: Client user agent
        details: Additional event details
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "details": details or {},
    }

    audit_logger.info(json.dumps(log_entry))


def log_user_action(
    event_type: str,
    user_id: str,
    target_user_id: str | None = None,
    ip_address: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Log a user action (role change, deactivation, etc.).

    Args:
        event_type: Type of event (role_change, account_deactivated, etc.)
        user_id: User performing the action
        target_user_id: User being acted upon (if applicable)
        ip_address: Client IP address
        details: Additional event details
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "target_user_id": target_user_id,
        "ip_address": ip_address,
        "details": details or {},
    }

    audit_logger.info(json.dumps(log_entry))


def log_settings_change(
    user_id: str,
    settings_changed: dict[str, Any],
    ip_address: str | None = None,
) -> None:
    """Log a settings change.

    Args:
        user_id: User making the change
        settings_changed: Dictionary of changed settings
        ip_address: Client IP address
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "settings_change",
        "user_id": user_id,
        "ip_address": ip_address,
        "settings_changed": settings_changed,
    }

    audit_logger.info(json.dumps(log_entry))


def log_article_action(
    event_type: str,
    user_id: str,
    article_id: str | None = None,
    article_slug: str | None = None,
    ip_address: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Log an article action (create, update, delete).

    Args:
        event_type: Type of event (article_create, article_update, article_delete)
        user_id: User performing the action
        article_id: Article ID
        article_slug: Article slug
        ip_address: Client IP address
        details: Additional event details
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "article_id": article_id,
        "article_slug": article_slug,
        "ip_address": ip_address,
        "details": details or {},
    }

    audit_logger.info(json.dumps(log_entry))


# Event type constants
class AuthEvent:
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    REGISTER = "register"
    EMAIL_VERIFIED = "email_verified"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    PASSWORD_RESET_SUCCESS = "password_reset_success"
    PASSWORD_CHANGED = "password_changed"
    OAUTH_CONNECT = "oauth_connect"
    OAUTH_DISCONNECT = "oauth_disconnect"


class UserEvent:
    ROLE_CHANGED = "role_changed"
    ACCOUNT_ACTIVATED = "account_activated"
    ACCOUNT_DEACTIVATED = "account_deactivated"
    SESSION_INVALIDATED = "session_invalidated"
    ALL_SESSIONS_INVALIDATED = "all_sessions_invalidated"


class ArticleEvent:
    CREATED = "article_created"
    UPDATED = "article_updated"
    DELETED = "article_deleted"
    PUBLISHED = "article_published"
    UNPUBLISHED = "article_unpublished"


class SettingsEvent:
    CHANGED = "settings_changed"
