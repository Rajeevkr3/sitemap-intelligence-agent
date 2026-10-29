# SiteMap Intelligence Agent
> Production-grade, distributed web crawler, directed graph topological analyzer, and semantic vector deduplication agent built with **ASP.NET Core 10 Clean Architecture**, **Python 3.13 (NetworkX & FastEmbed ONNX)**, **PostgreSQL 16 (pgvector)**, and **Next.js 14**.

---

## 1. System Architecture Overview

                  +------------------------------------------+
                  |         Next.js 14 Dashboard             |
                  |   (Force-Directed 2D Graph Visualizer)   |
                  +--------------------+---------------------+
                                       | HTTP Requests (CORS)
                                       v
                  +--------------------+---------------------+
                  |    ASP.NET Core 10 Web API (CQRS)        |
                  |   Domain | Application | Infrastructure  |
                  +--------------------+---------------------+
                                       |
                +----------------------+----------------------+
                |                                             |
                v                                             v
+-----------------+-------------------+       +-----------------+-------------------+
|      PostgreSQL 16 + pgvector       | <==== |    Python 3.13 Engine (Daemon)      |
|  - Relational Graph & Issue Tables  |       |  - Async BFS Crawler (httpx)        |
|  - 384-Dim Semantic Embeddings      |       |  - NetworkX Centrality & PageRank   |
|  - IVFFlat Cosine Similarity Search |       |  - FastEmbed all-MiniLM-L6-v2 ONNX  |
+-------------------------------------+       +-------------------------------------+


### Key Architectural Pillars
- **Clean Architecture & CQRS**: Complete decoupling between Domain entities, Application business logic (MediatR), and Infrastructure persistence (EF Core + Npgsql).
- **Graph Topology Modeling**: Constructs directed web graphs $G = (V, E)$ to compute in-degree, out-degree, and PageRank scores to identify orphan nodes (pages listed in sitemaps with zero internal inbound references).
- **Dense Semantic Deduplication**: Employs ONNX-quantized `all-MiniLM-L6-v2` dense 384-dimensional sentence embeddings coupled with PostgreSQL's `pgvector` cosine distance operator (`<=>`) to flag near-duplicate web content exceeding an 85% similarity threshold.
- **Interactive Visualization**: Real-time 2D force-directed canvas visualizing internal linkages, PageRank node sizing, and defect indicators.

---

## 2. Relational & Vector Persistence Schema

The underlying database runs on PostgreSQL 16 via Docker, utilizing the `vector` extension:

- **`audit_jobs`**: Master record tracking target URL, root domain boundary, crawl limits, and execution state (`PENDING`, `RUNNING`, `COMPLETED`).
- **`crawled_pages`**: Graph vertices capturing URL, status code, latency, crawl depth, in/out degrees, PageRank score, and `vector(384)` embedding.
- **`page_hyperlinks`**: Directed graph edges linking `source_page_id` to `target_url`.
- **`audit_issues`**: Defect ledger logging broken links, orphan pages, and semantic duplicates.

---

## 3. Getting Started & Local Setup

### Prerequisites
- Docker Desktop
- .NET 10 SDK
- Python 3.13+
- Node.js 20+ & npm

### 1. Launch PostgreSQL with pgvector
```powershell
docker compose up -d