const API_BASE_URL = "http://localhost:5132/api/v1/audits";

export interface AuditJobDetail {
    id: string;
    targetUrl: string;
    rootDomain: string;
    status: string;
    maxCrawlDepth: number;
    maxPagesLimit: number;
    createdAt: string;
    completedAt: string | null;
    totalPagesCrawled: number;
    totalIssuesFound: number;
}

export interface CrawledPage {
    id: string;
    url: string;
    httpStatusCode: number | null;
    responseTimeMs: number | null;
    pageTitle: string | null;
    crawlDepth: number;
    inSitemap: boolean;
    isOrphan: boolean;
    inDegree: number;
    outDegree: number;
    pageRankScore: number;
}

export interface AuditIssue {
    id: string;
    pageId: string | null;
    issueType: string;
    severity: string;
    description: string;
    createdAt: string;
}

export interface GraphNode {
    id: string;
    label: string;
    pageRank: number;
    inDegree: number;
    isOrphan: boolean;
}

export interface GraphEdge {
    source: string;
    target: string;
}

export interface GraphTopology {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export async function createAuditJob(
    targetUrl: string,
    maxDepth = 3,
    maxPages = 50
): Promise<{ jobId: string }> {
    const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, maxDepth, maxPages }),
    });
    if (!res.ok) throw new Error("Failed to initialize audit job");
    return res.json();
}

export async function fetchAuditJob(jobId: string): Promise<AuditJobDetail> {
    const res = await fetch(`${API_BASE_URL}/${jobId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch audit job details");
    return res.json();
}

export async function fetchCrawledPages(jobId: string): Promise<CrawledPage[]> {
    const res = await fetch(`${API_BASE_URL}/${jobId}/pages`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch crawled pages");
    return res.json();
}

export async function fetchAuditIssues(jobId: string): Promise<AuditIssue[]> {
    const res = await fetch(`${API_BASE_URL}/${jobId}/issues`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch audit issues");
    return res.json();
}

export async function fetchGraphTopology(jobId: string): Promise<GraphTopology> {
    const res = await fetch(`${API_BASE_URL}/${jobId}/graph`, { cache: "no-store" });
    if (!res.ok) {
        // Graceful fallback if backend endpoint is still rebuilding
        return { nodes: [], edges: [] };
    }
    return res.json();
}