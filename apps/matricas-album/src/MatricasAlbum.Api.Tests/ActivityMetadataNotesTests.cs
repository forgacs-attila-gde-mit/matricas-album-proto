using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// Task 3.1: the structured activity-metadata columns are additive and nullable.
public class StickerVersionMetadataTests
{
    private static AlbumDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"sticker-meta-{Guid.NewGuid()}")
            .Options);

    [Fact]
    public async Task Metadata_columns_default_to_null_when_unset()
    {
        await using var db = NewDb();
        var resourceId = Guid.NewGuid();
        db.StickerResources.Add(new StickerResource
        {
            Id = resourceId,
            Title = "Legacy activity",
            Versions = [new StickerVersion { StickerResourceId = resourceId, VersionNumber = 1, Title = "Legacy activity" }],
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var loaded = await db.StickerVersions.SingleAsync();
        Assert.Null(loaded.Subject);
        Assert.Null(loaded.GradeLevel);
        Assert.Null(loaded.EstimatedMinutes);
        Assert.Null(loaded.Modality);
        Assert.Null(loaded.GroupSize);
        Assert.Null(loaded.ContextMode);
        Assert.Null(loaded.CompetenciesJson);
        Assert.Null(loaded.NatReferencesJson);
    }

    [Fact]
    public async Task Structured_metadata_round_trips()
    {
        await using var db = NewDb();
        var resourceId = Guid.NewGuid();
        db.StickerResources.Add(new StickerResource
        {
            Id = resourceId,
            Title = "Rich activity",
            Versions =
            [
                new StickerVersion
                {
                    StickerResourceId = resourceId, VersionNumber = 1, Title = "Rich activity",
                    Subject = "Matematika", GradeLevel = "8. évfolyam", EstimatedMinutes = 30,
                    Modality = "kutatas", GroupSize = "csoportos", ContextMode = "iskola",
                    CompetenciesJson = "[\"érvelés\",\"mérés\"]", NatReferencesJson = "[\"1.2\"]",
                },
            ],
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var loaded = await db.StickerVersions.SingleAsync();
        Assert.Equal("Matematika", loaded.Subject);
        Assert.Equal(30, loaded.EstimatedMinutes);
        Assert.Equal("csoportos", loaded.GroupSize);
        Assert.Contains("érvelés", loaded.CompetenciesJson);
    }
}

// REFACTOR-001 Task 3.1: when activity metadata used to be serialized into teacher-step
// note lines (the create drawer's "Tervezési meta: …", "Kompetenciák: …",
// "NAT-kapcsolódás: …"), this parser lifts it back into structured fields and leaves the
// genuine pedagogical steps untouched. No data is lost.
public class ActivityMetadataNotesTests
{
    [Fact]
    public void Parse_extracts_known_metadata_lines_and_keeps_real_steps()
    {
        string[] steps =
        [
            "Tevékenységtípus: Kísérletező",
            "Tervezési meta: Matematika / 8. évfolyam",
            "Kompetenciák: érvelés, mérés, becslés",
            "NAT-kapcsolódás: 1.2, 3.4",
            "Mutasd be a célt.",
            "Zárd reflexióval.",
        ];

        var (fields, remaining) = ActivityMetadataNotes.Parse(steps);

        Assert.Equal("Matematika", fields.Subject);
        Assert.Equal("8. évfolyam", fields.GradeLevel);
        Assert.Equal(new[] { "érvelés", "mérés", "becslés" }, fields.Competencies);
        Assert.Equal(new[] { "1.2", "3.4" }, fields.NatReferences);
        // The Tevékenységtípus line is already structured (Phase 2) and the real steps stay.
        Assert.Equal(new[] { "Mutasd be a célt.", "Zárd reflexióval." }, remaining);
    }

    [Fact]
    public void Parse_with_no_metadata_lines_returns_empty_fields_and_all_steps()
    {
        string[] steps = ["Mutasd be a célt.", "Adj választási lehetőséget."];

        var (fields, remaining) = ActivityMetadataNotes.Parse(steps);

        Assert.Null(fields.Subject);
        Assert.Null(fields.GradeLevel);
        Assert.Empty(fields.Competencies);
        Assert.Empty(fields.NatReferences);
        Assert.Equal(steps, remaining);
    }

    [Fact]
    public void Parse_ignores_blank_metadata_values_and_trims()
    {
        string[] steps = ["Tervezési meta:   ", "Kompetenciák:  érvelés ,  ,  mérés "];

        var (fields, _) = ActivityMetadataNotes.Parse(steps);

        Assert.Null(fields.Subject);
        Assert.Null(fields.GradeLevel);
        Assert.Equal(new[] { "érvelés", "mérés" }, fields.Competencies);
    }
}
