"""Shared test fixtures for the SIGINT backend test suite."""

import os

# Must set environment BEFORE any app modules are imported
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-abcdef123456")
os.environ.setdefault("APP_ENV", "testing")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite://")
os.environ.setdefault("LOG_DIR", "/tmp/sigint-test-logs")

import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from sqlalchemy import JSON
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Clear cached settings so test env vars take effect
from app.core.config import get_settings

get_settings.cache_clear()

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password, hash_token
from app.main import app
from app.models.analytics import AnalyticsEvent
from app.models.article import Article
from app.models.oauth_connection import OAuthConnection
from app.models.session import Session as SessionModel
from app.models.user import User

# SQLite does not support PostgreSQL JSONB; swap to generic JSON for tests
OAuthConnection.__table__.c.provider_metadata.type = JSON()
AnalyticsEvent.__table__.c.metadata.type = JSON()

# ---------------------------------------------------------------------------
# In-memory SQLite database (StaticPool shares one connection across sessions)
# ---------------------------------------------------------------------------
_engine = create_async_engine(
    "sqlite+aiosqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_SessionFactory = async_sessionmaker(
    _engine, class_=AsyncSession, expire_on_commit=False
)


async def _override_get_db():
    async with _SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = _override_get_db
app.state.redis = None  # disable Redis for all tests


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
async def _setup_tables():
    """Create all tables before each test; drop them after."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db():
    """Raw database session for arranging test data."""
    async with _SessionFactory() as session:
        yield session


@pytest.fixture
async def client():
    """Async HTTP client wired to the FastAPI application."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# -- dev login fixture ------------------------------------------------------


@pytest.fixture
def enable_dev_login(monkeypatch):
    """Enable dev login by setting required env vars and clearing settings cache."""
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("DEV_LOGIN_ENABLED", "true")
    monkeypatch.setenv("DEV_LOGIN_EMAIL", "dev@test.com")
    monkeypatch.setenv("DEV_LOGIN_PASSWORD", "DevPassword123!")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


# -- users ------------------------------------------------------------------


@pytest.fixture
async def test_user(db):
    """A verified regular user."""
    user = User(
        id=uuid.uuid4(),
        email="user@test.com",
        password_hash=hash_password("TestPassword1!"),
        username="testuser",
        role="user",
        is_active=True,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def admin_user(db):
    """A verified admin user."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=hash_password("AdminPassword1!"),
        username="admin",
        role="admin",
        is_active=True,
        is_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# -- auth tokens (JWT + DB session row) ------------------------------------


async def _make_token(db: AsyncSession, user: User) -> str:
    """Create a valid access token backed by a session row."""
    token, expire = create_access_token(user.id, user.role)
    session = SessionModel(
        user_id=user.id,
        token_hash=hash_token(token),
        refresh_token_hash=f"ref-{uuid.uuid4().hex[:16]}",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        created_at=datetime.now(timezone.utc),
        last_activity=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.commit()
    return token


@pytest.fixture
async def auth_token(db, test_user) -> str:
    """Valid bearer token for the regular test user."""
    return await _make_token(db, test_user)


@pytest.fixture
async def admin_token(db, admin_user) -> str:
    """Valid bearer token for the admin user."""
    return await _make_token(db, admin_user)


# -- sample data ------------------------------------------------------------


@pytest.fixture
async def sample_article(db, admin_user):
    """A published sample article."""
    article = Article(
        id=uuid.uuid4(),
        slug="test-signals",
        category="sigint",
        title="Test Signals Article",
        description="A sample article for testing",
        content="# Signals\n\nContent about signals.",
        frontmatter={},
        is_published=True,
        author_id=admin_user.id,
        created_at=datetime.now(timezone.utc),
        synced_at=datetime.now(timezone.utc),
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article
