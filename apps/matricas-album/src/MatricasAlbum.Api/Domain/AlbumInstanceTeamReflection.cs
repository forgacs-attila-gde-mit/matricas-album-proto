namespace MatricasAlbum.Api.Domain;

/// <summary>
/// Project-level reflection a team writes once at album close.
/// Distinct from per-sticker reflections (on <see cref="InstanceStickerTeamProgress"/>).
/// One row per (AlbumInstanceId, TeamId).
/// </summary>
public sealed class AlbumInstanceTeamReflection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
