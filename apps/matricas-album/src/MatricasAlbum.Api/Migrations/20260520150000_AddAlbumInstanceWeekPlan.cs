using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520150000_AddAlbumInstanceWeekPlan")]
public partial class AddAlbumInstanceWeekPlan : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Per-instance unit title overrides. Absent rows fall back to the bound template
        // version's title at read time — see MapInstanceDetailAsync.
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS album_instance_week_plans (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL,
    "WeekNumber" integer NOT NULL,
    "Title" varchar(240) NOT NULL,
    CONSTRAINT "FK_album_instance_week_plans_album_instances_AlbumInstanceId"
        FOREIGN KEY ("AlbumInstanceId") REFERENCES album_instances ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_instance_week_plans_AlbumInstanceId_WeekNumber"
    ON album_instance_week_plans ("AlbumInstanceId", "WeekNumber");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP INDEX IF EXISTS "IX_album_instance_week_plans_AlbumInstanceId_WeekNumber";
DROP TABLE IF EXISTS album_instance_week_plans;
""");
    }
}
