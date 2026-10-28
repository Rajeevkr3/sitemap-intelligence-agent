"""
=============================================================================
SITEMAP INTELLIGENCE AGENT - COMPLETE PIPELINE WORKER
Location: src/engine-python/app/worker.py
Purpose: Integrated execution pipeline: BFS Crawl -> NetworkX Graph -> 
         FastEmbed Vector Generation -> pgvector Semantic Deduplication.
=============================================================================
"""
import asyncio
import httpx

from app.config import settings
from app.crawler.crawler import AsyncWebCrawler
from app.crawler.robots import RobotsDirectives
from app.crawler.sitemap import SitemapParser
from app.db import get_db_pool
from app.graph.analyzer import WebsiteGraphAnalyzer
from app.ml.deduplicator import SemanticDeduplicator
from app.ml.vector_engine import SemanticVectorEngine


async def process_audit_job(job_id: str, target_url: str, max_depth: int, max_pages: int) -> None:
    pool = await get_db_pool()
    print(f"\n[*] ==========================================================")
    print(f"[*] Starting Execution Pipeline for Job ID: {job_id}")
    print(f"[*] Target Endpoint: {target_url} | Depth Limit: {max_depth}")
    print(f"[*] ==========================================================")

    # 1. Update status to RUNNING
    async with pool.acquire() as conn:
        await conn.execute("UPDATE audit_jobs SET status = 'RUNNING' WHERE id = $1", job_id)

    # 2. Robots & Sitemap Discovery
    async with httpx.AsyncClient(follow_redirects=True) as client:
        robots = RobotsDirectives(target_url)
        await robots.fetch_and_parse(client)

        sitemap_parser = SitemapParser(target_url, robots.sitemaps)
        sitemap_urls = await sitemap_parser.extract_sitemap_urls(client)

    # 3. Asynchronous BFS Web Crawl
    crawler = AsyncWebCrawler(
        target_url=target_url,
        max_depth=max_depth,
        max_pages=max_pages,
        sitemap_urls=sitemap_urls,
        robots=robots,
    )
    crawl_results = await crawler.run()
    print(f"[+] Crawled {len(crawl_results)} distinct webpage nodes.")

    # 4. Topological Graph Modeling (NetworkX)
    analyzer = WebsiteGraphAnalyzer(crawl_results, sitemap_urls)
    graph_report = analyzer.build_and_analyze()
    print(f"[+] Computed PageRank & Link Topology. Flagged {len(graph_report.orphan_pages)} orphan pages.")

    # 5. Initialize Vector Embedding Engine
    print("[*] Generating 384-dimensional dense semantic vectors (all-MiniLM-L6-v2)...")
    vector_engine = SemanticVectorEngine()

    # 6. Database Transaction Commit
    async with pool.acquire() as conn:
        async with conn.transaction():
            page_id_map: dict[str, str] = {}

            # Insert Crawled Pages along with Embedding Vectors
            for page in crawl_results:
                embedding = vector_engine.generate_embedding(page.clean_text)
                embedding_str = f"[{','.join(map(str, embedding))}]" if embedding else None

                row = await conn.fetchrow(
                    """
                    INSERT INTO crawled_pages 
                        (job_id, url, http_status_code, response_time_ms, page_title, 
                         crawl_depth, in_sitemap, is_orphan, in_degree, out_degree, 
                         pagerank_score, content_hash, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::vector)
                    ON CONFLICT (job_id, url) DO UPDATE SET
                        http_status_code = EXCLUDED.http_status_code,
                        in_degree = EXCLUDED.in_degree,
                        out_degree = EXCLUDED.out_degree,
                        pagerank_score = EXCLUDED.pagerank_score,
                        embedding = EXCLUDED.embedding
                    RETURNING id;
                    """,
                    job_id,
                    page.url,
                    page.status_code,
                    page.latency_ms,
                    page.title,
                    page.depth,
                    page.in_sitemap,
                    page.url in graph_report.orphan_pages,
                    graph_report.in_degrees.get(page.url, 0),
                    graph_report.out_degrees.get(page.url, 0),
                    graph_report.pagerank_scores.get(page.url, 0.0),
                    page.content_hash,
                    embedding_str,
                )
                page_id_map[page.url] = str(row["id"])

            # Insert Directed Graph Edges
            for page in crawl_results:
                source_id = page_id_map.get(page.url)
                if not source_id:
                    continue
                for target_url in page.outbound_links:
                    target_id = page_id_map.get(target_url)
                    await conn.execute(
                        """
                        INSERT INTO page_hyperlinks (job_id, source_page_id, target_url, target_page_id, is_internal)
                        VALUES ($1, $2, $3, $4, $5);
                        """,
                        job_id,
                        source_id,
                        target_url,
                        target_id,
                        target_url.startswith(target_url),
                    )

            # Insert Detected Issues: Orphan Pages
            for orphan_url in graph_report.orphan_pages:
                page_id = page_id_map.get(orphan_url)
                await conn.execute(
                    """
                    INSERT INTO audit_issues (job_id, page_id, issue_type, severity, description)
                    VALUES ($1, $2, 'ORPHAN_PAGE', 'MEDIUM', $3);
                    """,
                    job_id,
                    page_id,
                    f"Page declared in sitemap but has zero inbound internal links: {orphan_url}",
                )

            # Insert Detected Issues: Broken Links
            for source_url, target_url, status in graph_report.broken_links:
                page_id = page_id_map.get(source_url)
                await conn.execute(
                    """
                    INSERT INTO audit_issues (job_id, page_id, issue_type, severity, description)
                    VALUES ($1, $2, 'BROKEN_LINK_4XX', 'HIGH', $3);
                    """,
                    job_id,
                    page_id,
                    f"Anchor link on {source_url} leads to broken endpoint {target_url} (HTTP {status})",
                )

            # 7. Run Vector Deduplication Search
            deduplicator = SemanticDeduplicator(similarity_threshold=0.85)
            duplicate_count = await deduplicator.find_and_record_duplicates(conn, job_id)
            print(f"[+] Vector Deduplication Completed. Found {duplicate_count} near-duplicate pairs.")

            # Mark job as COMPLETED
            await conn.execute(
                "UPDATE audit_jobs SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
                job_id,
            )

    await pool.close()
    print(f"[✓] Successfully finalized Job ID: {job_id}\n")


async def main():
    pool = await get_db_pool()
    print("[*] Worker listening for PENDING audit jobs...")

    while True:
        try:
            async with pool.acquire() as conn:
                # To this (case-insensitive):
             job = await conn.fetchrow(
               "SELECT id, target_url, max_crawl_depth, max_pages_limit FROM audit_jobs WHERE UPPER(status) = 'PENDING' LIMIT 1"
)

            if job:
                await process_audit_job(
                    job_id=str(job["id"]),
                    target_url=job["target_url"],
                    max_depth=job["max_crawl_depth"],
                    max_pages=job["max_pages_limit"],
                )
            else:
                await asyncio.sleep(3)
        except Exception as e:
            print(f"[!] Worker polling iteration error: {e}")
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())