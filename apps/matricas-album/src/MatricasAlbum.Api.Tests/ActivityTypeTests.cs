using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 2.2: Tevékenységtípus (ActivityType) is a closed, system-defined
// taxonomy of six. Keys, names and pedagogyModel are sourced verbatim from the
// gold-standard "3. Tevékenységtípus" spec.
public class ActivityTypeTests
{
    public static readonly string[] CanonicalKeys =
        ["felfedezo", "kiserletezo", "feldolgozo", "kommunikacios", "kollaborativ", "reflektiv"];

    [Theory]
    [InlineData("felfedezo")]
    [InlineData("kiserletezo")]
    [InlineData("feldolgozo")]
    [InlineData("kommunikacios")]
    [InlineData("kollaborativ")]
    [InlineData("reflektiv")]
    public void Normalize_accepts_each_canonical_key(string key)
    {
        Assert.Equal(key, ActivityTypeKeys.Normalize(key));
    }

    [Theory]
    [InlineData("FELFEDEZO", "felfedezo")]
    [InlineData("  Kiserletezo  ", "kiserletezo")]
    [InlineData("Reflektiv", "reflektiv")]
    public void Normalize_is_case_insensitive_and_trims(string input, string expected)
    {
        Assert.Equal(expected, ActivityTypeKeys.Normalize(input));
    }

    [Theory]
    [InlineData("ismeretlen")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Normalize_rejects_unknown_with_null_no_fallback(string? input)
    {
        // Closed taxonomy: unknown input is never coerced to a default — unlike
        // DifferentiationPathKeys, there is no "alap"-style fallback.
        Assert.Null(ActivityTypeKeys.Normalize(input));
    }

    [Fact]
    public void All_has_exactly_the_six_keys()
    {
        Assert.Equal(6, ActivityTypeKeys.All.Count);
        foreach (var key in CanonicalKeys)
        {
            Assert.Contains(key, ActivityTypeKeys.All);
        }
    }

    [Fact]
    public void Catalog_seeds_six_distinct_types_with_names_and_models()
    {
        var seed = ActivityTypeCatalog.Seed();

        Assert.Equal(6, seed.Count);
        Assert.Equal(6, seed.Select(t => t.Key).Distinct().Count());
        foreach (var type in seed)
        {
            Assert.Contains(type.Key, ActivityTypeKeys.All);
            Assert.False(string.IsNullOrWhiteSpace(type.Name));
            Assert.False(string.IsNullOrWhiteSpace(type.PedagogyModel));
        }
        // The Hungarian display name is preserved verbatim (diacritics intact).
        Assert.Contains(seed, t => t is { Key: "felfedezo", Name: "Felfedező" });
        Assert.Contains(seed, t => t is { Key: "kiserletezo", Name: "Kísérletező" });
    }

    [Fact]
    public void MatchesFilter_with_no_filter_matches_everything()
    {
        Assert.True(ActivityTypeKeys.MatchesFilter("felfedezo", null));
        Assert.True(ActivityTypeKeys.MatchesFilter("felfedezo", ""));
        Assert.True(ActivityTypeKeys.MatchesFilter(null, "   "));
        // A provided-but-unknown filter is lenient: it narrows nothing rather than erroring.
        Assert.True(ActivityTypeKeys.MatchesFilter("felfedezo", "ismeretlen"));
    }

    [Fact]
    public void MatchesFilter_with_valid_filter_narrows_to_that_type()
    {
        Assert.True(ActivityTypeKeys.MatchesFilter("kiserletezo", "kiserletezo"));
        Assert.True(ActivityTypeKeys.MatchesFilter("KISERLETEZO", "kiserletezo")); // case-insensitive
        Assert.False(ActivityTypeKeys.MatchesFilter("felfedezo", "kiserletezo"));
        Assert.False(ActivityTypeKeys.MatchesFilter(null, "kiserletezo")); // unclassified excluded
    }

    [Fact]
    public async Task SeedActivityTypesAsync_is_idempotent()
    {
        var options = new DbContextOptionsBuilder<AlbumDbContext>()
            .UseInMemoryDatabase($"activity-types-{Guid.NewGuid()}")
            .Options;
        await using var db = new AlbumDbContext(options);

        await DemoSeeder.SeedActivityTypesAsync(db);
        await DemoSeeder.SeedActivityTypesAsync(db);

        Assert.Equal(6, await db.ActivityTypes.CountAsync());
    }
}
