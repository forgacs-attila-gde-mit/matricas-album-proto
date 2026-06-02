using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260602130000_AddModules")]
public partial class AddModules : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS modules (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(180) NOT NULL,
    "ArchivedAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_versions (
    "Id" uuid NOT NULL PRIMARY KEY,
    "ModuleId" uuid NOT NULL,
    "VersionNumber" integer NOT NULL,
    "IsDraft" boolean NOT NULL DEFAULT FALSE,
    "Name" character varying(180) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_module_versions_modules_ModuleId"
        FOREIGN KEY ("ModuleId") REFERENCES modules ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_module_versions_Module_Version"
    ON module_versions ("ModuleId", "VersionNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "IX_module_versions_one_draft_per_module"
    ON module_versions ("ModuleId")
    WHERE "IsDraft" = TRUE;

CREATE TABLE IF NOT EXISTS module_topic_relations (
    "Id" uuid NOT NULL PRIMARY KEY,
    "ModuleVersionId" uuid NOT NULL,
    "TopicVersionId" uuid NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_module_topic_relations_module_versions_ModuleVersionId"
        FOREIGN KEY ("ModuleVersionId") REFERENCES module_versions ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_module_topic_relations_topic_versions_TopicVersionId"
        FOREIGN KEY ("TopicVersionId") REFERENCES topic_versions ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_module_topic_relations_Version_Sort"
    ON module_topic_relations ("ModuleVersionId", "SortOrder");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS module_topic_relations;
DROP INDEX IF EXISTS "IX_module_versions_one_draft_per_module";
DROP INDEX IF EXISTS "IX_module_versions_Module_Version";
DROP TABLE IF EXISTS module_versions;
DROP TABLE IF EXISTS modules;
""");
    }
}
