using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260519130000_AddEvidenceHelpRequested")]
public partial class AddEvidenceHelpRequested : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS "HelpRequested" boolean NOT NULL DEFAULT FALSE;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE evidence DROP COLUMN IF EXISTS "HelpRequested";
""");
    }
}
