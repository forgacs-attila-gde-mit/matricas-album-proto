namespace MatricasAlbum.Api.Domain;

// Témakör (Topic) — a reusable, versioned grouping of Blocks, one level above Block. Mirrors
// the Block/BlockVersion draft/publish machinery (<=1 draft, published immutable; v1 starts
// editable). Composed BY REFERENCE: a TopicVersion points at BlockVersion rows via
// TopicBlockRelation; it never copies the block, and the same block version can be referenced
// by many topics. Per the 2026-06-01 decision Topic references Block directly (the
// `Tanulási egység` level was retired). Richer fields (learningGoals, competencies,
// progression) are deferred until the source/UI supplies them — not invented.
public sealed class Topic
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<TopicVersion> Versions { get; set; } = [];
}

public sealed class TopicVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TopicId { get; set; }
    public Topic? Topic { get; set; }
    public int VersionNumber { get; set; }
    public bool IsDraft { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<TopicBlockRelation> Blocks { get; set; } = [];
}

// Reference join row: a topic version references a block version with an order. No copy of the
// block is made; deleting the row does not touch the BlockVersion.
public sealed class TopicBlockRelation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TopicVersionId { get; set; }
    public TopicVersion? TopicVersion { get; set; }
    public Guid BlockVersionId { get; set; }
    public BlockVersion? BlockVersion { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}
