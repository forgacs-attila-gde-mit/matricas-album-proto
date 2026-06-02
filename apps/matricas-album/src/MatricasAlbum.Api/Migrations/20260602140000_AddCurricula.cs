using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260602140000_AddCurricula")]
public partial class AddCurricula : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS curricula (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(180) NOT NULL,
    "ArchivedAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_versions (
    "Id" uuid NOT NULL PRIMARY KEY,
    "CurriculumId" uuid NOT NULL,
    "VersionNumber" integer NOT NULL,
    "IsDraft" boolean NOT NULL DEFAULT FALSE,
    "Name" character varying(180) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_curriculum_versions_curricula_CurriculumId"
        FOREIGN KEY ("CurriculumId") REFERENCES curricula ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_curriculum_versions_Curriculum_Version"
    ON curriculum_versions ("CurriculumId", "VersionNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "IX_curriculum_versions_one_draft_per_curriculum"
    ON curriculum_versions ("CurriculumId")
    WHERE "IsDraft" = TRUE;

CREATE TABLE IF NOT EXISTS curriculum_module_relations (
    "Id" uuid NOT NULL PRIMARY KEY,
    "CurriculumVersionId" uuid NOT NULL,
    "ModuleVersionId" uuid NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_curriculum_module_relations_curriculum_versions_CurriculumVersionId"
        FOREIGN KEY ("CurriculumVersionId") REFERENCES curriculum_versions ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_curriculum_module_relations_module_versions_ModuleVersionId"
        FOREIGN KEY ("ModuleVersionId") REFERENCES module_versions ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_curriculum_module_relations_Version_Sort"
    ON curriculum_module_relations ("CurriculumVersionId", "SortOrder");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS curriculum_module_relations;
DROP INDEX IF EXISTS "IX_curriculum_versions_one_draft_per_curriculum";
DROP INDEX IF EXISTS "IX_curriculum_versions_Curriculum_Version";
DROP TABLE IF EXISTS curriculum_versions;
DROP TABLE IF EXISTS curricula;
""");
    }
}
