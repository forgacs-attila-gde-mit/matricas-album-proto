namespace MatricasAlbum.Api.Domain;

public sealed class Team
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlbumInstanceId { get; set; }
    public AlbumInstance? AlbumInstance { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public string Color { get; set; } = "#7872d4";

    public List<TeamMember> Members { get; set; } = [];
    public List<Evidence> Evidence { get; set; } = [];
}

public sealed class TeamMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TeamId { get; set; }
    public Team? Team { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
