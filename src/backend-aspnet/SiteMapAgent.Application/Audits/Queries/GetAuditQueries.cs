using MediatR;
using SiteMapAgent.Application.Audits.DTOs;
using SiteMapAgent.Application.Common.Interfaces;

namespace SiteMapAgent.Application.Audits.Queries;

public record GetAuditJobQuery(Guid JobId) : IRequest<AuditJobDetailDto?>;
public record GetCrawledPagesQuery(Guid JobId) : IRequest<IReadOnlyList<CrawledPageDto>>;
public record GetAuditIssuesQuery(Guid JobId) : IRequest<IReadOnlyList<AuditIssueDto>>;
public record GetGraphTopologyQuery(Guid JobId) : IRequest<GraphDataDto>;

public class GetAuditQueriesHandler :
    IRequestHandler<GetAuditJobQuery, AuditJobDetailDto?>,
    IRequestHandler<GetCrawledPagesQuery, IReadOnlyList<CrawledPageDto>>,
    IRequestHandler<GetAuditIssuesQuery, IReadOnlyList<AuditIssueDto>>,
    IRequestHandler<GetGraphTopologyQuery, GraphDataDto>
{
    private readonly IAuditQueryService _queryService;

    public GetAuditQueriesHandler(IAuditQueryService queryService)
    {
        _queryService = queryService;
    }

    public Task<AuditJobDetailDto?> Handle(GetAuditJobQuery request, CancellationToken cancellationToken) =>
        _queryService.GetAuditJobAsync(request.JobId, cancellationToken);

    public Task<IReadOnlyList<CrawledPageDto>> Handle(GetCrawledPagesQuery request, CancellationToken cancellationToken) =>
        _queryService.GetCrawledPagesAsync(request.JobId, cancellationToken);

    public Task<IReadOnlyList<AuditIssueDto>> Handle(GetAuditIssuesQuery request, CancellationToken cancellationToken) =>
        _queryService.GetAuditIssuesAsync(request.JobId, cancellationToken);

    public Task<GraphDataDto> Handle(GetGraphTopologyQuery request, CancellationToken cancellationToken) =>
        _queryService.GetGraphTopologyAsync(request.JobId, cancellationToken);
}