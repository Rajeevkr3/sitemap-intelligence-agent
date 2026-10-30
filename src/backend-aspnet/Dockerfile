# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy solution and project definitions
COPY SiteMapAgent.sln ./
COPY src/backend-aspnet/SiteMapAgent.Domain/*.csproj src/backend-aspnet/SiteMapAgent.Domain/
COPY src/backend-aspnet/SiteMapAgent.Application/*.csproj src/backend-aspnet/SiteMapAgent.Application/
COPY src/backend-aspnet/SiteMapAgent.Infrastructure/*.csproj src/backend-aspnet/SiteMapAgent.Infrastructure/
COPY src/backend-aspnet/SiteMapAgent.Api/*.csproj src/backend-aspnet/SiteMapAgent.Api/
COPY tests/SiteMapAgent.Application.Tests/*.csproj tests/SiteMapAgent.Application.Tests/

# Restore dependencies
RUN dotnet restore SiteMapAgent.sln

# Copy source code and publish API
COPY src/ src/
WORKDIR /app/src/backend-aspnet/SiteMapAgent.Api
RUN dotnet publish -c Release -o /app/out --no-restore

# Stage 2: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./
EXPOSE 5132
ENV ASPNETCORE_URLS=http://+:5132
ENTRYPOINT ["dotnet", "SiteMapAgent.Api.dll"]