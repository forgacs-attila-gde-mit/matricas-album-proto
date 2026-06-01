namespace MatricasAlbum.Api.Domain;

// Tevékenységtípus — a closed, system-defined taxonomy. Read-only to users and AI
// (the AI only classifies an Activity into one of these, never creates a new type).
public sealed class ActivityType
{
    public string Key { get; set; } = string.Empty;   // natural primary key, e.g. "felfedezo"
    public string Name { get; set; } = string.Empty;   // Hungarian display name, e.g. "Felfedező"
    public string PedagogyModel { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public static class ActivityTypeCatalog
{
    // The six system-defined types. Key/Name/PedagogyModel are taken verbatim from the
    // gold-standard "3. Tevékenységtípus (ActivityType)" spec. The richer per-type
    // attributes (interactionModel, cognitiveFocus, compatibility, examples) are not yet
    // specified per type in the source, so they are deliberately not seeded here — do not
    // invent them; they land when Confluence specifies them.
    public static IReadOnlyList<ActivityType> Seed() =>
    [
        new() { Key = ActivityTypeKeys.Explorer, Name = "Felfedező", PedagogyModel = "exploratory", SortOrder = 1 },
        new() { Key = ActivityTypeKeys.Experimenter, Name = "Kísérletező", PedagogyModel = "experimental", SortOrder = 2 },
        new() { Key = ActivityTypeKeys.Processor, Name = "Feldolgozó", PedagogyModel = "analytical", SortOrder = 3 },
        new() { Key = ActivityTypeKeys.Communicator, Name = "Kommunikációs", PedagogyModel = "communicative", SortOrder = 4 },
        new() { Key = ActivityTypeKeys.Collaborator, Name = "Kollaboratív", PedagogyModel = "collaborative", SortOrder = 5 },
        new() { Key = ActivityTypeKeys.Reflector, Name = "Reflektív", PedagogyModel = "reflective", SortOrder = 6 },
    ];
}
