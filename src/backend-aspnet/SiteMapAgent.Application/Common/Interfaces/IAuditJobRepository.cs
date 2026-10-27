using SiteMapAgent.Domain.Entities; 
namespace SiteMapAgent.Application.Common.Interfaces; 
/// <summary> 
/// Port contract defining persistence operations for Audit Jobs. 
/// Implemented by the Infrastructure layer. 
/// </summary> 
public interface IAuditJobRepository 
{ 
Task<AuditJob?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default); 
Task AddAsync(AuditJob job, CancellationToken cancellationToken = default); 
Task UpdateAsync(AuditJob job, CancellationToken cancellationToken = default); 
Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default); 
}