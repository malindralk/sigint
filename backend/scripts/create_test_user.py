#!/usr/bin/env python3
"""Create a test user for development."""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, init_db
from app.core.security import hash_password
from app.models.user import User
from datetime import datetime


async def create_test_user():
    """Create test users for development."""
    await init_db()

    async for db in get_db():
        # Check if test users already exist
        from sqlalchemy import select

        # Create admin user
        result = await db.execute(
            select(User).where(User.email == "admin@test.com")
        )
        if not result.scalar_one_or_none():
            admin = User(
                email="admin@test.com",
                password_hash=hash_password("admin123!"),
                username="admin",
                role="admin",
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(admin)
            print("Created admin user: admin@test.com / admin123!")
        else:
            print("Admin user already exists")

        # Create regular user
        result = await db.execute(
            select(User).where(User.email == "user@test.com")
        )
        if not result.scalar_one_or_none():
            user = User(
                email="user@test.com",
                password_hash=hash_password("user123!"),
                username="testuser",
                role="user",
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            print("Created regular user: user@test.com / user123!")
        else:
            print("Regular user already exists")

        # Create editor user
        result = await db.execute(
            select(User).where(User.email == "editor@test.com")
        )
        if not result.scalar_one_or_none():
            editor = User(
                email="editor@test.com",
                password_hash=hash_password("editor123!"),
                username="editor",
                role="editor",
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(editor)
            print("Created editor user: editor@test.com / editor123!")
        else:
            print("Editor user already exists")

        await db.commit()
        print("\nTest users ready!")
        print("\nLogin credentials:")
        print("  Admin:  admin@test.com / admin123!")
        print("  Editor: editor@test.com / editor123!")
        print("  User:   user@test.com / user123!")
        break


if __name__ == "__main__":
    asyncio.run(create_test_user())
