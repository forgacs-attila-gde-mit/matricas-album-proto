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

public static class ActivityTypeKeys
{
    public const string Explorer = "felfedezo";
    public const string Experimenter = "kiserletezo";
    public const string Processor = "feldolgozo";
    public const string Communicator = "kommunikacios";
    public const string Collaborator = "kollaborativ";
    public const string Reflector = "reflektiv";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Explorer, Experimenter, Processor, Communicator, Collaborator, Reflector
    };

    // Closed, system-defined taxonomy: unknown input is rejected (null), never coerced to
    // a default. Unlike DifferentiationPathKeys there is no fallback — users/AI cannot
    // invent a Tevékenységtípus.
    public static string? Normalize(string? value)
    {
        var key = value?.Trim().ToLowerInvariant();
        return !string.IsNullOrEmpty(key) && All.Contains(key) ? key : null;
    }

    // Filter predicate for the Matricatár facet. An empty or unrecognised filter narrows
    // nothing (matches everything); a valid filter requires the activity's type to equal it.
    // An unclassified activity (null type) is excluded once a concrete filter is applied.
    public static bool MatchesFilter(string? activityTypeKey, string? filter)
    {
        var wanted = Normalize(filter);
        return wanted is null || Normalize(activityTypeKey) == wanted;
    }
}

public static class BlockFlowTypes
{
    public const string Linear = "linear";
    public const string Cyclical = "cyclical";
    public const string Exploratory = "exploratory";
    public const string ProjectBased = "project_based";
    public const string Mixed = "mixed";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Linear, Cyclical, Exploratory, ProjectBased, Mixed
    };

    public static string Normalize(string? value)
    {
        var key = value?.Trim().ToLowerInvariant();
        return !string.IsNullOrEmpty(key) && All.Contains(key) ? key : Linear;
    }
}

public static class BlockGroupings
{
    public const string Individual = "individual";
    public const string Pair = "pair";
    public const string Group = "group";
    public const string WholeClass = "whole_class";
    public const string Dynamic = "dynamic";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Individual, Pair, Group, WholeClass, Dynamic
    };

    public static string Normalize(string? value)
    {
        var key = value?.Trim().ToLowerInvariant();
        return !string.IsNullOrEmpty(key) && All.Contains(key) ? key : Group;
    }
}

public static class BlockActivityRoles
{
    public const string Primary = "primary";
    public const string Supporting = "supporting";
    public const string Optional = "optional";
    public const string Transition = "transition";
    public const string Assessment = "assessment";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Primary, Supporting, Optional, Transition, Assessment
    };

    // Closed set: an unknown role is rejected (null) so the endpoint can 400, never coerced.
    public static string? Normalize(string? value)
    {
        var key = value?.Trim().ToLowerInvariant();
        return !string.IsNullOrEmpty(key) && All.Contains(key) ? key : null;
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
