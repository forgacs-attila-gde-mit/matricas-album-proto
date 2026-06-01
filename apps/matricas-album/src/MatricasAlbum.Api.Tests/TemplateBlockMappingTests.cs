using MatricasAlbum.Api.Domain;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 4.4: map an album-template version's per-unit (week) sticker groups to
// Block specs — one Block per non-empty unit, activities preserved in order. Pure and
// non-destructive: callers materialize these as NEW Block entities; the template and every
// running instance are untouched.
public class TemplateBlockMappingTests
{
    [Fact]
    public void MapUnitsToBlocks_makes_one_block_per_non_empty_unit_in_order()
    {
        var svA = Guid.NewGuid();
        var svB = Guid.NewGuid();
        var svC = Guid.NewGuid();

        var blocks = TemplateBlockMapping.MapUnitsToBlocks(
            [(1, "Kérdezés"), (2, "Kísérlet"), (3, "Üres egység")],
            // Week 1 deliberately out of order to prove SortOrder ordering; week 3 has none.
            [(svA, 1, 2), (svB, 1, 1), (svC, 2, 1)]);

        Assert.Equal(2, blocks.Count);

        Assert.Equal("Kérdezés", blocks[0].Name);
        Assert.Equal(new[] { svB, svA }, blocks[0].Activities.Select(a => a.StickerVersionId).ToArray());
        Assert.Equal(new[] { 1, 2 }, blocks[0].Activities.Select(a => a.SortOrder).ToArray());
        Assert.All(blocks[0].Activities, a => Assert.Equal(BlockActivityRoles.Primary, a.Role));

        Assert.Equal("Kísérlet", blocks[1].Name);
        Assert.Equal(new[] { svC }, blocks[1].Activities.Select(a => a.StickerVersionId).ToArray());
    }

    [Fact]
    public void MapUnitsToBlocks_falls_back_to_a_unit_label_when_title_is_blank()
    {
        var sv = Guid.NewGuid();
        var blocks = TemplateBlockMapping.MapUnitsToBlocks([(1, "   ")], [(sv, 1, 1)]);

        Assert.Single(blocks);
        Assert.Equal("1. egység", blocks[0].Name);
    }

    [Fact]
    public void MapUnitsToBlocks_includes_a_unit_that_has_stickers_but_no_unit_row()
    {
        // A sticker placed in a week with no week-plan row still becomes a block (no loss).
        var sv = Guid.NewGuid();
        var blocks = TemplateBlockMapping.MapUnitsToBlocks([], [(sv, 4, 1)]);

        Assert.Single(blocks);
        Assert.Equal("4. egység", blocks[0].Name);
        Assert.Equal(sv, blocks[0].Activities[0].StickerVersionId);
    }
}
