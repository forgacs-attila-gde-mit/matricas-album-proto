using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260601140000_AddActivityStructuredMetadata")]
public partial class AddActivityStructuredMetadata : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Additive, nullable structured activity-planning metadata. Existing rows stay NULL;
        // no destructive backfill — the note-line parser only runs where such data exists.
        migrationBuilder.Sql("""
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "Subject" character varying(120) NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "GradeLevel" character varying(80) NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "EstimatedMinutes" integer NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "Modality" character varying(40) NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "GroupSize" character varying(40) NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "ContextMode" character varying(40) NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "CompetenciesJson" text NULL;
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "NatReferencesJson" text NULL;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "NatReferencesJson";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "CompetenciesJson";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "ContextMode";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "GroupSize";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "Modality";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "EstimatedMinutes";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "GradeLevel";
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "Subject";
""");
    }
}
