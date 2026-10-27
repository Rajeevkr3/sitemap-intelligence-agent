namespace SiteMapAgent.Domain.Entities;

/// <summary>
/// Severity classifications for discovered audit defects.
/// </summary>
public enum IssueSeverityLevel
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Domain Entity capturing structural defects, broken links, or semantic redundancies.
/// </summary>
public class AuditIssue
{
    /// <summary>
    /// Unique identifier for the audit issue (Primary Key).
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign key referencing the parent audit job.
    /// </summary>
    public Guid JobId { get; set; }
    public AuditJob? Job { get; set; }

    /// <summary>
    /// Optional foreign key referencing the associated crawled page.
    /// </summary>
    public Guid? PageId { get; set; }
    public CrawledPage? Page { get; set; }

    /// <summary>
    /// Short classification code (e.g., BROKEN_LINK_404, ORPHAN_PAGE, DUPLICATE_CONTENT).
    /// </summary>
    public string IssueType { get; set; } = string.Empty;

    /// <summary>
    /// Urgency level assigned to this defect.
    /// </summary>
    public IssueSeverityLevel Severity { get; set; } = IssueSeverityLevel.Low;

    /// <summary>
    /// Human-readable explanation and architectural context of the defect.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Raw JSON formatted technical evidence.
    /// </summary>
    public string? EvidencePayloadJson { get; set; }

    /// <summary>
    /// Timestamp when this issue was recorded.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}