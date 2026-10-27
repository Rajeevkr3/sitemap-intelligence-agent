using MediatR;
using Microsoft.AspNetCore.Mvc;
using SiteMapAgent.Application.Audits.Commands;

namespace SiteMapAgent.Api.Controllers;

/// <summary>
/// Web API Controller exposing endpoints to trigger and query crawl audits.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class AuditsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuditsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Creates and queues a new website auditing job.
    /// </summary>
    /// <param name="command">Audit configuration details</param>
    /// <returns>HTTP 202 Accepted with assigned Job UUID</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAuditJob([FromBody] CreateAuditJobCommand command)
    {
        // Enforce valid, fully qualified HTTP/HTTPS URL
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
}