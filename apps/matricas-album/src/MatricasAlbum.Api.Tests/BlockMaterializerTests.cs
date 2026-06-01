using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 4.4: deriving Blocks from a template is strictly additive — an existing
// running instance and all its evidence must survive untouched.
public class BlockMaterializerTests
{
    private static AlbumDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"block-materializer-{Guid.NewGuid()}")
            .Options);

    [Fact]
    public async Task Materialize_creates_blocks_without_disturbing_instances_or_evidence()
    {
        await using var db = NewDb();
        var resourceId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        db.StickerResources.Add(new StickerResource
        {
            Id = resourceId,
            Title = "Megfigyelés",
            Versions = [new StickerVersion { Id = versionId, StickerResourceId = resourceId, VersionNumber = 1, Title = "Megfigyelés" }],
        });

        var instanceId = Guid.NewGuid();
        var instanceStickerId = Guid.NewGuid();
        db.AlbumInstances.Add(new AlbumInstance
        {
            Id = instanceId,
            AlbumTemplateId = Guid.NewGuid(),
            AlbumTemplateVersionId = Guid.NewGuid(),
            Title = "7.B futó album",
            Stickers = [new InstanceSticker { Id = instanceStickerId, AlbumInstanceId = instanceId, StickerVersionId = versionId, Week = 1, SortOrder = 1, State = StickerStates.Active }],
        });
        db.Evidence.Add(new Evidence { InstanceStickerId = instanceStickerId, TeamId = Guid.NewGuid(), Type = "foto", Status = EvidenceStatuses.Done, Title = "Terepi fotó" });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var evidenceBefore = await db.Evidence.CountAsync();
        var instancesBefore = await db.AlbumInstances.CountAsync();
        var instanceStickersBefore = await db.InstanceStickers.CountAsync();

        var specs = TemplateBlockMapping.MapUnitsToBlocks([(1, "Kérdezés")], [(versionId, 1, 1)]);
        var created = await BlockMaterializer.MaterializeAsync(db, specs);

        // The derived block exists and references the SAME activity version (no copy).
        Assert.Single(created);
        var relation = await db.ActivityBlockRelations.SingleAsync();
        Assert.Equal(versionId, relation.StickerVersionId);
        Assert.False(await db.BlockVersions.SingleAsync() is { IsDraft: true }); // derived block is published

        // The running instance + its evidence are completely untouched.
        Assert.Equal(evidenceBefore, await db.Evidence.CountAsync());
        Assert.Equal(instancesBefore, await db.AlbumInstances.CountAsync());
        Assert.Equal(instanceStickersBefore, await db.InstanceStickers.CountAsync());
    }

    [Fact]
    public async Task Materialize_is_idempotent_by_block_name()
    {
        await using var db = NewDb();
        var versionId = Guid.NewGuid();
        db.StickerResources.Add(new StickerResource
        {
            Id = Guid.NewGuid(),
            Title = "A",
            Versions = [new StickerVersion { Id = versionId, VersionNumber = 1, Title = "A" }],
        });
        await db.SaveChangesAsync();

        var specs = TemplateBlockMapping.MapUnitsToBlocks([(1, "Kérdezés")], [(versionId, 1, 1)]);
        await BlockMaterializer.MaterializeAsync(db, specs);
        var secondRun = await BlockMaterializer.MaterializeAsync(db, specs);

        Assert.Empty(secondRun);
        Assert.Equal(1, await db.Blocks.CountAsync());
    }
}
