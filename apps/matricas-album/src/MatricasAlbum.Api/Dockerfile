FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY MatricasAlbum.slnx ./
COPY src/MatricasAlbum.Api/MatricasAlbum.Api.csproj src/MatricasAlbum.Api/
RUN dotnet restore MatricasAlbum.slnx

COPY src/MatricasAlbum.Api/ src/MatricasAlbum.Api/
RUN dotnet publish src/MatricasAlbum.Api/MatricasAlbum.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MatricasAlbum.Api.dll"]
