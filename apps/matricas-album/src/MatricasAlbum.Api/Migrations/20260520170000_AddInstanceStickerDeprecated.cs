using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520170000_AddInstanceStickerDeprecated")]
public partial class AddInstanceStickerDeprecated : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Flagged true when a template-version upgrade removed this sticker from the
        // source template but evidence was already on it — we keep the row to preserve data.
        migrationBuilder.Sql("""
ALTER TABLE instance_stickers
    ADD COLUMN IF NOT EXISTS "Deprecated" boolean NOT NULL DEFAULT FALSE;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE instance_stickers DROP COLUMN IF EXISTS "Deprecated";
""");
    }
}
