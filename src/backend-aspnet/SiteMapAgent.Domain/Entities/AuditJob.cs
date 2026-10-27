namespace SiteMapAgent.Domain.Entities; 
/// <summary> 
/// Defines the lifecycle status of a crawler audit execution. 
/// </summary> 
public enum CrawlJobStatus 
{ 
Pending, 
Running, 
Completed, 
Failed 
} 
/// <summary> 
/// Domain Entity representing a target website auditing execution job. 
/// </summary> 
public class AuditJob 
{ 
    /// <summary> 
    /// Unique identifier for the audit job (Primary Key). 
    /// </summary> 
    public Guid Id { get; set; } = Guid.NewGuid(); 
 
    /// <summary> 
    /// The fully qualified seed URL submitted by the client (e.g., https://example.com). 
    /// </summary> 
    public string TargetUrl { get; set; } = string.Empty; 
 
    /// <summary> 
    /// Sanitized root domain extracted for boundary validation (e.g., example.com). 
    /// </summary> 
    public string RootDomain { get; set; } = string.Empty; 
 
    /// <summary> 
    /// Current execution state of the audit process. 
    /// </summary> 
    public CrawlJobStatus Status { get; set; } = CrawlJobStatus.Pending; 
 
    /// <summary> 
    /// Maximum link depth allowed for graph traversal from the root. 
    /// </summary> 
    public int MaxCrawlDepth { get; set; } = 3; 
 
    /// <summary> 
    /// Upper safety limit of total pages to collect during crawl. 
    /// </summary> 
    public int MaxPagesLimit { get; set; } = 200; 
 
    /// <summary> 
    /// Timestamp indicating when the job was requested. 
    /// </summary> 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
 
    /// <summary> 
    /// Timestamp marking completion or failure. 
    /// </summary> 
    public DateTime? CompletedAt { get; set; } 
 
    /// <summary> 
    /// Navigation collection of all pages discovered during this job. 
/// </summary> 
public ICollection<CrawledPage> Pages { get; set; } = new List<CrawledPage>(); 
/// <summary> 
/// Navigation collection of all structural and semantic issues detected. 
/// </summary> 
public ICollection<AuditIssue> Issues { get; set; } = new List<AuditIssue>(); 
} 