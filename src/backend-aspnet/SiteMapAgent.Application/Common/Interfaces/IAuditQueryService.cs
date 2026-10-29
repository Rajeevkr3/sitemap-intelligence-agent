using SiteMapAgent.Application.Audits.DTOs;

namespace SiteMapAgent.Application.Common.Interfaces;

public interface IAuditQueryService
{
    Task<AuditJobDetailDto?> GetAuditJobAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CrawledPageDto>> GetCrawledPagesAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuditIssueDto>> GetAuditIssuesAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task<GraphDataDto> GetGraphTopologyAsync(Guid jobId, CancellationToken cancellationToken = default);
}