using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260527100000_AddAlbumInstanceTeacherEffectLog")]
public partial class AddAlbumInstanceTeacherEffectLog : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS album_instance_teacher_effect_logs (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL,
    "WorkedWell" text NOT NULL DEFAULT '',
    "EngagementSignals" text NOT NULL DEFAULT '',
    "AdaptationNotes" text NOT NULL DEFAULT '',
    "ReuseNextTime" text NOT NULL DEFAULT '',
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_album_instance_teacher_effect_logs_album_instances_AlbumInstanceId"
        FOREIGN KEY ("AlbumInstanceId") REFERENCES album_instances ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_instance_teacher_effect_logs_AlbumInstanceId"
    ON album_instance_teacher_effect_logs ("AlbumInstanceId");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP INDEX IF EXISTS "IX_album_instance_teacher_effect_logs_AlbumInstanceId";
DROP TABLE IF EXISTS album_instance_teacher_effect_logs;
""");
    }
}
