namespace MatricasAlbum.Api.Domain;

public sealed class StickerResource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ArchivedAt { get; set; }

    public List<StickerVersion> Versions { get; set; } = [];
}

public sealed class StickerVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StickerResourceId { get; set; }
    public StickerResource? StickerResource { get; set; }
    public int VersionNumber { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public string Phase { get; set; } = "kerdezes";
    public string ShortDescription { get; set; } = string.Empty;
    public string StudentInstruction { get; set; } = string.Empty;
    public string StudentChoice { get; set; } = string.Empty;
    public string ExpectedProduct { get; set; } = string.Empty;
    public string EvidenceTypeLabel { get; set; } = string.Empty;
    public string ReflectionPrompt { get; set; } = string.Empty;
    public string BPlan { get; set; } = string.Empty;
    public string LowResource { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<StickerVersionTeacherStep> TeacherSteps { get; set; } = [];
}

public sealed class StickerVersionTeacherStep
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StickerVersionId { get; set; }
    public StickerVersion? StickerVersion { get; set; }
    public int SortOrder { get; set; }
    public string Text { get; set; } = string.Empty;
}

public sealed class AiNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerType { get; set; } = "instance";
    public Guid OwnerId { get; set; }
    public string TargetType { get; set; } = "albumInstance";
    public Guid? TargetId { get; set; }
    public string? TargetKey { get; set; }
    public string Kind { get; set; } = "check";
    public string Label { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string Message { get; set; } = string.Empty;
    public string? Recommendation { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
