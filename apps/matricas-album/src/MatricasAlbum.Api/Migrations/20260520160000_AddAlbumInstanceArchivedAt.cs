using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520160000_AddAlbumInstanceArchivedAt")]
public partial class AddAlbumInstanceArchivedAt : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_instances
    ADD COLUMN IF NOT EXISTS "ArchivedAt" timestamp with time zone NULL;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_instances DROP COLUMN IF EXISTS "ArchivedAt";
""");
    }
}
