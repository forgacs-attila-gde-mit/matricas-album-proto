namespace MatricasAlbum.Api.Domain;

// Modul (Module) — a reusable, versioned grouping of Témakörök (Topics), one level above
// Topic. Mirrors the Topic/Block versioning (<=1 draft, published immutable; v1 starts
// editable). Composed BY REFERENCE: a ModuleVersion points at TopicVersion rows via
// ModuleTopicRelation; it never copies the topic, and the same topic version can be
// referenced by many modules. Richer fields (learningGoals, competencies, progression) are
// deferred until the source/UI supplies them — not invented.
public sealed class Module
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<ModuleVersion> Versions { get; set; } = [];
}

public sealed class ModuleVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModuleId { get; set; }
    public Module? Module { get; set; }
    public int VersionNumber { get; set; }
    public bool IsDraft { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<ModuleTopicRelation> Topics { get; set; } = [];
}

// Reference join row: a module version references a topic version with an order. No copy of
// the topic is made; deleting the row does not touch the TopicVersion.
public sealed class ModuleTopicRelation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModuleVersionId { get; set; }
    public ModuleVersion? ModuleVersion { get; set; }
    public Guid TopicVersionId { get; set; }
    public TopicVersion? TopicVersion { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}
