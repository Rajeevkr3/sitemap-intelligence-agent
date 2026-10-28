using Microsoft.EntityFrameworkCore;
using SiteMapAgent.Application.Audits.DTOs;
using SiteMapAgent.Application.Common.Interfaces;

namespace SiteMapAgent.Infrastructure.Persistence.Services;

public class AuditQueryService : IAuditQueryService
{
    private readonly ApplicationDbContext _context;

    public AuditQueryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AuditJobDetailDto?> GetAuditJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        var job = await _context.AuditJobs
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);

        if (job is null) return null;

        var totalPages = await _context.CrawledPages
            .CountAsync(p => p.JobId == jobId, cancellationToken);

        var totalIssues = await _context.AuditIssues
            .CountAsync(i => i.JobId == jobId, cancellationToken);

        return new AuditJobDetailDto(
            job.Id,
            job.TargetUrl,
            job.RootDomain,
            job.Status.ToString().ToUpperInvariant(),
            job.MaxCrawlDepth,
            job.MaxPagesLimit,
            job.CreatedAt,
            job.CompletedAt,
            totalPages,
            totalIssues
        );
    }

    public async Task<IReadOnlyList<CrawledPageDto>> GetCrawledPagesAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return await _context.CrawledPages
            .AsNoTracking()
            .Where(p => p.JobId == jobId)
            .OrderByDescending(p => p.PageRankScore)
            .Select(p => new CrawledPageDto(
                p.Id,
                p.Url,
                p.HttpStatusCode,
                p.ResponseTimeMs,
                p.PageTitle,
                p.CrawlDepth,
                p.InSitemap,
                p.IsOrphan,
                p.InDegree,
                p.OutDegree,
                p.PageRankScore
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AuditIssueDto>> GetAuditIssuesAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return await _context.AuditIssues
            .AsNoTracking()
            .Where(i => i.JobId == jobId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new AuditIssueDto(
                i.Id,
                i.PageId,
                i.IssueType,
                i.Severity.ToString().ToUpperInvariant(),
                i.Description,
                i.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }
}