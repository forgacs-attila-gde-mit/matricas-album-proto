namespace MatricasAlbum.Api.Domain;

public sealed class Evidence
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstanceStickerId { get; set; }
    public InstanceSticker? InstanceSticker { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string Type { get; set; } = "jegyzet";
    public string Status { get; set; } = "varakozik";
    public string Title { get; set; } = string.Empty;
    public string SubmittedBy { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Description { get; set; } = string.Empty;
    public string? HelpRequest { get; set; }
    public bool HelpRequested { get; set; }
    public string? Reflection { get; set; }
    public string? TeacherFeedback { get; set; }
    public DateTimeOffset? FeedbackAt { get; set; }
    public DateTimeOffset? SeenByTeamAt { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
}
