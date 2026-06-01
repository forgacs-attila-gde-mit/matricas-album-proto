using MatricasAlbum.Api.Domain;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 3.2: an activity's version lineage. Until an explicit derivedFrom link
// exists, version N is treated as derived from version N-1 of the same resource.
public class StickerVersionLineageTests
{
    [Fact]
    public void Build_links_each_version_to_the_previous_one()
    {
        var v1 = Guid.NewGuid();
        var v2 = Guid.NewGuid();
        var v3 = Guid.NewGuid();

        // Deliberately unordered input — Build sorts by version number.
        var lineage = StickerVersionLineage.Build([(v3, 3), (v1, 1), (v2, 2)]);

        Assert.Equal(3, lineage.Count);
        Assert.Null(lineage[0].DerivedFromVersionId);          // v1 has no source
        Assert.Equal(v1, lineage[1].DerivedFromVersionId);     // v2 <- v1
        Assert.Equal(1, lineage[1].DerivedFromVersionNumber);
        Assert.Equal(v2, lineage[2].DerivedFromVersionId);     // v3 <- v2
        Assert.Equal(2, lineage[2].DerivedFromVersionNumber);
    }

    [Fact]
    public void Build_with_a_single_version_has_no_source()
    {
        var only = Guid.NewGuid();
        var lineage = StickerVersionLineage.Build([(only, 1)]);

        Assert.Single(lineage);
        Assert.Null(lineage[0].DerivedFromVersionId);
        Assert.Null(lineage[0].DerivedFromVersionNumber);
    }
}
