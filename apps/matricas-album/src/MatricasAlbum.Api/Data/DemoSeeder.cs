using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace MatricasAlbum.Api.Data;

public static class DemoSeeder
{
    public const string SeedMarkerId = "demo-seed-v1";
    public const string MethodPatternSeedMarkerId = "method-pattern-seed-v1";

    public static readonly Guid TemplateId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid TemplateVersionId = Guid.Parse("12000000-0000-0000-0000-000000000001");
    public static readonly Guid InstanceId = Guid.Parse("11000000-0000-0000-0000-000000000001");
    public static readonly Guid ProductiveFailureTemplateId = Guid.Parse("10000000-0000-0000-0000-000000000101");
    public static readonly Guid ProductiveFailureTemplateVersionId = Guid.Parse("12000000-0000-0000-0000-000000000101");
    public static readonly Guid InquiryTemplateId = Guid.Parse("10000000-0000-0000-0000-000000000201");
    public static readonly Guid InquiryTemplateVersionId = Guid.Parse("12000000-0000-0000-0000-000000000201");

    public static readonly Guid ObservationResourceId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    public static readonly Guid PerspectiveResourceId = Guid.Parse("20000000-0000-0000-0000-000000000002");
    public static readonly Guid MeasurementResourceId = Guid.Parse("20000000-0000-0000-0000-000000000003");
    public static readonly Guid PresentationResourceId = Guid.Parse("20000000-0000-0000-0000-000000000004");
    public static readonly Guid MeasurementBasicsResourceId = Guid.Parse("20000000-0000-0000-0000-000000000005");
    public static readonly Guid ProductiveFailureChallengeResourceId = Guid.Parse("20000000-0000-0000-0000-000000000101");
    public static readonly Guid ProductiveFailureFirstStrategyResourceId = Guid.Parse("20000000-0000-0000-0000-000000000102");
    public static readonly Guid ProductiveFailureDeadEndResourceId = Guid.Parse("20000000-0000-0000-0000-000000000103");
    public static readonly Guid ProductiveFailureConsolidationResourceId = Guid.Parse("20000000-0000-0000-0000-000000000104");
    public static readonly Guid ProductiveFailureRetryResourceId = Guid.Parse("20000000-0000-0000-0000-000000000105");
    public static readonly Guid InquiryQuestionResourceId = Guid.Parse("20000000-0000-0000-0000-000000000201");
    public static readonly Guid InquiryHypothesisResourceId = Guid.Parse("20000000-0000-0000-0000-000000000202");
    public static readonly Guid InquiryDataResourceId = Guid.Parse("20000000-0000-0000-0000-000000000203");
    public static readonly Guid InquiryClaimResourceId = Guid.Parse("20000000-0000-0000-0000-000000000204");
    public static readonly Guid InquiryEvidenceResourceId = Guid.Parse("20000000-0000-0000-0000-000000000205");
    public static readonly Guid InquiryReasoningResourceId = Guid.Parse("20000000-0000-0000-0000-000000000206");
    public static readonly Guid InquiryRevisionResourceId = Guid.Parse("20000000-0000-0000-0000-000000000207");

    public static readonly Guid ObservationVersionId = Guid.Parse("21000000-0000-0000-0000-000000000001");
    public static readonly Guid PerspectiveVersionId = Guid.Parse("21000000-0000-0000-0000-000000000002");
    public static readonly Guid MeasurementVersionId = Guid.Parse("21000000-0000-0000-0000-000000000003");
    public static readonly Guid PresentationVersionId = Guid.Parse("21000000-0000-0000-0000-000000000004");
    public static readonly Guid MeasurementBasicsVersionId = Guid.Parse("21000000-0000-0000-0000-000000000005");
    public static readonly Guid ProductiveFailureChallengeVersionId = Guid.Parse("21000000-0000-0000-0000-000000000101");
    public static readonly Guid ProductiveFailureFirstStrategyVersionId = Guid.Parse("21000000-0000-0000-0000-000000000102");
    public static readonly Guid ProductiveFailureDeadEndVersionId = Guid.Parse("21000000-0000-0000-0000-000000000103");
    public static readonly Guid ProductiveFailureConsolidationVersionId = Guid.Parse("21000000-0000-0000-0000-000000000104");
    public static readonly Guid ProductiveFailureRetryVersionId = Guid.Parse("21000000-0000-0000-0000-000000000105");
    public static readonly Guid InquiryQuestionVersionId = Guid.Parse("21000000-0000-0000-0000-000000000201");
    public static readonly Guid InquiryHypothesisVersionId = Guid.Parse("21000000-0000-0000-0000-000000000202");
    public static readonly Guid InquiryDataVersionId = Guid.Parse("21000000-0000-0000-0000-000000000203");
    public static readonly Guid InquiryClaimVersionId = Guid.Parse("21000000-0000-0000-0000-000000000204");
    public static readonly Guid InquiryEvidenceVersionId = Guid.Parse("21000000-0000-0000-0000-000000000205");
    public static readonly Guid InquiryReasoningVersionId = Guid.Parse("21000000-0000-0000-0000-000000000206");
    public static readonly Guid InquiryRevisionVersionId = Guid.Parse("21000000-0000-0000-0000-000000000207");

    public static readonly Guid TemplateObservationStickerId = Guid.Parse("22000000-0000-0000-0000-000000000001");
    public static readonly Guid TemplatePerspectiveStickerId = Guid.Parse("22000000-0000-0000-0000-000000000002");
    public static readonly Guid TemplateMeasurementStickerId = Guid.Parse("22000000-0000-0000-0000-000000000003");
    public static readonly Guid TemplatePresentationStickerId = Guid.Parse("22000000-0000-0000-0000-000000000004");
    public static readonly Guid ProductiveFailureChallengeStickerId = Guid.Parse("22000000-0000-0000-0000-000000000101");
    public static readonly Guid ProductiveFailureFirstStrategyStickerId = Guid.Parse("22000000-0000-0000-0000-000000000102");
    public static readonly Guid ProductiveFailureDeadEndStickerId = Guid.Parse("22000000-0000-0000-0000-000000000103");
    public static readonly Guid ProductiveFailureConsolidationStickerId = Guid.Parse("22000000-0000-0000-0000-000000000104");
    public static readonly Guid ProductiveFailureRetryStickerId = Guid.Parse("22000000-0000-0000-0000-000000000105");
    public static readonly Guid InquiryQuestionStickerId = Guid.Parse("22000000-0000-0000-0000-000000000201");
    public static readonly Guid InquiryHypothesisStickerId = Guid.Parse("22000000-0000-0000-0000-000000000202");
    public static readonly Guid InquiryDataStickerId = Guid.Parse("22000000-0000-0000-0000-000000000203");
    public static readonly Guid InquiryClaimStickerId = Guid.Parse("22000000-0000-0000-0000-000000000204");
    public static readonly Guid InquiryEvidenceStickerId = Guid.Parse("22000000-0000-0000-0000-000000000205");
    public static readonly Guid InquiryReasoningStickerId = Guid.Parse("22000000-0000-0000-0000-000000000206");
    public static readonly Guid InquiryRevisionStickerId = Guid.Parse("22000000-0000-0000-0000-000000000207");

    public static readonly Guid InstanceObservationStickerId = Guid.Parse("23000000-0000-0000-0000-000000000001");
    public static readonly Guid InstancePerspectiveStickerId = Guid.Parse("23000000-0000-0000-0000-000000000002");
    public static readonly Guid InstanceMeasurementStickerId = Guid.Parse("23000000-0000-0000-0000-000000000003");
    public static readonly Guid InstancePresentationStickerId = Guid.Parse("23000000-0000-0000-0000-000000000004");

    public static readonly Guid TeamShadeId = Guid.Parse("30000000-0000-0000-0000-000000000001");
    public static readonly Guid TeamStonesId = Guid.Parse("30000000-0000-0000-0000-000000000002");
    public static readonly Guid TeamCloudsId = Guid.Parse("30000000-0000-0000-0000-000000000003");
    public static readonly Guid TeamWaterId = Guid.Parse("30000000-0000-0000-0000-000000000004");

    public static async Task SeedAsync(AlbumDbContext db, CancellationToken cancellationToken = default)
    {
        // Reference data (the closed Tevékenységtípus taxonomy) is ensured on every boot,
        // independent of the demo-content seed marker.
        await SeedActivityTypesAsync(db, cancellationToken);
        await SeedDemoContentAsync(db, cancellationToken);
        // Classify the seeded matricas (dominant Tevékenységtípus) so the Matricatár type filter
        // returns results. Idempotent (fills nulls only); runs after content seeding in every path.
        await BackfillSeededActivityTypesAsync(db, cancellationToken);
    }

    private static async Task SeedDemoContentAsync(AlbumDbContext db, CancellationToken cancellationToken)
    {
        if (await db.SeedMarkers.AnyAsync(marker => marker.Id == SeedMarkerId, cancellationToken))
        {
            await SeedMethodPatternTemplatesAsync(db, cancellationToken);
            return;
        }

        await using (var transaction = await db.Database.BeginTransactionAsync(cancellationToken))
        {
            if (await db.SeedMarkers.AnyAsync(marker => marker.Id == SeedMarkerId, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                await SeedMethodPatternTemplatesAsync(db, cancellationToken);
                return;
            }

            if (await db.StickerResources.AnyAsync(cancellationToken))
            {
                db.SeedMarkers.Add(new SeedMarker { Id = SeedMarkerId, CompletedAt = DateTimeOffset.UtcNow });
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                await SeedMethodPatternTemplatesAsync(db, cancellationToken);
                return;
            }

            SeedFreshDemo(db);

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        await SeedMethodPatternTemplatesAsync(db, cancellationToken);
    }

    // Ensures the six system-defined activity types exist. Idempotent: only inserts keys
    // that are missing, so calling it repeatedly leaves exactly six rows. Reference data is
    // never removed by the demo resets (DeleteAllDemoDataAsync leaves activity_types alone).
    public static async Task SeedActivityTypesAsync(AlbumDbContext db, CancellationToken cancellationToken = default)
    {
        var catalog = ActivityTypeCatalog.Seed();
        var keys = catalog.Select(type => type.Key).ToList();
        var existing = (await db.ActivityTypes
                .Where(type => keys.Contains(type.Key))
                .Select(type => type.Key)
                .ToListAsync(cancellationToken))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var missing = catalog.Where(type => !existing.Contains(type.Key)).ToList();
        if (missing.Count == 0)
        {
            return;
        }

        db.ActivityTypes.AddRange(missing);
        await db.SaveChangesAsync(cancellationToken);
    }

    // Demo-content classification: each seeded matrica's dominant Tevékenységtípus, keyed by its
    // (fixed) StickerVersion id. All six types are represented so every Matricatár type-filter
    // chip returns results. This is demo authoring (a teacher/AI would classify the same way),
    // not an invented domain fact.
    public static readonly IReadOnlyDictionary<Guid, string> SeededActivityTypeAssignments =
        new Dictionary<Guid, string>
        {
            [ObservationVersionId] = ActivityTypeKeys.Explorer,
            [PerspectiveVersionId] = ActivityTypeKeys.Collaborator,
            [MeasurementVersionId] = ActivityTypeKeys.Experimenter,
            [PresentationVersionId] = ActivityTypeKeys.Communicator,
            [MeasurementBasicsVersionId] = ActivityTypeKeys.Experimenter,
            [ProductiveFailureChallengeVersionId] = ActivityTypeKeys.Explorer,
            [ProductiveFailureFirstStrategyVersionId] = ActivityTypeKeys.Processor,
            [ProductiveFailureDeadEndVersionId] = ActivityTypeKeys.Experimenter,
            [ProductiveFailureConsolidationVersionId] = ActivityTypeKeys.Processor,
            [ProductiveFailureRetryVersionId] = ActivityTypeKeys.Experimenter,
            [InquiryQuestionVersionId] = ActivityTypeKeys.Explorer,
            [InquiryHypothesisVersionId] = ActivityTypeKeys.Explorer,
            [InquiryDataVersionId] = ActivityTypeKeys.Experimenter,
            [InquiryClaimVersionId] = ActivityTypeKeys.Processor,
            [InquiryEvidenceVersionId] = ActivityTypeKeys.Processor,
            [InquiryReasoningVersionId] = ActivityTypeKeys.Communicator,
            [InquiryRevisionVersionId] = ActivityTypeKeys.Reflector,
        };

    // Fills in the dominant Tevékenységtípus on the known seeded matricas where it is still null.
    // Idempotent and non-destructive: never overwrites a teacher/AI-set type, only seeds missing
    // ones — so it fixes an already-running DB on the next boot without a destructive reset.
    public static async Task BackfillSeededActivityTypesAsync(AlbumDbContext db, CancellationToken cancellationToken = default)
    {
        var ids = SeededActivityTypeAssignments.Keys.ToList();
        var versions = await db.StickerVersions
            .Where(version => ids.Contains(version.Id) && version.ActivityTypeKey == null)
            .ToListAsync(cancellationToken);
        if (versions.Count == 0)
        {
            return;
        }

        foreach (var version in versions)
        {
            version.ActivityTypeKey = SeededActivityTypeAssignments[version.Id];
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    public static async Task ResetAsync(AlbumDbContext db, CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        await DeleteAllDemoDataAsync(db, cancellationToken);
        db.ChangeTracker.Clear();
        SeedFreshDemo(db);

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await SeedMethodPatternTemplatesAsync(db, cancellationToken);
        await BackfillSeededActivityTypesAsync(db, cancellationToken);
    }

    public static async Task ResetToEmptyAsync(AlbumDbContext db, CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        await DeleteAllDemoDataAsync(db, cancellationToken);
        db.ChangeTracker.Clear();
        db.SeedMarkers.Add(new SeedMarker { Id = SeedMarkerId, CompletedAt = DateTimeOffset.UtcNow });

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private static async Task DeleteAllDemoDataAsync(AlbumDbContext db, CancellationToken cancellationToken)
    {
        await db.AiAdvices.ExecuteDeleteAsync(cancellationToken);
        await db.AiAdviceRuns.ExecuteDeleteAsync(cancellationToken);
        await db.AiNotes.ExecuteDeleteAsync(cancellationToken);
        await db.QualityDimensionChanges.ExecuteDeleteAsync(cancellationToken);
        await db.QualityDimensions.ExecuteDeleteAsync(cancellationToken);
        await db.TeamHelpRequests.ExecuteDeleteAsync(cancellationToken);
        await db.AlbumInstanceTeamReflections.ExecuteDeleteAsync(cancellationToken);
        await db.InstanceStickerTeamProgress.ExecuteDeleteAsync(cancellationToken);
        await db.Evidence.ExecuteDeleteAsync(cancellationToken);
        await db.Set<TeamMember>().ExecuteDeleteAsync(cancellationToken);
        await db.Teams.ExecuteDeleteAsync(cancellationToken);
        await db.InstanceStickers.ExecuteDeleteAsync(cancellationToken);
        await db.AlbumInstances.ExecuteDeleteAsync(cancellationToken);
        await db.AlbumTemplateVersionStickers.ExecuteDeleteAsync(cancellationToken);
        await db.Set<AlbumTemplateVersionWeekPlan>().ExecuteDeleteAsync(cancellationToken);
        await db.Set<AlbumTemplateVersionDisposition>().ExecuteDeleteAsync(cancellationToken);
        await db.AlbumTemplateVersions.ExecuteDeleteAsync(cancellationToken);
        await db.AlbumTemplateStickers.ExecuteDeleteAsync(cancellationToken);
        await db.Set<TemplateWeekPlan>().ExecuteDeleteAsync(cancellationToken);
        await db.Set<TemplateDisposition>().ExecuteDeleteAsync(cancellationToken);
        await db.AlbumTemplates.ExecuteDeleteAsync(cancellationToken);
        await db.Set<StickerVersionTeacherStep>().ExecuteDeleteAsync(cancellationToken);
        await db.StickerVersions.ExecuteDeleteAsync(cancellationToken);
        await db.StickerResources.ExecuteDeleteAsync(cancellationToken);
        await db.SeedMarkers.ExecuteDeleteAsync(cancellationToken);
    }

    private static async Task SeedMethodPatternTemplatesAsync(AlbumDbContext db, CancellationToken cancellationToken)
    {
        if (await db.SeedMarkers.AnyAsync(marker => marker.Id == MethodPatternSeedMarkerId, cancellationToken))
        {
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        if (await db.SeedMarkers.AnyAsync(marker => marker.Id == MethodPatternSeedMarkerId, cancellationToken))
        {
            await transaction.RollbackAsync(cancellationToken);
            return;
        }

        await MarkGeneralTemplatePatternAsync(db, cancellationToken);
        await AddMissingPatternResourcesAsync(db, cancellationToken);

        if (!await db.AlbumTemplates.AnyAsync(template => template.Id == ProductiveFailureTemplateId, cancellationToken))
        {
            db.AlbumTemplates.Add(ProductiveFailureTemplate());
            db.QualityDimensions.AddRange(CreateTemplateQualityDimensions(ProductiveFailureTemplateId));
        }

        if (!await db.AlbumTemplates.AnyAsync(template => template.Id == InquiryTemplateId, cancellationToken))
        {
            db.AlbumTemplates.Add(InquiryTemplate());
            db.QualityDimensions.AddRange(CreateTemplateQualityDimensions(InquiryTemplateId));
        }

        db.SeedMarkers.Add(new SeedMarker { Id = MethodPatternSeedMarkerId, CompletedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private static async Task MarkGeneralTemplatePatternAsync(AlbumDbContext db, CancellationToken cancellationToken)
    {
        var template = await db.AlbumTemplates
            .Include(item => item.Versions)
            .SingleOrDefaultAsync(item => item.Id == TemplateId, cancellationToken);
        if (template is null)
        {
            return;
        }

        template.PatternKey = AlbumTemplatePatterns.General;
        template.PatternName = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General);
        template.PatternDescription = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General);
        foreach (var version in template.Versions)
        {
            version.PatternKey = AlbumTemplatePatterns.General;
            version.PatternName = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General);
            version.PatternDescription = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General);
        }
    }

    private static async Task AddMissingPatternResourcesAsync(AlbumDbContext db, CancellationToken cancellationToken)
    {
        var resources = PatternResources();
        var ids = resources.Select(resource => resource.Id).ToList();
        var existingIds = await db.StickerResources
            .Where(resource => ids.Contains(resource.Id))
            .Select(resource => resource.Id)
            .ToListAsync(cancellationToken);
        var existing = existingIds.ToHashSet();

        db.StickerResources.AddRange(resources.Where(resource => !existing.Contains(resource.Id)));
    }

    private static IReadOnlyList<StickerResource> PatternResources() =>
    [
        ProductiveFailureChallengeSticker(),
        ProductiveFailureFirstStrategySticker(),
        ProductiveFailureDeadEndSticker(),
        ProductiveFailureConsolidationSticker(),
        ProductiveFailureRetrySticker(),
        InquiryQuestionSticker(),
        InquiryHypothesisSticker(),
        InquiryDataSticker(),
        InquiryClaimSticker(),
        InquiryEvidenceSticker(),
        InquiryReasoningSticker(),
        InquiryRevisionSticker()
    ];

    private static AlbumTemplate ProductiveFailureTemplate()
    {
        var patternKey = AlbumTemplatePatterns.ProductiveFailure;
        return new AlbumTemplate
        {
            Id = ProductiveFailureTemplateId,
            Title = "Produktív hibázás album: Statisztikai átlagok nyomozása",
            Subject = "Matematika",
            Grade = "8. évfolyam",
            DurationType = DurationTypes.Phase,
            PatternKey = patternKey,
            PatternName = AlbumTemplatePatterns.Name(patternKey),
            PatternDescription = AlbumTemplatePatterns.Description(patternKey),
            DrivingQuestion = "Mikor igazságos egy átlag, és mikor vezet félre?",
            FinalProduct = "Csoportos mini-portfólió hibás első stratégiákkal, javított magyarázattal és új helyzetben alkalmazott átlagválasztással.",
            Audience = "Osztálytársak és matematika tanár",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-5),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            Versions =
            [
                new AlbumTemplateVersion
                {
                    Id = ProductiveFailureTemplateVersionId,
                    AlbumTemplateId = ProductiveFailureTemplateId,
                    VersionNumber = 1,
                    Title = "Produktív hibázás album: Statisztikai átlagok nyomozása",
                    Subject = "Matematika",
                    Grade = "8. évfolyam",
                    DurationType = DurationTypes.Phase,
                    PatternKey = patternKey,
                    PatternName = AlbumTemplatePatterns.Name(patternKey),
                    PatternDescription = AlbumTemplatePatterns.Description(patternKey),
                    DrivingQuestion = "Mikor igazságos egy átlag, és mikor vezet félre?",
                    FinalProduct = "Csoportos mini-portfólió hibás első stratégiákkal, javított magyarázattal és új helyzetben alkalmazott átlagválasztással.",
                    Audience = "Osztálytársak és matematika tanár",
                    ProjectReflectionPromptsJson = Prompts(
                        "Mit gondoltatok először az átlagokról, és mi bizonyult félrevezetőnek?",
                        "Melyik zsákutca segített abban, hogy pontosabb legyen a fogalom?",
                        "Mikor választanátok most számtani átlag helyett mediánt vagy más mutatót?"),
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-5),
                    Dispositions =
                    [
                        VersionDisposition("kíváncsiság", 1),
                        VersionDisposition("hibatűrés", 2),
                        VersionDisposition("stratégia-váltás", 3),
                        VersionDisposition("bizonyítás", 4),
                        VersionDisposition("reflexió", 5)
                    ],
                    Weeks =
                    [
                        VersionWeek(1, "Kihívó probléma"),
                        VersionWeek(2, "Próbálkozás és stratégiaépítés"),
                        VersionWeek(3, "Hibák láthatóvá tétele"),
                        VersionWeek(4, "Tanári konszolidáció"),
                        VersionWeek(5, "Új helyzetben alkalmazás")
                    ],
                    Stickers =
                    [
                        TemplateVersionSticker(ProductiveFailureChallengeStickerId, ProductiveFailureChallengeVersionId, 1, 1),
                        TemplateVersionSticker(ProductiveFailureFirstStrategyStickerId, ProductiveFailureFirstStrategyVersionId, 2, 1),
                        TemplateVersionSticker(ProductiveFailureDeadEndStickerId, ProductiveFailureDeadEndVersionId, 3, 1),
                        TemplateVersionSticker(ProductiveFailureConsolidationStickerId, ProductiveFailureConsolidationVersionId, 4, 1),
                        TemplateVersionSticker(ProductiveFailureRetryStickerId, ProductiveFailureRetryVersionId, 5, 1)
                    ]
                }
            ]
        };
    }

    private static AlbumTemplate InquiryTemplate()
    {
        var patternKey = AlbumTemplatePatterns.InquiryCer;
        return new AlbumTemplate
        {
            Id = InquiryTemplateId,
            Title = "Kutatás-bizonyítás album: Állítás, bizonyíték, indoklás",
            Subject = "Integrált természettudomány",
            Grade = "7-8. évfolyam",
            DurationType = DurationTypes.Phase,
            PatternKey = patternKey,
            PatternName = AlbumTemplatePatterns.Name(patternKey),
            PatternDescription = AlbumTemplatePatterns.Description(patternKey),
            DrivingQuestion = "Milyen bizonyítékkal tudunk meggyőző állítást tenni egy helyi jelenségről?",
            FinalProduct = "CER-poszter vagy rövid prezentáció: állítás, kiválasztott bizonyíték, indoklás és revízió.",
            Audience = "Osztálytársak, szaktanárok",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            Versions =
            [
                new AlbumTemplateVersion
                {
                    Id = InquiryTemplateVersionId,
                    AlbumTemplateId = InquiryTemplateId,
                    VersionNumber = 1,
                    Title = "Kutatás-bizonyítás album: Állítás, bizonyíték, indoklás",
                    Subject = "Integrált természettudomány",
                    Grade = "7-8. évfolyam",
                    DurationType = DurationTypes.Phase,
                    PatternKey = patternKey,
                    PatternName = AlbumTemplatePatterns.Name(patternKey),
                    PatternDescription = AlbumTemplatePatterns.Description(patternKey),
                    DrivingQuestion = "Milyen bizonyítékkal tudunk meggyőző állítást tenni egy helyi jelenségről?",
                    FinalProduct = "CER-poszter vagy rövid prezentáció: állítás, kiválasztott bizonyíték, indoklás és revízió.",
                    Audience = "Osztálytársak, szaktanárok",
                    ProjectReflectionPromptsJson = Prompts(
                        "Melyik bizonyíték erősítette vagy gyengítette az első állításotokat?",
                        "Hol kellett pontosítanotok az indoklást?",
                        "Mitől lett meggyőzőbb a végső magyarázatotok?"),
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-4),
                    Dispositions =
                    [
                        VersionDisposition("kérdezés", 1),
                        VersionDisposition("bizonyítékalapúság", 2),
                        VersionDisposition("érvelés", 3),
                        VersionDisposition("revízió", 4)
                    ],
                    Weeks =
                    [
                        VersionWeek(1, "Kutatási kérdés"),
                        VersionWeek(2, "Hipotézis"),
                        VersionWeek(3, "Adatgyűjtés"),
                        VersionWeek(4, "Állítás"),
                        VersionWeek(5, "Bizonyíték kiválasztása"),
                        VersionWeek(6, "Indoklás"),
                        VersionWeek(7, "Revízió")
                    ],
                    Stickers =
                    [
                        TemplateVersionSticker(InquiryQuestionStickerId, InquiryQuestionVersionId, 1, 1),
                        TemplateVersionSticker(InquiryHypothesisStickerId, InquiryHypothesisVersionId, 2, 1),
                        TemplateVersionSticker(InquiryDataStickerId, InquiryDataVersionId, 3, 1),
                        TemplateVersionSticker(InquiryClaimStickerId, InquiryClaimVersionId, 4, 1),
                        TemplateVersionSticker(InquiryEvidenceStickerId, InquiryEvidenceVersionId, 5, 1),
                        TemplateVersionSticker(InquiryReasoningStickerId, InquiryReasoningVersionId, 6, 1),
                        TemplateVersionSticker(InquiryRevisionStickerId, InquiryRevisionVersionId, 7, 1)
                    ]
                }
            ]
        };
    }

    private static void SeedFreshDemo(AlbumDbContext db)
    {
        var resources = new[]
        {
            ObservationSticker(),
            PerspectiveSticker(),
            MeasurementSticker(),
            PresentationSticker()
        };

        var template = new AlbumTemplate
        {
            Id = TemplateId,
            Title = "Városi mikroklíma nyomában",
            Subject = "Integrált természettudomány",
            Grade = "7-8. évfolyam",
            DurationType = DurationTypes.Week,
            PatternKey = AlbumTemplatePatterns.General,
            PatternName = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General),
            PatternDescription = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General),
            DrivingQuestion = "Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?",
            FinalProduct = "Diákok által készített mikroklíma-javaslatcsomag makettel, mérési adatokkal és nyilvános bemutatóval",
            Audience = "Osztálytársak, természettudomány-tanárok, iskola vezetése",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-20),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-4),
            Versions =
            [
                new AlbumTemplateVersion
                {
                    Id = TemplateVersionId,
                    AlbumTemplateId = TemplateId,
                    VersionNumber = 1,
                    Title = "Városi mikroklíma nyomában",
                    Subject = "Integrált természettudomány",
                    Grade = "7-8. évfolyam",
                    DurationType = DurationTypes.Week,
                    PatternKey = AlbumTemplatePatterns.General,
                    PatternName = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General),
                    PatternDescription = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General),
                    DrivingQuestion = "Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?",
                    FinalProduct = "Diákok által készített mikroklíma-javaslatcsomag makettel, mérési adatokkal és nyilvános bemutatóval",
                    Audience = "Osztálytársak, természettudomány-tanárok, iskola vezetése",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-20),
                    Dispositions =
                    [
                        VersionDisposition("Kíváncsiság", 1),
                        VersionDisposition("Képzelőerő", 2),
                        VersionDisposition("Együttműködés", 3),
                        VersionDisposition("Kitartás", 4),
                        VersionDisposition("Fegyelem", 5)
                    ],
                    Weeks =
                    [
                        VersionWeek(1, "Kérdezés és terepi megfigyelés"),
                        VersionWeek(2, "Perspektívák és érvek"),
                        VersionWeek(3, "Kísérlet és prototípus"),
                        VersionWeek(4, "Bemutatás és reflexió")
                    ],
                    Stickers =
                    [
                        TemplateVersionSticker(TemplateObservationStickerId, ObservationVersionId, 1, 1),
                        TemplateVersionSticker(TemplatePerspectiveStickerId, PerspectiveVersionId, 2, 1),
                        TemplateVersionSticker(TemplateMeasurementStickerId, MeasurementVersionId, 3, 1),
                        TemplateVersionSticker(TemplatePresentationStickerId, PresentationVersionId, 4, 1)
                    ]
                }
            ]
        };

        var instance = new AlbumInstance
        {
            Id = InstanceId,
            AlbumTemplateId = TemplateId,
            AlbumTemplateVersionId = TemplateVersionId,
            Title = "7.B mikroklíma projekt",
            ClassName = "7.B",
            CurrentWeek = 3,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-12),
            UpdatedAt = DateTimeOffset.UtcNow,
            Teams =
            [
                Team(TeamShadeId, "Árnyékkommandó", "Növényzet és árnyék", "#7872d4", ["Dóri", "Marci", "Hanna", "Zétény"]),
                Team(TeamStonesId, "Kőkutatók", "Burkolatok hatása", "#ef7c5b", ["Bence", "Petra", "Réka", "Tomi"]),
                Team(TeamCloudsId, "Felhőfigyelők", "Mikroklíma és időjárás", "#5cb6a3", ["Vince", "Léna", "Boti", "Adél"]),
                Team(TeamWaterId, "Vízkereső expedíció", "Víz és párolgás", "#e5b653", ["Eszter", "Csongor", "Ági", "Misi"])
            ],
            Stickers =
            [
                InstanceSticker(InstanceObservationStickerId, TemplateObservationStickerId, ObservationVersionId, 1, 1, StickerStates.Active),
                InstanceSticker(InstancePerspectiveStickerId, TemplatePerspectiveStickerId, PerspectiveVersionId, 2, 1, StickerStates.Active),
                InstanceSticker(InstanceMeasurementStickerId, TemplateMeasurementStickerId, MeasurementVersionId, 3, 1, StickerStates.Active),
                InstanceSticker(InstancePresentationStickerId, TemplatePresentationStickerId, PresentationVersionId, 4, 1, StickerStates.Planned)
            ],
            ClosureChecklist =
            [
                new AlbumInstanceClosureChecklistItem { SortOrder = 1, Label = "Iskolavezetés meghívva", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 2, Label = "Próbabemutató megtartva", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 3, Label = "Makett kész", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 4, Label = "Bizonyítékokra épülő érvelés a diákban", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 5, Label = "Reflexiók beérkeztek minden csapattól", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 6, Label = "Iskolavezetés visszajelzése rögzítve", Done = true },
                new AlbumInstanceClosureChecklistItem { SortOrder = 7, Label = "Hosszú távú javaslatok továbbítva", Done = false },
            ],
        };

        AddEvidence(instance, Evidence(InstanceObservationStickerId, TeamShadeId, "foto", "Sportpálya déli oldala - fotó és jegyzet", "Árnyékkommandó", -10, "A déli oldalon álló műfüves felületnél a járda is forró volt. A jegyzetben azt írtuk, hogy a fűzfa körüli rész lényegesen hűvösebbnek tűnt.", null, null, "elkeszult", "Jó megfigyelés. A következő körben próbáljátok pontosabban leírni a mérés időpontját."));
        AddEvidence(instance, Evidence(InstancePerspectiveStickerId, TeamShadeId, "jegyzet", "Szerepkártya: alsós gyerek", "Árnyékkommandó", -6, "A kisebbeknek a délutáni napsütésben nincs hová leülniük az udvaron. Az érvtérkép a játszótér árnyékhiányára épült.", null, null, "elkeszult", "Erős nézőpont. A példák konkrétak. Köszönöm a jól dokumentált érvtérképet."));
        AddEvidence(instance, Evidence(InstanceMeasurementStickerId, TeamShadeId, "meres", "A műfüves pálya mellett 6 fokkal melegebb volt", "Árnyékkommandó", -1, "A napos műfüves részen 34 fokot mértünk, az árnyékos fás részen 28 fokot. Szerintünk a burkolat és az árnyék együtt számít.", "Nem vagyunk biztosak benne, hogy elég pontos volt-e a mérés.", "Azt hittük, csak az árnyék számít, de a burkolat is nagyon sokat változtatott.", "varakozik", null));
        AddEvidence(instance, Evidence(InstanceMeasurementStickerId, TeamStonesId, "meres", "Aszfalt vs. kavics: 4 fokos különbség", "Kőkutatók", -1, "Aszfalt 36 fok, kavics 32 fok. Csak két mérést tudtunk venni, mert egy hőmérő hibásan mutatott.", "Lehet, hogy nem ugyanabban a napszakban mértünk.", "Más napszakban újra mérnénk és többször ismételnénk.", "varakozik", null));
        AddEvidence(instance, Evidence(InstanceMeasurementStickerId, TeamCloudsId, "meres", "Tanári épület melletti rész", "Felhőfigyelők", -1, "Két helyszínen mértünk, az adatok közel azonosak. A módszer leírása nem pontos: nem jegyeztük le a mérés idejét.", "Nem tudjuk eldönteni, mi az érdemi különbség.", "Lehet, hogy nem voltak elég különböző helyszínek.", "varakozik", null));

        SeedTeamProgress(instance);

        db.StickerResources.AddRange(resources);
        db.AlbumTemplates.Add(template);
        db.AlbumInstances.Add(instance);
        db.QualityDimensions.AddRange(CreateTemplateQualityDimensions(TemplateId));
        db.QualityDimensions.AddRange(CreateInstanceQualityDimensions(InstanceId));
        db.AiNotes.AddRange(CreateTemplateAiNotes(TemplateId, TemplateMeasurementStickerId));
        db.AiNotes.AddRange(CreateInstanceAiNotes(InstanceId, InstanceMeasurementStickerId, TeamStonesId));
        db.AiNotes.AddRange(CreateStickerVersionAiNotes(MeasurementVersionId));
        db.SeedMarkers.Add(new SeedMarker { Id = SeedMarkerId, CompletedAt = DateTimeOffset.UtcNow });
    }

    public static StickerResource CreateMeasurementBasicsResource() =>
        Resource(
            MeasurementBasicsResourceId,
            MeasurementBasicsVersionId,
            "Mérési gyorstalpaló",
            "cselekves",
            "Rövid, erőforrástakarékos előkészítő matrica a pontosabb méréshez.",
            "Válasszatok ki egy mérési helyzetet, és írjátok le: mit mértek, mikor, hányszor, milyen eszközzel, és mi számítana meglepő eredménynek.",
            "A csapat döntheti el, hogy hőmérsékletet, árnyékot, felülettípust vagy vízpárolgást készít elő.",
            "Mérési protokoll-lap legalább három döntési ponttal.",
            "Mérési protokoll + rövid reflexió",
            "Melyik mérési döntésetek befolyásolhatja leginkább az eredményt?",
            "Ha nincs mérőeszköz, a protokoll becslésre és megfigyelési kategóriákra épül.",
            "Papíralapú protokoll-lap, eszköz nélkül is kitölthető.",
            [
                "Mutass egy jó és egy hiányos mérési jegyzőkönyvet.",
                "Kérd meg a csapatokat, hogy javítsák a saját protokolljukat egy társuk kérdése alapján.",
                "Zárd azzal, hogy minden csapat kimondja a legfontosabb mérési kockázatát."
            ]);

    public static InstanceSticker CreateMeasurementBasicsInstanceSticker(Guid instanceId, Guid versionId, int sortOrder) => new()
    {
        AlbumInstanceId = instanceId,
        StickerVersionId = versionId,
        Week = 2,
        SortOrder = sortOrder,
        State = "tervezett"
    };

    public static IReadOnlyList<AiNote> CreateMeasurementBasicsNotes(Guid instanceId, Guid instanceStickerId) =>
    [
        Note("instance", instanceId, "instanceSticker", instanceStickerId, null, "check", "Erősíti a bizonyítékgyűjtést", "igen", "A mikro-matrica explicit mérési protokollt kér a csapatoktól.", null),
        Note("instance", instanceId, "instanceSticker", instanceStickerId, null, "check", "Erőforrástakarékos módon is működik", "igen", "A feladat hőmérő nélkül is futtatható jegyzőkönyv-ellenőrzésként.", null),
        Note("instance", instanceId, "quality", null, "bizonyit", "suggestion", "Mikro-matrica beillesztve", "info", "A futó album bizonyítékgyűjtési kockázatára célzott kiegészítő lépés került be.", "Figyeld, hogy a következő beküldésekben javul-e a mérési módszer leírása.")
    ];

    private static StickerResource ObservationSticker() =>
        Resource(
            ObservationResourceId,
            ObservationVersionId,
            "Hőnyomozók az iskola körül",
            "kerdezes",
            "Terepi megfigyelés és hipotézisalkotás az iskola környékén.",
            "Fotózzatok le két olyan helyet az iskola környékén, ahol szerintetek nyáron különösen meleg lehet. Írjatok mellé egy hipotézist: miért pont ott melegszik fel jobban a környezet?",
            "Választhattok: árnyékos és napos terület összehasonlítása, burkolatok összehasonlítása, növényzet szerepe vagy emberi használat megfigyelése.",
            "2 fotó, 2 megfigyelési jegyzet, 1 hipotézis csapatonként.",
            "Fotó + rövid jegyzet",
            "Mi lepett meg a megfigyelés során, és mit mérnétek meg legközelebb pontosabban?",
            "Esős időben használjatok korábbi iskolai fotókat vagy az iskola térképes nézetét.",
            "Telefon nélküli csapatok rajzos vázlatot készítenek a két helyszínről, mellé szöveges leírást a felület és az árnyék állapotáról.",
            [
                "Mutasd be a vezérkérdést és a hőmérséklet-megfigyelés célját.",
                "Vidd ki az osztályt a megfigyelési pontokra, csoportonként más-más útvonalat ajánlj.",
                "A megfigyelés után gyűjtsd össze a hipotéziseket a táblán.",
                "Zárd egy közös kérdéssel: melyik feltevést tudnánk leghamarabb ellenőrizni?"
            ]);

    private static StickerResource PerspectiveSticker() =>
        Resource(
            PerspectiveResourceId,
            PerspectiveVersionId,
            "Kinek mi számít élhető udvarnak?",
            "kepzelet",
            "Perspektívák ütköztetése: kisdiák, sportoló, tanár, takarító, kerékpáros.",
            "Húzzatok egy szerepkártyát. Az ő nézőpontjából írjátok le, milyen az élhető udvar, és mi zavar a hőségben.",
            "A csapat döntheti el, hogy egy szerepre fókuszál mélyen, vagy két szerep konfliktusát tárja fel.",
            "1 szerepkártya kitöltve + 1 érvtérkép.",
            "Szerepkártya + érvtérkép",
            "Melyik nézőpontot értettétek meg jobban a beszélgetés után, és melyik maradt nehéz?",
            "Ha a vita túl gyorsan eljut konszenzusig, dobj be egy ellentmondó forrást.",
            "Nyomtatott szerepkártyák és A4-es érvtérkép sablon. Internet nem szükséges.",
            [
                "Készítsd elő az 5 szerepkártyát; minden csapat egy-egy szerepet válaszon.",
                "Vezesd be az érvtérkép sablont: állítás, indok, példa.",
                "Tarts 10 perces ütköztetést: két csapat egymás mellé ül.",
                "Záráskor minden csapat egy mondatban összegezze a saját szerepe szükségletét."
            ]);

    private static StickerResource MeasurementSticker() =>
        Resource(
            MeasurementResourceId,
            MeasurementVersionId,
            "Árnyék, víz, felület: mikroklíma-kísérlet",
            "cselekves",
            "Hőmérséklet-mérés különböző felületeken és körülmények között.",
            "Mérjetek 3 különböző helyszínen hőmérsékletet: napos burkolat, árnyékos füves felület és egy harmadik általatok választott pont. Készítsetek mérési táblázatot napszakonként.",
            "A csapat választja a 3. helyszínt és a mérés időpontjait.",
            "Mérési táblázat legalább 6 adattal + rövid magyarázat.",
            "Mérési adatlap + fotó a helyszínről",
            "Milyen tényezőre nem gondoltatok előre, ami mégis befolyásolta a mérést?",
            "Ha kevés a hőmérő, csapatok rotálják őket 15 perces időkeretekben.",
            "Digitális hőmérő helyett árnyék-nap összehasonlító megfigyelési lap: vizuális becslés és tapintás-alapú jegyzet.",
            [
                "Mutasd be a mérési protokollt: eszköz, idő, helyszín, ismétlés.",
                "Oszd ki a hőmérőket; csapatonként minimum 2 mérési időpont.",
                "Mérés közben járd be a helyszíneket, kérdezz, ne válaszolj rögtön.",
                "Az adatfelvitel után tarts közös elemzést."
            ]);

    private static StickerResource PresentationSticker() =>
        Resource(
            PresentationResourceId,
            PresentationVersionId,
            "Javaslatcsomag az iskola vezetésének",
            "reflexio",
            "A bizonyítékokra épülő javaslatcsomag bemutatása nyilvánosan.",
            "Készítsetek 3 perces bemutatót: mit javasoltok az iskola hőtűrésének javítására, és melyik mérési adat támasztja alá?",
            "A csapat eldönti, hogy makettet, plakátot vagy videós bemutatót készít.",
            "Bemutató + makett vagy poszter + záró reflexió.",
            "Prezentáció + reflexió",
            "Melyik döntésetek változott meg a projekt során a bizonyítékok hatására?",
            "Ha az iskolavezetés nem ér rá, vegyétek fel videóra a bemutatót és kérjetek írásos visszajelzést.",
            "Plakát kézzel rajzolva A2-es lapra; mérési táblázat kézi grafikonnal.",
            [
                "Hívd meg az iskolavezetés egy tagját a záró bemutatóra.",
                "Tartsatok két próbabemutatást csapaton belül.",
                "A bemutatók után minden csapat fogalmazzon egy mondatot arról, mit tanult másik csapattól.",
                "Záró reflexióban a portfólióból válasszanak ki egy fontos pillanatot."
            ]);

    private static StickerResource ProductiveFailureChallengeSticker() =>
        Resource(
            ProductiveFailureChallengeResourceId,
            ProductiveFailureChallengeVersionId,
            "Kihívó adatprobléma",
            "kerdezes",
            "Szokatlan adatsor értelmezése előzetes képletmagyarázat nélkül.",
            "Kaptok három rövid adatsort. Döntsétek el, melyik csoport teljesített jobban, és írjátok le, milyen szabály alapján döntöttetek.",
            "Választhattok: összeg, legnagyobb érték, számtani átlag, medián vagy saját szabály.",
            "Első döntés rövid indoklással és legalább egy számítással.",
            "Számítás + indoklás",
            "Mi volt az első szabályotok, és miért tűnt igazságosnak?",
            "Ha a számolás elakad, becsléssel és rangsorolással is lehet kezdeni.",
            "Papíron, számológép nélkül is futtatható kis adatsorokkal.",
            [
                "Adj direkt tanítás nélküli, de érthető adatsort.",
                "Ne javítsd rögtön a stratégiákat; gyűjtsd a különböző döntési szabályokat.",
                "A végén csak azt kérd: melyik szabály hol működik rosszul?"
            ]);

    private static StickerResource ProductiveFailureFirstStrategySticker() =>
        Resource(
            ProductiveFailureFirstStrategyResourceId,
            ProductiveFailureFirstStrategyVersionId,
            "Első stratégia térképe",
            "cselekves",
            "A tanulók láthatóvá teszik, hogyan gondolkodtak az első próbálkozáskor.",
            "Rajzoljátok vagy írjátok le lépésről lépésre, hogyan jutottatok a döntésetekhez. Jelöljétek meg, melyik lépésben vagytok a legbiztosabbak.",
            "Készülhet számításlánc, folyamatábra, táblázat vagy rövid hangos magyarázat vázlata.",
            "Stratégia-térkép egy bizonytalan ponttal.",
            "Stratégia-vázlat",
            "Melyik lépés döntötte el leginkább az eredményt?",
            "Ha nincs közös stratégia, két versengő ötletet is fel lehet rajzolni.",
            "Táblai vagy füzetbeli vázlat elég.",
            [
                "Kérj gondolkodási nyomot, ne csak végeredményt.",
                "Keress legalább két eltérő, de érthető stratégiát a csoportok között.",
                "Tedd félre a formális definíciót a közös feldolgozásig."
            ]);

    private static StickerResource ProductiveFailureDeadEndSticker() =>
        Resource(
            ProductiveFailureDeadEndResourceId,
            ProductiveFailureDeadEndVersionId,
            "Zsákutca és ellenpélda",
            "cselekves",
            "A hibás vagy részleges stratégia ellenpéldán keresztül válik tanulási bizonyítékká.",
            "Keressetek olyan adatsort, ahol az első szabályotok félrevezető döntést adna. Írjátok le, pontosan mi romlik el.",
            "A saját szabályotokat is tesztelhetitek, vagy választhattok másik csoport szabályából.",
            "Ellenpélda és rövid hibaelemzés.",
            "Hibaelemzés",
            "Mit mutatott meg az ellenpélda, amit az első adatsor elrejtett?",
            "Ha nehéz új adatsort találni, a tanár adjon egy szélsőértékes példát.",
            "Három-négy számos adatsorral is működik.",
            [
                "Normalizáld a hibát: a cél most a stratégia tesztelése.",
                "Kérd, hogy a csapatok nevezzék meg a stratégia érvényességi határát.",
                "Gyűjts közös táblára tipikus zsákutcákat."
            ]);

    private static StickerResource ProductiveFailureConsolidationSticker() =>
        Resource(
            ProductiveFailureConsolidationResourceId,
            ProductiveFailureConsolidationVersionId,
            "Fogalmi rendezés",
            "reflexio",
            "A tanár a tanulói stratégiákból építi fel az átlag, medián és terjedelem szerepét.",
            "A közös megbeszélés után készítsetek fogalmi jegyzetet: mikor segít az átlag, mikor a medián, és milyen esetben kell óvatosnak lenni.",
            "Választhattok fogalomtérképet, példatáblázatot vagy három szabálymondatot.",
            "Fogalmi rendező lap saját példával.",
            "Fogalmi jegyzet",
            "Melyik fogalom lett pontosabb a hibák összevetése után?",
            "Ha kevés az idő, három mondatban rögzítsék: átlag, medián, szélsőérték.",
            "Füzetben vagy táblaképpel is elég.",
            [
                "Kapcsold a formális fogalmakat a korábbi tanulói stratégiákhoz.",
                "Mutasd meg, melyik hiba melyik fogalom szükségességét teszi láthatóvá.",
                "Zárd egy rövid döntési szabállyal: melyik mutatót mikor választanánk?"
            ]);

    private static StickerResource ProductiveFailureRetrySticker() =>
        Resource(
            ProductiveFailureRetryResourceId,
            ProductiveFailureRetryVersionId,
            "Újrapróba másik helyzetben",
            "reflexio",
            "A tanulók új adathelyzetben alkalmazzák a konszolidált fogalmat.",
            "Oldjatok meg egy új döntési helyzetet. Most előre írjátok le, melyik mutatót választjátok, miért, és milyen adat tehetné félrevezetővé.",
            "Választhattok sporteredményes, jegyes, időméréses vagy pénzügyi példát.",
            "Javított megoldás választott mutatóval és önellenőrzéssel.",
            "Javított számítás + reflexió",
            "Miben különbözött a második döntésetek az elsőtől?",
            "Ha nincs új feladat, térjenek vissza az első adatsorra másik mutatóval.",
            "Rövid feladatlapon is futtatható.",
            [
                "Adj transfer-feladatot, ne azonos példát.",
                "Kérj indoklást a választott mutató mellé.",
                "Zárd azzal: milyen hiba ellen védene most a választásuk?"
            ]);

    private static StickerResource InquiryQuestionSticker() =>
        Resource(
            InquiryQuestionResourceId,
            InquiryQuestionVersionId,
            "Kutatási kérdés élesítése",
            "kerdezes",
            "A csapat vizsgálható, helyi kérdést fogalmaz meg.",
            "Írjatok egy olyan kérdést, amelyre megfigyeléssel, méréssel vagy forráselemzéssel lehet választ adni.",
            "Választhattok iskolai, természeti, közösségi vagy médiából vett jelenséget.",
            "Egy vizsgálható kutatási kérdés és rövid indoklás.",
            "Kérdés + indoklás",
            "Mitől lett a kérdésetek vizsgálható?",
            "Ha túl tág a kérdés, szűkítsék helyre, időre vagy mérhető jelre.",
            "Papíros kérdéskártyákkal is működik.",
            ["Mutass példát túl tág és vizsgálható kérdésre.", "Kérj páros visszajelzést: megfigyelhető-e a kérdés?", "A végén minden csapat egy kérdést publikáljon."]);

    private static StickerResource InquiryHypothesisSticker() =>
        Resource(
            InquiryHypothesisResourceId,
            InquiryHypothesisVersionId,
            "Hipotézis és várakozás",
            "kerdezes",
            "A csapat előzetes, ellenőrizhető állítást fogalmaz meg.",
            "Írjátok le, mit vártok, és milyen adat gyengítené vagy erősítené ezt a várakozást.",
            "Lehet egy fő hipotézis vagy két versengő magyarázat.",
            "Hipotézis és ellenőrzési jel.",
            "Hipotézis-kártya",
            "Milyen adat lepne meg benneteket?",
            "Ha nincs hipotézis, induljanak egy 'szerintünk...' mondattal.",
            "Füzetben, digitális eszköz nélkül is elég.",
            ["Kérj előrejelzést, ne utólagos magyarázatot.", "Tisztázzátok, mi számít bizonyítéknak.", "Jelezd, hogy a hipotézis változhat."]);

    private static StickerResource InquiryDataSticker() =>
        Resource(
            InquiryDataResourceId,
            InquiryDataVersionId,
            "Adatgyűjtési terv",
            "cselekves",
            "A csapat megtervezi és rögzíti a bizonyítékgyűjtést.",
            "Készítsetek adatgyűjtési tervet: mit gyűjtötök, honnan, hányszor, milyen szabállyal.",
            "Választhattok mérés, megfigyelés, rövid kérdőív vagy forrásrészlet között.",
            "Adatgyűjtési terv legalább három döntéssel.",
            "Terv + adatlap",
            "Melyik adatgyűjtési döntés befolyásolhatja legjobban az eredményt?",
            "Ha nincs eszköz, használjanak megfigyelési kategóriákat.",
            "Papíralapú adatlap is elegendő.",
            ["Kérj ismételhető tervet.", "Járj körbe és kérdezz rá torzításokra.", "A végén minden csapat mondjon egy kockázatot."]);

    private static StickerResource InquiryClaimSticker() =>
        Resource(
            InquiryClaimResourceId,
            InquiryClaimVersionId,
            "Állítás megfogalmazása",
            "cselekves",
            "Az adatokból egy világos, vitatható állítás készül.",
            "Fogalmazzatok meg egy mondatos állítást, amelyet az adataitokkal szeretnétek alátámasztani.",
            "Lehet óvatos állítás vagy erős állítás külön bizonyossági jelzéssel.",
            "Egy állítás és bizonyossági szint.",
            "Állítás-kártya",
            "Mennyire erős az állításotok az adatok alapján?",
            "Ha az adat nem elég, engedj meg óvatosabb állítást.",
            "Egy mondat papíron is elég.",
            ["Kerüld a túl általános állításokat.", "Kérj kapcsolatot a kérdés és az adat között.", "Ellenőriztesd másik csapattal: érthető-e az állítás?"]);

    private static StickerResource InquiryEvidenceSticker() =>
        Resource(
            InquiryEvidenceResourceId,
            InquiryEvidenceVersionId,
            "Bizonyíték kiválasztása",
            "cselekves",
            "A csapat kiválasztja, melyik adat támasztja alá legerősebben az állítást.",
            "Válasszatok ki legfeljebb három bizonyítékot. Írjátok mellé, miért ezek a legerősebbek.",
            "Lehet számadat, idézet, fotó, mérési táblázat vagy összehasonlítás.",
            "Három bizonyíték rövid erősségmagyarázattal.",
            "Bizonyítéklista",
            "Melyik bizonyíték a legerősebb, és miért?",
            "Ha sok az adat, rangsorolják erősség szerint.",
            "Post-it vagy füzetlista is elég.",
            ["Különítsd el az adatot és az értelmezést.", "Kérj bizonyíték-rangsorolást.", "Tedd fel: mi gyengítené ezt?"]);

    private static StickerResource InquiryReasoningSticker() =>
        Resource(
            InquiryReasoningResourceId,
            InquiryReasoningVersionId,
            "Indoklás lánca",
            "reflexio",
            "A bizonyíték és az állítás közé magyarázó kapcsolat kerül.",
            "Írjátok le, hogyan vezet a kiválasztott bizonyíték az állításotokhoz. Használjátok: mert, ezért, azonban.",
            "Készülhet CER-táblázat, érvlánc vagy rövid prezentációvázlat.",
            "Állítás-bizonyíték-indoklás hármas.",
            "CER-vázlat",
            "Hol volt a legnehezebb összekötni adatot és állítást?",
            "Ha elakadnak, mondatkezdőkkel segíts: 'Ez azért bizonyíték, mert...'",
            "Táblai CER-sablonnal is futtatható.",
            ["Mutasd a claim-evidence-reasoning különbségét.", "Kérj egy ellenkérdést páronként.", "Zárd egy javított indoklásmondattal."]);

    private static StickerResource InquiryRevisionSticker() =>
        Resource(
            InquiryRevisionResourceId,
            InquiryRevisionVersionId,
            "Revízió és bemutatás",
            "reflexio",
            "A csapat visszajelzés alapján pontosítja állítását vagy indoklását.",
            "Kérjetek visszajelzést egy másik csapattól, majd javítsátok az állításotokat, bizonyítékotokat vagy indoklásotokat.",
            "Javíthatjátok a posztert, a CER-táblázatot vagy a szóbeli magyarázatot.",
            "Javított CER-produktum és rövid reflexió.",
            "Prezentáció + revízió",
            "Mit változtattatok, és mitől lett meggyőzőbb?",
            "Ha nincs idő bemutatóra, cseréljenek írásos feedbacket.",
            "Papíros poszterrel is működik.",
            ["Adj rövid peer-feedback protokollt.", "Kérj legalább egy konkrét javítást.", "Zárd bemutatással vagy galériasétával."]);

    private static string Prompts(params string[] prompts) => JsonSerializer.Serialize(prompts);

    private static StickerResource Resource(
        Guid resourceId,
        Guid versionId,
        string title,
        string phase,
        string shortDescription,
        string studentInstruction,
        string studentChoice,
        string expectedProduct,
        string evidenceTypeLabel,
        string reflectionPrompt,
        string bPlan,
        string lowResource,
        IReadOnlyList<string> steps) => new()
    {
        Id = resourceId,
        Title = title,
        Versions =
        [
            new StickerVersion
            {
                Id = versionId,
                StickerResourceId = resourceId,
                VersionNumber = 1,
                Title = title,
                Phase = phase,
                ShortDescription = shortDescription,
                StudentInstruction = studentInstruction,
                StudentChoice = studentChoice,
                ExpectedProduct = expectedProduct,
                EvidenceTypeLabel = evidenceTypeLabel,
                ReflectionPrompt = reflectionPrompt,
                BPlan = bPlan,
                LowResource = lowResource,
                TeacherSteps = steps.Select((step, index) => Step(index + 1, step)).ToList()
            }
        ]
    };

    private static AlbumTemplateVersionDisposition VersionDisposition(string name, int sortOrder) => new()
    {
        Name = name,
        SortOrder = sortOrder
    };

    private static AlbumTemplateVersionWeekPlan VersionWeek(int weekNumber, string title) => new()
    {
        WeekNumber = weekNumber,
        Title = title
    };

    private static AlbumTemplateVersionSticker TemplateVersionSticker(Guid id, Guid versionId, int week, int sortOrder) => new()
    {
        Id = id,
        StickerVersionId = versionId,
        Week = week,
        SortOrder = sortOrder
    };

    private static InstanceSticker InstanceSticker(Guid id, Guid templateStickerId, Guid versionId, int week, int sortOrder, string state) => new()
    {
        Id = id,
        AlbumTemplateVersionStickerId = templateStickerId,
        StickerVersionId = versionId,
        Week = week,
        SortOrder = sortOrder,
        State = state
    };

    private static Team Team(Guid id, string name, string focus, string color, IReadOnlyList<string> members) => new()
    {
        Id = id,
        Name = name,
        Focus = focus,
        Color = color,
        Members = members.Select((member, index) => new TeamMember
        {
            Name = member,
            SortOrder = index + 1
        }).ToList()
    };

    private static StickerVersionTeacherStep Step(int sortOrder, string text) => new()
    {
        SortOrder = sortOrder,
        Text = text
    };

    private static Evidence Evidence(
        Guid instanceStickerId,
        Guid teamId,
        string type,
        string title,
        string submittedBy,
        int submittedDaysAgo,
        string description,
        string? helpRequest,
        string? reflection,
        string status,
        string? teacherFeedback) => new()
    {
        InstanceStickerId = instanceStickerId,
        TeamId = teamId,
        Type = type,
        Title = title,
        SubmittedBy = submittedBy,
        SubmittedAt = DateTimeOffset.UtcNow.AddDays(submittedDaysAgo),
        Description = description,
        HelpRequest = helpRequest,
        Reflection = reflection,
        Status = status,
        TeacherFeedback = teacherFeedback,
        FeedbackAt = teacherFeedback is null ? null : DateTimeOffset.UtcNow.AddDays(submittedDaysAgo + 1)
    };

    private static void AddEvidence(AlbumInstance instance, Evidence evidence)
    {
        var sticker = instance.Stickers.Single(sticker => sticker.Id == evidence.InstanceStickerId);
        sticker.Evidence.Add(evidence);
    }

    private static void SeedTeamProgress(AlbumInstance instance)
    {
        Guid? LatestEvidenceId(Guid instanceStickerId, Guid teamId) =>
            instance.Stickers
                .Single(sticker => sticker.Id == instanceStickerId).Evidence
                .Where(evidence => evidence.TeamId == teamId)
                .OrderByDescending(evidence => evidence.SubmittedAt)
                .FirstOrDefault()?.Id;

        void Add(Guid instanceStickerId, Guid teamId, string state) =>
            instance.Stickers
                .Single(sticker => sticker.Id == instanceStickerId)
                .TeamProgress.Add(new InstanceStickerTeamProgress
                {
                    InstanceStickerId = instanceStickerId,
                    TeamId = teamId,
                    State = state,
                    LatestEvidenceId = LatestEvidenceId(instanceStickerId, teamId),
                    UpdatedAt = DateTimeOffset.UtcNow
                });

        // Week 1 + 2: all four teams have closed out (synthetic for demo continuity;
        // only Shade has an actual evidence row, others were seeded as "done" without one).
        foreach (var teamId in new[] { TeamShadeId, TeamStonesId, TeamCloudsId, TeamWaterId })
        {
            Add(InstanceObservationStickerId, teamId, TeamProgressStates.Reflected);
            Add(InstancePerspectiveStickerId, teamId, TeamProgressStates.Done);
        }

        // Week 3 (measurement): Shade, Stones, Clouds have submitted and are awaiting feedback;
        // Water has no progress row yet → "not started" → student banner shows "Töltsétek fel".
        Add(InstanceMeasurementStickerId, TeamShadeId, TeamProgressStates.Pending);
        Add(InstanceMeasurementStickerId, TeamStonesId, TeamProgressStates.Pending);
        Add(InstanceMeasurementStickerId, TeamCloudsId, TeamProgressStates.Pending);

        // Week 4 (presentation): lifecycle is tervezett — no per-team rows.
    }

    public static List<QualityDimension> CreateTemplateQualityDimensions(Guid templateId) =>
    [
        Quality("template", templateId, "aktiv", "Tanulói aktivitás", 88, "ok"),
        Quality("template", templateId, "valaszt", "Választási lehetőség", 86, "ok"),
        Quality("template", templateId, "nyilt", "Nyílt végű probléma", 90, "ok"),
        Quality("template", templateId, "produkt", "Látható produktum", 90, "ok"),
        Quality("template", templateId, "bizonyit", "Bizonyítékgyűjtés", 72, "warn"),
        Quality("template", templateId, "egyutt", "Együttműködés", 82, "ok"),
        Quality("template", templateId, "feedback", "Visszajelzés és javítás", 78, "ok"),
        Quality("template", templateId, "reflex", "Reflexió", 86, "ok"),
        Quality("template", templateId, "lowres", "Erőforrástakarékos megvalósíthatóság", 58, "warn"),
        Quality("template", templateId, "tanari", "Tanári kontroll és rugalmasság", 84, "ok")
    ];

    public static List<QualityDimension> CreateInstanceQualityDimensions(Guid instanceId, bool early = false) =>
    [
        Quality("instance", instanceId, "aktiv", "Tanulói aktivitás", early ? 55 : 92, early ? "warn" : "ok"),
        Quality("instance", instanceId, "valaszt", "Választási lehetőség", early ? 70 : 85, "ok"),
        Quality("instance", instanceId, "nyilt", "Nyílt végű probléma", 88, "ok"),
        Quality("instance", instanceId, "produkt", "Látható produktum", early ? 45 : 90, early ? "warn" : "ok"),
        Quality("instance", instanceId, "bizonyit", "Bizonyítékgyűjtés", early ? 35 : 70, "warn"),
        Quality("instance", instanceId, "egyutt", "Együttműködés", early ? 62 : 80, early ? "warn" : "ok"),
        Quality("instance", instanceId, "feedback", "Visszajelzés és javítás", early ? 30 : 78, early ? "miss" : "ok"),
        Quality("instance", instanceId, "reflex", "Reflexió", early ? 35 : 86, early ? "miss" : "ok"),
        Quality("instance", instanceId, "lowres", "Erőforrástakarékos megvalósíthatóság", early ? 55 : 55, "warn"),
        Quality("instance", instanceId, "tanari", "Tanári kontroll és rugalmasság", early ? 76 : 82, "ok")
    ];

    private static QualityDimension Quality(string ownerType, Guid ownerId, string code, string label, int score, string state) => new()
    {
        OwnerType = ownerType,
        OwnerId = ownerId,
        Code = code,
        Label = label,
        Score = score,
        State = state
    };

    private static IReadOnlyList<AiNote> CreateTemplateAiNotes(Guid templateId, Guid measurementTemplateStickerId) =>
    [
        Note("template", templateId, "templateSticker", measurementTemplateStickerId, null, "check", "Eszközigény a tervben", "figyelmet", "A mérési matrica minden csapatnak hőmérőt feltételez.", "A sablonban tarts megfigyeléses alternatívát is."),
        Note("template", templateId, "albumTemplate", templateId, null, "suggestion", "Újrahasználható terv", "igen", "Az albumterv önállóan futtatható több osztályban, mert a csapatok és bizonyítékok nem a tervben élnek.", null)
    ];

    private static IReadOnlyList<AiNote> CreateInstanceAiNotes(Guid instanceId, Guid measurementInstanceStickerId, Guid stonesTeamId) =>
    [
        Note("instance", instanceId, "quality", null, "bizonyit", "check", "Bizonyítékgyűjtés figyelése", "figyelmet", "Több csapat mérési bizonytalanságot jelzett, ezért a futó album szintjén is érdemes megerősíteni a bizonyítékgyűjtést.", "Adj rövid mérési protokollt vagy mikro-matricát a 3. hét előtt."),
        Note("instance", instanceId, "quality", null, "lowres", "suggestion", "Erőforrástakarékos alternatíva", "figyelmet", "A hőmérős mérés eszközigényes, ezért nem minden iskolai helyzetben futtatható egyformán.", "Tarts fenn megfigyeléses alternatívát azoknak a csapatoknak, akiknél nincs elég eszköz."),
        Note("instance", instanceId, "instanceSticker", measurementInstanceStickerId, null, "check", "Eszközigény", "figyelmet", "A futó mérési matrica minden csapatnak hőmérőt feltételez.", "Használj csapatrotációt vagy erőforrástakarékos megfigyelési lapot."),
        Note("instance", instanceId, "team", stonesTeamId, null, "suggestion", "Csapat támogatási pont", "figyelmet", "A Kőkutatók bizonytalanok az összehasonlítás időzítésében.", "A visszajelzésben kérj újramérést azonos napszakban.")
    ];

    private static IReadOnlyList<AiNote> CreateStickerVersionAiNotes(Guid stickerVersionId) =>
    [
        Note("stickerVersion", stickerVersionId, "stickerVersion", stickerVersionId, null, "check", "Tanulói döntési pont", "igen", "A mérési matrica engedi, hogy a csapat válassza ki a harmadik helyszínt és a mérés időpontjait.", null)
    ];

    private static AiNote Note(
        string ownerType,
        Guid ownerId,
        string targetType,
        Guid? targetId,
        string? targetKey,
        string kind,
        string label,
        string severity,
        string message,
        string? recommendation) => new()
    {
        OwnerType = ownerType,
        OwnerId = ownerId,
        TargetType = targetType,
        TargetId = targetId,
        TargetKey = targetKey,
        Kind = kind,
        Label = label,
        Severity = severity,
        Message = message,
        Recommendation = recommendation
    };
}
