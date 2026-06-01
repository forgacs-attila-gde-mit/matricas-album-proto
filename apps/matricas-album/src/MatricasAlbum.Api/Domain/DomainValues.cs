namespace MatricasAlbum.Api.Domain;

public static class StickerStates
{
    public const string Planned = "tervezett";
    public const string Active = "aktiv";
    public const string Submitted = "bekuldve";
    public const string Pending = "varakozik";
    public const string Revision = "javitas";
    public const string Done = "elkeszult";
    public const string Reflected = "reflektalt";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Planned,
        Active,
        Submitted,
        Pending,
        Revision,
        Done,
        Reflected
    };
}

public static class EvidenceStatuses
{
    public const string Pending = "varakozik";
    public const string Revision = "javitas";
    public const string Done = "elkeszult";
}

public static class TeamProgressStates
{
    public const string Pending = "varakozik";
    public const string Revision = "javitas";
    public const string Done = "elkeszult";
    public const string Reflected = "reflektalt";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Pending, Revision, Done, Reflected
    };
}

public static class DifferentiationPathKeys
{
    public const string Supported = "tamogatott";
    public const string Base = "alap";
    public const string Challenge = "kihivas";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Supported, Base, Challenge
    };

    public static string Normalize(string? value)
    {
        var key = value?.Trim().ToLowerInvariant();
        return key switch
        {
            Supported or "support" or "sup" => Supported,
            Challenge or "challenge" or "chal" => Challenge,
            _ => Base
        };
    }
}

public static class QualityStates
{
    public const string Ok = "ok";
    public const string Warn = "warn";
    public const string Missing = "miss";
}

public static class AdviceStatuses
{
    public const string New = "uj";
    public const string Accepted = "elfogadott";
    public const string Rejected = "elutasitott";
    public const string Applied = "alkalmazott";
    public const string Broken = "hibas";
}

public static class AdviceActions
{
    public const string CreateSticker = "createSticker";
    public const string DraftFeedback = "draftFeedback";
}

public sealed class SeedMarker
{
    public string Id { get; set; } = string.Empty;
    public DateTimeOffset CompletedAt { get; set; } = DateTimeOffset.UtcNow;
}
