using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260524130000_AddProjectReflectionPrompts")]
public partial class AddProjectReflectionPrompts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_template_versions
    ADD COLUMN IF NOT EXISTS "ProjectReflectionPromptsJson" text NULL;

UPDATE album_template_versions
SET "ProjectReflectionPromptsJson" = '["Milyen kérdéssel indultatok, és hogyan változott meg az út során?","Mi az, amit másképp gondoltok most a projekt végére?","Mit csinálnátok másképp, ha újrakezdenétek?"]'
WHERE "ProjectReflectionPromptsJson" IS NULL OR btrim("ProjectReflectionPromptsJson") = '';
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_template_versions DROP COLUMN IF EXISTS "ProjectReflectionPromptsJson";
""");
    }
}
