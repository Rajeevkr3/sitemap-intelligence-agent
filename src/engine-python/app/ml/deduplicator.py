"""
=============================================================================
SITEMAP INTELLIGENCE AGENT - VECTOR DEDUPLICATION ANALYZER
Location: src/engine-python/app/ml/deduplicator.py
Purpose: Executes pgvector cosine distance queries to detect near-duplicate
         web content and flag defects into audit_issues.
=============================================================================
"""
import asyncpg


class SemanticDeduplicator:
    """
    Queries pgvector using the cosine distance operator (<=>) to find
    pairs of crawled pages exceeding the similarity threshold.
    """
    def __init__(self, similarity_threshold: float = 0.85):
        # Cosine distance = 1 - Cosine Similarity
        # If similarity >= 0.85, distance <= 0.15
        self.max_distance = round(1.0 - similarity_threshold, 4)

    async def find_and_record_duplicates(self, conn: asyncpg.Connection, job_id: str) -> int:
        """
        Executes an all-pairs similarity search on crawled pages of the given job
        and inserts detected duplicates into audit_issues.
        """
        duplicate_pairs_query = """
            SELECT 
                a.id AS source_page_id,
                a.url AS source_url,
                b.id AS target_page_id,
                b.url AS target_url,
                ROUND((1 - (a.embedding <=> b.embedding))::numeric, 4) AS similarity_score
            FROM crawled_pages a
            JOIN crawled_pages b 
                ON a.job_id = b.job_id 
                AND a.id < b.id
            WHERE a.job_id = $1
              AND a.embedding IS NOT NULL
              AND b.embedding IS NOT NULL
              AND (a.embedding <=> b.embedding) <= $2
            ORDER BY similarity_score DESC;
        """

        rows = await conn.fetch(duplicate_pairs_query, job_id, self.max_distance)

        for row in rows:
            similarity_pct = float(row["similarity_score"]) * 100
            description = (
                f"Near-duplicate content detected ({similarity_pct:.1f}% similarity) "
                f"between {row['source_url']} and {row['target_url']}."
            )

            await conn.execute(
                """
                INSERT INTO audit_issues (job_id, page_id, issue_type, severity, description)
                VALUES ($1, $2, 'DUPLICATE_CONTENT_SEMANTIC', 'HIGH', $3);
                """,
                job_id,
                row["source_page_id"],
                description,
            )

        return len(rows)