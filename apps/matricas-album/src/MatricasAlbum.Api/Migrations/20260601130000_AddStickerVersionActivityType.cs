using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260601130000_AddStickerVersionActivityType")]
public partial class AddStickerVersionActivityType : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Additive, nullable: existing activities stay unclassified (NULL) until a teacher
        // or the AI assigns a dominant Tevékenységtípus. No backfill — types are not invented.
        migrationBuilder.Sql("""
ALTER TABLE sticker_versions ADD COLUMN IF NOT EXISTS "ActivityTypeKey" character varying(40) NULL;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE sticker_versions DROP COLUMN IF EXISTS "ActivityTypeKey";
""");
    }
}
