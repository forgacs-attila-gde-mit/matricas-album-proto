namespace MatricasAlbum.Api.Domain;

public sealed class QualityDimension
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OwnerType { get; set; } = "instance";
    public Guid OwnerId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Score { get; set; }
    public string State { get; set; } = "ok";
    public string? Reason { get; set; }
}

public sealed class QualityDimensionChange
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid QualityDimensionId { get; set; }
    public QualityDimension? QualityDimension { get; set; }
    public string TriggerType { get; set; } = string.Empty;
    public Guid? TriggerId { get; set; }
    public int PreviousScore { get; set; }
    public int NewScore { get; set; }
    public string PreviousState { get; set; } = string.Empty;
    public string NewState { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
