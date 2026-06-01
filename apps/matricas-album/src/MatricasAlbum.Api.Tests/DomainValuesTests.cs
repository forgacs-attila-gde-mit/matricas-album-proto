using MatricasAlbum.Api.Domain;

namespace MatricasAlbum.Api.Tests;

// Smoke tests for REFACTOR-001 Task 1.1: prove the xUnit harness builds, references
// the API project, and can exercise its domain code. Targets existing pure functions
// (no DB / app boot needed).
public class DomainValuesTests
{
    [Theory]
    [InlineData("support", "tamogatott")]
    [InlineData("SUP", "tamogatott")]
    [InlineData("tamogatott", "tamogatott")]
    [InlineData("challenge", "kihivas")]
    [InlineData("kihivas", "kihivas")]
    [InlineData("alap", "alap")]
    [InlineData("ismeretlen", "alap")]
    [InlineData(null, "alap")]
    public void DifferentiationPathKeys_Normalize_maps_to_canonical_hungarian(string? input, string expected)
    {
        Assert.Equal(expected, DifferentiationPathKeys.Normalize(input));
    }

    [Fact]
    public void DifferentiationPathKeys_All_has_the_three_paths()
    {
        Assert.Equal(3, DifferentiationPathKeys.All.Count);
        Assert.Contains("tamogatott", DifferentiationPathKeys.All);
        Assert.Contains("alap", DifferentiationPathKeys.All);
        Assert.Contains("kihivas", DifferentiationPathKeys.All);
    }
}
