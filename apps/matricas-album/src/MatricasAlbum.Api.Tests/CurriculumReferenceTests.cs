using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 6.2: a Tanterv (Curriculum) composes Modulok (Modules) BY REFERENCE — a
// CurriculumVersion points at ModuleVersion rows via CurriculumModuleRelation; no copy, and
// the same module version can be referenced by many curricula.
public class CurriculumReferenceTests
{
    private static AlbumDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"curricula-{Guid.NewGuid()}")
            .Options);

    private static Guid SeedModuleVersion(AlbumDbContext db, string name)
    {
        var moduleId = Guid.NewGuid();
        var versionId = Guid.NewGuid();
        db.Modules.Add(new Module
        {
            Id = moduleId,
            Name = name,
            Versions = [new ModuleVersion { Id = versionId, ModuleId = moduleId, VersionNumber = 1, IsDraft = false, Name = name }],
        });
        return versionId;
    }

    [Fact]
    public async Task CurriculumVersion_references_module_versions_without_copying()
    {
        await using var db = NewDb();
        var mvA = SeedModuleVersion(db, "Modul A");
        var mvB = SeedModuleVersion(db, "Modul B");

        var curriculumId = Guid.NewGuid();
        db.Curricula.Add(new Curriculum
        {
            Id = curriculumId,
            Name = "7-8. évfolyam természettudomány",
            Versions =
            [
                new CurriculumVersion
                {
                    CurriculumId = curriculumId, VersionNumber = 1, IsDraft = true, Name = "7-8. évfolyam természettudomány",
                    Modules =
                    [
                        new CurriculumModuleRelation { ModuleVersionId = mvA, SortOrder = 1 },
                        new CurriculumModuleRelation { ModuleVersionId = mvB, SortOrder = 2 },
                    ],
                },
            ],
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var relations = await db.CurriculumModuleRelations.OrderBy(r => r.SortOrder).ToListAsync();
        Assert.Equal(new[] { mvA, mvB }, relations.Select(r => r.ModuleVersionId).ToArray());
        Assert.Equal(2, await db.ModuleVersions.CountAsync());
    }

    [Fact]
    public async Task Same_module_version_can_be_referenced_by_two_curricula()
    {
        await using var db = NewDb();
        var mv = SeedModuleVersion(db, "Közös modul");

        foreach (var name in new[] { "Tanterv 1", "Tanterv 2" })
        {
            var curriculumId = Guid.NewGuid();
            db.Curricula.Add(new Curriculum
            {
                Id = curriculumId,
                Name = name,
                Versions = [new CurriculumVersion { CurriculumId = curriculumId, VersionNumber = 1, IsDraft = false, Name = name, Modules = [new CurriculumModuleRelation { ModuleVersionId = mv, SortOrder = 1 }] }],
            });
        }
        await db.SaveChangesAsync();

        Assert.Equal(2, await db.CurriculumModuleRelations.CountAsync(r => r.ModuleVersionId == mv));
        Assert.Equal(1, await db.ModuleVersions.CountAsync());
    }
}
