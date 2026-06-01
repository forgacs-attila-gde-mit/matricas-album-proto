using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Data;

// Materializes BlockSpecs (from TemplateBlockMapping) as new, published Block entities
// (REFACTOR-001 Task 4.4). Strictly additive: it only inserts Block / BlockVersion /
// ActivityBlockRelation rows — it never reads or mutates templates, instances, evidence, or
// progress. Idempotent by block name: a spec whose name already matches a live (non-archived)
// block is skipped, so re-deriving a template does not create duplicates.
public static class BlockMaterializer
{
    public static async Task<IReadOnlyList<Block>> MaterializeAsync(
        AlbumDbContext db,
        IReadOnlyList<BlockSpec> specs,
        CancellationToken cancellationToken = default)
    {
        var existingNames = (await db.Blocks
                .Where(block => block.ArchivedAt == null)
                .Select(block => block.Name)
                .ToListAsync(cancellationToken))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var created = new List<Block>();
        foreach (var spec in specs)
        {
            if (existingNames.Contains(spec.Name))
            {
                continue;
            }

            var block = new Block { Name = spec.Name };
            block.Versions.Add(new BlockVersion
            {
                BlockId = block.Id,
                VersionNumber = 1,
                IsDraft = false, // derived blocks land published (they mirror a published template)
                Name = spec.Name,
                FlowType = BlockFlowTypes.Normalize(spec.FlowType),
                Grouping = BlockGroupings.Normalize(spec.Grouping),
                Activities = spec.Activities
                    .Select(activity => new ActivityBlockRelation
                    {
                        StickerVersionId = activity.StickerVersionId,
                        Role = BlockActivityRoles.Normalize(activity.Role) ?? BlockActivityRoles.Primary,
                        SortOrder = activity.SortOrder,
                    })
                    .ToList(),
            });

            db.Blocks.Add(block);
            created.Add(block);
            existingNames.Add(spec.Name);
        }

        if (created.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        return created;
    }
}
