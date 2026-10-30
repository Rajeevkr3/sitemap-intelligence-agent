using System.Text;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using SiteMapAgent.Application.Audits.Commands;
using SiteMapAgent.Application.Audits.DTOs;
using SiteMapAgent.Application.Audits.Queries;

namespace SiteMapAgent.Api.Controllers;

[ApiController]
[Route("api/v1/audits")]
public class AuditsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateAuditJob([FromBody] CreateAuditJobCommand command, CancellationToken ct)
    {
        var jobId = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetAuditJobById), new { id = jobId }, new { jobId });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AuditJobDetailDto>> GetAuditJobById(Guid id, CancellationToken ct)
    {
        var job = await _mediator.Send(new GetAuditJobQuery(id), ct);
        if (job == null)
            return NotFound();

        return Ok(job);
    }

    [HttpGet("{id:guid}/pages")]
    public async Task<ActionResult<IReadOnlyList<CrawledPageDto>>> GetCrawledPages(Guid id, CancellationToken ct)
    {
        var pages = await _mediator.Send(new GetCrawledPagesQuery(id), ct);
        return Ok(pages);
    }

    [HttpGet("{id:guid}/issues")]
    public async Task<ActionResult<IReadOnlyList<AuditIssueDto>>> GetAuditIssues(Guid id, CancellationToken ct)
    {
        var issues = await _mediator.Send(new GetAuditIssuesQuery(id), ct);
        return Ok(issues);
    }

    [HttpGet("{id:guid}/graph")]
    public async Task<ActionResult<GraphDataDto>> GetGraphTopology(Guid id, CancellationToken ct)
    {
        var graph = await _mediator.Send(new GetGraphTopologyQuery(id), ct);
        return Ok(graph);
    }

    [HttpGet("{id:guid}/export/csv")]
    public async Task<IActionResult> ExportAuditReportCsv(Guid id, CancellationToken ct)
    {
        var job = await _mediator.Send(new GetAuditJobQuery(id), ct);
        if (job == null)
            return NotFound();

        var pages = await _mediator.Send(new GetCrawledPagesQuery(id), ct);
        var issues = await _mediator.Send(new GetAuditIssuesQuery(id), ct);

        var builder = new StringBuilder();

        // 1. Audit Summary Block
        builder.AppendLine("# SITEMAP INTELLIGENCE AGENT - AUDIT SUMMARY REPORT");
        builder.AppendLine($"# Job ID: {job.Id}");
        builder.AppendLine($"# Target Domain: {job.RootDomain}");
        builder.AppendLine($"# Status: {job.Status}");
        builder.AppendLine($"# Total Pages Crawled: {job.TotalPagesCrawled}");
        builder.AppendLine($"# Total Defects Found: {job.TotalIssuesFound}");
        builder.AppendLine($"# Generated At: {DateTime.UtcNow:u}");
        builder.AppendLine();

        // 2. Audit Issues Section
        builder.AppendLine("SECTION: AUDIT DEFECTS & FINDINGS");
        builder.AppendLine("Issue Type,Severity,Description");
        foreach (var issue in issues)
        {
            var cleanDesc = issue.Description.Replace("\"", "\"\"");
            builder.AppendLine($"\"{issue.IssueType}\",\"{issue.Severity}\",\"{cleanDesc}\"");
        }
        builder.AppendLine();

        // 3. Topology & Centrality Section
        builder.AppendLine("SECTION: CRAWLED PAGES & TOPOLOGICAL CENTRALITY");
        builder.AppendLine("URL,HTTP Status,Depth,In-Degree,Out-Degree,PageRank,Is Orphan");
        foreach (var page in pages)
        {
            var cleanUrl = page.Url.Replace("\"", "\"\"");
            builder.AppendLine($"\"{cleanUrl}\",{page.HttpStatusCode ?? 200},{page.CrawlDepth},{page.InDegree},{page.OutDegree},{page.PageRankScore:F6},{page.IsOrphan}");
        }

        var bytes = Encoding.UTF8.GetBytes(builder.ToString());
        var filename = $"audit-report-{job.RootDomain}-{job.Id.ToString()[..8]}.csv";

        return File(bytes, "text/csv", filename);
    }
}