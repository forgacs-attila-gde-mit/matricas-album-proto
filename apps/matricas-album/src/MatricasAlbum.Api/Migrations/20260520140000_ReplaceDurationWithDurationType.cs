using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520140000_ReplaceDurationWithDurationType")]
public partial class ReplaceDurationWithDurationType : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Replace the free-text Duration with a constrained DurationType (het | ora | fazis).
        // The number of units (weeks, hours, phases) is now implied by the rows in
        // album_template_version_week_plans, so a free-text Duration is redundant and stale.
        migrationBuilder.Sql("""
ALTER TABLE album_templates
    ADD COLUMN IF NOT EXISTS "DurationType" varchar(20) NOT NULL DEFAULT 'het';

ALTER TABLE album_template_versions
    ADD COLUMN IF NOT EXISTS "DurationType" varchar(20) NOT NULL DEFAULT 'het';

ALTER TABLE album_templates DROP COLUMN IF EXISTS "Duration";
ALTER TABLE album_template_versions DROP COLUMN IF EXISTS "Duration";
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // The original free-text Duration cannot be recovered — best effort backfills empty strings.
        migrationBuilder.Sql("""
ALTER TABLE album_templates
    ADD COLUMN IF NOT EXISTS "Duration" varchar(120) NOT NULL DEFAULT '';

ALTER TABLE album_template_versions
    ADD COLUMN IF NOT EXISTS "Duration" varchar(120) NOT NULL DEFAULT '';

ALTER TABLE album_templates DROP COLUMN IF EXISTS "DurationType";
ALTER TABLE album_template_versions DROP COLUMN IF EXISTS "DurationType";
""");
    }
}
