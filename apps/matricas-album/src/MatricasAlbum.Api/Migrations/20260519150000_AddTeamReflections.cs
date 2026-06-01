using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260519150000_AddTeamReflections")]
public partial class AddTeamReflections : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE instance_sticker_team_progress
    ADD COLUMN IF NOT EXISTS "Reflection" text NULL;

ALTER TABLE instance_sticker_team_progress
    ADD COLUMN IF NOT EXISTS "ReflectedAt" timestamp with time zone NULL;

CREATE TABLE IF NOT EXISTS album_instance_team_reflections (
    "Id" uuid PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL REFERENCES album_instances("Id") ON DELETE CASCADE,
    "TeamId" uuid NOT NULL REFERENCES teams("Id") ON DELETE CASCADE,
    "Text" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_instance_team_reflections_AlbumInstanceId_TeamId"
    ON album_instance_team_reflections ("AlbumInstanceId", "TeamId");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS album_instance_team_reflections;

ALTER TABLE instance_sticker_team_progress DROP COLUMN IF EXISTS "ReflectedAt";
ALTER TABLE instance_sticker_team_progress DROP COLUMN IF EXISTS "Reflection";
""");
    }
}
