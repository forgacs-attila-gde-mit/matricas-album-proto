namespace MatricasAlbum.Api.Domain;

// Tanterv (Curriculum) — the top of the gold-standard hierarchy: a reusable, versioned
// grouping of Modulok (Modules). Mirrors the module/topic/block versioning (<=1 draft,
// published immutable; v1 starts editable). Composed BY REFERENCE: a CurriculumVersion points
// at ModuleVersion rows via CurriculumModuleRelation; no copy, and the same module version
// can be referenced by many curricula. The richer draft/review/approved/published governance
// workflow from the spec is deferred — the draft/publish lifecycle here matches the rest of
// the hierarchy; review/approved states wait until the source/UI needs them.
public sealed class Curriculum
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset? ArchivedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<CurriculumVersion> Versions { get; set; } = [];
}

public sealed class CurriculumVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CurriculumId { get; set; }
    public Curriculum? Curriculum { get; set; }
    public int VersionNumber { get; set; }
    public bool IsDraft { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<CurriculumModuleRelation> Modules { get; set; } = [];
}

// Reference join row: a curriculum version references a module version with an order. No copy
// of the module is made; deleting the row does not touch the ModuleVersion.
public sealed class CurriculumModuleRelation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CurriculumVersionId { get; set; }
    public CurriculumVersion? CurriculumVersion { get; set; }
    public Guid ModuleVersionId { get; set; }
    public ModuleVersion? ModuleVersion { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}
