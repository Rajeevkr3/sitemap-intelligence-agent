using MediatR; 
using SiteMapAgent.Application.Common.Interfaces; 
using SiteMapAgent.Domain.Entities; 
namespace SiteMapAgent.Application.Audits.Commands; 
/// <summary> 
/// Command record containing the parameters needed to initialize an audit. 
/// </summary> 
public record CreateAuditJobCommand( 
string TargetUrl, 
int MaxDepth = 3, 
int MaxPages = 200 
) : IRequest<Guid>; 
/// <summary> 
/// Handler responsible for executing domain logic upon receiving CreateAuditJobCommand. 
/// </summary> 
public class CreateAuditJobCommandHandler : IRequestHandler<CreateAuditJobCommand, 
Guid> 
{ 
    private readonly IAuditJobRepository _repository; 
 
    public CreateAuditJobCommandHandler(IAuditJobRepository repository) 
    { 
        _repository = repository; 
    } 
 
    public async Task<Guid> Handle(CreateAuditJobCommand request, CancellationToken 
cancellationToken) 
    { 
        // Extract root domain host from provided URL string 
        var parsedUri = new Uri(request.TargetUrl); 
 
        var auditJob = new AuditJob 
        { 
            TargetUrl = request.TargetUrl, 
            RootDomain = parsedUri.Host, 
            MaxCrawlDepth = request.MaxDepth, 
            MaxPagesLimit = request.MaxPages, 
            Status = CrawlJobStatus.Pending, 
            CreatedAt = DateTime.UtcNow 
        }; 
 
        // Persist new job entity in database 
        await _repository.AddAsync(auditJob, cancellationToken); 
 
        return auditJob.Id; 
    } 
}