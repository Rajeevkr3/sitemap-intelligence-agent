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

    public async Task<GraphDataDto> GetGraphTopologyAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        // 1. Fetch crawled page vertices with metrics
        var pages = await _context.CrawledPages
            .AsNoTracking()
            .Where(p => p.JobId == jobId)
            .Select(p => new GraphNodeDto(
                p.Url,
                p.PageTitle ?? p.Url,
                p.PageRankScore,
                p.InDegree,
                p.IsOrphan
            ))
            .ToListAsync(cancellationToken);

        // 2. Fetch page linkages directly via ADO.NET connection on the existing DbContext
        var edges = new List<GraphEdgeDto>();
        var pageUrlSet = pages.Select(p => p.Id).ToHashSet();

        var connection = _context.Database.GetDbConnection();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = @"
                SELECT src.url AS source_url, h.target_url 
                FROM page_hyperlinks h
                JOIN crawled_pages src ON h.source_page_id = src.id
                WHERE h.job_id = @jobId";

            var param = command.CreateParameter();
            param.ParameterName = "@jobId";
            param.Value = jobId;
            command.Parameters.Add(param);

            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }

            await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    var source = reader.GetString(0);
                    var target = reader.GetString(1);

                    // Only link vertices present in this crawl graph
                    if (pageUrlSet.Contains(source) && pageUrlSet.Contains(target))
                    {
                        edges.Add(new GraphEdgeDto(source, target));
                    }
                }
            }
        }

        return new GraphDataDto(pages, edges);
    }
}