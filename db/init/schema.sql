-- =============================================================================
-- SITEMAP INTELLIGENCE AGENT - PRODUCTION RELATIONAL & VECTOR SCHEMA
-- Engine: PostgreSQL 16+ with pgvector
-- Design Pattern: Clean Architecture Relational & Vector Persistence Store
-- =============================================================================

-- Enable pgvector extension for high-dimensional semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 1. AUDIT JOBS TABLE (Master Root Aggregate)
-- Tracks individual crawl audit tasks, configuration parameters, and status.
-- Uses standard VARCHAR for status to guarantee clean cross-platform ORM mapping.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_url TEXT NOT NULL,
    root_domain VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    max_crawl_depth INT NOT NULL DEFAULT 3,
    max_pages_limit INT NOT NULL DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------------------------------
-- 2. CRAWLED PAGES TABLE (Graph Vertices / Nodes)
-- Represents unique discovered URLs, network latency, crawl depth, sitemap
-- presence, and topological metrics (in-degree, out-degree, PageRank score).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crawled_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    http_status_code INT,
    response_time_ms INT,
    page_title TEXT,
    crawl_depth INT NOT NULL DEFAULT 0,
    in_sitemap BOOLEAN NOT NULL DEFAULT FALSE,
    is_orphan BOOLEAN NOT NULL DEFAULT FALSE,
    in_degree INT NOT NULL DEFAULT 0,
    out_degree INT NOT NULL DEFAULT 0,
    pagerank_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    content_hash CHAR(64),
    embedding vector(384), -- 384-dimensional vector space for all-MiniLM-L6-v2
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_job_page_url UNIQUE (job_id, url)
);

-- -----------------------------------------------------------------------------
-- 3. PAGE HYPERLINKS TABLE (Graph Directed Edges)
-- Captures the directional web graph structure: source page -> target URL.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_hyperlinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    source_page_id UUID NOT NULL REFERENCES crawled_pages(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    target_page_id UUID REFERENCES crawled_pages(id) ON DELETE SET NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. AUDIT ISSUES TABLE (Defect & Observation Ledger)
-- Stores broken links, orphan pages, sitemap mismatches, and semantic duplicates.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
    page_id UUID REFERENCES crawled_pages(id) ON DELETE SET NULL,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'LOW',
    description TEXT NOT NULL,
    evidence_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES: Relational Performance & Graph Joins
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_jobs_status ON audit_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_job_id ON crawled_pages(job_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_url ON crawled_pages(url);
CREATE INDEX IF NOT EXISTS idx_page_hyperlinks_job_id ON page_hyperlinks(job_id);
CREATE INDEX IF NOT EXISTS idx_page_hyperlinks_source ON page_hyperlinks(source_page_id);
CREATE INDEX IF NOT EXISTS idx_page_hyperlinks_target ON page_hyperlinks(target_page_id);
CREATE INDEX IF NOT EXISTS idx_audit_issues_job_id ON audit_issues(job_id);

-- -----------------------------------------------------------------------------
-- INDEX: Vector Cosine Similarity Search
-- Uses IVFFlat indexing across 384 dimensions using vector_cosine_ops
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_crawled_pages_embedding 
ON crawled_pages USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);