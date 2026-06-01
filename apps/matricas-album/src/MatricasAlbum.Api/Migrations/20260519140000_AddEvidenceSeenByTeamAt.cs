using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260519140000_AddEvidenceSeenByTeamAt")]
public partial class AddEvidenceSeenByTeamAt : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS "SeenByTeamAt" timestamp with time zone NULL;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE evidence DROP COLUMN IF EXISTS "SeenByTeamAt";
""");
    }
}
