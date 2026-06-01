using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260520120000_AddAlbumTemplateVersioning")]
public partial class AddAlbumTemplateVersioning : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE album_templates
    ADD COLUMN IF NOT EXISTS "ArchivedAt" timestamp with time zone NULL;

CREATE TABLE IF NOT EXISTS album_template_versions (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateId" uuid NOT NULL REFERENCES album_templates("Id") ON DELETE CASCADE,
    "VersionNumber" integer NOT NULL,
    "Title" character varying(160) NOT NULL,
    "Subject" character varying(120) NOT NULL,
    "Grade" character varying(80) NOT NULL,
    "Duration" character varying(80) NOT NULL,
    "DrivingQuestion" text NOT NULL,
    "FinalProduct" text NOT NULL,
    "Audience" character varying(240) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_versions_AlbumTemplateId_VersionNumber"
    ON album_template_versions ("AlbumTemplateId", "VersionNumber");

CREATE TABLE IF NOT EXISTS album_template_version_dispositions (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateVersionId" uuid NOT NULL REFERENCES album_template_versions("Id") ON DELETE CASCADE,
    "Name" character varying(80) NOT NULL,
    "SortOrder" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_version_dispositions_AlbumTemplateVersionId_SortOrder"
    ON album_template_version_dispositions ("AlbumTemplateVersionId", "SortOrder");

CREATE TABLE IF NOT EXISTS album_template_version_week_plans (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateVersionId" uuid NOT NULL REFERENCES album_template_versions("Id") ON DELETE CASCADE,
    "WeekNumber" integer NOT NULL,
    "Title" character varying(160) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_version_week_plans_AlbumTemplateVersionId_WeekNumber"
    ON album_template_version_week_plans ("AlbumTemplateVersionId", "WeekNumber");

CREATE TABLE IF NOT EXISTS album_template_version_stickers (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateVersionId" uuid NOT NULL REFERENCES album_template_versions("Id") ON DELETE CASCADE,
    "StickerVersionId" uuid NOT NULL REFERENCES sticker_versions("Id") ON DELETE RESTRICT,
    "Week" integer NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_version_stickers_AlbumTemplateVersionId_Week_SortOrder"
    ON album_template_version_stickers ("AlbumTemplateVersionId", "Week", "SortOrder");

INSERT INTO album_template_versions (
    "Id", "AlbumTemplateId", "VersionNumber", "Title", "Subject", "Grade", "Duration",
    "DrivingQuestion", "FinalProduct", "Audience", "CreatedAt"
)
SELECT gen_random_uuid(), t."Id", 1, t."Title", t."Subject", t."Grade", t."Duration",
       t."DrivingQuestion", t."FinalProduct", t."Audience", t."CreatedAt"
FROM album_templates t
WHERE NOT EXISTS (
    SELECT 1 FROM album_template_versions v WHERE v."AlbumTemplateId" = t."Id"
);

INSERT INTO album_template_version_dispositions ("Id", "AlbumTemplateVersionId", "Name", "SortOrder")
SELECT gen_random_uuid(), v."Id", d."Name", d."SortOrder"
FROM template_dispositions d
JOIN album_template_versions v ON v."AlbumTemplateId" = d."AlbumTemplateId" AND v."VersionNumber" = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM album_template_version_dispositions existing
    WHERE existing."AlbumTemplateVersionId" = v."Id"
      AND existing."SortOrder" = d."SortOrder"
);

INSERT INTO album_template_version_week_plans ("Id", "AlbumTemplateVersionId", "WeekNumber", "Title")
SELECT gen_random_uuid(), v."Id", w."WeekNumber", w."Title"
FROM template_week_plans w
JOIN album_template_versions v ON v."AlbumTemplateId" = w."AlbumTemplateId" AND v."VersionNumber" = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM album_template_version_week_plans existing
    WHERE existing."AlbumTemplateVersionId" = v."Id"
      AND existing."WeekNumber" = w."WeekNumber"
);

INSERT INTO album_template_version_stickers ("Id", "AlbumTemplateVersionId", "StickerVersionId", "Week", "SortOrder", "AddedAt")
SELECT s."Id", v."Id", s."StickerVersionId", s."Week", s."SortOrder", s."AddedAt"
FROM album_template_stickers s
JOIN album_template_versions v ON v."AlbumTemplateId" = s."AlbumTemplateId" AND v."VersionNumber" = 1
ON CONFLICT ("Id") DO NOTHING;

ALTER TABLE album_instances
    ADD COLUMN IF NOT EXISTS "AlbumTemplateVersionId" uuid NULL;

UPDATE album_instances i
SET "AlbumTemplateVersionId" = v."Id"
FROM album_template_versions v
WHERE i."AlbumTemplateVersionId" IS NULL
  AND v."AlbumTemplateId" = i."AlbumTemplateId"
  AND v."VersionNumber" = 1;

ALTER TABLE album_instances
    ALTER COLUMN "AlbumTemplateVersionId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_album_instances_album_template_versions_AlbumTemplateVersionId'
    ) THEN
        ALTER TABLE album_instances
            ADD CONSTRAINT "FK_album_instances_album_template_versions_AlbumTemplateVersionId"
            FOREIGN KEY ("AlbumTemplateVersionId") REFERENCES album_template_versions("Id") ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_album_instances_AlbumTemplateVersionId"
    ON album_instances ("AlbumTemplateVersionId");

ALTER TABLE instance_stickers
    ADD COLUMN IF NOT EXISTS "AlbumTemplateVersionStickerId" uuid NULL;

UPDATE instance_stickers s
SET "AlbumTemplateVersionStickerId" = s."AlbumTemplateStickerId"
WHERE s."AlbumTemplateVersionStickerId" IS NULL
  AND s."AlbumTemplateStickerId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM album_template_version_stickers version_sticker
    WHERE version_sticker."Id" = s."AlbumTemplateStickerId"
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_instance_stickers_album_template_version_stickers_AlbumTemplateVersionStickerId'
    ) THEN
        ALTER TABLE instance_stickers
            ADD CONSTRAINT "FK_instance_stickers_album_template_version_stickers_AlbumTemplateVersionStickerId"
            FOREIGN KEY ("AlbumTemplateVersionStickerId") REFERENCES album_template_version_stickers("Id") ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_instance_stickers_AlbumTemplateVersionStickerId"
    ON instance_stickers ("AlbumTemplateVersionStickerId");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
ALTER TABLE instance_stickers
    DROP CONSTRAINT IF EXISTS "FK_instance_stickers_album_template_version_stickers_AlbumTemplateVersionStickerId";

ALTER TABLE instance_stickers
    DROP COLUMN IF EXISTS "AlbumTemplateVersionStickerId";

ALTER TABLE album_instances
    DROP CONSTRAINT IF EXISTS "FK_album_instances_album_template_versions_AlbumTemplateVersionId";

ALTER TABLE album_instances
    DROP COLUMN IF EXISTS "AlbumTemplateVersionId";

DROP TABLE IF EXISTS album_template_version_stickers;
DROP TABLE IF EXISTS album_template_version_week_plans;
DROP TABLE IF EXISTS album_template_version_dispositions;
DROP TABLE IF EXISTS album_template_versions;

ALTER TABLE album_templates
    DROP COLUMN IF EXISTS "ArchivedAt";
""");
    }
}
