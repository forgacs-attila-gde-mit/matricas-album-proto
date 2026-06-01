using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260519120000_AddInstanceStickerTeamProgress")]
public partial class AddInstanceStickerTeamProgress : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS instance_sticker_team_progress (
    "Id" uuid PRIMARY KEY,
    "InstanceStickerId" uuid NOT NULL REFERENCES instance_stickers("Id") ON DELETE CASCADE,
    "TeamId" uuid NOT NULL REFERENCES teams("Id") ON DELETE CASCADE,
    "State" character varying(40) NOT NULL,
    "LatestEvidenceId" uuid NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_instance_sticker_team_progress_InstanceStickerId_TeamId"
    ON instance_sticker_team_progress ("InstanceStickerId", "TeamId");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS instance_sticker_team_progress;
""");
    }
}
