namespace MatricasAlbum.Api.Domain;

public sealed record BlockActivitySpec(Guid StickerVersionId, string Role, int SortOrder);

public sealed record BlockSpec(string Name, string FlowType, string Grouping, IReadOnlyList<BlockActivitySpec> Activities);

// Maps an album-template version's per-unit (week) sticker groups to Block specs (Task 4.4).
// One Block per unit that has activities, order preserved, each activity referenced (not
// copied) with the default `primary` role. Pure and non-destructive — the caller materializes
// the specs as new Block entities; the template and any running instance stay untouched. The
// existing AlbumInstance mint already snapshots references into InstanceSticker rows, so the
// "snapshot at run" guarantee is unchanged; wiring the mint *through* blocks waits until a
// template composes blocks (Phase 5/6).
public static class TemplateBlockMapping
{
    public static IReadOnlyList<BlockSpec> MapUnitsToBlocks(
        IReadOnlyList<(int Week, string Title)> units,
        IReadOnlyList<(Guid StickerVersionId, int Week, int SortOrder)> stickers)
    {
        var titleByWeek = new Dictionary<int, string>();
        foreach (var (week, title) in units)
        {
            titleByWeek[week] = title;
        }

        var blocks = new List<BlockSpec>();
        var weeks = stickers
            .GroupBy(sticker => sticker.Week)
            .OrderBy(group => group.Key);

        foreach (var group in weeks)
        {
            var ordered = group.OrderBy(sticker => sticker.SortOrder).ToList();
            if (ordered.Count == 0)
            {
                continue;
            }

            titleByWeek.TryGetValue(group.Key, out var title);
            var name = string.IsNullOrWhiteSpace(title) ? $"{group.Key}. egység" : title.Trim();
            var activities = ordered
                .Select((sticker, index) => new BlockActivitySpec(sticker.StickerVersionId, BlockActivityRoles.Primary, index + 1))
                .ToList();

            blocks.Add(new BlockSpec(name, BlockFlowTypes.Linear, BlockGroupings.Group, activities));
        }

        return blocks;
    }
}
