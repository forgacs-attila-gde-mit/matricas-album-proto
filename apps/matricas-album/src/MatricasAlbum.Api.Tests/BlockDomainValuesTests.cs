using MatricasAlbum.Api.Domain;

namespace MatricasAlbum.Api.Tests;

// REFACTOR-001 Task 4.1/4.2: Block flow-type and grouping are defaulted enums (an unknown
// value falls back to a sensible default), while the activity role within a block is a
// closed set that rejects unknown values (so the API can 400 on a bad role).
public class BlockDomainValuesTests
{
    [Theory]
    [InlineData("linear", "linear")]
    [InlineData("CYCLICAL", "cyclical")]
    [InlineData("project_based", "project_based")]
    [InlineData("ismeretlen", "linear")]
    [InlineData(null, "linear")]
    public void FlowTypes_Normalize_defaults_to_linear(string? input, string expected)
    {
        Assert.Equal(expected, BlockFlowTypes.Normalize(input));
    }

    [Theory]
    [InlineData("individual", "individual")]
    [InlineData("WHOLE_CLASS", "whole_class")]
    [InlineData("ismeretlen", "group")]
    [InlineData(null, "group")]
    public void Groupings_Normalize_defaults_to_group(string? input, string expected)
    {
        Assert.Equal(expected, BlockGroupings.Normalize(input));
    }

    [Theory]
    [InlineData("primary", "primary")]
    [InlineData("ASSESSMENT", "assessment")]
    [InlineData("transition", "transition")]
    public void Roles_Normalize_accepts_the_closed_set(string input, string expected)
    {
        Assert.Equal(expected, BlockActivityRoles.Normalize(input));
    }

    [Theory]
    [InlineData("ismeretlen")]
    [InlineData("")]
    [InlineData(null)]
    public void Roles_Normalize_rejects_unknown_with_null(string? input)
    {
        Assert.Null(BlockActivityRoles.Normalize(input));
    }

    [Fact]
    public void Closed_sets_have_the_expected_members()
    {
        Assert.Equal(5, BlockFlowTypes.All.Count);
        Assert.Equal(5, BlockGroupings.All.Count);
        Assert.Equal(5, BlockActivityRoles.All.Count);
        Assert.Contains("assessment", BlockActivityRoles.All);
    }
}
