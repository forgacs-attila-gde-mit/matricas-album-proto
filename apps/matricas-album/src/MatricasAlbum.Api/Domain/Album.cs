namespace MatricasAlbum.Api.Domain;

public static class DurationTypes
{
    public const string Week = "het";
    public const string Hour = "ora";
    public const string Phase = "fazis";

    public static bool IsValid(string? value) => value is Week or Hour or Phase;
}

public static class AlbumTemplatePatterns
{
    public const string General = "altalanos";
    public const string ProductiveFailure = "produktiv-hibazas";
    public const string InquiryCer = "kutatas-bizonyitas";

    public static bool IsValid(string? value) => value is General or ProductiveFailure or InquiryCer;

    public static string Normalize(string? value) => IsValid(value?.Trim()) ? value!.Trim() : General;

    public static string Name(string? value) => Normalize(value) switch
    {
        ProductiveFailure => "Produktív hibázás",
        InquiryCer => "Kutatás-bizonyítás",
        _ => "Általános album"
    };

    public static string Description(string? value) => Normalize(value) switch
    {
        ProductiveFailure => "Kihívó probléma, látható zsákutcák, tanári konszolidáció és újrapróba.",
        InquiryCer => "Kérdésből induló kutatás állítással, bizonyítékkal és indoklással.",
        _ => "Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval."
    };
}

public sealed class AlbumTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    // het | ora | fazis — labels the unit rows (weeks / lessons / phases). See AlbumTemplate.DurationTypes.
    public string DurationType { get; set; } = "het";
    public string PatternKey { get; set; } = AlbumTemplatePatterns.General;
    public string PatternName { get; set; } = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General);
    public string PatternDescription { get; set; } = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General);
    public string DrivingQuestion { get; set; } = string.Empty;
    public string FinalProduct { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<AlbumTemplateVersion> Versions { get; set; } = [];
    public List<TemplateDisposition> Dispositions { get; set; } = [];
    public List<TemplateWeekPlan> Weeks { get; set; } = [];
    public List<AlbumTemplateSticker> Stickers { get; set; } = [];
    public List<AlbumInstance> Instances { get; set; } = [];
}

public sealed class AlbumTemplateVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateId { get; set; }
    public AlbumTemplate? AlbumTemplate { get; set; }
    public int VersionNumber { get; set; }
    public bool IsDraft { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    // het | ora | fazis
    public string DurationType { get; set; } = "het";
    public string PatternKey { get; set; } = AlbumTemplatePatterns.General;
    public string PatternName { get; set; } = AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General);
    public string PatternDescription { get; set; } = AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General);
    public string DrivingQuestion { get; set; } = string.Empty;
    public string FinalProduct { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string ProjectReflectionPromptsJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<AlbumTemplateVersionDisposition> Dispositions { get; set; } = [];
    public List<AlbumTemplateVersionWeekPlan> Weeks { get; set; } = [];
    public List<AlbumTemplateVersionDifferentiationPath> DifferentiationPaths { get; set; } = [];
    public List<AlbumTemplateVersionSticker> Stickers { get; set; } = [];
    public List<AlbumInstance> Instances { get; set; } = [];
}

public sealed class AlbumTemplateVersionDifferentiationPath
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateVersionId { get; set; }
    public AlbumTemplateVersion? AlbumTemplateVersion { get; set; }
    public string Phase { get; set; } = "kerdezes";
    public string PathKey { get; set; } = DifferentiationPathKeys.Base;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RecommendedFor { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public sealed class AlbumTemplateVersionDisposition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateVersionId { get; set; }
    public AlbumTemplateVersion? AlbumTemplateVersion { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public sealed class AlbumTemplateVersionWeekPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateVersionId { get; set; }
    public AlbumTemplateVersion? AlbumTemplateVersion { get; set; }
    public int WeekNumber { get; set; }
    public string Title { get; set; } = string.Empty;
}

public sealed class AlbumTemplateVersionSticker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateVersionId { get; set; }
    public AlbumTemplateVersion? AlbumTemplateVersion { get; set; }
    public Guid StickerVersionId { get; set; }
    public StickerVersion? StickerVersion { get; set; }
    public int Week { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class TemplateDisposition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateId { get; set; }
    public AlbumTemplate? AlbumTemplate { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public sealed class TemplateWeekPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateId { get; set; }
    public AlbumTemplate? AlbumTemplate { get; set; }
    public int WeekNumber { get; set; }
    public string Title { get; set; } = string.Empty;
}

public sealed class AlbumTemplateSticker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateId { get; set; }
    public AlbumTemplate? AlbumTemplate { get; set; }
    public Guid StickerVersionId { get; set; }
    public StickerVersion? StickerVersion { get; set; }
    public int Week { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AlbumInstance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumTemplateId { get; set; }
    public AlbumTemplate? AlbumTemplate { get; set; }
    public Guid AlbumTemplateVersionId { get; set; }
    public AlbumTemplateVersion? AlbumTemplateVersion { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int CurrentWeek { get; set; } = 1;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<InstanceSticker> Stickers { get; set; } = [];
    public List<Team> Teams { get; set; } = [];
    /** Per-instance overrides for unit titles. Falls back to the template version's title when absent. */
    public List<AlbumInstanceWeekPlan> WeekPlanOverrides { get; set; } = [];
    /** Closure-page checklist items (seeded from a default set at instance create time). */
    public List<AlbumInstanceClosureChecklistItem> ClosureChecklist { get; set; } = [];
    /** Teacher-facing closing reflection for pilot learning and later synthesis. */
    public AlbumInstanceTeacherEffectLog? TeacherEffectLog { get; set; }
}

public sealed class AlbumInstanceClosureChecklistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public int SortOrder { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool Done { get; set; }
}

public sealed class AlbumInstanceTeacherEffectLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public string WorkedWell { get; set; } = string.Empty;
    public string EngagementSignals { get; set; } = string.Empty;
    public string AdaptationNotes { get; set; } = string.Empty;
    public string ReuseNextTime { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AlbumInstanceWeekPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public int WeekNumber { get; set; }
    public string Title { get; set; } = string.Empty;
}

public sealed class InstanceSticker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public Guid? AlbumTemplateStickerId { get; set; }
    public AlbumTemplateSticker? AlbumTemplateSticker { get; set; }
    public Guid? AlbumTemplateVersionStickerId { get; set; }
    public AlbumTemplateVersionSticker? AlbumTemplateVersionSticker { get; set; }
    public Guid StickerVersionId { get; set; }
    public StickerVersion? StickerVersion { get; set; }
    public int Week { get; set; }
    public int SortOrder { get; set; }
    public string State { get; set; } = "tervezett";
    /** Set when a template-version upgrade removed this sticker from the source template but the instance keeps it for the evidence already on it. */
    public bool Deprecated { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Evidence> Evidence { get; set; } = [];
    public List<InstanceStickerTeamProgress> TeamProgress { get; set; } = [];
    public List<InstanceStickerTeamDifferentiationPath> TeamDifferentiationPaths { get; set; } = [];
}

public sealed class InstanceStickerTeamDifferentiationPath
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstanceStickerId { get; set; }
    public InstanceSticker? InstanceSticker { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string PathKey { get; set; } = DifferentiationPathKeys.Base;
    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
}
