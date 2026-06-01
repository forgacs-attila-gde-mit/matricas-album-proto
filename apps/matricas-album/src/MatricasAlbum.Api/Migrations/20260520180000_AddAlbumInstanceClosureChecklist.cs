using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520180000_AddAlbumInstanceClosureChecklist")]
public partial class AddAlbumInstanceClosureChecklist : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Per-instance closure checklist items. v1 ships with a fixed seed set and a Done toggle;
        // teacher-editable item lists (add/remove/reorder) tracked as a follow-up.
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS album_instance_closure_checklist_items (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL,
    "SortOrder" integer NOT NULL,
    "Label" varchar(240) NOT NULL,
    "Done" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_album_instance_closure_checklist_items_album_instances_AlbumInstanceId"
        FOREIGN KEY ("AlbumInstanceId") REFERENCES album_instances ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_album_instance_closure_checklist_items_AlbumInstanceId"
    ON album_instance_closure_checklist_items ("AlbumInstanceId");

-- Backfill: seed the seven default items for every existing AlbumInstance that doesn't
-- already have any checklist rows. New instances get the same seeds at create time
-- via Program.cs (see POST /album-templates/{id}/instances).
INSERT INTO album_instance_closure_checklist_items ("Id", "AlbumInstanceId", "SortOrder", "Label", "Done")
SELECT gen_random_uuid(), i."Id", seed."sort_order", seed."label", FALSE
FROM album_instances i
CROSS JOIN (
    VALUES
        (1, 'Iskolavezetés meghívva'),
        (2, 'Próbabemutató megtartva'),
        (3, 'Makett kész'),
        (4, 'Bizonyítékokra épülő érvelés a diákban'),
        (5, 'Reflexiók beérkeztek minden csapattól'),
        (6, 'Iskolavezetés visszajelzése rögzítve'),
        (7, 'Hosszú távú javaslatok továbbítva')
) AS seed("sort_order", "label")
WHERE NOT EXISTS (
    SELECT 1 FROM album_instance_closure_checklist_items c WHERE c."AlbumInstanceId" = i."Id"
);
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP INDEX IF EXISTS "IX_album_instance_closure_checklist_items_AlbumInstanceId";
DROP TABLE IF EXISTS album_instance_closure_checklist_items;
""");
    }
}
