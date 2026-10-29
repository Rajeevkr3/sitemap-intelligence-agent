namespace SiteMapAgent.Application.Audits.DTOs;

public record AuditJobDetailDto(
    Guid Id,
    string TargetUrl,
    string RootDomain,
    string Status,
    int MaxCrawlDepth,
    int MaxPagesLimit,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    int TotalPagesCrawled,
    int TotalIssuesFound
);

public record CrawledPageDto(
    Guid Id,
    string Url,
    int? HttpStatusCode,
    int? ResponseTimeMs,
    string? PageTitle,
    int CrawlDepth,
    bool InSitemap,
    bool IsOrphan,
    int InDegree,
    int OutDegree,
    double PageRankScore
);

public record AuditIssueDto(
    Guid Id,
    Guid? PageId,
    string IssueType,
    string Severity,
    string Description,
    DateTime CreatedAt
);

public record GraphDataDto(
    IReadOnlyList<GraphNodeDto> Nodes,
    IReadOnlyList<GraphEdgeDto> Edges
);

public record GraphNodeDto(string Id, string Label, double PageRank, int InDegree, bool IsOrphan);
public record GraphEdgeDto(string Source, string Target);