# CHAPTER 4: SYSTEM DESIGN

## 4.1 Entity-Relationship (E-R) Diagram
The following Chen-notation E-R diagram defines the relational and vector database models:

```mermaid
flowchart TD
    classDef academic fill:#FFFFFF,stroke:#000000,stroke-width:1.5px,color:#000000;

    JOB["AUDIT_JOB"]:::academic
    PAGE["CRAWLED_PAGE"]:::academic
    LINK["PAGE_HYPERLINK"]:::academic
    ISSUE["AUDIT_ISSUE"]:::academic

    REL_DISCOVERS{"Discovers"}:::academic
    REL_CONNECTS{"Connects"}:::academic
    REL_FLAGS{"Flags"}:::academic

    JOB ---|1| REL_DISCOVERS
    REL_DISCOVERS ---|N| PAGE

    PAGE ---|1| REL_CONNECTS
    REL_CONNECTS ---|N| LINK

    PAGE ---|1| REL_FLAGS
    REL_FLAGS ---|N| ISSUE
```

## 4.2 Use Case Diagram
Models interaction boundaries between the Auditor and the Background Engine:

```mermaid
flowchart LR
    classDef academic fill:#FFFFFF,stroke:#000000,stroke-width:1.5px,color:#000000;

    subgraph SystemBoundary ["SiteMap Intelligence Agent System"]
        UC1(["Initialize Audit Job"]):::academic
        UC2(["Validate URL & Robots.txt"]):::academic
        UC3(["Discover XML Sitemaps"]):::academic
        UC4(["Execute BFS Web Crawl"]):::academic
        UC5(["Construct Directed Link Graph"]):::academic
        UC6(["Compute Centrality & PageRank"]):::academic
        UC7(["Identify Orphan Pages"]):::academic
        UC8(["Run Semantic Vector Deduplication"]):::academic
        UC9(["View Interactive Audit Dashboard"]):::academic
        UC10(["Export Technical Compliance Report"]):::academic
    end

    User["Auditor / Client"]:::academic
    Engine["Background Crawler / Scheduler"]:::academic

    User --> UC1
    User --> UC9
    User --> UC10

    UC1 -.->|<<includes>>| UC2
    UC2 -.->|<<includes>>| UC3

    Engine --> UC4
    Engine --> UC5
    Engine --> UC6
    Engine --> UC7
    Engine --> UC8
```

## 4.3 Data Flow Diagram (Level 0 - Context Diagram)
Gane & Sarson DFD Level 0 defining external entities and data flows:

```mermaid
flowchart LR
    classDef academic fill:#FFFFFF,stroke:#000000,stroke-width:1.5px,color:#000000;

    Auditor["Auditor / Client"]:::academic
    TargetWeb["Target Web Server"]:::academic
    System(("0.0<br/>SiteMap Intelligence<br/>Agent System")):::academic

    Auditor -->|Target Domain URL and Audit Depth Limits| System
    System -->|Topological Link Graph and Issue Breakdown| Auditor
    System -->|Semantic Similarity Clusters and Audit Report| Auditor

    System -->|Robots.txt and Sitemap Ingestion Requests| TargetWeb
    System -->|HTTP GET Requests for Permitted Endpoints| TargetWeb
    TargetWeb -->|Robots Directives and Sitemap XML Manifests| System
    TargetWeb -->|HTTP Response Headers and Webpage HTML Content| System
```

## 4.4 Data Flow Diagram (Level 1 - Functional Decomposition)
Detailed decomposition of Process 0.0 mapping to Data Stores D1 through D4:

```mermaid
flowchart TD
    classDef academic fill:#FFFFFF,stroke:#000000,stroke-width:1.5px,color:#000000;

    User["Auditor / Client"]:::academic
    TargetServer["Target Web Server"]:::academic

    P1(["1.0 Initialize and Validate Audit Job"]):::academic
    P2(["2.0 Parse Directives and Ingest Sitemaps"]):::academic
    P3(["3.0 Crawl Pages and Extract Links"]):::academic
    P4(["4.0 Build Link Graph and Calculate Metrics"]):::academic
    P5(["5.0 Generate Semantic Insights and Audit Report"]):::academic

    D1[("D1: audit_jobs")]:::academic
    D2[("D2: crawled_pages")]:::academic
    D3[("D3: page_hyperlinks")]:::academic
    D4[("D4: audit_issues")]:::academic

    User -->|Target URL and Audit Depth Limits| P1
    P1 -->|Create Pending Audit Job| D1
    P1 -->|Validated Target Configuration| P2

    P2 -->|Robots.txt and Sitemap Requests| TargetServer
    TargetServer -->|Robots Directives and Sitemap XML| P2
    P2 -->|Seed URLs and Crawl Metadata| D2
    P2 -->|Initialize Crawl Queue| P3

    P3 -->|Resolved Anchor HTTP GET Requests| TargetServer
    TargetServer -->|HTTP Status, Headers, and HTML| P3
    P3 -->|Page Content, Status, and Latency| D2
    P3 -->|Extracted Internal and External Links| D3
    P3 -->|Broken Link and Crawl Error Records| D4

    D2 -->|Page Nodes and Crawl Metadata| P4
    D3 -->|Directed Hyperlink Edges| P4
    P4 -->|Topology Metrics and Page Depth| D2
    P4 -->|Broken Links and Orphan Page Findings| D4

    D2 -->|Clean Page Text| P5
    P5 -->|Semantic Vectors and Similarity Records| D2
    P5 -->|Duplicate and Near-Duplicate Content Findings| D4
    D1 -->|Job Status and Audit Metadata| P5
    D3 -->|Link Topology Data| P5
    D4 -->|Audit Issues and Findings| P5
    P5 -->|Update Completed Job Status| D1
    P5 -->|Final Comprehensive Analysis and Audit Report| User
```