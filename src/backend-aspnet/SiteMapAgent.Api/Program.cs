using Microsoft.EntityFrameworkCore;
using SiteMapAgent.Application.Common.Interfaces;
using SiteMapAgent.Application.Audits.Commands;
using SiteMapAgent.Infrastructure.Persistence;
using SiteMapAgent.Infrastructure.Persistence.Repositories;
using SiteMapAgent.Infrastructure.Persistence.Services;

var builder = WebApplication.CreateBuilder(args);

// Register CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=sitemap_agent_db;Username=postgres;Password=postgrespass;Include Error Detail=true";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Dependency Injection
builder.Services.AddScoped<IAuditJobRepository, AuditJobRepository>();
builder.Services.AddScoped<IAuditQueryService, AuditQueryService>();

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(CreateAuditJobCommand).Assembly));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontendApp");
app.UseAuthorization();
app.MapControllers();

app.Run();