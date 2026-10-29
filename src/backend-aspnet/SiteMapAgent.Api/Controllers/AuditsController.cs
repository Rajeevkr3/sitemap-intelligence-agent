using MediatR;
using Microsoft.AspNetCore.Mvc;
using SiteMapAgent.Application.Audits.Commands;
using SiteMapAgent.Application.Audits.DTOs;
using SiteMapAgent.Application.Audits.Queries;

namespace SiteMapAgent.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuditsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAuditJob([FromBody] CreateAuditJobCommand command)
    {
        if (!Uri.TryCreate(command.TargetUrl, UriKind.Absolute, out var validatedUri) 
            || (validatedUri.Scheme != Uri.UriSchemeHttp && validatedUri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest(new { error = "Target URL must be a valid, fully qualified HTTP/HTTPS address." });
        }

        var jobId = await _mediator.Send(command);

        return Accepted(new 
        { 
            JobId = jobId, 
            Status = "PENDING", 
            Message = "Audit job accepted and queued for execution." 
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AuditJobDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditJob(Guid id)
    {
        var job = await _mediator.Send(new GetAuditJobQuery(id));
        return job is not null ? Ok(job) : NotFound(new { error = $"Audit job with ID {id} not found." });
    }

    [HttpGet("{id:guid}/pages")]
    [ProducesResponseType(typeof(IReadOnlyList<CrawledPageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCrawledPages(Guid id)
    {
        var pages = await _mediator.Send(new GetCrawledPagesQuery(id));
        return Ok(pages);
    }

    [HttpGet("{id:guid}/issues")]
    [ProducesResponseType(typeof(IReadOnlyList<AuditIssueDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditIssues(Guid id)
    {
        var issues = await _mediator.Send(new GetAuditIssuesQuery(id));
        return Ok(issues);
    }

    [HttpGet("{id:guid}/graph")]
    [ProducesResponseType(typeof(GraphDataDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGraphTopology(Guid id)
    {
    var graph = await _mediator.Send(new GetGraphTopologyQuery(id));
    return Ok(graph);
    }
}