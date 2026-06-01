namespace MatricasAlbum.Api.Domain;

/// <summary>
/// Standalone "kérek tanári segítséget" signal from a team.
/// Distinct from the per-evidence <c>HelpRequested</c> flag because a team can ask
/// before they have anything to submit. Resolution is a toggle — no response text required.
/// </summary>
public sealed class TeamHelpRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public Guid? InstanceStickerId { get; set; }
    public InstanceSticker? InstanceSticker { get; set; }
    public string Question { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAt { get; set; }
}
