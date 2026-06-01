using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260519160000_AddTeamHelpRequests")]
public partial class AddTeamHelpRequests : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS team_help_requests (
    "Id" uuid PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL REFERENCES album_instances("Id") ON DELETE CASCADE,
    "TeamId" uuid NOT NULL REFERENCES teams("Id") ON DELETE CASCADE,
    "InstanceStickerId" uuid NULL REFERENCES instance_stickers("Id") ON DELETE SET NULL,
    "Question" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ResolvedAt" timestamp with time zone NULL
);

CREATE INDEX IF NOT EXISTS "IX_team_help_requests_AlbumInstanceId_ResolvedAt"
    ON team_help_requests ("AlbumInstanceId", "ResolvedAt");

CREATE INDEX IF NOT EXISTS "IX_team_help_requests_TeamId_ResolvedAt"
    ON team_help_requests ("TeamId", "ResolvedAt");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS team_help_requests;
""");
    }
}
