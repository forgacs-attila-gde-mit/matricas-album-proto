using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520130000_AddAlbumTemplateVersionIsDraft")]
public partial class AddAlbumTemplateVersionIsDraft : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE album_template_versions
    ADD COLUMN IF NOT EXISTS "IsDraft" boolean NOT NULL DEFAULT FALSE;

-- Drafts must never collide with the published version number sequence. We treat
-- drafts as living "above" the latest published version while pending; the partial
-- unique index below enforces "at most one draft per template" at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_versions_one_draft_per_template"
    ON album_template_versions ("AlbumTemplateId")
    WHERE "IsDraft" = TRUE;
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP INDEX IF EXISTS "IX_album_template_versions_one_draft_per_template";
ALTER TABLE album_template_versions DROP COLUMN IF EXISTS "IsDraft";
""");
    }
}
