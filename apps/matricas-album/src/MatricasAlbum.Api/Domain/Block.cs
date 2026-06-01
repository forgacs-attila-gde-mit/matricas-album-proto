namespace MatricasAlbum.Api.Domain;

// Blokk (Block) — a reusable, versioned grouping of activity references. Mirrors the
// AlbumTemplate/AlbumTemplateVersion draft/publish machinery (<=1 draft, published
// immutable). Composed BY REFERENCE: a BlockVersion points at StickerVersion rows via
// ActivityBlockRelation; it never copies the activity, and the same activity version can
// be referenced by many blocks.
public sealed class Block
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<BlockVersion> Versions { get; set; } = [];
}

public sealed class BlockVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BlockId { get; set; }
    public Block? Block { get; set; }
    public int VersionNumber { get; set; }
    public bool IsDraft { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FlowType { get; set; } = BlockFlowTypes.Linear;
    public string Grouping { get; set; } = BlockGroupings.Group;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<ActivityBlockRelation> Activities { get; set; } = [];
}

// Reference join row: a block version references an activity version with a role + order.
// No copy of the activity is made; deleting the row does not touch the StickerVersion.
public sealed class ActivityBlockRelation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BlockVersionId { get; set; }
    public BlockVersion? BlockVersion { get; set; }
    public Guid StickerVersionId { get; set; }
    public StickerVersion? StickerVersion { get; set; }
    public string Role { get; set; } = BlockActivityRoles.Primary;
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}
