"""
=============================================================================
SITEMAP INTELLIGENCE AGENT - ASYNCHRONOUS BFS CRAWLER
Location: src/engine-python/app/crawler/crawler.py
Purpose: Traverses internal web paths, extracts hyperlinks, cleans textual
         body content, measures TTFB latency, and maps discovery depth.
=============================================================================
"""
import asyncio
import hashlib
import time
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import httpx

from app.config import settings
from app.crawler.robots import RobotsDirectives


class CrawledPageResult:
    """
    Data carrier representing an individual crawled webpage node.
    Captures network latency, HTTP status, parsed metadata, and outbound edges.
    """
    def __init__(
        self,
        url: str,
        status_code: int | None,
        latency_ms: int,
        title: str | None,
        depth: int,
        in_sitemap: bool,
        content_hash: str | None,
        outbound_links: list[str],
        clean_text: str,
    ):
        self.url = url
        self.status_code = status_code
        self.latency_ms = latency_ms
        self.title = title
        self.depth = depth
        self.in_sitemap = in_sitemap
        self.content_hash = content_hash
        self.outbound_links = outbound_links
        self.clean_text = clean_text


class AsyncWebCrawler:
    """
    Asynchronous Breadth-First Search (BFS) crawler with domain boundary
    isolation, rate limiting, and defensive HTML parsing.
    """
    def __init__(
        self,
        target_url: str,
        max_depth: int,
        max_pages: int,
        sitemap_urls: set[str],
        robots: RobotsDirectives,
    ):
        self.target_url = target_url
        self.root_domain = urlparse(target_url).netloc
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.sitemap_urls = sitemap_urls
        self.robots = robots

        self.visited_urls: set[str] = set()
        self.crawl_results: list[CrawledPageResult] = []

    def _normalize_url(self, base_url: str, raw_link: str) -> str | None:
        """
        Normalizes relative links, discards non-HTTP schemes, and enforces
        strict target-domain boundaries.
        """
        try:
            resolved = urljoin(base_url, raw_link)
            parsed = urlparse(resolved)

            # Restrict exclusively to HTTP/HTTPS protocols
            if parsed.scheme not in ("http", "https"):
                return None

            # Enforce target host domain boundary (ignore external sites)
            if parsed.netloc.lower() != self.root_domain.lower():
                return None

            # Normalize by stripping URL query fragments and trailing slashes
            clean_path = parsed.path.rstrip("/")
            normalized = f"{parsed.scheme}://{parsed.netloc}{clean_path}"
            return normalized if clean_path else f"{parsed.scheme}://{parsed.netloc}/"

        except Exception:
            return None

    async def run(self) -> list[CrawledPageResult]:
        """
        Executes asynchronous BFS crawling using Python's built-in html.parser.
        """
        headers = {"User-Agent": settings.USER_AGENT}
        queue: list[tuple[str, int]] = [(self.target_url.rstrip("/"), 0)]

        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            while queue and len(self.visited_urls) < self.max_pages:
                current_url, current_depth = queue.pop(0)

                # Skip duplicate visits
                if current_url in self.visited_urls:
                    continue

                # Enforce traversal depth safety limit
                if current_depth > self.max_depth:
                    continue

                # Respect robots.txt exclusions
                if not self.robots.is_allowed(current_url):
                    continue

                self.visited_urls.add(current_url)

                # Politeness delay to prevent rate limiting or target host stress
                await asyncio.sleep(settings.REQUEST_DELAY_SECONDS)

                start_time = time.perf_counter()
                status_code: int | None = None
                title: str | None = None
                content_hash: str | None = None
                outbound_links: list[str] = []
                clean_text: str = ""

                try:
                    response = await client.get(current_url, timeout=settings.REQUEST_TIMEOUT_SECONDS)
                    status_code = response.status_code
                    latency_ms = int((time.perf_counter() - start_time) * 1000)

                    content_type = response.headers.get("content-type", "").lower()

                    # Only parse textual HTML markup
                    if "text/html" in content_type and status_code == 200:
                        # Use Python's built-in html.parser (Zero C++ dependency)
                        soup = BeautifulSoup(response.text, "html.parser")

                        # Extract Document Title
                        if soup.title and soup.title.string:
                            title = soup.title.string.strip()

                        # Strip script, style, and noscript noise
                        for tag in soup(["script", "style", "noscript", "svg"]):
                            tag.decompose()

                        # Extract clean body text and compute SHA-256 fingerprint
                        clean_text = " ".join(soup.stripped_strings)
                        if clean_text:
                            content_hash = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()

                        # Extract anchor links for graph adjacency list
                        for a_tag in soup.find_all("a", href=True):
                            normalized = self._normalize_url(current_url, a_tag["href"])
                            if normalized:
                                outbound_links.append(normalized)
                                if normalized not in self.visited_urls:
                                    queue.append((normalized, current_depth + 1))

                except Exception:
                    latency_ms = int((time.perf_counter() - start_time) * 1000)

                # Check if this URL was listed in the website's XML sitemap
                in_sitemap = current_url in self.sitemap_urls

                self.crawl_results.append(
                    CrawledPageResult(
                        url=current_url,
                        status_code=status_code,
                        latency_ms=latency_ms,
                        title=title,
                        depth=current_depth,
                        in_sitemap=in_sitemap,
                        content_hash=content_hash,
                        outbound_links=outbound_links,
                        clean_text=clean_text,
                    )
                )

        return self.crawl_results