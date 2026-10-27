using Microsoft.EntityFrameworkCore;
using SiteMapAgent.Domain.Entities;

namespace SiteMapAgent.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<AuditJob> AuditJobs => Set<AuditJob>();
    public DbSet<CrawledPage> CrawledPages => Set<CrawledPage>();
    public DbSet<AuditIssue> AuditIssues => Set<AuditIssue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. AuditJob Table Mapping
        modelBuilder.Entity<AuditJob>(entity =>
        {
            entity.ToTable("audit_jobs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TargetUrl).HasColumnName("target_url").IsRequired();
            entity.Property(e => e.RootDomain).HasColumnName("root_domain").HasMaxLength(255).IsRequired();

            // Store as clean string in DB, expose as C# Enum in domain
            entity.Property(e => e.Status)
                  .HasColumnName("status")
                  .HasConversion<string>()
                  .HasMaxLength(50);

            entity.Property(e => e.MaxCrawlDepth).HasColumnName("max_crawl_depth");
            entity.Property(e => e.MaxPagesLimit).HasColumnName("max_pages_limit");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
        });

        // 2. CrawledPage Table Mapping
        modelBuilder.Entity<CrawledPage>(entity =>
        {
            entity.ToTable("crawled_pages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.Url).HasColumnName("url").IsRequired();
            entity.Property(e => e.HttpStatusCode).HasColumnName("http_status_code");
            entity.Property(e => e.ResponseTimeMs).HasColumnName("response_time_ms");
            entity.Property(e => e.PageTitle).HasColumnName("page_title");
            entity.Property(e => e.CrawlDepth).HasColumnName("crawl_depth");
            entity.Property(e => e.InSitemap).HasColumnName("in_sitemap");
            entity.Property(e => e.IsOrphan).HasColumnName("is_orphan");
            entity.Property(e => e.InDegree).HasColumnName("in_degree");
            entity.Property(e => e.OutDegree).HasColumnName("out_degree");
            entity.Property(e => e.PageRankScore).HasColumnName("pagerank_score");
            entity.Property(e => e.ContentHash).HasColumnName("content_hash");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => new { e.JobId, e.Url }).IsUnique();
        });

        // 3. AuditIssue Table Mapping
        modelBuilder.Entity<AuditIssue>(entity =>
        {
            entity.ToTable("audit_issues");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.JobId).HasColumnName("job_id");
            entity.Property(e => e.PageId).HasColumnName("page_id");
            entity.Property(e => e.IssueType).HasColumnName("issue_type").HasMaxLength(100);

            entity.Property(e => e.Severity)
                  .HasColumnName("severity")
                  .HasConversion<string>()
                  .HasMaxLength(50);

            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.EvidencePayloadJson).HasColumnName("evidence_payload").HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        });
    }
}