using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260528100000_AddDifferentiationPaths")]
public partial class AddDifferentiationPaths : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS album_template_version_differentiation_paths (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AlbumTemplateVersionId" uuid NOT NULL,
    "Phase" character varying(40) NOT NULL,
    "PathKey" character varying(40) NOT NULL,
    "Title" character varying(120) NOT NULL,
    "Description" character varying(800) NOT NULL,
    "RecommendedFor" character varying(500) NOT NULL,
    "SortOrder" integer NOT NULL,
    CONSTRAINT "FK_album_template_version_differentiation_paths_album_template_versions_AlbumTemplateVersionId"
        FOREIGN KEY ("AlbumTemplateVersionId") REFERENCES album_template_versions ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_version_differentiation_paths_Version_Phase_Path"
    ON album_template_version_differentiation_paths ("AlbumTemplateVersionId", "Phase", "PathKey");

CREATE INDEX IF NOT EXISTS "IX_album_template_version_differentiation_paths_Version_Sort"
    ON album_template_version_differentiation_paths ("AlbumTemplateVersionId", "SortOrder");

CREATE TABLE IF NOT EXISTS instance_sticker_team_differentiation_paths (
    "Id" uuid NOT NULL PRIMARY KEY,
    "InstanceStickerId" uuid NOT NULL,
    "TeamId" uuid NOT NULL,
    "PathKey" character varying(40) NOT NULL,
    "AssignedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_instance_sticker_team_differentiation_paths_instance_stickers_InstanceStickerId"
        FOREIGN KEY ("InstanceStickerId") REFERENCES instance_stickers ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_instance_sticker_team_differentiation_paths_teams_TeamId"
        FOREIGN KEY ("TeamId") REFERENCES teams ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_instance_sticker_team_differentiation_paths_Sticker_Team"
    ON instance_sticker_team_differentiation_paths ("InstanceStickerId", "TeamId");

CREATE INDEX IF NOT EXISTS "IX_instance_sticker_team_differentiation_paths_Team_AssignedAt"
    ON instance_sticker_team_differentiation_paths ("TeamId", "AssignedAt");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP INDEX IF EXISTS "IX_instance_sticker_team_differentiation_paths_Team_AssignedAt";
DROP INDEX IF EXISTS "IX_instance_sticker_team_differentiation_paths_Sticker_Team";
DROP TABLE IF EXISTS instance_sticker_team_differentiation_paths;

DROP INDEX IF EXISTS "IX_album_template_version_differentiation_paths_Version_Sort";
DROP INDEX IF EXISTS "IX_album_template_version_differentiation_paths_Version_Phase_Path";
DROP TABLE IF EXISTS album_template_version_differentiation_paths;
""");
    }
}
