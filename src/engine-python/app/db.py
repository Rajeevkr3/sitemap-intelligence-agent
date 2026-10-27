"""
Database persistence utilities using asyncpg connection pooling.
"""
import asyncpg
from app.config import settings


async def get_db_pool() -> asyncpg.Pool:
    """Create and return an asynchronous PostgreSQL connection pool."""
    return await asyncpg.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        min_size=2,
        max_size=10,
    )