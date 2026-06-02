using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 6.1: a Modul (Module) composes Témakörök (Topics) BY REFERENCE — a
// ModuleVersion points at TopicVersion rows via ModuleTopicRelation; no copy, and the same
// topic version can be referenced by many modules.
public class ModuleReferenceTests
{
    private static AlbumDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"modules-{Guid.NewGuid()}")
            .Options);

    private static Guid SeedTopicVersion(AlbumDbContext db, string name)
    {
        var topicId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        db.Topics.Add(new Topic
        {
            Id = topicId,
            Name = name,
            Versions = [new TopicVersion { Id = versionId, TopicId = topicId, VersionNumber = 1, IsDraft = false, Name = name }],
        });
        return versionId;
    }

    [Fact]
    public async Task ModuleVersion_references_topic_versions_without_copying()
    {
        await using var db = NewDb();
        var tvA = SeedTopicVersion(db, "Témakör A");
        var tvB = SeedTopicVersion(db, "Témakör B");

        var moduleId = Guid.NewGuid();
        db.Modules.Add(new Module
        {
            Id = moduleId,
            Name = "Erők és kölcsönhatások",
            Versions =
            [
                new ModuleVersion
                {
                    ModuleId = moduleId, VersionNumber = 1, IsDraft = true, Name = "Erők és kölcsönhatások",
                    Topics =
                    [
                        new ModuleTopicRelation { TopicVersionId = tvA, SortOrder = 1 },
                        new ModuleTopicRelation { TopicVersionId = tvB, SortOrder = 2 },
                    ],
                },
            ],
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var relations = await db.ModuleTopicRelations.OrderBy(r => r.SortOrder).ToListAsync();
        Assert.Equal(new[] { tvA, tvB }, relations.Select(r => r.TopicVersionId).ToArray());
        Assert.Equal(2, await db.TopicVersions.CountAsync());
    }

    [Fact]
    public async Task Same_topic_version_can_be_referenced_by_two_modules()
    {
        await using var db = NewDb();
        var tv = SeedTopicVersion(db, "Közös témakör");

        foreach (var name in new[] { "Modul 1", "Modul 2" })
        {
            var moduleId = Guid.NewGuid();
            db.Modules.Add(new Module
            {
                Id = moduleId,
                Name = name,
                Versions = [new ModuleVersion { ModuleId = moduleId, VersionNumber = 1, IsDraft = false, Name = name, Topics = [new ModuleTopicRelation { TopicVersionId = tv, SortOrder = 1 }] }],
            });
        }
        await db.SaveChangesAsync();

        Assert.Equal(2, await db.ModuleTopicRelations.CountAsync(r => r.TopicVersionId == tv));
        Assert.Equal(1, await db.TopicVersions.CountAsync());
    }
}
