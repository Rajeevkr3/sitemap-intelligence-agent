"""
Directed Graph Modeling and Centrality Analysis using NetworkX.
"""
import networkx as nx
from app.crawler.crawler import CrawledPageResult


class GraphAnalysisReport:
    def __init__(
        self,
        in_degrees: dict[str, int],
        out_degrees: dict[str, int],
        pagerank_scores: dict[str, float],
        orphan_pages: list[str],
        broken_links: list[tuple[str, str, int | None]],  # (source_url, target_url, http_status)
    ):
        self.in_degrees = in_degrees
        self.out_degrees = out_degrees
        self.pagerank_scores = pagerank_scores
        self.orphan_pages = orphan_pages
        self.broken_links = broken_links


class WebsiteGraphAnalyzer:
    def __init__(self, crawl_results: list[CrawledPageResult], sitemap_urls: set[str]):
        self.crawl_results = crawl_results
        self.sitemap_urls = sitemap_urls
        self.graph = nx.DiGraph()

    def build_and_analyze(self) -> GraphAnalysisReport:
        """Construct DiGraph G=(V, E) and compute topological properties."""
        url_status_map: dict[str, int | None] = {}

        # 1. Add Vertices (Nodes)
        for page in self.crawl_results:
            self.graph.add_node(page.url, title=page.title, depth=page.depth)
            url_status_map[page.url] = page.status_code

        broken_links: list[tuple[str, str, int | None]] = []

        # 2. Add Directed Edges (Hyperlinks)
        for page in self.crawl_results:
            for target in page.outbound_links:
                self.graph.add_edge(page.url, target)

                # Check for broken internal link targets
                if target in url_status_map:
                    target_status = url_status_map[target]
                    if target_status and target_status >= 400:
                        broken_links.append((page.url, target, target_status))

        # 3. Compute Degree Centrality
        in_degrees = dict(self.graph.in_degree())
        out_degrees = dict(self.graph.out_degree())

        # 4. Compute PageRank
        try:
            pagerank_scores = nx.pagerank(self.graph, alpha=0.85, max_iter=100)
        except Exception:
            # Fallback for disconnected or cyclic corner cases
            pagerank_scores = {node: 0.0 for node in self.graph.nodes()}

        # 5. Detect Orphan Pages
        # An orphan page is declared in the sitemap or discovered, but has 0 inbound internal links
        orphan_pages: list[str] = []
        for page in self.crawl_results:
            if page.in_sitemap and in_degrees.get(page.url, 0) == 0:
                orphan_pages.append(page.url)

        return GraphAnalysisReport(
            in_degrees=in_degrees,
            out_degrees=out_degrees,
            pagerank_scores=pagerank_scores,
            orphan_pages=orphan_pages,
            broken_links=broken_links,
        )