"""
Configuration settings for the Python Crawler & Graph Analysis Engine.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database connection pointing to PostgreSQL on port 5433
    DB_HOST: str = "localhost"
    DB_PORT: int = 5433
    DB_NAME: str = "sitemap_agent_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgrespass"

    # Crawler Politeness & Safety Parameters
    DEFAULT_MAX_DEPTH: int = 3
    DEFAULT_MAX_PAGES: int = 200
    REQUEST_TIMEOUT_SECONDS: float = 10.0
    REQUEST_DELAY_SECONDS: float = 0.5  # Politeness interval
    USER_AGENT: str = "SiteMapIntelligenceAgent/1.0 (+https://github.com/rajeev/sitemap-intelligence-agent)"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()