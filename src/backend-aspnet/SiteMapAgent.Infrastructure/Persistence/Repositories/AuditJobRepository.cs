using Microsoft.EntityFrameworkCore; 
using SiteMapAgent.Application.Common.Interfaces; 
using SiteMapAgent.Domain.Entities; 
 
namespace SiteMapAgent.Infrastructure.Persistence.Repositories; 
 
/// <summary> 
/// Concrete implementation of IAuditJobRepository using Entity Framework Core. 
/// </summary> 
public class AuditJobRepository : IAuditJobRepository 
{ 
    private readonly ApplicationDbContext _context; 
 
    public AuditJobRepository(ApplicationDbContext context) 
    { 
        _context = context; 
    } 
 
    public async Task<AuditJob?> GetByIdAsync(Guid id, CancellationToken cancellationToken 
= default) 
    { 
        return await _context.AuditJobs 
            .Include(j => j.Pages) 
            .Include(j => j.Issues) 
            .FirstOrDefaultAsync(j => j.Id == id, cancellationToken); 
    } 
 
    public async Task AddAsync(AuditJob job, CancellationToken cancellationToken = default) 
    { 
        await _context.AuditJobs.AddAsync(job, cancellationToken); 
        await _context.SaveChangesAsync(cancellationToken); 
    } 
 
    public async Task UpdateAsync(AuditJob job, CancellationToken cancellationToken = 
default) 
    { 
        _context.AuditJobs.Update(job); 
        await _context.SaveChangesAsync(cancellationToken); 
    } 
 
    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = 
default) 
    { 
        return await _context.AuditJobs.AnyAsync(j => j.Id == id, cancellationToken); 
    } 
} 