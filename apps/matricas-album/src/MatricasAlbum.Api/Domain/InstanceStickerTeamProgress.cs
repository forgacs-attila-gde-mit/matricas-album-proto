namespace MatricasAlbum.Api.Domain;

public sealed class InstanceStickerTeamProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstanceStickerId { get; set; }
    public InstanceSticker? InstanceSticker { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string State { get; set; } = TeamProgressStates.Pending;
    public Guid? LatestEvidenceId { get; set; }
    public string? Reflection { get; set; }
    public DateTimeOffset? ReflectedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
