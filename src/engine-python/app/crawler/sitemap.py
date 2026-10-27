"""
=============================================================================
SITEMAP INTELLIGENCE AGENT - XML SITEMAP PARSER
Location: src/engine-python/app/crawler/sitemap.py
Purpose: Recursively discovers, downloads, and extracts URLs declared in
         standard sitemaps and sitemap index files.
=============================================================================
"""
from urllib.parse import urljoin
import httpx
from bs4 import BeautifulSoup

from app.config import settings


class SitemapParser:
    """
    Parser for website XML sitemaps and sitemap index manifests.
    Uses Python's standard built-in parser without external binary bindings.
    """
    def __init__(self, target_url: str, declared_sitemaps: list[str]):
        self.target_url = target_url
        self.sitemap_candidates = declared_sitemaps or [
            urljoin(target_url, "/sitemap.xml"),
            urljoin(target_url, "/sitemap_index.xml"),
        ]

    async def extract_sitemap_urls(self, client: httpx.AsyncClient) -> set[str]:
        """
        Discovers and retrieves all URLs listed across reachable sitemap endpoints.
        """
        discovered_urls: set[str] = set()

        for sitemap_url in self.sitemap_candidates:
            try:
                response = await client.get(sitemap_url, timeout=settings.REQUEST_TIMEOUT_SECONDS)
                if response.status_code != 200:
                    continue

                # Standard Python HTML/XML parser
                soup = BeautifulSoup(response.content, "html.parser")

                # Parse all <loc> entries
                for loc in soup.find_all("loc"):
                    clean_loc = loc.get_text().strip()
                    if clean_loc.endswith(".xml"):
                        # Sitemap index entry: recursively fetch child sitemap
                        try:
                            child_res = await client.get(clean_loc, timeout=settings.REQUEST_TIMEOUT_SECONDS)
                            if child_res.status_code == 200:
                                child_soup = BeautifulSoup(child_res.content, "html.parser")
                                for child_loc in child_soup.find_all("loc"):
                                    discovered_urls.add(child_loc.get_text().strip())
                        except Exception:
                            continue
                    else:
                        discovered_urls.add(clean_loc)

            except Exception:
                continue

        return discovered_urls