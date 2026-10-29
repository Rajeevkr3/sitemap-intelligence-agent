"""
Unit tests for directed graph analysis and orphan detection using NetworkX.
Location: src/engine-python/tests/test_analyzer.py
"""
from app.crawler.crawler import CrawledPageResult
from app.graph.analyzer import WebsiteGraphAnalyzer


def test_orphan_page_detection():
    # Setup mock crawled pages
    # Node A links to Node B, and Node B links back to Node A.
    # Node C is declared in sitemap but has no incoming internal links (Orphan).
    pages = [
        CrawledPageResult(
            url="https://test.com/",
            status_code=200,
            latency_ms=100,
            title="Home",
            depth=0,
            in_sitemap=True,
            content_hash="abc1",
            outbound_links=["https://test.com/about"],
            clean_text="Welcome to the website",
        ),
        CrawledPageResult(
            url="https://test.com/about",
            status_code=200,
            latency_ms=120,
            title="About",
            depth=1,
            in_sitemap=True,
            content_hash="abc2",
            outbound_links=["https://test.com/"],
            clean_text="About our business",
        ),
        CrawledPageResult(
            url="https://test.com/hidden-orphan",
            status_code=200,
            latency_ms=110,
            title="Hidden",
            depth=0,
            in_sitemap=True,
            content_hash="abc3",
            outbound_links=[],
            clean_text="Hidden orphaned campaign content",
        ),
    ]

    sitemap_urls = {"https://test.com/", "https://test.com/about", "https://test.com/hidden-orphan"}

    analyzer = WebsiteGraphAnalyzer(pages, sitemap_urls)
    report = analyzer.build_and_analyze()

    # 1. Structural topological verification
    assert "https://test.com/hidden-orphan" in report.orphan_pages
    assert "https://test.com/about" not in report.orphan_pages
    assert report.in_degrees["https://test.com/about"] == 1
    assert report.out_degrees["https://test.com/"] == 1

    # 2. PageRank presence verification
    assert "https://test.com/" in report.pagerank_scores
    assert isinstance(report.pagerank_scores["https://test.com/"], float)
    assert report.pagerank_scores["https://test.com/"] >= 0.0