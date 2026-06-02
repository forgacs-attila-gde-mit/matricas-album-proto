using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 5.1: a Témakör (Topic) composes Blocks BY REFERENCE — a TopicVersion
// points at BlockVersion rows via TopicBlockRelation; it never copies the block, and the same
// block version can be referenced by many topics.
public class TopicReferenceTests
{
    private static AlbumDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"topics-{Guid.NewGuid()}")
            .Options);

    private static (Guid blockId, Guid versionId) SeedBlock(AlbumDbContext db, string name)
    {
        var blockId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        db.Blocks.Add(new Block
        {
            Id = blockId,
            Name = name,
            Versions = [new BlockVersion { Id = versionId, BlockId = blockId, VersionNumber = 1, IsDraft = false, Name = name }],
        });
        return (blockId, versionId);
    }

    [Fact]
    public async Task TopicVersion_references_block_versions_without_copying()
    {
        await using var db = NewDb();
        var (_, bvA) = SeedBlock(db, "Blokk A");
        var (_, bvB) = SeedBlock(db, "Blokk B");

        var topicId = Guid.NewGuid();
        var topicVersionId = Guid.NewGuid();
        db.Topics.Add(new Topic
        {
            Id = topicId,
            Name = "Mozgás témakör",
            Versions =
            [
                new TopicVersion
                {
                    Id = topicVersionId, TopicId = topicId, VersionNumber = 1, IsDraft = true, Name = "Mozgás témakör",
                    Blocks =
                    [
                        new TopicBlockRelation { BlockVersionId = bvA, SortOrder = 1 },
                        new TopicBlockRelation { BlockVersionId = bvB, SortOrder = 2 },
                    ],
                },
            ],
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var relations = await db.TopicBlockRelations.OrderBy(r => r.SortOrder).ToListAsync();
        Assert.Equal(new[] { bvA, bvB }, relations.Select(r => r.BlockVersionId).ToArray());
        // The referenced block versions are untouched (still exactly 2, no duplicates created).
        Assert.Equal(2, await db.BlockVersions.CountAsync());
    }

    [Fact]
    public async Task Same_block_version_can_be_referenced_by_two_topics()
    {
        await using var db = NewDb();
        var (_, bv) = SeedBlock(db, "Közös blokk");

        foreach (var name in new[] { "Témakör 1", "Témakör 2" })
        {
            var topicId = Guid.NewGuid();
            db.Topics.Add(new Topic
            {
                Id = topicId,
                Name = name,
                Versions = [new TopicVersion { TopicId = topicId, VersionNumber = 1, IsDraft = false, Name = name, Blocks = [new TopicBlockRelation { BlockVersionId = bv, SortOrder = 1 }] }],
            });
        }
        await db.SaveChangesAsync();

        Assert.Equal(2, await db.TopicBlockRelations.CountAsync(r => r.BlockVersionId == bv));
        Assert.Equal(1, await db.BlockVersions.CountAsync()); // still one block version, referenced twice
    }
}
