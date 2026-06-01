using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260525120000_AddAlbumTemplatePatterns")]
public partial class AddAlbumTemplatePatterns : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_templates
    ADD COLUMN IF NOT EXISTS "PatternKey" character varying(60) NOT NULL DEFAULT 'altalanos',
    ADD COLUMN IF NOT EXISTS "PatternName" character varying(120) NOT NULL DEFAULT 'Általános album',
    ADD COLUMN IF NOT EXISTS "PatternDescription" character varying(500) NOT NULL DEFAULT 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.';

ALTER TABLE album_template_versions
    ADD COLUMN IF NOT EXISTS "PatternKey" character varying(60) NOT NULL DEFAULT 'altalanos',
    ADD COLUMN IF NOT EXISTS "PatternName" character varying(120) NOT NULL DEFAULT 'Általános album',
    ADD COLUMN IF NOT EXISTS "PatternDescription" character varying(500) NOT NULL DEFAULT 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.';

UPDATE album_templates
SET "PatternKey" = 'altalanos',
    "PatternName" = 'Általános album',
    "PatternDescription" = 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.'
WHERE "PatternKey" IS NULL OR btrim("PatternKey") = '';

UPDATE album_template_versions
SET "PatternKey" = 'altalanos',
    "PatternName" = 'Általános album',
    "PatternDescription" = 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.'
WHERE "PatternKey" IS NULL OR btrim("PatternKey") = '';
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_template_versions
    DROP COLUMN IF EXISTS "PatternDescription",
    DROP COLUMN IF EXISTS "PatternName",
    DROP COLUMN IF EXISTS "PatternKey";

ALTER TABLE album_templates
    DROP COLUMN IF EXISTS "PatternDescription",
    DROP COLUMN IF EXISTS "PatternName",
    DROP COLUMN IF EXISTS "PatternKey";
""");
    }
}
