using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260602120000_AddTopics")]
public partial class AddTopics : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS topics (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(180) NOT NULL,
    "ArchivedAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topic_versions (
    "Id" uuid NOT NULL PRIMARY KEY,
    "TopicId" uuid NOT NULL,
    "VersionNumber" integer NOT NULL,
    "IsDraft" boolean NOT NULL DEFAULT FALSE,
    "Name" character varying(180) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_topic_versions_topics_TopicId"
        FOREIGN KEY ("TopicId") REFERENCES topics ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_topic_versions_Topic_Version"
    ON topic_versions ("TopicId", "VersionNumber");

-- At most one draft per topic (mirrors the block / album-template partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS "IX_topic_versions_one_draft_per_topic"
    ON topic_versions ("TopicId")
    WHERE "IsDraft" = TRUE;

CREATE TABLE IF NOT EXISTS topic_block_relations (
    "Id" uuid NOT NULL PRIMARY KEY,
    "TopicVersionId" uuid NOT NULL,
    "BlockVersionId" uuid NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_topic_block_relations_topic_versions_TopicVersionId"
        FOREIGN KEY ("TopicVersionId") REFERENCES topic_versions ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_topic_block_relations_block_versions_BlockVersionId"
        FOREIGN KEY ("BlockVersionId") REFERENCES block_versions ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_topic_block_relations_Version_Sort"
    ON topic_block_relations ("TopicVersionId", "SortOrder");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS topic_block_relations;
DROP INDEX IF EXISTS "IX_topic_versions_one_draft_per_topic";
DROP INDEX IF EXISTS "IX_topic_versions_Topic_Version";
DROP TABLE IF EXISTS topic_versions;
DROP TABLE IF EXISTS topics;
""");
    }
}
