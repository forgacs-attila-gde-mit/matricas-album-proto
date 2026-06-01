using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260601150000_AddBlocks")]
public partial class AddBlocks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS blocks (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Name" character varying(180) NOT NULL,
    "ArchivedAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS block_versions (
    "Id" uuid NOT NULL PRIMARY KEY,
    "BlockId" uuid NOT NULL,
    "VersionNumber" integer NOT NULL,
    "IsDraft" boolean NOT NULL DEFAULT FALSE,
    "Name" character varying(180) NOT NULL,
    "FlowType" character varying(40) NOT NULL DEFAULT 'linear',
    "Grouping" character varying(40) NOT NULL DEFAULT 'group',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_block_versions_blocks_BlockId"
        FOREIGN KEY ("BlockId") REFERENCES blocks ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_block_versions_Block_Version"
    ON block_versions ("BlockId", "VersionNumber");

-- At most one draft per block (mirrors the album-template partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS "IX_block_versions_one_draft_per_block"
    ON block_versions ("BlockId")
    WHERE "IsDraft" = TRUE;

CREATE TABLE IF NOT EXISTS activity_block_relations (
    "Id" uuid NOT NULL PRIMARY KEY,
    "BlockVersionId" uuid NOT NULL,
    "StickerVersionId" uuid NOT NULL,
    "Role" character varying(40) NOT NULL DEFAULT 'primary',
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_activity_block_relations_block_versions_BlockVersionId"
        FOREIGN KEY ("BlockVersionId") REFERENCES block_versions ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_activity_block_relations_sticker_versions_StickerVersionId"
        FOREIGN KEY ("StickerVersionId") REFERENCES sticker_versions ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_activity_block_relations_Version_Sort"
    ON activity_block_relations ("BlockVersionId", "SortOrder");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS activity_block_relations;
DROP INDEX IF EXISTS "IX_block_versions_one_draft_per_block";
DROP INDEX IF EXISTS "IX_block_versions_Block_Version";
DROP TABLE IF EXISTS block_versions;
DROP TABLE IF EXISTS blocks;
""");
    }
}
