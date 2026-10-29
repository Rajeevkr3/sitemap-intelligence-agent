using FluentAssertions;
using Moq;
using SiteMapAgent.Application.Audits.Commands;
using SiteMapAgent.Application.Common.Interfaces;
using SiteMapAgent.Domain.Entities;
using Xunit;

namespace SiteMapAgent.Application.Tests;

public class CreateAuditJobCommandHandlerTests
{
    private readonly Mock<IAuditJobRepository> _mockRepo;
    private readonly CreateAuditJobCommandHandler _handler;

    public CreateAuditJobCommandHandlerTests()
    {
        _mockRepo = new Mock<IAuditJobRepository>();
        _handler = new CreateAuditJobCommandHandler(_mockRepo.Object);
    }

    [Fact]
    public async Task Handle_ShouldExtractRootDomainAndPersist_WhenCommandIsValid()
    {
        // Arrange
        var command = new CreateAuditJobCommand("https://example.com/blog/article-1", 3, 100);

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<AuditJob>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        // Act
        var resultId = await _handler.Handle(command, CancellationToken.None);

        // Assert
        resultId.Should().NotBeEmpty();
        _mockRepo.Verify(r => r.AddAsync(It.Is<AuditJob>(j =>
            j.TargetUrl == "https://example.com/blog/article-1" &&
            j.RootDomain == "example.com" &&
            j.MaxCrawlDepth == 3 &&
            j.MaxPagesLimit == 100 &&
            j.Status == CrawlJobStatus.Pending
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldStripPort_WhenDomainHasPortSpecification()
    {
        // Arrange
        var command = new CreateAuditJobCommand("http://localhost:8080/dashboard", 2, 50);

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<AuditJob>(), It.IsAny<CancellationToken>()))
                 .Returns(Task.CompletedTask);

        // Act
        var resultId = await _handler.Handle(command, CancellationToken.None);

        // Assert
        resultId.Should().NotBeEmpty();
        _mockRepo.Verify(r => r.AddAsync(It.Is<AuditJob>(j =>
            j.RootDomain == "localhost"
        ), It.IsAny<CancellationToken>()), Times.Once);
    }
}