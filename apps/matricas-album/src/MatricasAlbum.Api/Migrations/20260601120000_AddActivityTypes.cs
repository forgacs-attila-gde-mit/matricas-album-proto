using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260601120000_AddActivityTypes")]
public partial class AddActivityTypes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS activity_types (
    "Key" character varying(40) NOT NULL PRIMARY KEY,
    "Name" character varying(80) NOT NULL,
    "PedagogyModel" character varying(60) NOT NULL,
    "SortOrder" integer NOT NULL
);
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS activity_types;
""");
    }
}
