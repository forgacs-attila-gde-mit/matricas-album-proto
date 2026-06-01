namespace MatricasAlbum.Api.Domain.Upgrades;

/// <summary>
/// Pure (no DbContext, no IO) reconciliation between an AlbumInstance bound to v_old
/// and a target v_new of the same template. Returns a categorized change set the
/// commit endpoint applies inside a single transaction.
///
/// Match algorithm (two passes):
///   1. Pair by exact StickerVersionId — instance stickers whose underlying matrica
///      version still exists as-is on the new template version.
///   2. For everything that didn't match, pair by StickerResourceId — same matrica,
///      newer version. These become "Repointed" so evidence + progress stays attached.
///   3. Unmatched instance stickers on the v_old side are "Removed" (split into the
///      no-evidence and with-evidence cases). Unmatched v_new entries are "Added".
/// </summary>
public static class InstanceUpgradePlanner
{
    public static UpgradePlan ComputeUpgradePlan(
        AlbumInstance instance,
        AlbumTemplateVersion oldVersion,
        AlbumTemplateVersion newVersion)
    {
        var instanceStickers = instance.Stickers.Where(s => !s.Deprecated).ToList();
        var newAssignments = newVersion.Stickers.ToList();

        // Pass 1: exact StickerVersionId match.
        var matchedInstanceIds = new HashSet<Guid>();
        var matchedNewIds = new HashSet<Guid>();
        var moved = new List<UpgradePlanItem>();
        var unchanged = new List<UpgradePlanItem>();

        foreach (var instanceSticker in instanceStickers)
        {
            var match = newAssignments.FirstOrDefault(n => n.StickerVersionId == instanceSticker.StickerVersionId);
            if (match is null) continue;
            matchedInstanceIds.Add(instanceSticker.Id);
            matchedNewIds.Add(match.Id);

            var item = BuildItem(instanceSticker, match, instanceSticker.StickerVersion!, instanceSticker.StickerVersion!.VersionNumber);
            if (instanceSticker.Week == match.Week && instanceSticker.SortOrder == match.SortOrder)
            {
                unchanged.Add(item);
            }
            else
            {
                moved.Add(item);
            }
        }

        // Pass 2: same StickerResourceId, different StickerVersionId → repointed.
        var repointed = new List<UpgradePlanItem>();
        var remainingInstance = instanceStickers.Where(s => !matchedInstanceIds.Contains(s.Id)).ToList();
        var remainingNew = newAssignments.Where(n => !matchedNewIds.Contains(n.Id)).ToList();

        foreach (var instanceSticker in remainingInstance.ToList())
        {
            var resourceId = instanceSticker.StickerVersion?.StickerResourceId;
            if (resourceId is null) continue;
            var match = remainingNew.FirstOrDefault(n => n.StickerVersion?.StickerResourceId == resourceId);
            if (match is null) continue;
            matchedInstanceIds.Add(instanceSticker.Id);
            matchedNewIds.Add(match.Id);
            remainingNew.Remove(match);

            repointed.Add(new UpgradePlanItem(
                InstanceStickerId: instanceSticker.Id,
                StickerVersionId: match.StickerVersionId,
                NewStickerVersionId: match.StickerVersionId,
                StickerResourceId: (Guid)resourceId,
                Title: instanceSticker.StickerVersion?.Title ?? string.Empty,
                FromStickerVersionNumber: instanceSticker.StickerVersion?.VersionNumber ?? 0,
                ToStickerVersionNumber: match.StickerVersion?.VersionNumber ?? 0,
                FromWeek: instanceSticker.Week,
                FromSort: instanceSticker.SortOrder,
                ToWeek: match.Week,
                ToSort: match.SortOrder,
                EvidenceCount: instanceSticker.Evidence.Count,
                ProgressCount: instanceSticker.TeamProgress.Count));
        }

        remainingInstance = remainingInstance.Where(s => !matchedInstanceIds.Contains(s.Id)).ToList();

        // What remains: unmatched on either side.
        var removedNoEvidence = new List<UpgradePlanItem>();
        var removedKept = new List<UpgradePlanItem>();
        foreach (var instanceSticker in remainingInstance)
        {
            var item = BuildItem(instanceSticker, target: null, instanceSticker.StickerVersion!, instanceSticker.StickerVersion!.VersionNumber);
            if (instanceSticker.Evidence.Count == 0 && instanceSticker.TeamProgress.Count == 0)
            {
                removedNoEvidence.Add(item);
            }
            else
            {
                removedKept.Add(item);
            }
        }

        var added = remainingNew.Select(n => new UpgradePlanItem(
            InstanceStickerId: null,
            StickerVersionId: n.StickerVersionId,
            NewStickerVersionId: null,
            StickerResourceId: n.StickerVersion?.StickerResourceId ?? Guid.Empty,
            Title: n.StickerVersion?.Title ?? string.Empty,
            FromStickerVersionNumber: 0,
            ToStickerVersionNumber: n.StickerVersion?.VersionNumber ?? 0,
            FromWeek: 0,
            FromSort: 0,
            ToWeek: n.Week,
            ToSort: n.SortOrder,
            EvidenceCount: 0,
            ProgressCount: 0)).ToList();

        // Unit count + DurationType + CurrentWeek clamp.
        var newUnitCount = newVersion.Weeks.Count;
        int? clamp = null;
        if (newUnitCount > 0 && instance.CurrentWeek > newUnitCount)
        {
            clamp = newUnitCount;
        }

        return new UpgradePlan(
            TargetVersionId: newVersion.Id,
            TargetVersionNumber: newVersion.VersionNumber,
            FromDurationType: oldVersion.DurationType,
            ToDurationType: newVersion.DurationType,
            FromUnitCount: oldVersion.Weeks.Count,
            ToUnitCount: newUnitCount,
            CurrentWeekClamp: clamp,
            Added: added,
            RemovedNoEvidence: removedNoEvidence,
            RemovedKeptForEvidence: removedKept,
            Moved: moved,
            Repointed: repointed,
            Unchanged: unchanged);
    }

    private static UpgradePlanItem BuildItem(
        InstanceSticker instanceSticker,
        AlbumTemplateVersionSticker? target,
        StickerVersion stickerVersion,
        int stickerVersionNumber) =>
        new(
            InstanceStickerId: instanceSticker.Id,
            StickerVersionId: instanceSticker.StickerVersionId,
            NewStickerVersionId: null,
            StickerResourceId: stickerVersion.StickerResourceId,
            Title: stickerVersion.Title,
            FromStickerVersionNumber: stickerVersionNumber,
            ToStickerVersionNumber: stickerVersionNumber,
            FromWeek: instanceSticker.Week,
            FromSort: instanceSticker.SortOrder,
            ToWeek: target?.Week ?? instanceSticker.Week,
            ToSort: target?.SortOrder ?? instanceSticker.SortOrder,
            EvidenceCount: instanceSticker.Evidence.Count,
            ProgressCount: instanceSticker.TeamProgress.Count);
}

public sealed record UpgradePlan(
    Guid TargetVersionId,
    int TargetVersionNumber,
    string FromDurationType,
    string ToDurationType,
    int FromUnitCount,
    int ToUnitCount,
    int? CurrentWeekClamp,
    IReadOnlyList<UpgradePlanItem> Added,
    IReadOnlyList<UpgradePlanItem> RemovedNoEvidence,
    IReadOnlyList<UpgradePlanItem> RemovedKeptForEvidence,
    IReadOnlyList<UpgradePlanItem> Moved,
    IReadOnlyList<UpgradePlanItem> Repointed,
    IReadOnlyList<UpgradePlanItem> Unchanged)
{
    /// <summary>True when the plan would not change anything (instance is already on the latest version).</summary>
    public bool IsNoOp =>
        Added.Count == 0 && RemovedNoEvidence.Count == 0 && RemovedKeptForEvidence.Count == 0
        && Moved.Count == 0 && Repointed.Count == 0
        && CurrentWeekClamp is null
        && FromDurationType == ToDurationType
        && FromUnitCount == ToUnitCount;
}

public sealed record UpgradePlanItem(
    Guid? InstanceStickerId,
    Guid StickerVersionId,
    /// <summary>Set for Repointed items: the StickerVersionId we'll rebind to.</summary>
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
