using System.Text.Json;

namespace MatricasAlbum.Api.Contracts;

public sealed record GenerateAiAdviceRequest(
    string OwnerType,
    Guid OwnerId,
    string Audience,
    string? TargetType,
    Guid? TargetId,
    string? TargetKey,
    Guid? TeamId,
    Guid? InstanceStickerId);

public sealed record AiCitationDto(
    string SourceId,
    string Label,
    string? Excerpt,
    string? Kind = null);

public sealed record AiAdviceActionDto(
    string Type,
    string Label,
    JsonElement Payload);

public sealed record AiAdviceDto(
    Guid Id,
    Guid? RunId,
    string Audience,
    string OwnerType,
    Guid OwnerId,
    string TargetType,
    Guid? TargetId,
    string? TargetKey,
    string Kind,
    string Severity,
    string Status,
    string Message,
    string? Recommendation,
    IReadOnlyList<string> Questions,
    IReadOnlyList<AiCitationDto> Citations,
    AiAdviceActionDto? Action,
    string? Model,
    string PromptVersion,
    string ProjectionVersion,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? AppliedAt);

public sealed record SetAiAdviceStatusRequest(string Status);

public sealed record ApplyAiAdviceRequest(JsonElement? ActionPayload);

public sealed record ApplyAiAdviceResultDto(
    AiAdviceDto Advice,
    StickerResourceDetailDto? Sticker,
    InstanceStickerDto? InstanceSticker,
    Guid? EvidenceId,
    string? DraftFeedback);

public sealed record CreateStickerAdviceActionPayload(
    string Title,
    string Phase,
    string ShortDescription,
    string StudentInstruction,
    IReadOnlyList<string> TeacherSteps,
    string StudentChoice,
    string ExpectedProduct,
    string EvidenceTypeLabel,
    string ReflectionPrompt,
    string BPlan,
    string LowResource,
    int? Week,
    int? SortOrder);

public sealed record DraftFeedbackAdviceActionPayload(
    Guid EvidenceId,
    string Draft);
