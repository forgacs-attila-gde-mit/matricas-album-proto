using MatricasAlbum.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MatricasAlbum.Api.Migrations;

/// <inheritdoc />
[DbContext(typeof(AlbumDbContext))]
[Migration("20260517120000_InitialCreate")]
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS sticker_resources (
    "Id" uuid PRIMARY KEY,
    "Title" character varying(180) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS sticker_versions (
    "Id" uuid PRIMARY KEY,
    "StickerResourceId" uuid NOT NULL REFERENCES sticker_resources("Id") ON DELETE CASCADE,
    "VersionNumber" integer NOT NULL,
    "Title" character varying(180) NOT NULL,
    "Phase" character varying(40) NOT NULL,
    "ShortDescription" text NOT NULL,
    "StudentInstruction" text NOT NULL,
    "StudentChoice" text NOT NULL,
    "ExpectedProduct" text NOT NULL,
    "EvidenceTypeLabel" character varying(120) NOT NULL,
    "ReflectionPrompt" text NOT NULL,
    "BPlan" text NOT NULL,
    "LowResource" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS sticker_version_teacher_steps (
    "Id" uuid PRIMARY KEY,
    "StickerVersionId" uuid NOT NULL REFERENCES sticker_versions("Id") ON DELETE CASCADE,
    "SortOrder" integer NOT NULL,
    "Text" text NOT NULL
);

CREATE TABLE IF NOT EXISTS album_templates (
    "Id" uuid PRIMARY KEY,
    "Title" character varying(160) NOT NULL,
    "Subject" character varying(120) NOT NULL,
    "Grade" character varying(80) NOT NULL,
    "Duration" character varying(80) NOT NULL,
    "DrivingQuestion" text NOT NULL,
    "FinalProduct" text NOT NULL,
    "Audience" character varying(240) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS template_dispositions (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateId" uuid NOT NULL REFERENCES album_templates("Id") ON DELETE CASCADE,
    "Name" character varying(80) NOT NULL,
    "SortOrder" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS template_week_plans (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateId" uuid NOT NULL REFERENCES album_templates("Id") ON DELETE CASCADE,
    "WeekNumber" integer NOT NULL,
    "Title" character varying(160) NOT NULL
);

CREATE TABLE IF NOT EXISTS album_template_stickers (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateId" uuid NOT NULL REFERENCES album_templates("Id") ON DELETE CASCADE,
    "StickerVersionId" uuid NOT NULL REFERENCES sticker_versions("Id") ON DELETE RESTRICT,
    "Week" integer NOT NULL,
    "SortOrder" integer NOT NULL,
    "AddedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS album_instances (
    "Id" uuid PRIMARY KEY,
    "AlbumTemplateId" uuid NOT NULL REFERENCES album_templates("Id") ON DELETE RESTRICT,
    "Title" character varying(180) NOT NULL,
    "ClassName" character varying(120) NOT NULL,
    "CurrentWeek" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS instance_stickers (
    "Id" uuid PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL REFERENCES album_instances("Id") ON DELETE CASCADE,
    "AlbumTemplateStickerId" uuid NULL REFERENCES album_template_stickers("Id") ON DELETE SET NULL,
    "StickerVersionId" uuid NOT NULL REFERENCES sticker_versions("Id") ON DELETE RESTRICT,
    "Week" integer NOT NULL,
    "SortOrder" integer NOT NULL,
    "State" character varying(40) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    "Id" uuid PRIMARY KEY,
    "AlbumInstanceId" uuid NOT NULL REFERENCES album_instances("Id") ON DELETE CASCADE,
    "Name" character varying(120) NOT NULL,
    "Focus" character varying(180) NOT NULL,
    "Color" character varying(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    "Id" uuid PRIMARY KEY,
    "TeamId" uuid NOT NULL REFERENCES teams("Id") ON DELETE CASCADE,
    "Name" character varying(80) NOT NULL,
    "SortOrder" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
    "Id" uuid PRIMARY KEY,
    "InstanceStickerId" uuid NOT NULL REFERENCES instance_stickers("Id") ON DELETE CASCADE,
    "TeamId" uuid NOT NULL REFERENCES teams("Id") ON DELETE CASCADE,
    "Type" character varying(40) NOT NULL,
    "Status" character varying(40) NOT NULL,
    "Title" character varying(200) NOT NULL,
    "SubmittedBy" character varying(120) NOT NULL,
    "SubmittedAt" timestamp with time zone NOT NULL,
    "Description" text NOT NULL,
    "HelpRequest" text NULL,
    "Reflection" text NULL,
    "TeacherFeedback" text NULL,
    "FeedbackAt" timestamp with time zone NULL
);

CREATE TABLE IF NOT EXISTS quality_dimensions (
    "Id" uuid PRIMARY KEY,
    "OwnerType" character varying(40) NOT NULL,
    "OwnerId" uuid NOT NULL,
    "Code" character varying(40) NOT NULL,
    "Label" character varying(120) NOT NULL,
    "Score" integer NOT NULL,
    "State" character varying(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS quality_dimension_changes (
    "Id" uuid PRIMARY KEY,
    "QualityDimensionId" uuid NOT NULL REFERENCES quality_dimensions("Id") ON DELETE CASCADE,
    "TriggerType" character varying(80) NOT NULL,
    "TriggerId" uuid NULL,
    "PreviousScore" integer NOT NULL,
    "NewScore" integer NOT NULL,
    "PreviousState" character varying(40) NOT NULL,
    "NewState" character varying(40) NOT NULL,
    "Reason" character varying(500) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_notes (
    "Id" uuid PRIMARY KEY,
    "OwnerType" character varying(40) NOT NULL,
    "OwnerId" uuid NOT NULL,
    "TargetType" character varying(40) NOT NULL,
    "TargetId" uuid NULL,
    "TargetKey" character varying(80) NULL,
    "Kind" character varying(40) NOT NULL,
    "Label" character varying(180) NOT NULL,
    "Severity" character varying(40) NOT NULL,
    "Message" text NOT NULL,
    "Recommendation" text NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_advice_runs (
    "Id" uuid PRIMARY KEY,
    "Audience" character varying(40) NOT NULL,
    "OwnerType" character varying(40) NOT NULL,
    "OwnerId" uuid NOT NULL,
    "TargetType" character varying(40) NULL,
    "TargetId" uuid NULL,
    "TargetKey" character varying(80) NULL,
    "SnapshotHash" character varying(80) NOT NULL,
    "Status" character varying(40) NOT NULL,
    "Error" text NULL,
    "Model" character varying(80) NULL,
    "PromptVersion" character varying(80) NOT NULL,
    "ProjectionVersion" character varying(120) NOT NULL,
    "StartedAt" timestamp with time zone NOT NULL,
    "CompletedAt" timestamp with time zone NULL
);

CREATE TABLE IF NOT EXISTS ai_advices (
    "Id" uuid PRIMARY KEY,
    "RunId" uuid NULL REFERENCES ai_advice_runs("Id") ON DELETE SET NULL,
    "Audience" character varying(40) NOT NULL,
    "OwnerType" character varying(40) NOT NULL,
    "OwnerId" uuid NOT NULL,
    "TargetType" character varying(40) NOT NULL,
    "TargetId" uuid NULL,
    "TargetKey" character varying(80) NULL,
    "Kind" character varying(40) NOT NULL,
    "Severity" character varying(40) NOT NULL,
    "Status" character varying(40) NOT NULL,
    "Message" text NOT NULL,
    "Recommendation" text NULL,
    "QuestionsJson" jsonb NOT NULL,
    "CitationsJson" jsonb NOT NULL,
    "ActionType" character varying(80) NULL,
    "ActionLabel" character varying(180) NULL,
    "ActionPayloadJson" jsonb NULL,
    "Model" character varying(80) NULL,
    "PromptVersion" character varying(80) NOT NULL,
    "ProjectionVersion" character varying(120) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "AppliedAt" timestamp with time zone NULL
);

CREATE TABLE IF NOT EXISTS seed_markers (
    "Id" character varying(120) PRIMARY KEY,
    "CompletedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_sticker_versions_StickerResourceId_VersionNumber" ON sticker_versions ("StickerResourceId", "VersionNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_sticker_version_teacher_steps_StickerVersionId_SortOrder" ON sticker_version_teacher_steps ("StickerVersionId", "SortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_template_dispositions_AlbumTemplateId_SortOrder" ON template_dispositions ("AlbumTemplateId", "SortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_template_week_plans_AlbumTemplateId_WeekNumber" ON template_week_plans ("AlbumTemplateId", "WeekNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_album_template_stickers_AlbumTemplateId_Week_SortOrder" ON album_template_stickers ("AlbumTemplateId", "Week", "SortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_instance_stickers_AlbumInstanceId_Week_SortOrder" ON instance_stickers ("AlbumInstanceId", "Week", "SortOrder");
CREATE INDEX IF NOT EXISTS "IX_evidence_InstanceStickerId_Status" ON evidence ("InstanceStickerId", "Status");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_quality_dimensions_OwnerType_OwnerId_Code" ON quality_dimensions ("OwnerType", "OwnerId", "Code");
CREATE INDEX IF NOT EXISTS "IX_quality_dimension_changes_QualityDimensionId_CreatedAt" ON quality_dimension_changes ("QualityDimensionId", "CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_ai_notes_OwnerType_OwnerId" ON ai_notes ("OwnerType", "OwnerId");
CREATE INDEX IF NOT EXISTS "IX_ai_notes_OwnerType_OwnerId_TargetType_TargetId" ON ai_notes ("OwnerType", "OwnerId", "TargetType", "TargetId");
CREATE INDEX IF NOT EXISTS "IX_ai_notes_OwnerType_OwnerId_TargetType_TargetKey" ON ai_notes ("OwnerType", "OwnerId", "TargetType", "TargetKey");
CREATE INDEX IF NOT EXISTS "IX_ai_advice_runs_OwnerType_OwnerId_Audience_StartedAt" ON ai_advice_runs ("OwnerType", "OwnerId", "Audience", "StartedAt");
CREATE INDEX IF NOT EXISTS "IX_ai_advices_OwnerType_OwnerId_Audience_Status" ON ai_advices ("OwnerType", "OwnerId", "Audience", "Status");
CREATE INDEX IF NOT EXISTS "IX_ai_advices_OwnerType_OwnerId_TargetType_TargetId" ON ai_advices ("OwnerType", "OwnerId", "TargetType", "TargetId");
CREATE INDEX IF NOT EXISTS "IX_ai_advices_OwnerType_OwnerId_TargetType_TargetKey" ON ai_advices ("OwnerType", "OwnerId", "TargetType", "TargetKey");
""");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS seed_markers;
DROP TABLE IF EXISTS ai_advices;
DROP TABLE IF EXISTS ai_advice_runs;
DROP TABLE IF EXISTS ai_notes;
DROP TABLE IF EXISTS quality_dimension_changes;
DROP TABLE IF EXISTS quality_dimensions;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS instance_stickers;
DROP TABLE IF EXISTS album_instances;
DROP TABLE IF EXISTS album_template_stickers;
DROP TABLE IF EXISTS template_week_plans;
DROP TABLE IF EXISTS template_dispositions;
DROP TABLE IF EXISTS album_templates;
DROP TABLE IF EXISTS sticker_version_teacher_steps;
DROP TABLE IF EXISTS sticker_versions;
DROP TABLE IF EXISTS sticker_resources;
""");
    }
}
