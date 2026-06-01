namespace MatricasAlbum.Api.Domain;

public sealed record StickerVersionLineageEntry(
    Guid StickerVersionId,
    int VersionNumber,
    Guid? DerivedFromVersionId,
    int? DerivedFromVersionNumber);

// Implicit activity version lineage: version N derives from version N-1 of the same
// resource. This stands in until an explicit derivedFrom link is recorded; the read model
// (Activity relations) surfaces it so a teacher can see where a version came from.
public static class StickerVersionLineage
{
    public static IReadOnlyList<StickerVersionLineageEntry> Build(IEnumerable<(Guid Id, int VersionNumber)> versions)
    {
        var ordered = versions.OrderBy(version => version.VersionNumber).ToList();
        return ordered
            .Select((version, index) => new StickerVersionLineageEntry(
                version.Id,
                version.VersionNumber,
                index > 0 ? ordered[index - 1].Id : null,
                index > 0 ? ordered[index - 1].VersionNumber : null))
            .ToList();
    }
}
