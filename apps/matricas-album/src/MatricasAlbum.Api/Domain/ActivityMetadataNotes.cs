namespace MatricasAlbum.Api.Domain;

// Structured activity-planning metadata lifted out of the legacy teacher-step note lines.
public sealed record ActivityMetadataFields(
    string? Subject,
    string? GradeLevel,
    IReadOnlyList<string> Competencies,
    IReadOnlyList<string> NatReferences);

// Backfill helper: earlier the create drawer prepended planning metadata to a sticker's
// teacher steps as prefixed lines ("Tervezési meta: <subject> / <grade>",
// "Kompetenciák: <csv>", "NAT-kapcsolódás: <csv>"). Parse() lifts those into structured
// fields and returns the remaining lines (the genuine pedagogical steps) untouched, so no
// data is lost. New activities send the structured fields directly and skip this path.
public static class ActivityMetadataNotes
{
    private const string TypePrefix = "Tevékenységtípus:";
    private const string PlanningPrefix = "Tervezési meta:";
    private const string CompetenciesPrefix = "Kompetenciák:";
    private const string NatPrefix = "NAT-kapcsolódás:";

    public static (ActivityMetadataFields Fields, IReadOnlyList<string> RemainingSteps) Parse(IEnumerable<string> steps)
    {
        string? subject = null;
        string? gradeLevel = null;
        IReadOnlyList<string> competencies = [];
        IReadOnlyList<string> natReferences = [];
        var remaining = new List<string>();

        foreach (var step in steps)
        {
            var line = step?.Trim() ?? string.Empty;

            if (line.StartsWith(TypePrefix, StringComparison.Ordinal))
            {
                // Already promoted to StickerVersion.ActivityTypeKey (Phase 2); drop the line.
            }
            else if (line.StartsWith(PlanningPrefix, StringComparison.Ordinal))
            {
                var value = line[PlanningPrefix.Length..].Trim();
                var parts = value.Split('/', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length > 0) subject = parts[0];
                if (parts.Length > 1) gradeLevel = parts[1];
            }
            else if (line.StartsWith(CompetenciesPrefix, StringComparison.Ordinal))
            {
                competencies = SplitList(line[CompetenciesPrefix.Length..]);
            }
            else if (line.StartsWith(NatPrefix, StringComparison.Ordinal))
            {
                natReferences = SplitList(line[NatPrefix.Length..]);
            }
            else if (line.Length > 0)
            {
                remaining.Add(line);
            }
        }

        return (new ActivityMetadataFields(subject, gradeLevel, competencies, natReferences), remaining);
    }

    private static IReadOnlyList<string> SplitList(string value) =>
        value.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
}
