namespace SiteMapAgent.Domain.Entities; 
/// <summary> 
/// Domain Entity representing an individual webpage vertex in the website graph. 
/// </summary> 
public class CrawledPage 
{ 
public Guid Id { get; set; } = Guid.NewGuid(); 
/// <summary> 
/// Foreign key referencing the parent audit job. 
/// </summary> 
public Guid JobId { get; set; } 
public AuditJob? Job { get; set; } 
/// <summary> 
/// Fully resolved page URL. 
/// </summary> 
public string Url { get; set; } = string.Empty; 
/// <summary> 
/// HTTP status code returned by target server (e.g., 200, 404, 500). 
/// </summary> 
public int? HttpStatusCode { get; set; } 
/// <summary> 
/// Response latency in milliseconds (Time To First Byte). 
/// </summary> 
public int? ResponseTimeMs { get; set; } 
/// <summary> 
/// Page title extracted from the HTML document head. 
/// </summary> 
public string? PageTitle { get; set; } 
/// <summary> 
/// Traversal distance from the root landing page. 
/// </summary> 
public int CrawlDepth { get; set; } = 0; 
/// <summary> 
/// Indicates whether the page URL was listed inside the target's XML sitemap. 
/// </summary> 
public bool InSitemap { get; set; } = false; 
/// <summary> 
/// True if the page exists in sitemap but has zero inbound internal links. 
/// </summary> 
public bool IsOrphan { get; set; } = false; 
/// <summary> 
/// Count of internal hyperlinks directing to this page. 
/// </summary> 
public int InDegree { get; set; } = 0; 
/// <summary> 
/// Count of hyperlinks originating from this page pointing to others. 
/// </summary> 
public int OutDegree { get; set; } = 0; 
/// <summary> 
/// PageRank score computed by the directed graph engine. 
/// </summary> 
public double PageRankScore { get; set; } = 0.0; 
/// <summary> 
/// Cryptographic SHA-256 hash of cleaned textual body content. 
/// </summary> 
public string? ContentHash { get; set; } 
public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
}