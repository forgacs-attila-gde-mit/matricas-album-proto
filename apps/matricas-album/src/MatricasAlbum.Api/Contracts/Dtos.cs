namespace MatricasAlbum.Api.Contracts;

public sealed record StickerResourceListItemDto(
    Guid Id,
    string Title,
    Guid LatestVersionId,
    int LatestVersionNumber,
    string Phase,
    string ShortDescription,
    int TemplateUsageCount,
    DateTimeOffset? ArchivedAt);

public sealed record StickerResourceDetailDto(
    Guid Id,
    string Title,
    DateTimeOffset? ArchivedAt,
    IReadOnlyList<StickerVersionDto> Versions);

public sealed record StickerVersionDto(
    Guid Id,
    Guid StickerResourceId,
    int VersionNumber,
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
    IReadOnlyList<AiNoteDto> AiNotes);

public sealed record AlbumTemplateListItemDto(
    Guid Id,
    string Title,
    string Subject,
    string Grade,
    string DurationType,
    string PatternKey,
    string PatternName,
    string PatternDescription,
    int UnitCount,
    string DrivingQuestion,
    int StickerCount,
    int InstanceCount,
    DateTimeOffset? ArchivedAt,
    bool IsDraftOnly);

public sealed record DifferentiationPathDto(
    string Phase,
    string PathKey,
    string Title,
    string Description,
    string RecommendedFor,
    int SortOrder);

public sealed record AlbumTemplateDetailDto(
    Guid Id,
    DateTimeOffset? ArchivedAt,
    string Title,
    string Subject,
    string Grade,
    string DurationType,
    string PatternKey,
    string PatternName,
    string PatternDescription,
    string DrivingQuestion,
    string FinalProduct,
    string Audience,
    IReadOnlyList<string> ProjectReflectionPrompts,
    IReadOnlyList<DifferentiationPathDto> DifferentiationPaths,
    IReadOnlyList<string> Dispositions,
    IReadOnlyList<WeekPlanDto> Weeks,
    IReadOnlyList<TemplateStickerDto> Stickers,
    IReadOnlyList<AlbumTemplateVersionDto> Versions,
    IReadOnlyList<QualityDimensionDto> QualityDimensions,
    IReadOnlyList<AiNoteDto> AiNotes);

public sealed record AlbumTemplateVersionDto(
    Guid Id,
    Guid AlbumTemplateId,
    int VersionNumber,
    bool IsDraft,
    string Title,
    string Subject,
    string Grade,
    string DurationType,
    string PatternKey,
    string PatternName,
    string PatternDescription,
    string DrivingQuestion,
    string FinalProduct,
    string Audience,
    IReadOnlyList<string> ProjectReflectionPrompts,
    DateTimeOffset CreatedAt,
    IReadOnlyList<DifferentiationPathDto> DifferentiationPaths,
    IReadOnlyList<string> Dispositions,
    IReadOnlyList<WeekPlanDto> Weeks,
    IReadOnlyList<TemplateStickerDto> Stickers);

public sealed record UpdateTemplateVersionStickerRequest(int? Week, int? SortOrder);

public sealed record ReorderTemplateVersionStickersRequest(
    IReadOnlyList<ReorderTemplateVersionStickerItem> Items);

public sealed record ReorderTemplateVersionStickerItem(Guid Id, int Week, int SortOrder);

public sealed record UpdateTemplateVersionMetadataRequest(
    string? Title,
    string? Subject,
    string? Grade,
    string? DurationType,
    string? PatternKey,
    string? PatternName,
    string? PatternDescription,
    string? DrivingQuestion,
    string? FinalProduct,
    string? Audience,
    IReadOnlyList<string>? ProjectReflectionPrompts,
    IReadOnlyList<DifferentiationPathDto>? DifferentiationPaths,
    IReadOnlyList<string>? Dispositions,
    IReadOnlyList<string>? WeekTitles);

public sealed record AlbumInstanceListItemDto(
    Guid Id,
    Guid AlbumTemplateId,
    string TemplateTitle,
    string Title,
    string ClassName,
    string Subject,
    string Grade,
    string DurationType,
    int UnitCount,
    string DrivingQuestion,
    int CurrentWeek,
    int StickerCount,
    int PendingEvidenceCount,
    DateTimeOffset? ArchivedAt);

public sealed record AlbumInstanceDetailDto(
    Guid Id,
    Guid AlbumTemplateId,
    string TemplateTitle,
    DateTimeOffset? TemplateArchivedAt,
    DateTimeOffset? ArchivedAt,
    string Title,
    string ClassName,
    string Subject,
    string Grade,
    string DurationType,
    string DrivingQuestion,
    string FinalProduct,
    string Audience,
    IReadOnlyList<string> ProjectReflectionPrompts,
    IReadOnlyList<DifferentiationPathDto> DifferentiationPaths,
    int CurrentWeek,
    IReadOnlyList<string> Dispositions,
    IReadOnlyList<WeekPlanDto> Weeks,
    IReadOnlyList<TeamDto> Teams,
    IReadOnlyList<InstanceStickerDto> Stickers,
    IReadOnlyList<EvidenceDto> Evidence,
    IReadOnlyList<TeamStickerProgressDto> TeamProgress,
    IReadOnlyList<TeamDifferentiationPathAssignmentDto> TeamDifferentiationPaths,
    IReadOnlyList<AlbumInstanceTeamReflectionDto> TeamReflections,
    IReadOnlyList<TeamHelpRequestDto> HelpRequests,
    TeacherEffectLogDto? TeacherEffectLog,
    IReadOnlyList<ClosureChecklistItemDto> ClosureChecklist,
    IReadOnlyList<QualityDimensionDto> QualityDimensions,
    IReadOnlyList<AiNoteDto> AiNotes);

public sealed record TeamStickerProgressDto(
    Guid InstanceStickerId,
    Guid TeamId,
    string State,
    Guid? LatestEvidenceId,
    string? Reflection,
    DateTimeOffset? ReflectedAt,
    DateTimeOffset UpdatedAt);

public sealed record TeamDifferentiationPathAssignmentDto(
    Guid InstanceStickerId,
    Guid TeamId,
    string PathKey,
    DateTimeOffset AssignedAt);

public sealed record AlbumInstanceTeamReflectionDto(
    Guid TeamId,
    string Text,
    DateTimeOffset UpdatedAt);

public sealed record TeacherEffectLogDto(
    string WorkedWell,
    string EngagementSignals,
    string AdaptationNotes,
    string ReuseNextTime,
    DateTimeOffset UpdatedAt);

public sealed record EvidenceSubmissionDto(
    EvidenceDto Evidence,
    TeamStickerProgressDto Progress);

public sealed record SaveReflectionRequest(string Text);

public sealed record TeamHelpRequestDto(
    Guid Id,
    Guid AlbumInstanceId,
    Guid TeamId,
    Guid? InstanceStickerId,
    string Question,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt);

public sealed record CreateTeamHelpRequest(
    Guid AlbumInstanceId,
    Guid TeamId,
    Guid? InstanceStickerId,
    string Question);

public sealed record WeekPlanDto(int WeekNumber, string Title);

public sealed record TemplateStickerDto(
    Guid Id,
    Guid StickerResourceId,
    Guid StickerVersionId,
    int StickerVersionNumber,
    int Week,
    int SortOrder,
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
    IReadOnlyList<AiNoteDto> AiNotes);

public sealed record InstanceStickerDto(
    Guid Id,
    Guid StickerResourceId,
    Guid StickerVersionId,
    int StickerVersionNumber,
    Guid? AlbumTemplateStickerId,
    int Week,
    int SortOrder,
    string State,
    bool Deprecated,
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
    IReadOnlyList<AiNoteDto> AiNotes);

public sealed record TeamDto(
    Guid Id,
    string Name,
    IReadOnlyList<TeamMemberDto> Members,
    string Focus,
    string Color);

public sealed record TeamMemberDto(Guid Id, string Name);

public sealed record AiNoteDto(
    Guid Id,
    string OwnerType,
    Guid OwnerId,
    string TargetType,
    Guid? TargetId,
    string? TargetKey,
    string Kind,
    string Label,
    string Severity,
    string Message,
    string? Recommendation);

public sealed record EvidenceDto(
    Guid Id,
    Guid InstanceStickerId,
    Guid TeamId,
    string Type,
    string Status,
    string Title,
    string SubmittedBy,
    DateTimeOffset SubmittedAt,
    string Description,
    string? HelpRequest,
    bool HelpRequested,
    string? Reflection,
    string? TeacherFeedback,
    DateTimeOffset? FeedbackAt,
    DateTimeOffset? SeenByTeamAt,
    DateTimeOffset? ArchivedAt);

public sealed record QualityDimensionDto(
    Guid Id,
    string Code,
    string Label,
    int Score,
    string State,
    string? Reason);

public sealed record WorkspaceListsDto(
    IReadOnlyList<StickerResourceListItemDto> Stickers,
    IReadOnlyList<AlbumTemplateListItemDto> Templates,
    IReadOnlyList<AlbumInstanceListItemDto> Instances);

public sealed record CreateStickerRequest(
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
    string LowResource);

public sealed record CreateAlbumTemplateRequest(
    string Title,
    string Subject,
    string Grade,
    string DurationType,
    string? PatternKey,
    string? PatternName,
    string? PatternDescription,
    string DrivingQuestion,
    string FinalProduct,
    string Audience,
    IReadOnlyList<string>? ProjectReflectionPrompts,
    IReadOnlyList<string> Dispositions,
    IReadOnlyList<string> WeekTitles);

public sealed record AssignStickerToTemplateRequest(
    Guid StickerVersionId,
    int Week,
    int SortOrder);

public sealed record CreateAlbumInstanceRequest(
    string Title,
    string ClassName,
    IReadOnlyList<CreateTeamRequest> Teams);

public sealed record UpdateAlbumInstanceRequest(
    string? Title,
    string? ClassName,
    int? CurrentWeek);

public sealed record ReplaceInstanceUnitsRequest(IReadOnlyList<UnitOverrideItem> Items);

public sealed record UnitOverrideItem(int WeekNumber, string Title);

public sealed record UpgradePlanDto(
    Guid TargetVersionId,
    int TargetVersionNumber,
    int CurrentVersionNumber,
    string FromDurationType,
    string ToDurationType,
    int FromUnitCount,
    int ToUnitCount,
    int? CurrentWeekClamp,
    bool IsNoOp,
    IReadOnlyList<UpgradePlanItemDto> Added,
    IReadOnlyList<UpgradePlanItemDto> RemovedNoEvidence,
    IReadOnlyList<UpgradePlanItemDto> RemovedKeptForEvidence,
    IReadOnlyList<UpgradePlanItemDto> Moved,
    IReadOnlyList<UpgradePlanItemDto> Repointed,
    IReadOnlyList<UpgradePlanItemDto> Unchanged);

public sealed record ClosureChecklistItemDto(Guid Id, int SortOrder, string Label, bool Done);

public sealed record UpdateClosureChecklistItemRequest(bool Done);

public sealed record SaveTeacherEffectLogRequest(
    string? WorkedWell,
    string? EngagementSignals,
    string? AdaptationNotes,
    string? ReuseNextTime);

public sealed record ReplaceDifferentiationPathsRequest(IReadOnlyList<DifferentiationPathDto> Paths);

public sealed record SetTeamDifferentiationPathRequest(string? PathKey);

public sealed record UpgradePlanItemDto(
    Guid? InstanceStickerId,
    Guid StickerVersionId,
    Guid? NewStickerVersionId,
    Guid StickerResourceId,
    string Title,
    int FromStickerVersionNumber,
    int ToStickerVersionNumber,
    int FromWeek,
    int FromSort,
    int ToWeek,
    int ToSort,
    int EvidenceCount,
    int ProgressCount);

public sealed record CreateTeamRequest(
    string Name,
    string Focus,
    string Color,
    IReadOnlyList<string> Members);

public sealed record UpdateTeamRequest(string? Name, string? Focus, string? Color);

public sealed record TeamMemberRequest(string Name);

public sealed record TeamDeleteBlockerDto(
    int EvidenceCount,
    int ProgressCount,
    int HelpRequestCount,
    int ReflectionCount);

public sealed record CreateEvidenceRequest(
    Guid InstanceStickerId,
    Guid TeamId,
    string Type,
    string Title,
    string Description,
    string? HelpRequest,
    bool HelpRequested,
    string? Reflection);

public sealed record FeedbackRequest(string TeacherFeedback, string Status);

public sealed record SetStickerStateRequest(string State);

public sealed record CreateInstanceStickerRequest(
    CreateStickerRequest Sticker,
    int? Week,
    int? SortOrder,
    string? State);

public sealed record DuplicateInstanceStickerRequest(int? Week, int? SortOrder);

public sealed record ForkInstanceStickerRequest(CreateStickerRequest Sticker, int? Week, int? SortOrder);

public sealed record UpdateQualityDimensionRequest(
    int? Score,
    string? State,
    string? Reason);
