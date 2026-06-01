namespace MatricasAlbum.Api.Domain;

public sealed class AiAdvice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? RunId { get; set; }
    public AiAdviceRun? Run { get; set; }
    public string Audience { get; set; } = "teacher";
    public string OwnerType { get; set; } = "instance";
    public Guid OwnerId { get; set; }
    public string TargetType { get; set; } = "albumInstance";
    public Guid? TargetId { get; set; }
    public string? TargetKey { get; set; }
    public string Kind { get; set; } = "suggestion";
    public string Severity { get; set; } = "info";
    public string Status { get; set; } = "uj";
    public string Message { get; set; } = string.Empty;
    public string? Recommendation { get; set; }
    public string QuestionsJson { get; set; } = "[]";
    public string CitationsJson { get; set; } = "[]";
    public string? ActionType { get; set; }
    public string? ActionLabel { get; set; }
    public string? ActionPayloadJson { get; set; }
    public string? Model { get; set; }
    public string PromptVersion { get; set; } = "phase4-v1";
    public string ProjectionVersion { get; set; } = "matricas-methodology-agent-wiki-v1";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AppliedAt { get; set; }
}

public sealed class AiAdviceRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Audience { get; set; } = "teacher";
    public string OwnerType { get; set; } = "instance";
    public Guid OwnerId { get; set; }
    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? TargetKey { get; set; }
    public string SnapshotHash { get; set; } = string.Empty;
    public string Status { get; set; } = "started";
    public string? Error { get; set; }
    public string? Model { get; set; }
    public string PromptVersion { get; set; } = "phase4-v1";
    public string ProjectionVersion { get; set; } = "matricas-methodology-agent-wiki-v1";
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }

    public List<AiAdvice> Advices { get; set; } = [];
}
