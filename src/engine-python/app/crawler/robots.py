"""
Robots.txt Parser conforming to standard RFC 9309 rules.
"""
import urllib.robotparser
from urllib.parse import urljoin
import httpx
from app.config import settings


class RobotsDirectives:
    def __init__(self, target_url: str):
        self.target_url = target_url
        self.robots_url = urljoin(target_url, "/robots.txt")
        self.parser = urllib.robotparser.RobotFileParser()
        self.sitemaps: list[str] = []

    async def fetch_and_parse(self, client: httpx.AsyncClient) -> None:
        """Fetch robots.txt and parse user-agent directives and sitemap tags."""
        try:
            response = await client.get(self.robots_url, timeout=settings.REQUEST_TIMEOUT_SECONDS)
            if response.status_code == 200:
                lines = response.text.splitlines()
                self.parser.parse(lines)

                # Extract declared sitemaps
                for line in lines:
                    line_clean = line.strip()
                    if line_clean.lower().startswith("sitemap:"):
                        parts = line_clean.split(":", 1)
                        if len(parts) == 2:
                            self.sitemaps.append(parts[1].strip())
            else:
                # If robots.txt returns 404/non-200, assume entire site is permitted
                self.parser.allow_all = True
        except Exception:
            self.parser.allow_all = True

    def is_allowed(self, url: str) -> bool:
        """Check whether the agent is permitted to crawl the given URL."""
        return self.parser.can_fetch(settings.USER_AGENT, url)