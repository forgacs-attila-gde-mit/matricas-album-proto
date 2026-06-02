using MatricasAlbum.Api.Contracts;
using MatricasAlbum.Api.Data;
using MatricasAlbum.Api.Domain;
using MatricasAlbum.Api.Domain.Upgrades;
using MatricasAlbum.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AlbumDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddHttpClient<AiAdviceAgentClient>(client =>
{
    var baseUrl = builder.Configuration["AiAgent:BaseUrl"] ?? "http://localhost:8010";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromMinutes(3);
})
.AddStandardResilienceHandler(options =>
{
    options.AttemptTimeout.Timeout = TimeSpan.FromMinutes(2);
    options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(3);
    options.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(4);
});
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("ai-advice", limiter =>
    {
        limiter.PermitLimit = 8;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy
            .WithOrigins("http://localhost:4200", "http://localhost:4300", "http://localhost:8080")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend");
app.UseRateLimiter();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AlbumDbContext>();
    await db.Database.MigrateAsync();
    await DemoSeeder.SeedAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var api = app.MapGroup("/api")
    .AddEndpointFilter(DemoAuth.RequireAnyRole);
// Hierarchy entities ship dark behind a feature flag (REFACTOR-001). Defaults to on in
// Development (so the demo stack + tests can exercise them) and off elsewhere unless
// Features:Hierarchy:Block is set explicitly.
var blockFeatureEnabled = app.Configuration.GetValue<bool?>("Features:Hierarchy:Block") ?? app.Environment.IsDevelopment();
var topicFeatureEnabled = app.Configuration.GetValue<bool?>("Features:Hierarchy:Topic") ?? app.Environment.IsDevelopment();
const string PromptVersion = "phase5-v1";
const string GuidedDemoPromptVersion = "phase4-v1-guided-demo";
const string ProjectionVersion = "matricas-methodology-agent-wiki-v1";
const string GuidedDemoHeader = "X-Guided-Demo";
var JsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
var AllowedAdviceStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    AdviceStatuses.New,
    AdviceStatuses.Accepted,
    AdviceStatuses.Rejected,
    AdviceStatuses.Applied,
    AdviceStatuses.Broken
};

api.MapDelete("/demo-maintenance/ai-advice", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var adviceCount = await db.AiAdvices.CountAsync(cancellationToken);
    var runCount = await db.AiAdviceRuns.CountAsync(cancellationToken);

    await db.AiAdvices.ExecuteDeleteAsync(cancellationToken);
    await db.AiAdviceRuns.ExecuteDeleteAsync(cancellationToken);

    return Results.Ok(new { deletedAdvices = adviceCount, deletedRuns = runCount });
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/demo-maintenance/reset", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    await DemoSeeder.ResetAsync(db, cancellationToken);
    var detail = await MapInstanceDetailAsync(db, DemoSeeder.InstanceId, cancellationToken);
    return detail is null
        ? Results.Problem("A demo adatbázis visszaállt, de a kezdő futó album nem tölthető be.", statusCode: StatusCodes.Status500InternalServerError)
        : Results.Ok(detail);
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/demo-maintenance/guided-demo/reset", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    await DemoSeeder.ResetToEmptyAsync(db, cancellationToken);
    return Results.Ok(new WorkspaceListsDto([], [], []));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapGet("/stickers", async (AlbumDbContext db, string? activityType, CancellationToken cancellationToken) =>
{
    var resources = await db.StickerResources
        .AsNoTracking()
        .Include(resource => resource.Versions)
        .OrderBy(resource => resource.Title)
        .ToListAsync(cancellationToken);

    var usageRows = await db.AlbumTemplateVersionStickers
        .AsNoTracking()
        .Include(sticker => sticker.StickerVersion)
        .ToListAsync(cancellationToken);
    var usage = usageRows
        .GroupBy(sticker => sticker.StickerVersion!.StickerResourceId)
        .ToDictionary(group => group.Key, group => group.Count());

    var items = resources
        .Select(resource => new { resource, latest = LatestVersion(resource) })
        .Where(entry => ActivityTypeKeys.MatchesFilter(entry.latest.ActivityTypeKey, activityType))
        .Select(entry => new StickerResourceListItemDto(
            entry.resource.Id,
            UiText(entry.resource.Title),
            entry.latest.Id,
            entry.latest.VersionNumber,
            entry.latest.Phase,
            entry.latest.ActivityTypeKey,
            UiText(entry.latest.ShortDescription),
            usage.GetValueOrDefault(entry.resource.Id),
            entry.resource.ArchivedAt))
        .ToList();

    return Results.Ok(items);
});

api.MapGet("/activity-types", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    // The closed Tevékenységtípus taxonomy, read-only. Users/AI never create types here.
    var types = await db.ActivityTypes
        .AsNoTracking()
        .OrderBy(type => type.SortOrder)
        .Select(type => new ActivityTypeDto(type.Key, type.Name, type.PedagogyModel))
        .ToListAsync(cancellationToken);
    return Results.Ok(types);
});

api.MapPost("/stickers", async (CreateStickerRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "A matrica címe kötelező." });
    }

    if (!string.IsNullOrWhiteSpace(request.ActivityTypeKey) && ActivityTypeKeys.Normalize(request.ActivityTypeKey) is null)
    {
        return Results.BadRequest(new { error = "Ismeretlen tevékenységtípus." });
    }

    var resource = CreateStickerResource(request, Guid.NewGuid(), Guid.NewGuid(), 1);
    db.StickerResources.Add(resource);
    db.AiNotes.Add(new AiNote
    {
        OwnerType = "stickerVersion",
        OwnerId = resource.Versions[0].Id,
        TargetType = "stickerVersion",
        TargetId = resource.Versions[0].Id,
        Kind = "info",
        Label = "Újrahasználható matrica létrejött",
        Severity = "info",
        Message = "Ez a matrica globális erőforrás, albumtervek konkrét verzióként hivatkozhatnak rá.",
        Recommendation = "Ha később módosítod, hozz létre új verziót, hogy a futó albumok stabilak maradjanak."
    });

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/stickers/{resource.Id}", await MapStickerResourceDetailAsync(db, resource.Id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapGet("/stickers/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var detail = await MapStickerResourceDetailAsync(db, id, cancellationToken);
    return detail is null ? Results.NotFound() : Results.Ok(detail);
});

api.MapPatch("/stickers/{id:guid}/archive", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var resource = await db.StickerResources.SingleOrDefaultAsync(r => r.Id == id, cancellationToken);
    if (resource is null)
    {
        return Results.NotFound();
    }
    resource.ArchivedAt = resource.ArchivedAt is null ? DateTimeOffset.UtcNow : null;
    resource.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    var detail = await MapStickerResourceDetailAsync(db, id, cancellationToken);
    return Results.Ok(detail);
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/stickers/{id:guid}/versions", async (Guid id, CreateStickerRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var resource = await db.StickerResources
        .Include(resource => resource.Versions)
        .SingleOrDefaultAsync(resource => resource.Id == id, cancellationToken);

    if (resource is null)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "A matrica címe kötelező." });
    }

    if (!string.IsNullOrWhiteSpace(request.ActivityTypeKey) && ActivityTypeKeys.Normalize(request.ActivityTypeKey) is null)
    {
        return Results.BadRequest(new { error = "Ismeretlen tevékenységtípus." });
    }

    var nextVersionNumber = resource.Versions.Count == 0 ? 1 : resource.Versions.Max(version => version.VersionNumber) + 1;
    var version = CreateStickerVersion(request, id, Guid.NewGuid(), nextVersionNumber);
    resource.Title = request.Title.Trim();
    resource.UpdatedAt = DateTimeOffset.UtcNow;
    resource.Versions.Add(version);

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/stickers/{id}", await MapStickerResourceDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Blokk (Block) API — reference-composed, versioned (Phase 4, behind feature flag) --------
if (blockFeatureEnabled)
{
    api.MapGet("/blocks", async (AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var blocks = await db.Blocks
            .AsNoTracking()
            .Include(block => block.Versions)
            .ThenInclude(version => version.Activities)
            .OrderBy(block => block.Name)
            .ToListAsync(cancellationToken);

        return Results.Ok(blocks.Select(block =>
        {
            var latest = LatestBlockVersion(block);
            return new BlockListItemDto(
                block.Id,
                UiText(block.Name),
                latest.VersionNumber,
                latest.FlowType,
                latest.Grouping,
                latest.Activities.Count,
                block.Versions.Any(version => version.IsDraft),
                block.ArchivedAt);
        }));
    });

    api.MapPost("/blocks", async (CreateBlockRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.BadRequest(new { error = "A blokk neve kötelező." });
        }

        var block = new Block { Name = request.Name.Trim() };
        // v1 starts as an editable draft: create -> fill with activity references -> publish.
        block.Versions.Add(new BlockVersion
        {
            BlockId = block.Id,
            VersionNumber = 1,
            IsDraft = true,
            Name = request.Name.Trim(),
            FlowType = BlockFlowTypes.Normalize(request.FlowType),
            Grouping = BlockGroupings.Normalize(request.Grouping),
        });
        db.Blocks.Add(block);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/blocks/{block.Id}", await MapBlockDetailAsync(db, block.Id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapGet("/blocks/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var detail = await MapBlockDetailAsync(db, id, cancellationToken);
        return detail is null ? Results.NotFound() : Results.Ok(detail);
    });

    api.MapPatch("/blocks/{id:guid}/archive", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await db.Blocks.SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        block.ArchivedAt = block.ArchivedAt is null ? DateTimeOffset.UtcNow : null;
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/blocks/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        if (DraftBlockVersion(block) is not null)
        {
            return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
        }

        var latest = LatestBlockVersion(block);
        var now = DateTimeOffset.UtcNow;
        var draft = new BlockVersion
        {
            BlockId = block.Id,
            VersionNumber = block.Versions.Max(version => version.VersionNumber) + 1,
            IsDraft = true,
            Name = latest.Name,
            FlowType = latest.FlowType,
            Grouping = latest.Grouping,
            CreatedAt = now,
            Activities = latest.Activities
                .OrderBy(activity => activity.SortOrder)
                .Select(activity => new ActivityBlockRelation
                {
                    StickerVersionId = activity.StickerVersionId,
                    Role = activity.Role,
                    SortOrder = activity.SortOrder,
                    AddedAt = now,
                })
                .ToList(),
        };
        block.Versions.Add(draft);
        block.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/blocks/{id}", await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/blocks/{id:guid}/draft/publish", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        if (draft is null) return Results.BadRequest(new { error = "Nincs publikálható blokkvázlat." });
        draft.IsDraft = false;
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapDelete("/blocks/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        // Never strand a block with no published version: only discard a draft that has a
        // published sibling.
        if (draft is not null && block.Versions.Any(version => !version.IsDraft))
        {
            db.BlockVersions.Remove(draft);
            block.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPatch("/block-versions/{versionId:guid}", async (Guid versionId, UpdateBlockVersionRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var version = await db.BlockVersions.SingleOrDefaultAsync(version => version.Id == versionId, cancellationToken);
        if (version is null) return Results.NotFound();
        if (!version.IsDraft) return Results.BadRequest(new { error = "Csak vázlat szerkeszthető." });
        if (request.Name is { } name && !string.IsNullOrWhiteSpace(name)) version.Name = name.Trim();
        if (request.FlowType is not null) version.FlowType = BlockFlowTypes.Normalize(request.FlowType);
        if (request.Grouping is not null) version.Grouping = BlockGroupings.Normalize(request.Grouping);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, version.BlockId, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/blocks/{id:guid}/activities", async (Guid id, AddBlockActivityRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        if (draft is null) return Results.BadRequest(new { error = "Előbb hozz létre egy blokkvázlatot." });

        var role = BlockActivityRoles.Normalize(request.Role) ?? (string.IsNullOrWhiteSpace(request.Role) ? BlockActivityRoles.Primary : null);
        if (role is null) return Results.BadRequest(new { error = "Ismeretlen szerep." });

        if (!await db.StickerVersions.AnyAsync(version => version.Id == request.StickerVersionId, cancellationToken))
        {
            return Results.BadRequest(new { error = "Ismeretlen tevékenység-verzió." });
        }

        var sortOrder = request.SortOrder ?? (draft.Activities.Count == 0 ? 1 : draft.Activities.Max(activity => activity.SortOrder) + 1);
        draft.Activities.Add(new ActivityBlockRelation
        {
            BlockVersionId = draft.Id,
            StickerVersionId = request.StickerVersionId,
            Role = role,
            SortOrder = sortOrder,
        });
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPatch("/blocks/{id:guid}/activities/{relationId:guid}", async (Guid id, Guid relationId, UpdateBlockActivityRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        var relation = draft?.Activities.SingleOrDefault(activity => activity.Id == relationId);
        if (relation is null) return Results.NotFound();

        var role = BlockActivityRoles.Normalize(request.Role);
        if (role is null) return Results.BadRequest(new { error = "Ismeretlen szerep." });
        relation.Role = role;
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapDelete("/blocks/{id:guid}/activities/{relationId:guid}", async (Guid id, Guid relationId, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        var relation = draft?.Activities.SingleOrDefault(activity => activity.Id == relationId);
        if (relation is null) return Results.NotFound();
        db.ActivityBlockRelations.Remove(relation);
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/blocks/{id:guid}/activities/reorder", async (Guid id, ReorderBlockActivitiesRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var block = await BlockGraph(db).SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
        if (block is null) return Results.NotFound();
        var draft = DraftBlockVersion(block);
        if (draft is null) return Results.BadRequest(new { error = "Nincs szerkeszthető blokkvázlat." });

        var targets = (request.Items ?? []).ToDictionary(item => item.Id, item => item.SortOrder);
        // Two-pass write so the unique (BlockVersionId, SortOrder) index never collides mid-swap.
        foreach (var activity in draft.Activities)
        {
            activity.SortOrder += 100000;
        }
        await db.SaveChangesAsync(cancellationToken);
        foreach (var activity in draft.Activities)
        {
            if (targets.TryGetValue(activity.Id, out var sortOrder)) activity.SortOrder = sortOrder;
            else activity.SortOrder -= 100000;
        }
        block.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapBlockDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    // Additive migration helper (Task 4.4): derive published Blocks from a template's latest
    // published version (one block per unit). Idempotent by name; never touches the template,
    // its instances, or any evidence.
    api.MapPost("/album-templates/{id:guid}/derive-blocks", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var template = await TemplateGraph(db).SingleOrDefaultAsync(template => template.Id == id, cancellationToken);
        if (template is null) return Results.NotFound();

        var version = template.Versions
            .Where(version => !version.IsDraft)
            .OrderByDescending(version => version.VersionNumber)
            .FirstOrDefault();
        if (version is null) return Results.BadRequest(new { error = "Nincs publikált albumterv-verzió." });

        var units = version.Weeks.Select(week => (week.WeekNumber, week.Title)).ToList();
        var stickers = version.Stickers.Select(sticker => (sticker.StickerVersionId, sticker.Week, sticker.SortOrder)).ToList();
        var specs = TemplateBlockMapping.MapUnitsToBlocks(units, stickers);
        var created = await BlockMaterializer.MaterializeAsync(db, specs, cancellationToken);

        return Results.Ok(new
        {
            mapped = specs.Count,
            created = created.Count,
            blocks = created.Select(block => new { block.Id, block.Name }).ToList(),
        });
    }).RequireDemoRole(DemoAuth.TeacherRole);
}

// --- Témakör (Topic) API — reference-composed, versioned (Phase 5, behind feature flag) ------
if (topicFeatureEnabled)
{
    api.MapGet("/topics", async (AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topics = await db.Topics
            .AsNoTracking()
            .Include(topic => topic.Versions)
            .ThenInclude(version => version.Blocks)
            .OrderBy(topic => topic.Name)
            .ToListAsync(cancellationToken);

        return Results.Ok(topics.Select(topic =>
        {
            var latest = LatestTopicVersion(topic);
            return new TopicListItemDto(
                topic.Id,
                UiText(topic.Name),
                latest.VersionNumber,
                latest.Blocks.Count,
                topic.Versions.Any(version => version.IsDraft),
                topic.ArchivedAt);
        }));
    });

    api.MapPost("/topics", async (CreateTopicRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.BadRequest(new { error = "A témakör neve kötelező." });
        }

        var topic = new Topic { Name = request.Name.Trim() };
        topic.Versions.Add(new TopicVersion
        {
            TopicId = topic.Id,
            VersionNumber = 1,
            IsDraft = true,
            Name = request.Name.Trim(),
        });
        db.Topics.Add(topic);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/topics/{topic.Id}", await MapTopicDetailAsync(db, topic.Id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapGet("/topics/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var detail = await MapTopicDetailAsync(db, id, cancellationToken);
        return detail is null ? Results.NotFound() : Results.Ok(detail);
    });

    api.MapPatch("/topics/{id:guid}/archive", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await db.Topics.SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        topic.ArchivedAt = topic.ArchivedAt is null ? DateTimeOffset.UtcNow : null;
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/topics/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        if (DraftTopicVersion(topic) is not null)
        {
            return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
        }

        var latest = LatestTopicVersion(topic);
        var now = DateTimeOffset.UtcNow;
        topic.Versions.Add(new TopicVersion
        {
            TopicId = topic.Id,
            VersionNumber = topic.Versions.Max(version => version.VersionNumber) + 1,
            IsDraft = true,
            Name = latest.Name,
            CreatedAt = now,
            Blocks = latest.Blocks
                .OrderBy(block => block.SortOrder)
                .Select(block => new TopicBlockRelation { BlockVersionId = block.BlockVersionId, SortOrder = block.SortOrder, AddedAt = now })
                .ToList(),
        });
        topic.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/topics/{id}", await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/topics/{id:guid}/draft/publish", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        var draft = DraftTopicVersion(topic);
        if (draft is null) return Results.BadRequest(new { error = "Nincs publikálható témakörvázlat." });
        draft.IsDraft = false;
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapDelete("/topics/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        var draft = DraftTopicVersion(topic);
        if (draft is not null && topic.Versions.Any(version => !version.IsDraft))
        {
            db.TopicVersions.Remove(draft);
            topic.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPatch("/topic-versions/{versionId:guid}", async (Guid versionId, UpdateTopicVersionRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var version = await db.TopicVersions.SingleOrDefaultAsync(version => version.Id == versionId, cancellationToken);
        if (version is null) return Results.NotFound();
        if (!version.IsDraft) return Results.BadRequest(new { error = "Csak vázlat szerkeszthető." });
        if (request.Name is { } name && !string.IsNullOrWhiteSpace(name)) version.Name = name.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, version.TopicId, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/topics/{id:guid}/blocks", async (Guid id, AddTopicBlockRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        var draft = DraftTopicVersion(topic);
        if (draft is null) return Results.BadRequest(new { error = "Előbb hozz létre egy témakörvázlatot." });

        if (!await db.BlockVersions.AnyAsync(version => version.Id == request.BlockVersionId, cancellationToken))
        {
            return Results.BadRequest(new { error = "Ismeretlen blokk-verzió." });
        }

        var sortOrder = request.SortOrder ?? (draft.Blocks.Count == 0 ? 1 : draft.Blocks.Max(block => block.SortOrder) + 1);
        draft.Blocks.Add(new TopicBlockRelation { TopicVersionId = draft.Id, BlockVersionId = request.BlockVersionId, SortOrder = sortOrder });
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapDelete("/topics/{id:guid}/blocks/{relationId:guid}", async (Guid id, Guid relationId, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        var draft = DraftTopicVersion(topic);
        var relation = draft?.Blocks.SingleOrDefault(block => block.Id == relationId);
        if (relation is null) return Results.NotFound();
        db.TopicBlockRelations.Remove(relation);
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);

    api.MapPost("/topics/{id:guid}/blocks/reorder", async (Guid id, ReorderTopicBlocksRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
    {
        var topic = await TopicGraph(db).SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
        if (topic is null) return Results.NotFound();
        var draft = DraftTopicVersion(topic);
        if (draft is null) return Results.BadRequest(new { error = "Nincs szerkeszthető témakörvázlat." });

        var targets = (request.Items ?? []).ToDictionary(item => item.Id, item => item.SortOrder);
        foreach (var block in draft.Blocks)
        {
            block.SortOrder += 100000;
        }
        await db.SaveChangesAsync(cancellationToken);
        foreach (var block in draft.Blocks)
        {
            if (targets.TryGetValue(block.Id, out var sortOrder)) block.SortOrder = sortOrder;
            else block.SortOrder -= 100000;
        }
        topic.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(await MapTopicDetailAsync(db, id, cancellationToken));
    }).RequireDemoRole(DemoAuth.TeacherRole);
}

api.MapGet("/album-templates", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var templates = await TemplateGraph(db)
        .AsNoTracking()
        .ToListAsync(cancellationToken);

    var list = templates
        .Select(template => new
        {
            Template = template,
            Version = LatestTemplateVersion(template),
            IsDraftOnly = template.Versions.Count > 0 && template.Versions.All(v => v.IsDraft),
        })
        .OrderBy(item => item.Version.Title)
        .Select(item => new AlbumTemplateListItemDto(
            item.Template.Id,
            UiText(item.Version.Title),
            UiText(item.Version.Subject),
            UiText(item.Version.Grade),
            NormalizeDurationType(item.Version.DurationType),
            NormalizePatternKey(item.Version.PatternKey),
            UiText(PatternName(item.Version.PatternKey, item.Version.PatternName)),
            UiText(PatternDescription(item.Version.PatternKey, item.Version.PatternDescription)),
            item.Version.Weeks.Count,
            UiText(item.Version.DrivingQuestion),
            item.Version.Stickers.Count,
            item.Template.Instances.Count,
            item.Template.ArchivedAt,
            item.IsDraftOnly))
        .ToList();

    return Results.Ok(list);
});

api.MapPost("/album-templates", async (CreateAlbumTemplateRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.DrivingQuestion))
    {
        return Results.BadRequest(new { error = "Az albumterv címe és vezérkérdése kötelező." });
    }

    var now = DateTimeOffset.UtcNow;
    var template = new AlbumTemplate
    {
        Title = request.Title.Trim(),
        Subject = Clean(request.Subject),
        Grade = Clean(request.Grade),
        DurationType = NormalizeDurationType(request.DurationType),
        PatternKey = NormalizePatternKey(request.PatternKey),
        PatternName = PatternName(request.PatternKey, request.PatternName),
        PatternDescription = PatternDescription(request.PatternKey, request.PatternDescription),
        DrivingQuestion = request.DrivingQuestion.Trim(),
        FinalProduct = Clean(request.FinalProduct),
        Audience = Clean(request.Audience),
        CreatedAt = now,
        UpdatedAt = now
    };
    var initialVersion = CreateAlbumTemplateVersion(request, template.Id, Guid.NewGuid(), 1, now);
    // Phase B.1: brand-new templates start in draft state. Teachers fill in details
    // through the detail page's edit mode, then explicitly publish v1 from the draft banner.
    initialVersion.IsDraft = true;
    await AddStarterStickersAsync(db, initialVersion, initialVersion.PatternKey, now, cancellationToken);
    template.Versions.Add(initialVersion);

    db.AlbumTemplates.Add(template);
    db.QualityDimensions.AddRange(DemoSeeder.CreateTemplateQualityDimensions(template.Id));
    db.AiNotes.Add(new AiNote
    {
        OwnerType = "template",
        OwnerId = template.Id,
        TargetType = "albumTemplate",
        TargetId = template.Id,
        Kind = "info",
        Label = "Albumterv létrejött",
        Severity = "info",
        Message = "Ez még újrahasználható terv: csapatok, bizonyítékok és futási állapot majd a futó albumban jelennek meg.",
        Recommendation = "Adj hozzá 3-5 globális matricát konkrét verzióként."
    });

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-templates/{template.Id}", await MapTemplateDetailAsync(db, template.Id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);
api.MapGet("/album-templates/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var detail = await MapTemplateDetailAsync(db, id, cancellationToken);
    return detail is null ? Results.NotFound() : Results.Ok(detail);
});

api.MapPatch("/album-templates/{id:guid}/archive", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await db.AlbumTemplates.SingleOrDefaultAsync(template => template.Id == id, cancellationToken);
    if (template is null)
    {
        return Results.NotFound();
    }

    template.ArchivedAt = template.ArchivedAt is null ? DateTimeOffset.UtcNow : null;
    template.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// Hard-delete a brand-new template that never moved past its initial draft and has no running instances.
// Anything beyond that uses the archive flag instead.
api.MapDelete("/album-templates/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await db.AlbumTemplates
        .Include(t => t.Versions)
        .Include(t => t.Instances)
        .SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
    if (template is null)
    {
        return Results.NotFound();
    }
    if (template.Instances.Count > 0)
    {
        return Results.Conflict(new { error = "Az albumtervhez tartoznak futó albumok, csak archiválható." });
    }
    if (template.Versions.Count != 1 || !template.Versions[0].IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlat állapotú, közzé nem tett albumterv törölhető." });
    }

    db.AlbumTemplates.Remove(template);
    await db.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-templates/{id:guid}/versions", async (Guid id, CreateAlbumTemplateRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);

    if (template is null)
    {
        return Results.NotFound();
    }

    if (DraftTemplateVersion(template) is not null)
    {
        return Results.Conflict(new { error = "Először mentsd vagy vesd el a matricavázlatot." });
    }

    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.DrivingQuestion))
    {
        return Results.BadRequest(new { error = "Az albumterv címe és vezérkérdése kötelező." });
    }

    var latest = LatestTemplateVersion(template);
    var now = DateTimeOffset.UtcNow;
    var nextVersionNumber = template.Versions.Count == 0 ? 1 : template.Versions.Max(version => version.VersionNumber) + 1;
    var version = CreateAlbumTemplateVersion(request, template.Id, Guid.NewGuid(), nextVersionNumber, now);
    version.Stickers = latest.Stickers
        .OrderBy(sticker => sticker.Week)
        .ThenBy(sticker => sticker.SortOrder)
        .Select(sticker => new AlbumTemplateVersionSticker
        {
            StickerVersionId = sticker.StickerVersionId,
            Week = sticker.Week,
            SortOrder = sticker.SortOrder,
            AddedAt = now
        })
        .ToList();
    version.DifferentiationPaths = CloneDifferentiationPaths(DifferentiationPaths(latest));

    template.Title = request.Title.Trim();
    template.Subject = Clean(request.Subject);
    template.Grade = Clean(request.Grade);
    template.DurationType = NormalizeDurationType(request.DurationType);
    template.PatternKey = NormalizePatternKey(request.PatternKey);
    template.PatternName = PatternName(request.PatternKey, request.PatternName);
    template.PatternDescription = PatternDescription(request.PatternKey, request.PatternDescription);
    template.DrivingQuestion = request.DrivingQuestion.Trim();
    template.FinalProduct = Clean(request.FinalProduct);
    template.Audience = Clean(request.Audience);
    template.UpdatedAt = now;
    template.Versions.Add(version);

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-templates/{id}", await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Draft lifecycle for the Phase 4 sticker-management flow ---------------------------------

api.MapPost("/album-templates/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);
    if (template is null)
    {
        return Results.NotFound();
    }

    var existingDraft = DraftTemplateVersion(template);
    if (existingDraft is not null)
    {
        // Idempotent: return the existing draft and the refreshed detail. No new row created.
        return Results.Ok(await MapTemplateDetailAsync(db, id, cancellationToken));
    }

    var latest = LatestTemplateVersion(template);
    var now = DateTimeOffset.UtcNow;
    var nextVersionNumber = template.Versions.Count == 0 ? 2 : template.Versions.Max(version => version.VersionNumber) + 1;

    var draft = new AlbumTemplateVersion
    {
        AlbumTemplateId = template.Id,
        VersionNumber = nextVersionNumber,
        IsDraft = true,
        Title = latest.Title,
        Subject = latest.Subject,
        Grade = latest.Grade,
        DurationType = NormalizeDurationType(latest.DurationType),
        PatternKey = NormalizePatternKey(latest.PatternKey),
        PatternName = PatternName(latest.PatternKey, latest.PatternName),
        PatternDescription = PatternDescription(latest.PatternKey, latest.PatternDescription),
        DrivingQuestion = latest.DrivingQuestion,
        FinalProduct = latest.FinalProduct,
        Audience = latest.Audience,
        ProjectReflectionPromptsJson = latest.ProjectReflectionPromptsJson,
        CreatedAt = now,
        Dispositions = latest.Dispositions
            .OrderBy(disposition => disposition.SortOrder)
            .Select(disposition => new AlbumTemplateVersionDisposition
            {
                Name = disposition.Name,
                SortOrder = disposition.SortOrder
            })
            .ToList(),
        Weeks = latest.Weeks
            .OrderBy(week => week.WeekNumber)
            .Select(week => new AlbumTemplateVersionWeekPlan
            {
                WeekNumber = week.WeekNumber,
                Title = week.Title
            })
            .ToList(),
        DifferentiationPaths = CloneDifferentiationPaths(DifferentiationPaths(latest)),
        Stickers = latest.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .Select(sticker => new AlbumTemplateVersionSticker
            {
                StickerVersionId = sticker.StickerVersionId,
                Week = sticker.Week,
                SortOrder = sticker.SortOrder,
                AddedAt = now
            })
            .ToList()
    };

    template.Versions.Add(draft);
    template.UpdatedAt = now;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-templates/{id}", await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-templates/{id:guid}/draft/publish", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);
    if (template is null)
    {
        return Results.NotFound();
    }

    var draft = DraftTemplateVersion(template);
    if (draft is null)
    {
        return Results.BadRequest(new { error = "Nincs publikálható matricavázlat." });
    }

    draft.IsDraft = false;
    template.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapDelete("/album-templates/{id:guid}/draft", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);
    if (template is null)
    {
        return Results.NotFound();
    }

    var draft = DraftTemplateVersion(template);
    if (draft is null)
    {
        return Results.Ok(await MapTemplateDetailAsync(db, id, cancellationToken));
    }

    db.AlbumTemplateVersions.Remove(draft);
    template.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Draft metadata mutation -----------------------------------------------------------------

api.MapPatch("/album-template-versions/{versionId:guid}", async (
    Guid versionId,
    UpdateTemplateVersionMetadataRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var version = await db.AlbumTemplateVersions
        .Include(v => v.Dispositions)
        .Include(v => v.Weeks)
        .Include(v => v.DifferentiationPaths)
        .SingleOrDefaultAsync(v => v.Id == versionId, cancellationToken);
    if (version is null)
    {
        return Results.NotFound();
    }
    if (!version.IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlat metaadatait lehet szerkeszteni." });
    }

    if (request.Title is { } title) version.Title = title.Trim();
    if (request.Subject is { } subject) version.Subject = Clean(subject);
    if (request.Grade is { } grade) version.Grade = Clean(grade);
    if (request.DurationType is { } durationType) version.DurationType = NormalizeDurationType(durationType);
    if (request.PatternKey is { } patternKey) version.PatternKey = NormalizePatternKey(patternKey);
    if (request.PatternKey is { } || request.PatternName is { })
    {
        version.PatternName = PatternName(version.PatternKey, request.PatternName);
    }
    if (request.PatternKey is { } || request.PatternDescription is { })
    {
        version.PatternDescription = PatternDescription(version.PatternKey, request.PatternDescription);
    }
    if (request.DrivingQuestion is { } drivingQuestion) version.DrivingQuestion = drivingQuestion.Trim();
    if (request.FinalProduct is { } finalProduct) version.FinalProduct = Clean(finalProduct);
    if (request.Audience is { } audience) version.Audience = Clean(audience);
    if (request.ProjectReflectionPrompts is { } prompts) version.ProjectReflectionPromptsJson = SerializeProjectReflectionPrompts(prompts);
    if (request.DifferentiationPaths is { } differentiationPaths)
    {
        db.RemoveRange(version.DifferentiationPaths);
        version.DifferentiationPaths = CloneDifferentiationPaths(NormalizeDifferentiationPaths(differentiationPaths));
    }

    if (request.Dispositions is { } dispositions)
    {
        // Replace-in-place: remove the old set and rebuild from the payload, preserving order.
        db.RemoveRange(version.Dispositions);
        version.Dispositions = dispositions
            .Select((name, index) => name?.Trim())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select((name, index) => new AlbumTemplateVersionDisposition
            {
                AlbumTemplateVersionId = version.Id,
                Name = name!,
                SortOrder = index + 1
            })
            .ToList();
    }

    if (request.WeekTitles is { } weekTitles)
    {
        db.RemoveRange(version.Weeks);
        version.Weeks = weekTitles
            .Select((title, index) => new AlbumTemplateVersionWeekPlan
            {
                AlbumTemplateVersionId = version.Id,
                WeekNumber = index + 1,
                Title = (title ?? string.Empty).Trim()
            })
            .ToList();
    }

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, version.AlbumTemplateId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Per-sticker draft mutations ------------------------------------------------------------

api.MapPost("/album-template-versions/{versionId:guid}/stickers", async (
    Guid versionId,
    AssignStickerToTemplateRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var version = await db.AlbumTemplateVersions
        .Include(v => v.Stickers)
        .SingleOrDefaultAsync(v => v.Id == versionId, cancellationToken);
    if (version is null)
    {
        return Results.NotFound();
    }
    if (!version.IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlatba lehet matricát hozzáadni." });
    }

    var stickerVersionExists = await db.StickerVersions.AnyAsync(sv => sv.Id == request.StickerVersionId, cancellationToken);
    if (!stickerVersionExists)
    {
        return Results.BadRequest(new { error = "Ismeretlen matrica-verzió." });
    }

    var week = Math.Max(1, request.Week);
    var sortOrder = request.SortOrder > 0
        ? request.SortOrder
        : version.Stickers.Where(s => s.Week == week).Select(s => s.SortOrder).DefaultIfEmpty(0).Max() + 1;

    db.AlbumTemplateVersionStickers.Add(new AlbumTemplateVersionSticker
    {
        AlbumTemplateVersionId = version.Id,
        StickerVersionId = request.StickerVersionId,
        Week = week,
        SortOrder = sortOrder
    });
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-templates/{version.AlbumTemplateId}", await MapTemplateDetailAsync(db, version.AlbumTemplateId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPatch("/album-template-versions/{versionId:guid}/stickers/{templateStickerId:guid}", async (
    Guid versionId,
    Guid templateStickerId,
    UpdateTemplateVersionStickerRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var sticker = await db.AlbumTemplateVersionStickers
        .Include(s => s.AlbumTemplateVersion)
        .SingleOrDefaultAsync(s => s.Id == templateStickerId && s.AlbumTemplateVersionId == versionId, cancellationToken);
    if (sticker is null || sticker.AlbumTemplateVersion is null)
    {
        return Results.NotFound();
    }
    if (!sticker.AlbumTemplateVersion.IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlatban lehet matricát átrendezni." });
    }

    if (request.Week is { } week) sticker.Week = Math.Max(1, week);
    if (request.SortOrder is { } sortOrder) sticker.SortOrder = Math.Max(1, sortOrder);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, sticker.AlbumTemplateVersion.AlbumTemplateId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// Bulk reorder/move across units. The unique index on (versionId, Week, SortOrder)
// makes single-row patches collide when two stickers want to swap; this endpoint sidesteps
// that by bumping the affected rows into a high "scratch" sortOrder range first, saving, then
// writing the final values. Both passes run inside one transaction.
api.MapPost("/album-template-versions/{versionId:guid}/stickers/reorder", async (
    Guid versionId,
    ReorderTemplateVersionStickersRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var version = await db.AlbumTemplateVersions
        .Include(v => v.Stickers)
        .SingleOrDefaultAsync(v => v.Id == versionId, cancellationToken);
    if (version is null) return Results.NotFound();
    if (!version.IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlatban lehet matricát átrendezni." });
    }
    if (request.Items is null || request.Items.Count == 0)
    {
        return Results.Ok(await MapTemplateDetailAsync(db, version.AlbumTemplateId, cancellationToken));
    }

    var byId = version.Stickers.ToDictionary(sticker => sticker.Id);
    var affected = new List<(AlbumTemplateVersionSticker Sticker, int TargetWeek, int TargetSort)>();
    foreach (var item in request.Items)
    {
        if (!byId.TryGetValue(item.Id, out var sticker)) continue;
        affected.Add((sticker, Math.Max(1, item.Week), Math.Max(1, item.SortOrder)));
    }
    if (affected.Count == 0)
    {
        return Results.Ok(await MapTemplateDetailAsync(db, version.AlbumTemplateId, cancellationToken));
    }

    await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
    // Pass 1: shove each affected row to a unique scratch sortOrder so the unique index
    // cannot see two rows competing for the same slot during reassignment.
    var scratchBase = 100_000;
    for (var i = 0; i < affected.Count; i++)
    {
        affected[i].Sticker.SortOrder = scratchBase + i;
    }
    await db.SaveChangesAsync(cancellationToken);

    // Pass 2: write the real target Week + SortOrder.
    foreach (var (sticker, targetWeek, targetSort) in affected)
    {
        sticker.Week = targetWeek;
        sticker.SortOrder = targetSort;
    }
    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, version.AlbumTemplateId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapDelete("/album-template-versions/{versionId:guid}/stickers/{templateStickerId:guid}", async (
    Guid versionId,
    Guid templateStickerId,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var sticker = await db.AlbumTemplateVersionStickers
        .Include(s => s.AlbumTemplateVersion)
        .SingleOrDefaultAsync(s => s.Id == templateStickerId && s.AlbumTemplateVersionId == versionId, cancellationToken);
    if (sticker is null || sticker.AlbumTemplateVersion is null)
    {
        return Results.NotFound();
    }
    if (!sticker.AlbumTemplateVersion.IsDraft)
    {
        return Results.Conflict(new { error = "Csak vázlatból lehet matricát eltávolítani." });
    }

    var templateId = sticker.AlbumTemplateVersion.AlbumTemplateId;
    db.AlbumTemplateVersionStickers.Remove(sticker);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapTemplateDetailAsync(db, templateId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-templates/{id:guid}/stickers", async (Guid id, AssignStickerToTemplateRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);

    if (template is null)
    {
        return Results.NotFound();
    }

    var versionExists = await db.StickerVersions.AnyAsync(version => version.Id == request.StickerVersionId, cancellationToken);
    if (!versionExists)
    {
        return Results.BadRequest(new { error = "Ismeretlen matrica-verzió." });
    }

    var latest = LatestTemplateVersion(template);
    var week = Math.Max(1, request.Week);
    var sortOrder = request.SortOrder > 0
        ? request.SortOrder
        : latest.Stickers.Where(sticker => sticker.Week == week).Select(sticker => sticker.SortOrder).DefaultIfEmpty(0).Max() + 1;

    db.AlbumTemplateVersionStickers.Add(new AlbumTemplateVersionSticker
    {
        AlbumTemplateVersionId = latest.Id,
        StickerVersionId = request.StickerVersionId,
        Week = week,
        SortOrder = sortOrder
    });
    template.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-templates/{id}", await MapTemplateDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-templates/{id:guid}/instances", async (Guid id, CreateAlbumInstanceRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var template = await TemplateGraph(db)
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);

    if (template is null)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "A futó album neve kötelező." });
    }

    var templateVersion = LatestTemplateVersion(template);
    var instance = new AlbumInstance
    {
        AlbumTemplateId = template.Id,
        AlbumTemplateVersionId = templateVersion.Id,
        Title = request.Title.Trim(),
        ClassName = Clean(request.ClassName),
        CurrentWeek = 1,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
        Stickers = templateVersion.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .Select(sticker => new InstanceSticker
            {
                AlbumTemplateVersionStickerId = sticker.Id,
                StickerVersionId = sticker.StickerVersionId,
                Week = sticker.Week,
                SortOrder = sticker.SortOrder,
                State = sticker.Week == 1 ? StickerStates.Active : StickerStates.Planned
            })
            .ToList(),
        Teams = (request.Teams ?? []).Select(CreateTeam).ToList(),
        ClosureChecklist = DefaultClosureChecklistItems().ToList(),
    };

    db.AlbumInstances.Add(instance);
    db.QualityDimensions.AddRange(DemoSeeder.CreateInstanceQualityDimensions(instance.Id, early: true));
    db.AiNotes.Add(new AiNote
    {
        OwnerType = "instance",
        OwnerId = instance.Id,
        TargetType = "albumInstance",
        TargetId = instance.Id,
        Kind = "info",
        Label = "Futó album elindítva",
        Severity = "info",
        Message = "A futó album saját csapatokkal, matricaállapotokkal és bizonyíték-portfólióval indult el.",
        Recommendation = "A diák nézet mindig ezt a futó albumot használja, nem az albumtervet."
    });

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/album-instances/{instance.Id}", await MapInstanceDetailAsync(db, instance.Id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapGet("/album-instances", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var rows = await db.AlbumInstances
        .AsNoTracking()
        .Include(instance => instance.AlbumTemplate)
        .Include(instance => instance.AlbumTemplateVersion)
            .ThenInclude(version => version!.Weeks)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.Evidence)
        .OrderBy(instance => instance.Title)
        .ToListAsync(cancellationToken);

    var instances = rows
        .Select(instance => new AlbumInstanceListItemDto(
            instance.Id,
            instance.AlbumTemplateId,
            instance.AlbumTemplateVersion!.Title,
            instance.Title,
            instance.ClassName,
            instance.AlbumTemplateVersion.Subject,
            instance.AlbumTemplateVersion.Grade,
            NormalizeDurationType(instance.AlbumTemplateVersion.DurationType),
            instance.AlbumTemplateVersion.Weeks.Count,
            instance.AlbumTemplateVersion.DrivingQuestion,
            instance.CurrentWeek,
            instance.Stickers.Count,
            instance.Stickers.SelectMany(sticker => sticker.Evidence).Count(evidence => evidence.ArchivedAt == null && evidence.Status == EvidenceStatuses.Pending),
            instance.ArchivedAt))
        .ToList();

    return Results.Ok(instances);
});

api.MapGet("/album-instances/{id:guid}", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var detail = await MapInstanceDetailAsync(db, id, cancellationToken);
    return detail is null ? Results.NotFound() : Results.Ok(detail);
});

// Edit instance metadata (title, className, currentWeek). DurationType / Subject /
// Grade are inherited from the bound template version and intentionally not editable here.
api.MapPatch("/album-instances/{id:guid}", async (
    Guid id,
    UpdateAlbumInstanceRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Weeks)
        .SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
    if (instance is null) return Results.NotFound();

    if (request.Title is { } title)
    {
        var trimmed = title.Trim();
        if (string.IsNullOrEmpty(trimmed)) return Results.BadRequest(new { error = "A futó album neve nem lehet üres." });
        instance.Title = trimmed;
    }
    if (request.ClassName is { } className) instance.ClassName = Clean(className);
    if (request.CurrentWeek is { } week)
    {
        var unitCount = instance.AlbumTemplateVersion?.Weeks.Count ?? 0;
        if (week < 1 || (unitCount > 0 && week > unitCount))
        {
            return Results.BadRequest(new { error = $"Az aktuális egység 1 és {unitCount} között lehet." });
        }
        instance.CurrentWeek = week;
    }
    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-instances/{id:guid}/stickers", async (
    Guid id,
    CreateInstanceStickerRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(instance => instance.AlbumTemplateVersion)
            .ThenInclude(version => version!.Weeks)
        .SingleOrDefaultAsync(instance => instance.Id == id, cancellationToken);
    if (instance is null)
    {
        return Results.NotFound();
    }

    var validationError = ValidateStickerRequest(request.Sticker);
    if (validationError is not null)
    {
        return Results.BadRequest(new { error = validationError });
    }

    var requestedState = NormalizeOptionalStickerState(request.State);
    if (request.State is not null && requestedState is null)
    {
        return Results.BadRequest(new { error = "Ismeretlen matricaallapot." });
    }

    var week = ClampInstanceWeek(request.Week ?? instance.CurrentWeek, instance);
    var sortOrder = request.SortOrder is > 0
        ? request.SortOrder.Value
        : await NextInstanceSortOrderAsync(db, id, week, cancellationToken);
    var resource = CreateStickerResource(request.Sticker, Guid.NewGuid(), Guid.NewGuid(), 1);
    var sticker = new InstanceSticker
    {
        AlbumInstanceId = id,
        StickerVersionId = resource.Versions[0].Id,
        Week = week,
        SortOrder = sortOrder,
        State = requestedState ?? StickerStates.Planned,
    };

    db.StickerResources.Add(resource);
    db.InstanceStickers.Add(sticker);
    db.AiNotes.Add(InstanceStickerNote(id, sticker.Id, "Instance-only matrica", "Ez a matrica csak a futó albumban jött létre; a sablontervet nem módosítja."));
    instance.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/instance-stickers/{sticker.Id}", await MapInstanceStickerForResponseAsync(db, sticker.Id, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/instance-stickers/{id:guid}/duplicate", async (
    Guid id,
    DuplicateInstanceStickerRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var source = await db.InstanceStickers
        .Include(sticker => sticker.AlbumInstance)
            .ThenInclude(instance => instance!.AlbumTemplateVersion)
                .ThenInclude(version => version!.Weeks)
        .SingleOrDefaultAsync(sticker => sticker.Id == id, cancellationToken);
    if (source is null || source.AlbumInstance is null)
    {
        return Results.NotFound();
    }

    var week = ClampInstanceWeek(request.Week ?? source.Week, source.AlbumInstance);
    var sortOrder = request.SortOrder is > 0
        ? request.SortOrder.Value
        : await NextInstanceSortOrderAsync(db, source.AlbumInstanceId, week, cancellationToken);
    var copy = new InstanceSticker
    {
        AlbumInstanceId = source.AlbumInstanceId,
        StickerVersionId = source.StickerVersionId,
        Week = week,
        SortOrder = sortOrder,
        State = StickerStates.Planned,
    };

    db.InstanceStickers.Add(copy);
    db.AiNotes.Add(InstanceStickerNote(source.AlbumInstanceId, copy.Id, "Matrica duplikálva", "A másolat csak ebben a futó albumban jelent meg; a sablonterv változatlan maradt."));
    source.AlbumInstance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/instance-stickers/{copy.Id}", await MapInstanceStickerForResponseAsync(db, copy.Id, source.AlbumInstanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/instance-stickers/{id:guid}/fork", async (
    Guid id,
    ForkInstanceStickerRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var source = await db.InstanceStickers
        .Include(sticker => sticker.AlbumInstance)
            .ThenInclude(instance => instance!.AlbumTemplateVersion)
                .ThenInclude(version => version!.Weeks)
        .Include(sticker => sticker.Evidence)
        .Include(sticker => sticker.TeamProgress)
        .SingleOrDefaultAsync(sticker => sticker.Id == id, cancellationToken);
    if (source is null || source.AlbumInstance is null)
    {
        return Results.NotFound();
    }

    var validationError = ValidateStickerRequest(request.Sticker);
    if (validationError is not null)
    {
        return Results.BadRequest(new { error = validationError });
    }

    var resource = CreateStickerResource(request.Sticker, Guid.NewGuid(), Guid.NewGuid(), 1);
    var targetStickerId = source.Id;
    var hasWork = source.Evidence.Count > 0 || source.TeamProgress.Count > 0;
    var week = ClampInstanceWeek(request.Week ?? source.Week, source.AlbumInstance);
    db.StickerResources.Add(resource);

    if (hasWork)
    {
        var sortOrder = request.SortOrder is > 0
            ? request.SortOrder.Value
            : await NextInstanceSortOrderAsync(db, source.AlbumInstanceId, week, cancellationToken);
        var copy = new InstanceSticker
        {
            AlbumInstanceId = source.AlbumInstanceId,
            StickerVersionId = resource.Versions[0].Id,
            Week = week,
            SortOrder = sortOrder,
            State = StickerStates.Planned,
        };
        db.InstanceStickers.Add(copy);
        targetStickerId = copy.Id;
        db.AiNotes.Add(InstanceStickerNote(source.AlbumInstanceId, copy.Id, "Javított másolat", "Az eredeti matrica beadásai érintetlenek maradtak; a szerkesztés új futó matricaként jelent meg."));
    }
    else
    {
        source.StickerVersionId = resource.Versions[0].Id;
        source.AlbumTemplateStickerId = null;
        source.AlbumTemplateVersionStickerId = null;
        source.SortOrder = request.SortOrder is > 0
            ? request.SortOrder.Value
            : week == source.Week
                ? source.SortOrder
                : await NextInstanceSortOrderAsync(db, source.AlbumInstanceId, week, cancellationToken);
        source.Week = week;
        source.Deprecated = false;
        db.AiNotes.Add(InstanceStickerNote(source.AlbumInstanceId, source.Id, "Instance-only szerkesztés", "A szerkesztés csak ezt a futó matricát érinti; a sablonterv változatlan maradt."));
    }

    source.AlbumInstance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceStickerForResponseAsync(db, targetStickerId, source.AlbumInstanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapGet("/album-instances/{id:guid}/quality", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var exists = await db.AlbumInstances.AnyAsync(instance => instance.Id == id, cancellationToken);
    if (!exists)
    {
        return Results.NotFound();
    }

    var dimensions = await db.QualityDimensions
        .AsNoTracking()
        .Where(dimension => dimension.OwnerType == "instance" && dimension.OwnerId == id)
        .OrderBy(dimension => dimension.Label)
        .Select(dimension => new QualityDimensionDto(dimension.Id, dimension.Code, dimension.Label, dimension.Score, dimension.State, dimension.Reason))
        .ToListAsync(cancellationToken);

    return Results.Ok(dimensions);
});

api.MapPatch("/quality-dimensions/{id:guid}", async (
    Guid id,
    UpdateQualityDimensionRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var dimension = await db.QualityDimensions.SingleOrDefaultAsync(dimension => dimension.Id == id, cancellationToken);
    if (dimension is null)
    {
        return Results.NotFound();
    }

    var previousScore = dimension.Score;
    var previousState = dimension.State;
    var nextScore = request.Score.HasValue ? Math.Clamp(request.Score.Value, 0, 100) : dimension.Score;
    var nextState = string.IsNullOrWhiteSpace(request.State) ? dimension.State : request.State.Trim();
    if (nextState is not (QualityStates.Ok or QualityStates.Warn or QualityStates.Missing))
    {
        return Results.BadRequest(new { error = "Ismeretlen minőségi állapot." });
    }

    var reason = Clean(request.Reason);
    dimension.Score = nextScore;
    dimension.State = nextState;
    dimension.Reason = string.IsNullOrWhiteSpace(reason) ? null : reason;
    db.QualityDimensionChanges.Add(new QualityDimensionChange
    {
        QualityDimensionId = dimension.Id,
        TriggerType = "teacherEdit",
        TriggerId = dimension.OwnerId,
        PreviousScore = previousScore,
        NewScore = nextScore,
        PreviousState = previousState,
        NewState = nextState,
        Reason = dimension.Reason ?? "Tanári módosítás."
    });

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(MapQualityDimension(dimension));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/ai-advice/generate", async (
    GenerateAiAdviceRequest request,
    AlbumDbContext db,
    AiAdviceAgentClient agent,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var ownerType = Clean(request.OwnerType);
    var audience = Clean(request.Audience);
    if (ownerType != "instance" && ownerType != "template")
    {
        return Results.BadRequest(new { error = "Ismeretlen AI tanács owner." });
    }

    if (audience != "teacher" && audience != "student")
    {
        return Results.BadRequest(new { error = "A tanács célközönsége csak teacher vagy student lehet." });
    }

    var snapshot = await BuildAdviceSnapshotAsync(db, request, cancellationToken);
    if (snapshot is null)
    {
        return Results.NotFound();
    }

    var guidedDemo = IsGuidedDemoRequest(httpContext);
    var effectivePromptVersion = guidedDemo ? GuidedDemoPromptVersion : PromptVersion;
    var snapshotHash = HashSnapshot(snapshot.Value);
    var cachedRunId = await db.AiAdviceRuns
        .AsNoTracking()
        .Where(run =>
            run.OwnerType == ownerType &&
            run.OwnerId == request.OwnerId &&
            run.Audience == audience &&
            run.TargetType == (string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim()) &&
            run.TargetId == request.TargetId &&
            run.TargetKey == (string.IsNullOrWhiteSpace(request.TargetKey) ? null : request.TargetKey.Trim()) &&
            run.SnapshotHash == snapshotHash &&
            run.Status == "completed" &&
            run.PromptVersion == effectivePromptVersion &&
            run.ProjectionVersion == ProjectionVersion)
        .OrderByDescending(run => run.CompletedAt ?? run.StartedAt)
        .Select(run => (Guid?)run.Id)
        .FirstOrDefaultAsync(cancellationToken);
    if (cachedRunId.HasValue)
    {
        var cachedAdvices = await db.AiAdvices
            .AsNoTracking()
            .Where(advice => advice.RunId == cachedRunId.Value)
            .OrderByDescending(advice => advice.CreatedAt)
            .ToListAsync(cancellationToken);
        if (cachedAdvices.Count > 0)
        {
            return Results.Ok(cachedAdvices.Select(MapAiAdvice).ToList());
        }
    }

    var run = new AiAdviceRun
    {
        Audience = audience,
        OwnerType = ownerType,
        OwnerId = request.OwnerId,
        TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? null : request.TargetType.Trim(),
        TargetId = request.TargetId,
        TargetKey = string.IsNullOrWhiteSpace(request.TargetKey) ? null : request.TargetKey.Trim(),
        SnapshotHash = snapshotHash,
        Status = "started",
        PromptVersion = effectivePromptVersion,
        ProjectionVersion = ProjectionVersion,
        StartedAt = DateTimeOffset.UtcNow
    };

    db.AiAdviceRuns.Add(run);
    await db.SaveChangesAsync(cancellationToken);

    try
    {
        var response = guidedDemo
            ? BuildGuidedDemoAdviceResponse(request, snapshot.Value)
            : await agent.GenerateAsync(new AgentAdviceRequest(
                audience,
                ownerType,
                request.OwnerId,
                run.TargetType,
                run.TargetId,
                run.TargetKey,
                effectivePromptVersion,
                ProjectionVersion,
                snapshot.Value,
                run.Id.ToString("D")),
                cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var advices = response.Advices
            .Select(item => CreateAdviceFromAgentItem(item, run, request, now))
            .ToList();

        run.Status = "completed";
        run.CompletedAt = now;
        run.Model = advices.FirstOrDefault()?.Model;
        db.AiAdvices.AddRange(advices);
        await db.SaveChangesAsync(cancellationToken);

        return Results.Created($"/api/ai-advice?ownerType={ownerType}&ownerId={request.OwnerId}&audience={audience}",
            advices.Select(MapAiAdvice).ToList());
    }
    catch (Exception ex)
    {
        run.Status = "failed";
        run.Error = ex.Message;
        run.CompletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Problem("Az AI tanácsadó service nem elérhető vagy érvénytelen választ adott.", statusCode: StatusCodes.Status502BadGateway);
    }
})
.AddEndpointFilter(DemoAuth.RequireAdviceAudienceRole)
.RequireRateLimiting("ai-advice");

api.MapGet("/ai-advice", async (
    string ownerType,
    Guid ownerId,
    string? audience,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var query = db.AiAdvices
        .AsNoTracking()
        .Where(advice => advice.OwnerType == ownerType && advice.OwnerId == ownerId);

    if (!string.IsNullOrWhiteSpace(audience))
    {
        query = query.Where(advice => advice.Audience == audience);
    }

    var advices = await query
        .OrderByDescending(advice => advice.CreatedAt)
        .Take(40)
        .ToListAsync(cancellationToken);

    return Results.Ok(advices.Select(MapAiAdvice));
});

api.MapPatch("/ai-advice/{id:guid}/status", async (
    Guid id,
    SetAiAdviceStatusRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var advice = await db.AiAdvices.SingleOrDefaultAsync(advice => advice.Id == id, cancellationToken);
    if (advice is null)
    {
        return Results.NotFound();
    }

    var status = Clean(request.Status);
    if (!AllowedAdviceStatuses.Contains(status))
    {
        return Results.BadRequest(new { error = "Ismeretlen tanácsállapot." });
    }

    advice.Status = status;
    advice.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(MapAiAdvice(advice));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/ai-advice/{id:guid}/apply", async (
    Guid id,
    ApplyAiAdviceRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var advice = await db.AiAdvices.SingleOrDefaultAsync(advice => advice.Id == id, cancellationToken);
    if (advice is null)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(advice.ActionType))
    {
        return Results.BadRequest(new { error = "Ehhez a tanácshoz nincs alkalmazható akció." });
    }

    var payloadJson = request.ActionPayload.HasValue && request.ActionPayload.Value.ValueKind != JsonValueKind.Undefined
        ? request.ActionPayload.Value.GetRawText()
        : advice.ActionPayloadJson;
    if (string.IsNullOrWhiteSpace(payloadJson))
    {
        return Results.BadRequest(new { error = "Hiányzik az akció payload." });
    }

    if (advice.ActionType == "createSticker")
    {
        var payload = JsonSerializer.Deserialize<CreateStickerAdviceActionPayload>(payloadJson, JsonOptions);
        if (payload is null || string.IsNullOrWhiteSpace(payload.Title))
        {
            return Results.BadRequest(new { error = "A matrica draft címe kötelező." });
        }

        var stickerRequest = new CreateStickerRequest(
            payload.Title,
            payload.Phase,
            payload.ShortDescription,
            payload.StudentInstruction,
            payload.TeacherSteps,
            payload.StudentChoice,
            payload.ExpectedProduct,
            payload.EvidenceTypeLabel,
            payload.ReflectionPrompt,
            payload.BPlan,
            payload.LowResource);
        var resource = CreateStickerResource(stickerRequest, Guid.NewGuid(), Guid.NewGuid(), 1);
        db.StickerResources.Add(resource);

        InstanceSticker? instanceSticker = null;
        if (advice.OwnerType == "instance")
        {
            var instance = await db.AlbumInstances
                .Include(instance => instance.Stickers)
                .SingleOrDefaultAsync(instance => instance.Id == advice.OwnerId, cancellationToken);
            if (instance is null)
            {
                return Results.BadRequest(new { error = "Az AI tanács futtatott albuma már nem található." });
            }

            var week = Math.Max(1, payload.Week ?? instance.CurrentWeek);
            var sortOrder = payload.SortOrder.GetValueOrDefault();
            if (sortOrder <= 0)
            {
                sortOrder = instance.Stickers
                    .Where(sticker => sticker.Week == week)
                    .Select(sticker => sticker.SortOrder)
                    .DefaultIfEmpty(0)
                    .Max() + 1;
            }

            instanceSticker = new InstanceSticker
            {
                AlbumInstanceId = instance.Id,
                StickerVersionId = resource.Versions[0].Id,
                Week = week,
                SortOrder = sortOrder,
                State = week == instance.CurrentWeek ? StickerStates.Active : StickerStates.Planned
            };
            db.InstanceStickers.Add(instanceSticker);
            instance.UpdatedAt = DateTimeOffset.UtcNow;
        }

        advice.Status = AdviceStatuses.Applied;
        advice.AppliedAt = DateTimeOffset.UtcNow;
        advice.UpdatedAt = advice.AppliedAt.Value;
        advice.ActionPayloadJson = payloadJson;
        await db.SaveChangesAsync(cancellationToken);

        InstanceStickerDto? instanceStickerDto = null;
        if (instanceSticker is not null)
        {
            var saved = await db.InstanceStickers
                .Include(sticker => sticker.StickerVersion)
                .ThenInclude(version => version!.StickerResource)
                .Include(sticker => sticker.StickerVersion)
                .ThenInclude(version => version!.TeacherSteps)
                .SingleAsync(sticker => sticker.Id == instanceSticker.Id, cancellationToken);
            var notes = await LoadNotesAsync(db, "instance", advice.OwnerId, cancellationToken);
            instanceStickerDto = MapInstanceSticker(saved, notes);
        }

        var stickerDetail = await MapStickerResourceDetailAsync(db, resource.Id, cancellationToken);
        return Results.Ok(new ApplyAiAdviceResultDto(MapAiAdvice(advice), stickerDetail, instanceStickerDto, null, null));
    }

    if (advice.ActionType == "draftFeedback")
    {
        var payload = JsonSerializer.Deserialize<DraftFeedbackAdviceActionPayload>(payloadJson, JsonOptions);
        if (payload is null || payload.EvidenceId == Guid.Empty || string.IsNullOrWhiteSpace(payload.Draft))
        {
            return Results.BadRequest(new { error = "Ervenytelen feedback draft payload." });
        }

        advice.Status = AdviceStatuses.Applied;
        advice.AppliedAt = DateTimeOffset.UtcNow;
        advice.UpdatedAt = advice.AppliedAt.Value;
        advice.ActionPayloadJson = payloadJson;
        await db.SaveChangesAsync(cancellationToken);

        return Results.Ok(new ApplyAiAdviceResultDto(MapAiAdvice(advice), null, null, payload.EvidenceId, payload.Draft));
    }

    return Results.BadRequest(new { error = "Ismeretlen AI akciótípus." });
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapGet("/evidence/pending", async (AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var pendingEvidence = await db.Evidence
        .AsNoTracking()
        .Where(evidence => evidence.ArchivedAt == null && evidence.Status == EvidenceStatuses.Pending)
        .OrderBy(evidence => evidence.SubmittedAt)
        .ToListAsync(cancellationToken);

    return Results.Ok(pendingEvidence.Select(MapEvidence));
});

api.MapPost("/evidence", async (CreateEvidenceRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var instanceSticker = await db.InstanceStickers.SingleOrDefaultAsync(sticker => sticker.Id == request.InstanceStickerId, cancellationToken);
    if (instanceSticker is null)
    {
        return Results.BadRequest(new { error = "Ismeretlen futó matrica." });
    }

    var team = await db.Teams.SingleOrDefaultAsync(team => team.Id == request.TeamId, cancellationToken);
    if (team is null || team.AlbumInstanceId != instanceSticker.AlbumInstanceId)
    {
        return Results.BadRequest(new { error = "Ismeretlen vagy az instance-hez nem tartozó csapat." });
    }

    if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
    {
        return Results.BadRequest(new { error = "A bizonyíték címe és leírása kötelező." });
    }

    var evidence = new Evidence
    {
        InstanceStickerId = instanceSticker.Id,
        TeamId = team.Id,
        Type = string.IsNullOrWhiteSpace(request.Type) ? "jegyzet" : request.Type.Trim(),
        Status = EvidenceStatuses.Pending,
        Title = request.Title.Trim(),
        SubmittedBy = team.Name,
        SubmittedAt = DateTimeOffset.UtcNow,
        Description = request.Description.Trim(),
        HelpRequest = string.IsNullOrWhiteSpace(request.HelpRequest) ? null : request.HelpRequest.Trim(),
        HelpRequested = request.HelpRequested,
        Reflection = string.IsNullOrWhiteSpace(request.Reflection) ? null : request.Reflection.Trim()
    };

    db.Evidence.Add(evidence);

    var progress = await db.InstanceStickerTeamProgress
        .SingleOrDefaultAsync(row => row.InstanceStickerId == instanceSticker.Id && row.TeamId == team.Id, cancellationToken);
    if (progress is null)
    {
        progress = new InstanceStickerTeamProgress
        {
            InstanceStickerId = instanceSticker.Id,
            TeamId = team.Id,
        };
        db.InstanceStickerTeamProgress.Add(progress);
    }
    progress.State = TeamProgressStates.Pending;
    progress.LatestEvidenceId = evidence.Id;
    progress.UpdatedAt = DateTimeOffset.UtcNow;

    if (!string.IsNullOrWhiteSpace(evidence.HelpRequest) || !string.IsNullOrWhiteSpace(evidence.Reflection))
    {
        db.AiNotes.Add(new AiNote
        {
            OwnerType = "instance",
            OwnerId = instanceSticker.AlbumInstanceId,
            TargetType = "evidence",
            TargetId = evidence.Id,
            Kind = "suggestion",
            Label = "Bizonyíték támogatási jelzés",
            Severity = "figyelmet",
            Message = "A beküldés tanári figyelmet kérő kérdést vagy reflexiót tartalmaz.",
            Recommendation = "A visszajelzésben külön válaszolj a csapat bizonytalanságára."
        });
    }

    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/evidence/{evidence.Id}", new EvidenceSubmissionDto(MapEvidence(evidence), MapTeamProgress(progress)));
}).RequireDemoRole(DemoAuth.StudentRole);

api.MapPost("/evidence/{id:guid}/feedback", async (Guid id, FeedbackRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var evidence = await db.Evidence
        .Include(evidence => evidence.InstanceSticker)
            .ThenInclude(sticker => sticker!.AlbumInstance)
        .SingleOrDefaultAsync(evidence => evidence.Id == id, cancellationToken);

    if (evidence is null)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(request.TeacherFeedback))
    {
        return Results.BadRequest(new { error = "A tanári visszajelzés nem lehet üres." });
    }

    evidence.TeacherFeedback = request.TeacherFeedback.Trim();
    evidence.FeedbackAt = DateTimeOffset.UtcNow;
    evidence.Status = string.IsNullOrWhiteSpace(request.Status) ? EvidenceStatuses.Done : request.Status.Trim();
    evidence.HelpRequested = false;

    var progress = await db.InstanceStickerTeamProgress
        .SingleOrDefaultAsync(row => row.InstanceStickerId == evidence.InstanceStickerId && row.TeamId == evidence.TeamId, cancellationToken);
    if (progress is null)
    {
        progress = new InstanceStickerTeamProgress
        {
            InstanceStickerId = evidence.InstanceStickerId,
            TeamId = evidence.TeamId,
            LatestEvidenceId = evidence.Id,
        };
        db.InstanceStickerTeamProgress.Add(progress);
    }
    progress.State = evidence.Status == EvidenceStatuses.Revision ? TeamProgressStates.Revision : TeamProgressStates.Done;
    progress.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(new EvidenceSubmissionDto(MapEvidence(evidence), MapTeamProgress(progress)));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPatch("/evidence/{id:guid}/archive", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var evidence = await db.Evidence
        .Include(evidence => evidence.InstanceSticker)
        .SingleOrDefaultAsync(evidence => evidence.Id == id, cancellationToken);
    if (evidence is null || evidence.InstanceSticker is null)
    {
        return Results.NotFound();
    }

    if (!string.IsNullOrWhiteSpace(evidence.TeacherFeedback) || evidence.FeedbackAt is not null)
    {
        return Results.Conflict(new { error = "Visszajelzett bizonyíték nem archiválható innen; audit célból maradjon látható." });
    }

    if (evidence.ArchivedAt is null)
    {
        evidence.ArchivedAt = DateTimeOffset.UtcNow;
    }

    var progress = await db.InstanceStickerTeamProgress
        .SingleOrDefaultAsync(row => row.InstanceStickerId == evidence.InstanceStickerId && row.TeamId == evidence.TeamId, cancellationToken);
    if (progress?.LatestEvidenceId == evidence.Id)
    {
        var latestVisible = await db.Evidence
            .Where(row => row.Id != evidence.Id
                && row.InstanceStickerId == evidence.InstanceStickerId
                && row.TeamId == evidence.TeamId
                && row.ArchivedAt == null)
            .OrderByDescending(row => row.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestVisible is null)
        {
            db.InstanceStickerTeamProgress.Remove(progress);
        }
        else
        {
            progress.LatestEvidenceId = latestVisible.Id;
            progress.State = TeamProgressStateFromEvidence(latestVisible.Status);
            progress.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    evidence.InstanceSticker.AlbumInstance!.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, evidence.InstanceSticker.AlbumInstanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/instance-stickers/{stickerId:guid}/teams/{teamId:guid}/reflection", async (
    Guid stickerId,
    Guid teamId,
    SaveReflectionRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var text = request.Text?.Trim();
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.BadRequest(new { error = "A reflexió szövege nem lehet üres." });
    }

    var instanceSticker = await db.InstanceStickers.SingleOrDefaultAsync(sticker => sticker.Id == stickerId, cancellationToken);
    if (instanceSticker is null)
    {
        return Results.NotFound(new { error = "Ismeretlen futó matrica." });
    }

    var team = await db.Teams.SingleOrDefaultAsync(t => t.Id == teamId, cancellationToken);
    if (team is null || team.AlbumInstanceId != instanceSticker.AlbumInstanceId)
    {
        return Results.BadRequest(new { error = "A csapat nem tartozik ehhez az albumhoz." });
    }

    var progress = await db.InstanceStickerTeamProgress
        .SingleOrDefaultAsync(row => row.InstanceStickerId == stickerId && row.TeamId == teamId, cancellationToken);
    if (progress is null)
    {
        progress = new InstanceStickerTeamProgress
        {
            InstanceStickerId = stickerId,
            TeamId = teamId,
        };
        db.InstanceStickerTeamProgress.Add(progress);
    }

    if (progress.State != TeamProgressStates.Done && progress.State != TeamProgressStates.Reflected)
    {
        return Results.BadRequest(new { error = "A matrica csak lezárás után reflektálható." });
    }

    progress.Reflection = text;
    progress.ReflectedAt = DateTimeOffset.UtcNow;
    progress.State = TeamProgressStates.Reflected;
    progress.UpdatedAt = DateTimeOffset.UtcNow;

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(MapTeamProgress(progress));
}).RequireDemoRole(DemoAuth.StudentRole);

// Closure-page checklist toggle. v1 ships with a fixed seeded set per instance;
// teacher-editable item lists (add/remove/reorder) are a follow-up.
api.MapPatch("/album-instances/{instanceId:guid}/closure-checklist/{itemId:guid}", async (
    Guid instanceId,
    Guid itemId,
    UpdateClosureChecklistItemRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var item = await db.AlbumInstanceClosureChecklistItems
        .SingleOrDefaultAsync(i => i.Id == itemId && i.AlbumInstanceId == instanceId, cancellationToken);
    if (item is null) return Results.NotFound();
    item.Done = request.Done;
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPut("/album-instances/{instanceId:guid}/teacher-effect-log", async (
    Guid instanceId,
    SaveTeacherEffectLogRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.TeacherEffectLog)
        .SingleOrDefaultAsync(i => i.Id == instanceId, cancellationToken);
    if (instance is null) return Results.NotFound();

    var workedWell = Clean(request.WorkedWell);
    var engagementSignals = Clean(request.EngagementSignals);
    var adaptationNotes = Clean(request.AdaptationNotes);
    var reuseNextTime = Clean(request.ReuseNextTime);
    var isEmpty =
        string.IsNullOrWhiteSpace(workedWell) &&
        string.IsNullOrWhiteSpace(engagementSignals) &&
        string.IsNullOrWhiteSpace(adaptationNotes) &&
        string.IsNullOrWhiteSpace(reuseNextTime);

    if (isEmpty)
    {
        if (instance.TeacherEffectLog is not null)
        {
            db.AlbumInstanceTeacherEffectLogs.Remove(instance.TeacherEffectLog);
        }
    }
    else
    {
        var log = instance.TeacherEffectLog ?? new AlbumInstanceTeacherEffectLog
        {
            AlbumInstanceId = instanceId,
        };
        if (instance.TeacherEffectLog is null)
        {
            db.AlbumInstanceTeacherEffectLogs.Add(log);
        }

        log.WorkedWell = workedWell;
        log.EngagementSignals = engagementSignals;
        log.AdaptationNotes = adaptationNotes;
        log.ReuseNextTime = reuseNextTime;
        log.UpdatedAt = DateTimeOffset.UtcNow;
    }

    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPut("/album-instances/{instanceId:guid}/differentiation-paths", async (
    Guid instanceId,
    ReplaceDifferentiationPathsRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.DifferentiationPaths)
        .SingleOrDefaultAsync(i => i.Id == instanceId, cancellationToken);
    if (instance is null || instance.AlbumTemplateVersion is null)
    {
        return Results.NotFound();
    }

    var paths = NormalizeDifferentiationPaths(request.Paths);
    db.RemoveRange(instance.AlbumTemplateVersion.DifferentiationPaths);
    instance.AlbumTemplateVersion.DifferentiationPaths = CloneDifferentiationPaths(paths);
    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPut("/instance-stickers/{stickerId:guid}/teams/{teamId:guid}/differentiation-path", async (
    Guid stickerId,
    Guid teamId,
    SetTeamDifferentiationPathRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var sticker = await db.InstanceStickers
        .Include(s => s.AlbumInstance)
        .Include(s => s.TeamDifferentiationPaths)
        .SingleOrDefaultAsync(s => s.Id == stickerId, cancellationToken);
    if (sticker is null || sticker.AlbumInstance is null)
    {
        return Results.NotFound();
    }

    var teamBelongsToInstance = await db.Teams.AnyAsync(
        team => team.Id == teamId && team.AlbumInstanceId == sticker.AlbumInstanceId,
        cancellationToken);
    if (!teamBelongsToInstance)
    {
        return Results.BadRequest(new { error = "A csapat nem ehhez a futó albumhoz tartozik." });
    }

    var existing = sticker.TeamDifferentiationPaths.FirstOrDefault(path => path.TeamId == teamId);
    if (string.IsNullOrWhiteSpace(request.PathKey))
    {
        if (existing is not null)
        {
            db.InstanceStickerTeamDifferentiationPaths.Remove(existing);
        }
    }
    else
    {
        var pathKey = DifferentiationPathKeys.Normalize(request.PathKey);
        existing ??= new InstanceStickerTeamDifferentiationPath
        {
            InstanceStickerId = stickerId,
            TeamId = teamId
        };
        if (existing.Id == Guid.Empty || !sticker.TeamDifferentiationPaths.Contains(existing))
        {
            db.InstanceStickerTeamDifferentiationPaths.Add(existing);
        }
        existing.PathKey = pathKey;
        existing.AssignedAt = DateTimeOffset.UtcNow;
    }

    sticker.AlbumInstance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, sticker.AlbumInstanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Template-version upgrade ------------------------------------------------------------------

// Pure read: returns the planned diff between the instance's bound template version and
// the template's latest published version. Idempotent; the teacher may poll repeatedly.
api.MapGet("/album-instances/{id:guid}/upgrade-preview", async (
    Guid id,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var preview = await BuildUpgradePreviewAsync(db, id, cancellationToken);
    return preview is null ? Results.NotFound() : Results.Ok(preview);
});

// Commit the upgrade. Recomputes the plan server-side (don't trust the client) and applies
// inside one transaction. The unique index on (AlbumInstanceId, Week, SortOrder) requires
// the same scratch-range two-pass trick used by the sticker-reorder endpoint.
api.MapPost("/album-instances/{id:guid}/upgrade", async (
    Guid id,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.AlbumTemplate)
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Stickers)
                .ThenInclude(s => s.StickerVersion)
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Weeks)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.StickerVersion)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.Evidence)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.TeamProgress)
        .Include(i => i.WeekPlanOverrides)
        .SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
    if (instance is null || instance.AlbumTemplate is null || instance.AlbumTemplateVersion is null)
    {
        return Results.NotFound();
    }

    var targetVersion = await LatestPublishedVersionAsync(db, instance.AlbumTemplate.Id, cancellationToken);
    if (targetVersion is null || targetVersion.Id == instance.AlbumTemplateVersionId)
    {
        return Results.BadRequest(new { error = "Nincs újabb publikált sablonverzió." });
    }

    var plan = InstanceUpgradePlanner.ComputeUpgradePlan(instance, instance.AlbumTemplateVersion, targetVersion);
    if (plan.IsNoOp)
    {
        // Even if the target version id differs, the diff might be empty (rare but possible).
        // We still rebind to keep AlbumTemplateVersionId fresh.
    }

    await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

    // Pass 1: bump every InstanceSticker that survives into the scratch range so nothing
    // else can collide with their target (Week, SortOrder) on Pass 2.
    var scratchBase = 100_000;
    var scratchIndex = 0;
    foreach (var sticker in instance.Stickers)
    {
        sticker.SortOrder = scratchBase + scratchIndex++;
    }
    await db.SaveChangesAsync(cancellationToken);

    // Pass 2: apply each case.
    // (b) Hard-delete removed-without-evidence rows.
    var toDelete = plan.RemovedNoEvidence
        .Where(item => item.InstanceStickerId.HasValue)
        .Select(item => item.InstanceStickerId!.Value)
        .ToHashSet();
    db.InstanceStickers.RemoveRange(instance.Stickers.Where(s => toDelete.Contains(s.Id)));

    // (b') Deprecate removed-with-evidence rows; park them at Week=9999 so they don't reach the timeline.
    var deprecatedIds = plan.RemovedKeptForEvidence
        .Where(item => item.InstanceStickerId.HasValue)
        .Select(item => item.InstanceStickerId!.Value)
        .ToHashSet();
    var deprecatedIndex = 0;
    foreach (var sticker in instance.Stickers.Where(s => deprecatedIds.Contains(s.Id)))
    {
        sticker.Deprecated = true;
        sticker.Week = 9999;
        sticker.SortOrder = 9000 + deprecatedIndex++;
    }

    // (a) Insert new InstanceSticker rows for the Added items.
    var now = DateTimeOffset.UtcNow;
    var newVersionAssignmentMap = targetVersion.Stickers.ToDictionary(s => s.StickerVersionId);
    foreach (var item in plan.Added)
    {
        var assignment = newVersionAssignmentMap[item.StickerVersionId];
        instance.Stickers.Add(new InstanceSticker
        {
            AlbumInstanceId = instance.Id,
            AlbumTemplateVersionStickerId = assignment.Id,
            StickerVersionId = item.StickerVersionId,
            Week = item.ToWeek,
            SortOrder = item.ToSort,
            State = StickerStates.Planned,
            CreatedAt = now,
        });
    }

    // (c) Moved: set Week/SortOrder + rebind AlbumTemplateVersionStickerId.
    foreach (var item in plan.Moved.Concat(plan.Unchanged))
    {
        if (!item.InstanceStickerId.HasValue) continue;
        var sticker = instance.Stickers.First(s => s.Id == item.InstanceStickerId.Value);
        var assignment = newVersionAssignmentMap[item.StickerVersionId];
        sticker.AlbumTemplateVersionStickerId = assignment.Id;
        sticker.Week = item.ToWeek;
        sticker.SortOrder = item.ToSort;
    }

    // (d) Repointed: update StickerVersionId and Week/SortOrder; rebind assignment FK.
    foreach (var item in plan.Repointed)
    {
        if (!item.InstanceStickerId.HasValue || !item.NewStickerVersionId.HasValue) continue;
        var sticker = instance.Stickers.First(s => s.Id == item.InstanceStickerId.Value);
        var assignment = newVersionAssignmentMap[item.NewStickerVersionId.Value];
        sticker.StickerVersionId = item.NewStickerVersionId.Value;
        sticker.AlbumTemplateVersionStickerId = assignment.Id;
        sticker.Week = item.ToWeek;
        sticker.SortOrder = item.ToSort;
    }

    // Pass 3: rebind, clamp, prune stale unit overrides.
    instance.AlbumTemplateVersionId = targetVersion.Id;
    if (plan.CurrentWeekClamp is { } clamp) instance.CurrentWeek = clamp;
    var validUnitNumbers = targetVersion.Weeks.Select(w => w.WeekNumber).ToHashSet();
    db.RemoveRange(instance.WeekPlanOverrides.Where(o => !validUnitNumbers.Contains(o.WeekNumber)));
    instance.UpdatedAt = now;

    await db.SaveChangesAsync(cancellationToken);
    await transaction.CommitAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// Toggle the soft-delete flag. Archived instances stay readable but are hidden from default lists.
api.MapPatch("/album-instances/{id:guid}/archive", async (
    Guid id,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances.SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
    if (instance is null) return Results.NotFound();
    instance.ArchivedAt = instance.ArchivedAt is null ? DateTimeOffset.UtcNow : null;
    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(await MapInstanceDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Per-instance unit title overrides --------------------------------------------------------

api.MapPut("/album-instances/{id:guid}/units", async (
    Guid id,
    ReplaceInstanceUnitsRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Weeks)
        .Include(i => i.WeekPlanOverrides)
        .SingleOrDefaultAsync(i => i.Id == id, cancellationToken);
    if (instance is null) return Results.NotFound();

    var validWeekNumbers = instance.AlbumTemplateVersion?.Weeks.Select(w => w.WeekNumber).ToHashSet() ?? new HashSet<int>();
    db.RemoveRange(instance.WeekPlanOverrides);
    instance.WeekPlanOverrides = (request.Items ?? [])
        .Where(item => validWeekNumbers.Contains(item.WeekNumber))
        .Select(item => new AlbumInstanceWeekPlan
        {
            AlbumInstanceId = instance.Id,
            WeekNumber = item.WeekNumber,
            Title = Clean(item.Title),
        })
        .ToList();
    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, id, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// --- Team CRUD --------------------------------------------------------------------------------

api.MapPost("/album-instances/{instanceId:guid}/teams", async (
    Guid instanceId,
    CreateTeamRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(i => i.Teams)
        .SingleOrDefaultAsync(i => i.Id == instanceId, cancellationToken);
    if (instance is null) return Results.NotFound();
    var name = request.Name?.Trim();
    if (string.IsNullOrEmpty(name)) return Results.BadRequest(new { error = "A csapat neve kötelező." });

    var team = new Team
    {
        AlbumInstanceId = instance.Id,
        Name = name,
        Focus = Clean(request.Focus),
        Color = string.IsNullOrWhiteSpace(request.Color) ? "#7872d4" : request.Color.Trim(),
        Members = (request.Members ?? [])
            .Select(n => n?.Trim())
            .Where(n => !string.IsNullOrEmpty(n))
            .Select((n, index) => new TeamMember { Name = n!, SortOrder = index + 1 })
            .ToList(),
    };
    instance.Teams.Add(team);
    instance.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPatch("/album-instances/{instanceId:guid}/teams/{teamId:guid}", async (
    Guid instanceId,
    Guid teamId,
    UpdateTeamRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var team = await db.Teams.SingleOrDefaultAsync(t => t.Id == teamId && t.AlbumInstanceId == instanceId, cancellationToken);
    if (team is null) return Results.NotFound();

    if (request.Name is { } name)
    {
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed)) return Results.BadRequest(new { error = "A csapat neve nem lehet üres." });
        team.Name = trimmed;
    }
    if (request.Focus is { } focus) team.Focus = Clean(focus);
    if (request.Color is { } color && !string.IsNullOrWhiteSpace(color)) team.Color = color.Trim();
    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

// Hard-delete only when no rows reference the team; 409 with the blocker counts otherwise.
api.MapDelete("/album-instances/{instanceId:guid}/teams/{teamId:guid}", async (
    Guid instanceId,
    Guid teamId,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var team = await db.Teams
        .Include(t => t.Members)
        .Include(t => t.Evidence)
        .SingleOrDefaultAsync(t => t.Id == teamId && t.AlbumInstanceId == instanceId, cancellationToken);
    if (team is null) return Results.NotFound();

    var progressCount = await db.InstanceStickerTeamProgress.CountAsync(p => p.TeamId == teamId, cancellationToken);
    var helpCount = await db.TeamHelpRequests.CountAsync(r => r.TeamId == teamId, cancellationToken);
    var reflectionCount = await db.AlbumInstanceTeamReflections.CountAsync(r => r.TeamId == teamId, cancellationToken);
    if (team.Evidence.Count > 0 || progressCount > 0 || helpCount > 0 || reflectionCount > 0)
    {
        return Results.Conflict(new TeamDeleteBlockerDto(team.Evidence.Count, progressCount, helpCount, reflectionCount));
    }

    db.Teams.Remove(team);
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-instances/{instanceId:guid}/teams/{teamId:guid}/members", async (
    Guid instanceId,
    Guid teamId,
    TeamMemberRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var team = await db.Teams.Include(t => t.Members).SingleOrDefaultAsync(t => t.Id == teamId && t.AlbumInstanceId == instanceId, cancellationToken);
    if (team is null) return Results.NotFound();
    var name = request.Name?.Trim();
    if (string.IsNullOrEmpty(name)) return Results.BadRequest(new { error = "A tag neve kötelező." });

    var nextOrder = team.Members.Count == 0 ? 1 : team.Members.Max(m => m.SortOrder) + 1;
    team.Members.Add(new TeamMember { Name = name, SortOrder = nextOrder });
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapDelete("/album-instances/{instanceId:guid}/teams/{teamId:guid}/members/{memberId:guid}", async (
    Guid instanceId,
    Guid teamId,
    Guid memberId,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var member = await db.TeamMembers
        .Include(m => m.Team)
        .SingleOrDefaultAsync(m => m.Id == memberId && m.TeamId == teamId && m.Team!.AlbumInstanceId == instanceId, cancellationToken);
    if (member is null) return Results.NotFound();
    db.TeamMembers.Remove(member);
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(await MapInstanceDetailAsync(db, instanceId, cancellationToken));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-instances/{instanceId:guid}/teams/{teamId:guid}/project-reflection", async (
    Guid instanceId,
    Guid teamId,
    SaveReflectionRequest request,
    AlbumDbContext db,
    CancellationToken cancellationToken) =>
{
    var text = request.Text?.Trim();
    if (string.IsNullOrWhiteSpace(text))
    {
        return Results.BadRequest(new { error = "A projektzáró reflexió nem lehet üres." });
    }

    var instance = await db.AlbumInstances.SingleOrDefaultAsync(item => item.Id == instanceId, cancellationToken);
    if (instance is null)
    {
        return Results.NotFound();
    }

    var team = await db.Teams.SingleOrDefaultAsync(t => t.Id == teamId, cancellationToken);
    if (team is null || team.AlbumInstanceId != instanceId)
    {
        return Results.BadRequest(new { error = "A csapat nem tartozik ehhez az albumhoz." });
    }

    var reflection = await db.AlbumInstanceTeamReflections
        .SingleOrDefaultAsync(row => row.AlbumInstanceId == instanceId && row.TeamId == teamId, cancellationToken);
    if (reflection is null)
    {
        reflection = new AlbumInstanceTeamReflection
        {
            AlbumInstanceId = instanceId,
            TeamId = teamId,
            Text = text,
        };
        db.AlbumInstanceTeamReflections.Add(reflection);
    }
    else
    {
        reflection.Text = text;
        reflection.UpdatedAt = DateTimeOffset.UtcNow;
    }

    await db.SaveChangesAsync(cancellationToken);

    return Results.Ok(MapTeamReflection(reflection));
}).RequireDemoRole(DemoAuth.StudentRole);

api.MapPost("/help-requests", async (CreateTeamHelpRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var question = request.Question?.Trim();
    if (string.IsNullOrWhiteSpace(question))
    {
        return Results.BadRequest(new { error = "A segítségkérés szövege nem lehet üres." });
    }

    var instance = await db.AlbumInstances.SingleOrDefaultAsync(item => item.Id == request.AlbumInstanceId, cancellationToken);
    if (instance is null)
    {
        return Results.NotFound(new { error = "Ismeretlen futó album." });
    }

    var team = await db.Teams.SingleOrDefaultAsync(t => t.Id == request.TeamId, cancellationToken);
    if (team is null || team.AlbumInstanceId != request.AlbumInstanceId)
    {
        return Results.BadRequest(new { error = "A csapat nem tartozik ehhez az albumhoz." });
    }

    if (request.InstanceStickerId is { } stickerId)
    {
        var sticker = await db.InstanceStickers.SingleOrDefaultAsync(s => s.Id == stickerId, cancellationToken);
        if (sticker is null || sticker.AlbumInstanceId != request.AlbumInstanceId)
        {
            return Results.BadRequest(new { error = "A megjelölt matrica nem tartozik ehhez az albumhoz." });
        }
    }

    var helpRequest = new TeamHelpRequest
    {
        AlbumInstanceId = request.AlbumInstanceId,
        TeamId = request.TeamId,
        InstanceStickerId = request.InstanceStickerId,
        Question = question,
    };
    db.TeamHelpRequests.Add(helpRequest);
    await db.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/help-requests/{helpRequest.Id}", MapTeamHelpRequest(helpRequest));
}).RequireDemoRole(DemoAuth.StudentRole);

api.MapPatch("/help-requests/{id:guid}/resolve", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var helpRequest = await db.TeamHelpRequests.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    if (helpRequest is null)
    {
        return Results.NotFound();
    }

    helpRequest.ResolvedAt = helpRequest.ResolvedAt is null ? DateTimeOffset.UtcNow : null;
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(MapTeamHelpRequest(helpRequest));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPatch("/evidence/{id:guid}/seen", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var evidence = await db.Evidence.SingleOrDefaultAsync(evidence => evidence.Id == id, cancellationToken);
    if (evidence is null)
    {
        return Results.NotFound();
    }

    if (evidence.SeenByTeamAt is null)
    {
        evidence.SeenByTeamAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    return Results.Ok(MapEvidence(evidence));
}).RequireDemoRole(DemoAuth.StudentRole);

api.MapPatch("/instance-stickers/{id:guid}/state", async (Guid id, SetStickerStateRequest request, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var sticker = await db.InstanceStickers
        .Include(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.StickerResource)
        .Include(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.TeacherSteps)
        .SingleOrDefaultAsync(sticker => sticker.Id == id, cancellationToken);

    if (sticker is null)
    {
        return Results.NotFound();
    }

    if (string.IsNullOrWhiteSpace(request.State))
    {
        return Results.BadRequest(new { error = "Az állapot nem lehet üres." });
    }

    var requestedState = request.State.Trim();
    if (!StickerStates.All.Contains(requestedState))
    {
        return Results.BadRequest(new { error = "Ismeretlen matricaállapot." });
    }

    sticker.State = requestedState;
    await db.SaveChangesAsync(cancellationToken);

    var notes = await LoadNotesAsync(db, "instance", sticker.AlbumInstanceId, cancellationToken);
    var versionNotes = await LoadNotesAsync(db, "stickerVersion", sticker.StickerVersionId, cancellationToken);

    return Results.Ok(MapInstanceSticker(sticker, notes.Concat(versionNotes)));
}).RequireDemoRole(DemoAuth.TeacherRole);

api.MapPost("/album-instances/{id:guid}/micro-stickers/measurement-basics", async (Guid id, AlbumDbContext db, CancellationToken cancellationToken) =>
{
    var instance = await db.AlbumInstances
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.StickerVersion)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.Evidence)
        .SingleOrDefaultAsync(instance => instance.Id == id, cancellationToken);

    if (instance is null)
    {
        return Results.NotFound();
    }

    var existing = instance.Stickers.SingleOrDefault(sticker => sticker.StickerVersion!.Title == "Mérési gyorstalpaló");
    if (existing is not null)
    {
        var existingDetail = await db.InstanceStickers
            .Include(sticker => sticker.StickerVersion)
            .ThenInclude(version => version!.StickerResource)
            .Include(sticker => sticker.StickerVersion)
            .ThenInclude(version => version!.TeacherSteps)
            .SingleAsync(sticker => sticker.Id == existing.Id, cancellationToken);
        var existingNotes = await LoadNotesAsync(db, "instance", instance.Id, cancellationToken);
        return Results.Ok(MapInstanceSticker(existingDetail, existingNotes));
    }

    var version = await db.StickerVersions.SingleOrDefaultAsync(version => version.Id == DemoSeeder.MeasurementBasicsVersionId, cancellationToken);
    if (version is null)
    {
        db.StickerResources.Add(DemoSeeder.CreateMeasurementBasicsResource());
        version = db.StickerVersions.Local.Single(version => version.Id == DemoSeeder.MeasurementBasicsVersionId);
    }

    var sortOrder = instance.Stickers.Where(sticker => sticker.Week == 2).Select(sticker => sticker.SortOrder).DefaultIfEmpty(0).Max() + 1;
    var microSticker = DemoSeeder.CreateMeasurementBasicsInstanceSticker(instance.Id, version.Id, sortOrder);
    db.InstanceStickers.Add(microSticker);
    db.AiNotes.AddRange(DemoSeeder.CreateMeasurementBasicsNotes(instance.Id, microSticker.Id));
    instance.UpdatedAt = DateTimeOffset.UtcNow;

    var dimensions = await db.QualityDimensions
        .Where(dimension => dimension.OwnerType == "instance" && dimension.OwnerId == instance.Id && (dimension.Code == "bizonyit" || dimension.Code == "lowres"))
        .ToListAsync(cancellationToken);

    foreach (var dimension in dimensions)
    {
        var previousScore = dimension.Score;
        var previousState = dimension.State;
        dimension.Score = Math.Min(100, dimension.Score + 12);
        dimension.State = dimension.Score >= 70 ? QualityStates.Ok : QualityStates.Warn;
        db.QualityDimensionChanges.Add(new QualityDimensionChange
        {
            QualityDimensionId = dimension.Id,
            TriggerType = "microStickerAccepted",
            TriggerId = microSticker.Id,
            PreviousScore = previousScore,
            NewScore = dimension.Score,
            PreviousState = previousState,
            NewState = dimension.State,
            Reason = "Mérési gyorstalpaló mikromatrica beillesztése."
        });
    }

    await db.SaveChangesAsync(cancellationToken);

    var saved = await db.InstanceStickers
        .Include(sticker => sticker.StickerVersion)
        .ThenInclude(savedVersion => savedVersion!.StickerResource)
        .Include(sticker => sticker.StickerVersion)
        .ThenInclude(savedVersion => savedVersion!.TeacherSteps)
        .SingleAsync(sticker => sticker.Id == microSticker.Id, cancellationToken);
    var notes = await LoadNotesAsync(db, "instance", instance.Id, cancellationToken);

    return Results.Created($"/api/instance-stickers/{microSticker.Id}", MapInstanceSticker(saved, notes));
}).RequireDemoRole(DemoAuth.TeacherRole);

app.Run();

static IQueryable<AlbumTemplate> TemplateGraph(AlbumDbContext db) =>
    db.AlbumTemplates
        .AsSplitQuery()
        .Include(template => template.Instances)
        .Include(template => template.Versions)
        .ThenInclude(version => version.Dispositions)
        .Include(template => template.Versions)
        .ThenInclude(version => version.Weeks)
        .Include(template => template.Versions)
        .ThenInclude(version => version.DifferentiationPaths)
        .Include(template => template.Versions)
        .ThenInclude(version => version.Stickers)
        .ThenInclude(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.StickerResource)
        .Include(template => template.Versions)
        .ThenInclude(version => version.Stickers)
        .ThenInclude(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.TeacherSteps);

static IQueryable<AlbumInstance> InstanceGraph(AlbumDbContext db) =>
    db.AlbumInstances
        .AsSplitQuery()
        .Include(instance => instance.AlbumTemplate)
        .Include(instance => instance.AlbumTemplateVersion)
        .ThenInclude(version => version!.Dispositions)
        .Include(instance => instance.AlbumTemplate)
        .Include(instance => instance.AlbumTemplateVersion)
        .ThenInclude(version => version!.Weeks)
        .Include(instance => instance.AlbumTemplateVersion)
        .ThenInclude(version => version!.DifferentiationPaths)
        .Include(instance => instance.WeekPlanOverrides)
        .Include(instance => instance.ClosureChecklist)
        .Include(instance => instance.Teams)
        .ThenInclude(team => team.Members)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.StickerResource)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.StickerVersion)
        .ThenInclude(version => version!.TeacherSteps)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.Evidence)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.TeamProgress)
        .Include(instance => instance.Stickers)
        .ThenInclude(sticker => sticker.TeamDifferentiationPaths);

static async Task<StickerResourceDetailDto?> MapStickerResourceDetailAsync(AlbumDbContext db, Guid id, CancellationToken cancellationToken)
{
    var resource = await db.StickerResources
        .AsNoTracking()
        .Include(resource => resource.Versions)
        .ThenInclude(version => version.TeacherSteps)
        .SingleOrDefaultAsync(resource => resource.Id == id, cancellationToken);

    if (resource is null)
    {
        return null;
    }

    var versionIds = resource.Versions.Select(version => version.Id).ToList();
    var notes = await db.AiNotes
        .AsNoTracking()
        .Where(note => note.OwnerType == "stickerVersion" && versionIds.Contains(note.OwnerId))
        .ToListAsync(cancellationToken);

    // relations.reusedIn — the album-template versions that reference this activity.
    var usageRows = await db.AlbumTemplateVersionStickers
        .AsNoTracking()
        .Include(usage => usage.AlbumTemplateVersion)
        .Where(usage => versionIds.Contains(usage.StickerVersionId))
        .ToListAsync(cancellationToken);
    var versionNumberById = resource.Versions.ToDictionary(version => version.Id, version => version.VersionNumber);
    var reusedIn = usageRows
        .Where(usage => usage.AlbumTemplateVersion is not null)
        .Select(usage => new ActivityUsageDto(
            usage.AlbumTemplateVersion!.AlbumTemplateId,
            UiText(usage.AlbumTemplateVersion.Title),
            usage.AlbumTemplateVersion.VersionNumber,
            usage.StickerVersionId,
            versionNumberById.GetValueOrDefault(usage.StickerVersionId),
            usage.Week))
        .OrderBy(usage => usage.TemplateTitle)
        .ThenBy(usage => usage.TemplateVersionNumber)
        .ToList();
    var derivedFrom = StickerVersionLineage
        .Build(resource.Versions.Select(version => (version.Id, version.VersionNumber)))
        .Select(entry => new ActivityLineageDto(entry.StickerVersionId, entry.VersionNumber, entry.DerivedFromVersionId, entry.DerivedFromVersionNumber))
        .ToList();

    return new StickerResourceDetailDto(
        resource.Id,
        UiText(resource.Title),
        resource.ArchivedAt,
        resource.Versions
            .OrderByDescending(version => version.VersionNumber)
            .Select(version => MapStickerVersion(version, notes.Where(note => note.OwnerId == version.Id)))
            .ToList(),
        new ActivityRelationsDto(reusedIn, derivedFrom, []));
}

static async Task<AlbumTemplateDetailDto?> MapTemplateDetailAsync(AlbumDbContext db, Guid id, CancellationToken cancellationToken)
{
    var template = await TemplateGraph(db)
        .AsNoTracking()
        .SingleOrDefaultAsync(template => template.Id == id, cancellationToken);

    if (template is null)
    {
        return null;
    }

    var latest = LatestTemplateVersion(template);
    var templateNotes = await LoadNotesAsync(db, "template", id, cancellationToken);
    var versionIds = template.Versions.SelectMany(version => version.Stickers).Select(sticker => sticker.StickerVersionId).Distinct().ToList();
    var versionNotes = await db.AiNotes
        .AsNoTracking()
        .Where(note => note.OwnerType == "stickerVersion" && versionIds.Contains(note.OwnerId))
        .ToListAsync(cancellationToken);
    var quality = await LoadQualityAsync(db, "template", id, cancellationToken);

    return new AlbumTemplateDetailDto(
        template.Id,
        template.ArchivedAt,
        UiText(latest.Title),
        UiText(latest.Subject),
        UiText(latest.Grade),
        NormalizeDurationType(latest.DurationType),
        NormalizePatternKey(latest.PatternKey),
        UiText(PatternName(latest.PatternKey, latest.PatternName)),
        UiText(PatternDescription(latest.PatternKey, latest.PatternDescription)),
        UiText(latest.DrivingQuestion),
        UiText(latest.FinalProduct),
        UiText(latest.Audience),
        ProjectReflectionPrompts(latest),
        DifferentiationPaths(latest),
        latest.Dispositions.OrderBy(disposition => disposition.SortOrder).Select(disposition => UiText(disposition.Name)).ToList(),
        latest.Weeks.OrderBy(week => week.WeekNumber).Select(week => new WeekPlanDto(week.WeekNumber, UiText(week.Title))).ToList(),
        latest.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .Select(sticker => MapTemplateSticker(sticker, templateNotes.Concat(versionNotes)))
            .ToList(),
        template.Versions
            .OrderByDescending(version => version.VersionNumber)
            .Select(version => MapTemplateVersion(version, templateNotes.Concat(versionNotes)))
            .ToList(),
        quality,
        templateNotes.OrderByDescending(note => note.CreatedAt).Select(MapAiNote).ToList());
}

static async Task<AlbumInstanceDetailDto?> MapInstanceDetailAsync(AlbumDbContext db, Guid id, CancellationToken cancellationToken)
{
    var instance = await InstanceGraph(db)
        .AsNoTracking()
        .SingleOrDefaultAsync(instance => instance.Id == id, cancellationToken);

    if (instance is null || instance.AlbumTemplate is null || instance.AlbumTemplateVersion is null)
    {
        return null;
    }

    var templateVersion = instance.AlbumTemplateVersion;
    var instanceNotes = await LoadNotesAsync(db, "instance", id, cancellationToken);
    var versionIds = instance.Stickers.Select(sticker => sticker.StickerVersionId).Distinct().ToList();
    var versionNotes = await db.AiNotes
        .AsNoTracking()
        .Where(note => note.OwnerType == "stickerVersion" && versionIds.Contains(note.OwnerId))
        .ToListAsync(cancellationToken);
    var quality = await LoadQualityAsync(db, "instance", id, cancellationToken);
    var teamReflections = await db.AlbumInstanceTeamReflections
        .AsNoTracking()
        .Where(reflection => reflection.AlbumInstanceId == id)
        .ToListAsync(cancellationToken);
    var helpRequests = await db.TeamHelpRequests
        .AsNoTracking()
        .Where(request => request.AlbumInstanceId == id)
        .OrderByDescending(request => request.CreatedAt)
        .ToListAsync(cancellationToken);
    var teacherEffectLog = await db.AlbumInstanceTeacherEffectLogs
        .AsNoTracking()
        .SingleOrDefaultAsync(log => log.AlbumInstanceId == id, cancellationToken);

    return new AlbumInstanceDetailDto(
        instance.Id,
        instance.AlbumTemplateId,
        UiText(templateVersion.Title),
        instance.AlbumTemplate?.ArchivedAt,
        instance.ArchivedAt,
        UiText(instance.Title),
        UiText(instance.ClassName),
        UiText(templateVersion.Subject),
        UiText(templateVersion.Grade),
        NormalizeDurationType(templateVersion.DurationType),
        UiText(templateVersion.DrivingQuestion),
        UiText(templateVersion.FinalProduct),
        UiText(templateVersion.Audience),
        ProjectReflectionPrompts(templateVersion),
        DifferentiationPaths(templateVersion),
        instance.CurrentWeek,
        templateVersion.Dispositions.OrderBy(disposition => disposition.SortOrder).Select(disposition => UiText(disposition.Name)).ToList(),
        MergeInstanceWeekPlans(templateVersion.Weeks, instance.WeekPlanOverrides),
        instance.Teams.OrderBy(team => team.Name).Select(MapTeam).ToList(),
        instance.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .Select(sticker => MapInstanceSticker(sticker, instanceNotes.Concat(versionNotes)))
            .ToList(),
        instance.Stickers
            .SelectMany(sticker => sticker.Evidence)
            .Where(evidence => evidence.ArchivedAt == null)
            .OrderByDescending(evidence => evidence.SubmittedAt)
            .Select(MapEvidence)
            .ToList(),
        instance.Stickers.SelectMany(sticker => sticker.TeamProgress).Select(MapTeamProgress).ToList(),
        instance.Stickers.SelectMany(sticker => sticker.TeamDifferentiationPaths).Select(MapTeamDifferentiationPath).ToList(),
        teamReflections.Select(MapTeamReflection).ToList(),
        helpRequests.Select(MapTeamHelpRequest).ToList(),
        teacherEffectLog is null ? null : MapTeacherEffectLog(teacherEffectLog),
        instance.ClosureChecklist
            .OrderBy(item => item.SortOrder)
            .Select(item => new ClosureChecklistItemDto(item.Id, item.SortOrder, UiText(item.Label), item.Done))
            .ToList(),
        quality,
        instanceNotes.OrderByDescending(note => note.CreatedAt).Select(MapAiNote).ToList());
}

static async Task<JsonElement?> BuildAdviceSnapshotAsync(AlbumDbContext db, GenerateAiAdviceRequest request, CancellationToken cancellationToken)
{
    var options = CreateJsonOptions();

    if (request.OwnerType == "template")
    {
        var template = await TemplateGraph(db)
            .AsNoTracking()
            .SingleOrDefaultAsync(template => template.Id == request.OwnerId, cancellationToken);
        if (template is null)
        {
            return null;
        }

        var latest = LatestTemplateVersion(template);
        var templateQuality = await LoadQualityAsync(db, "template", template.Id, cancellationToken);
        var payload = new
        {
            request.Audience,
            request.OwnerType,
            request.OwnerId,
            request.TargetType,
            request.TargetId,
            request.TargetKey,
            template = new
            {
                template.Id,
                latest.VersionNumber,
                latest.Title,
                latest.Subject,
                latest.Grade,
                latest.DurationType,
                PatternKey = NormalizePatternKey(latest.PatternKey),
                PatternName = PatternName(latest.PatternKey, latest.PatternName),
                PatternDescription = PatternDescription(latest.PatternKey, latest.PatternDescription),
                latest.DrivingQuestion,
                latest.FinalProduct,
                latest.Audience,
                ProjectReflectionPrompts = ProjectReflectionPrompts(latest),
                DifferentiationPaths = DifferentiationPaths(latest),
                Dispositions = latest.Dispositions.OrderBy(item => item.SortOrder).Select(item => item.Name),
                Weeks = latest.Weeks.OrderBy(item => item.WeekNumber).Select(item => new { item.WeekNumber, item.Title }),
                Stickers = latest.Stickers.OrderBy(item => item.Week).ThenBy(item => item.SortOrder).Select(item => new
                {
                    item.Id,
                    item.Week,
                    item.SortOrder,
                    item.StickerVersionId,
                    item.StickerVersion!.Title,
                    item.StickerVersion.Phase,
                    item.StickerVersion.ShortDescription,
                    item.StickerVersion.StudentInstruction,
                    item.StickerVersion.StudentChoice,
                    item.StickerVersion.ExpectedProduct,
                    item.StickerVersion.ReflectionPrompt,
                    item.StickerVersion.LowResource
                }),
                Quality = templateQuality
            }
        };

        return JsonSerializer.SerializeToElement(payload, options);
    }

    var instance = await InstanceGraph(db)
        .AsNoTracking()
        .SingleOrDefaultAsync(instance => instance.Id == request.OwnerId, cancellationToken);
    if (instance is null || instance.AlbumTemplate is null || instance.AlbumTemplateVersion is null)
    {
        return null;
    }
    var templateVersion = instance.AlbumTemplateVersion;

    var orderedTeams = instance.Teams.OrderBy(team => team.Name).ToList();
    var teamAliases = orderedTeams
        .Select((team, index) => new
        {
            team.Id,
            Alias = $"Csapat {index + 1}",
            team.Focus,
            MemberCount = team.Members.Count,
            team.Color
        })
        .ToList();
    var aliasByTeamId = teamAliases.ToDictionary(team => team.Id, team => team.Alias);

    var activeSticker = request.InstanceStickerId.HasValue
        ? instance.Stickers.SingleOrDefault(sticker => sticker.Id == request.InstanceStickerId.Value)
        : instance.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .FirstOrDefault(sticker => sticker.State is "aktiv" or "varakozik" or "javitas")
            ?? instance.Stickers.OrderBy(sticker => sticker.Week).ThenBy(sticker => sticker.SortOrder).FirstOrDefault();
    var selectedTeam = request.TeamId.HasValue
        ? orderedTeams.SingleOrDefault(team => team.Id == request.TeamId.Value)
        : orderedTeams.FirstOrDefault();
    var instanceQuality = await LoadQualityAsync(db, "instance", instance.Id, cancellationToken);
    var evidenceQuery = instance.Stickers
        .SelectMany(sticker => sticker.Evidence
            .Where(evidence => evidence.ArchivedAt == null)
            .Select(evidence => new { Sticker = sticker, Evidence = evidence }));

    if (request.Audience == "student")
    {
        if (selectedTeam is not null)
        {
            evidenceQuery = evidenceQuery.Where(item => item.Evidence.TeamId == selectedTeam.Id);
        }

        if (activeSticker is not null)
        {
            evidenceQuery = evidenceQuery.Where(item => item.Evidence.InstanceStickerId == activeSticker.Id);
        }
    }
    // For the pending-evidence-digest target, restrict to actually-pending rows so the
    // agent has a clear "what's on the teacher's plate right now" picture.
    if (string.Equals(request.TargetType, "pendingEvidenceDigest", StringComparison.Ordinal))
    {
        evidenceQuery = evidenceQuery.Where(item => item.Evidence.Status == EvidenceStatuses.Pending);
    }

    var evidenceCap = request.Audience == "student" ? 5
        : string.Equals(request.TargetType, "pendingEvidenceDigest", StringComparison.Ordinal) ? 30
        : 12;
    var evidenceRows = evidenceQuery
        .OrderByDescending(item => item.Evidence.SubmittedAt)
        .Take(evidenceCap)
        .ToList();
    var pendingEvidenceId = evidenceRows.FirstOrDefault(item => item.Evidence.Status == EvidenceStatuses.Pending)?.Evidence.Id;
    var targetEvidenceRow = string.Equals(request.TargetType, "evidence", StringComparison.Ordinal) && request.TargetId.HasValue
        ? instance.Stickers
            .SelectMany(sticker => sticker.Evidence
                .Where(evidence => evidence.ArchivedAt == null)
                .Select(evidence => new { Sticker = sticker, Evidence = evidence }))
            .FirstOrDefault(item => item.Evidence.Id == request.TargetId.Value)
        : null;
    if (string.Equals(request.TargetType, "evidence", StringComparison.Ordinal) && request.TargetId.HasValue && targetEvidenceRow is null)
    {
        return null;
    }

    var selectedTeamProgress = activeSticker is null || selectedTeam is null
        ? null
        : activeSticker.TeamProgress.FirstOrDefault(progress => progress.TeamId == selectedTeam.Id);
    var selectedTeamPayload = selectedTeam is null
        ? null
        : new
        {
            selectedTeam.Id,
            Alias = aliasByTeamId.GetValueOrDefault(selectedTeam.Id, "Csapat"),
            selectedTeam.Focus,
            MemberCount = selectedTeam.Members.Count,
            selectedTeam.Color,
        };
    var activeStickerPayload = activeSticker is null
        ? null
        : new
        {
            activeSticker.Id,
            activeSticker.Week,
            activeSticker.SortOrder,
            activeSticker.State,
            activeSticker.StickerVersionId,
            activeSticker.StickerVersion!.Title,
            activeSticker.StickerVersion.Phase,
            activeSticker.StickerVersion.ShortDescription,
            activeSticker.StickerVersion.StudentInstruction,
            activeSticker.StickerVersion.StudentChoice,
            activeSticker.StickerVersion.ExpectedProduct,
            activeSticker.StickerVersion.ReflectionPrompt,
            activeSticker.StickerVersion.LowResource,
        };
    var targetEvidencePayload = targetEvidenceRow is null
        ? null
        : new
        {
            targetEvidenceRow.Evidence.Id,
            targetEvidenceRow.Evidence.InstanceStickerId,
            StickerTitle = targetEvidenceRow.Sticker.StickerVersion!.Title,
            TeamAlias = aliasByTeamId.GetValueOrDefault(targetEvidenceRow.Evidence.TeamId, "Csapat"),
            targetEvidenceRow.Evidence.Type,
            targetEvidenceRow.Evidence.Status,
            EvidenceTitle = targetEvidenceRow.Evidence.Title,
            Description = Limit(targetEvidenceRow.Evidence.Description, 1200),
            HelpRequest = Limit(targetEvidenceRow.Evidence.HelpRequest, 700),
            Reflection = Limit(targetEvidenceRow.Evidence.Reflection, 700),
            TeacherFeedback = request.Audience == "teacher" ? Limit(targetEvidenceRow.Evidence.TeacherFeedback, 700) : null,
            TeamProgressState = targetEvidenceRow.Sticker.TeamProgress.FirstOrDefault(progress => progress.TeamId == targetEvidenceRow.Evidence.TeamId)?.State,
        };

    // Teacher-only: thread per-team reflections + recent help requests so the agent can
    // reason about reflective depth and where teams are asking for help. Student snapshot
    // stays narrow (per-team active context only).
    object? teamReflectionsPayload = null;
    object? helpRequestsPayload = null;
    object? targetHelpRequestPayload = null;
    object? teacherEffectLogPayload = null;
    if (request.Audience == "teacher")
    {
        var reflections = await db.AlbumInstanceTeamReflections
            .AsNoTracking()
            .Where(reflection => reflection.AlbumInstanceId == instance.Id)
            .OrderByDescending(reflection => reflection.UpdatedAt)
            .ToListAsync(cancellationToken);
        teamReflectionsPayload = reflections.Select(reflection => new
        {
            TeamAlias = aliasByTeamId.GetValueOrDefault(reflection.TeamId, "Csapat"),
            Text = Limit(reflection.Text, 800),
            reflection.UpdatedAt,
        }).ToList();

        var fourteenDaysAgo = DateTimeOffset.UtcNow.AddDays(-14);
        var helps = await db.TeamHelpRequests
            .AsNoTracking()
            .Where(req => req.AlbumInstanceId == instance.Id
                && (req.ResolvedAt == null || req.ResolvedAt >= fourteenDaysAgo))
            .OrderBy(req => req.ResolvedAt == null ? 0 : 1)
            .ThenByDescending(req => req.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);
        helpRequestsPayload = helps.Select(req => new
        {
            req.Id,
            TeamAlias = aliasByTeamId.GetValueOrDefault(req.TeamId, "Csapat"),
            req.InstanceStickerId,
            Question = Limit(req.Question, 500),
            req.CreatedAt,
            req.ResolvedAt,
        }).ToList();

        // When triaging a specific help-request, surface it explicitly so the agent
        // can target its Socratic suggestions. Only set when the target asks for it.
        if (string.Equals(request.TargetType, "helpRequest", StringComparison.Ordinal) && request.TargetId.HasValue)
        {
            var target = helps.FirstOrDefault(req => req.Id == request.TargetId.Value);
            if (target is not null)
            {
                targetHelpRequestPayload = new
                {
                    target.Id,
                    TeamAlias = aliasByTeamId.GetValueOrDefault(target.TeamId, "Csapat"),
                    target.InstanceStickerId,
                    Question = Limit(target.Question, 500),
                    target.CreatedAt,
                };
            }
        }

        var teacherEffectLog = await db.AlbumInstanceTeacherEffectLogs
            .AsNoTracking()
            .SingleOrDefaultAsync(log => log.AlbumInstanceId == instance.Id, cancellationToken);
        teacherEffectLogPayload = teacherEffectLog is null
            ? null
            : new
            {
                WorkedWell = Limit(teacherEffectLog.WorkedWell, 900),
                EngagementSignals = Limit(teacherEffectLog.EngagementSignals, 900),
                AdaptationNotes = Limit(teacherEffectLog.AdaptationNotes, 900),
                ReuseNextTime = Limit(teacherEffectLog.ReuseNextTime, 900),
                teacherEffectLog.UpdatedAt,
            };
    }

    var instancePayload = new
    {
        request.Audience,
        request.OwnerType,
        request.OwnerId,
        request.TargetType,
        request.TargetId,
        request.TargetKey,
        currentWeek = instance.CurrentWeek,
        pendingEvidenceId,
        activeStickerTitle = activeSticker?.StickerVersion?.Title,
        activeTeamAlias = selectedTeam is null ? null : aliasByTeamId.GetValueOrDefault(selectedTeam.Id),
        selectedTeam = selectedTeamPayload,
        activeSticker = activeStickerPayload,
        selectedTeamProgress = selectedTeamProgress is null ? null : new
        {
            selectedTeamProgress.InstanceStickerId,
            selectedTeamProgress.TeamId,
            selectedTeamProgress.State,
            selectedTeamProgress.LatestEvidenceId,
            Reflection = Limit(selectedTeamProgress.Reflection, 500),
            selectedTeamProgress.ReflectedAt,
            selectedTeamProgress.UpdatedAt,
        },
        studentRecentEvidence = request.Audience == "student"
            ? evidenceRows.Select(item => new
            {
                item.Evidence.Id,
                item.Evidence.InstanceStickerId,
                StickerTitle = item.Sticker.StickerVersion!.Title,
                TeamAlias = aliasByTeamId.GetValueOrDefault(item.Evidence.TeamId, "Csapat"),
                item.Evidence.Type,
                item.Evidence.Status,
                EvidenceTitle = item.Evidence.Title,
                Description = Limit(item.Evidence.Description, 700),
                HelpRequest = Limit(item.Evidence.HelpRequest, 500),
                Reflection = Limit(item.Evidence.Reflection, 500),
            })
            : null,
        teamReflections = teamReflectionsPayload,
        helpRequests = helpRequestsPayload,
        targetHelpRequest = targetHelpRequestPayload,
        teacherEffectLog = teacherEffectLogPayload,
        targetEvidence = targetEvidencePayload,
        instance = new
        {
            instance.Id,
            instance.Title,
            instance.ClassName,
            instance.CurrentWeek,
            Template = new
            {
                templateVersion.VersionNumber,
                templateVersion.Title,
                templateVersion.Subject,
                templateVersion.Grade,
                templateVersion.DurationType,
                templateVersion.DrivingQuestion,
                templateVersion.FinalProduct,
                templateVersion.Audience,
                ProjectReflectionPrompts = ProjectReflectionPrompts(templateVersion),
                DifferentiationPaths = DifferentiationPaths(templateVersion),
                Dispositions = templateVersion.Dispositions.OrderBy(item => item.SortOrder).Select(item => item.Name),
                Weeks = templateVersion.Weeks.OrderBy(item => item.WeekNumber).Select(item => new { item.WeekNumber, item.Title })
            },
            Teams = teamAliases,
            ActiveSticker = activeSticker is null ? null : new
            {
                activeSticker.Id,
                activeSticker.Week,
                activeSticker.SortOrder,
                activeSticker.State,
                activeSticker.StickerVersionId,
                activeSticker.StickerVersion!.Title,
                activeSticker.StickerVersion.Phase,
                activeSticker.StickerVersion.ShortDescription,
                activeSticker.StickerVersion.StudentInstruction,
                activeSticker.StickerVersion.StudentChoice,
                activeSticker.StickerVersion.ExpectedProduct,
                activeSticker.StickerVersion.ReflectionPrompt,
                activeSticker.StickerVersion.LowResource
            },
            Stickers = instance.Stickers.OrderBy(item => item.Week).ThenBy(item => item.SortOrder).Select(item => new
            {
                item.Id,
                item.Week,
                item.SortOrder,
                item.State,
                item.StickerVersion!.Title,
                item.StickerVersion.Phase,
                item.StickerVersion.ShortDescription,
                EvidenceCount = item.Evidence.Count(evidence => evidence.ArchivedAt == null),
                PendingEvidenceCount = item.Evidence.Count(evidence => evidence.ArchivedAt == null && evidence.Status == EvidenceStatuses.Pending),
                TeamDifferentiationPaths = item.TeamDifferentiationPaths.Select(path => new
                {
                    TeamAlias = aliasByTeamId.GetValueOrDefault(path.TeamId, "Csapat"),
                    PathKey = DifferentiationPathKeys.Normalize(path.PathKey),
                    path.AssignedAt,
                }),
                TeamProgressCounts = item.TeamProgress
                    .GroupBy(progress => progress.State)
                    .ToDictionary(group => group.Key, group => group.Count()),
                SelectedTeamState = selectedTeam is null
                    ? null
                    : item.TeamProgress.FirstOrDefault(progress => progress.TeamId == selectedTeam.Id)?.State
            }),
            Evidence = evidenceRows.Select(item => new
            {
                item.Evidence.Id,
                item.Evidence.InstanceStickerId,
                StickerTitle = item.Sticker.StickerVersion!.Title,
                TeamAlias = aliasByTeamId.GetValueOrDefault(item.Evidence.TeamId, "Csapat"),
                item.Evidence.Type,
                item.Evidence.Status,
                EvidenceTitle = item.Evidence.Title,
                Description = Limit(item.Evidence.Description, 700),
                HelpRequest = Limit(item.Evidence.HelpRequest, 500),
                Reflection = Limit(item.Evidence.Reflection, 500),
                TeacherFeedback = request.Audience == "teacher" ? Limit(item.Evidence.TeacherFeedback, 500) : null
            }),
            Quality = instanceQuality
        }
    };

    return JsonSerializer.SerializeToElement(instancePayload, options);
}

static bool IsGuidedDemoRequest(HttpContext httpContext) =>
    httpContext.Request.Headers.TryGetValue(GuidedDemoHeader, out var values)
    && values.Any(value => string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "1", StringComparison.OrdinalIgnoreCase));

static AgentAdviceResponse BuildGuidedDemoAdviceResponse(GenerateAiAdviceRequest request, JsonElement snapshot)
{
    var citations = GuidedDemoCitations();

    if (string.Equals(request.Audience, "student", StringComparison.Ordinal))
    {
        return new AgentAdviceResponse([
            new AgentAdviceItem(
                request.TargetType ?? "instanceSticker",
                request.TargetId,
                request.TargetKey,
                "suggestion",
                "info",
                "Gondolkodtató kérdések az aktuális bizonyítékhoz.",
                null,
                [
                    "Mit mutat a bizonyítékotok, amit egy kívülálló is ellenőrizni tudna?",
                    "Melyik rész megfigyelés, és melyik már következtetés?",
                    "Mit próbálnátok meg újra, ha pontosabb választ szeretnétek?"
                ],
                citations.Take(2).ToList(),
                null)
        ]);
    }

    if (string.Equals(request.TargetType, "evidence", StringComparison.Ordinal) && request.TargetId.HasValue)
    {
        return new AgentAdviceResponse([
            new AgentAdviceItem(
                "evidence",
                request.TargetId,
                request.TargetKey,
                "suggestion",
                "info",
                "A beküldés jó alap a tanári visszajelzéshez, mert látszik benne a megfigyelés és a bizonytalanság is.",
                "A draft ismerje el a konkrét bizonyítékot, majd egyetlen javítható döntést kérjen vissza.",
                [],
                citations.Take(2).ToList(),
                new AgentAdviceAction(
                    "draftFeedback",
                    "Feedback draft használata",
                    JsonSerializer.SerializeToElement(
                        new DraftFeedbackAdviceActionPayload(
                            request.TargetId.Value,
                            "Jó, hogy konkrét bizonyítékot hoztatok, és jeleztétek, hol maradt bizonytalanság. A következő körben válasszatok ki egy mérési vagy megfigyelési döntést, amit pontosabban megismételtek, majd írjátok le, ettől hogyan lesz meggyőzőbb az állításotok."),
                        CreateJsonOptions())))
        ]);
    }

    if (string.Equals(request.TargetType, "helpRequest", StringComparison.Ordinal))
    {
        return new AgentAdviceResponse([
            new AgentAdviceItem(
                "helpRequest",
                request.TargetId,
                request.TargetKey,
                "suggestion",
                "info",
                "A segítségkérésre érdemes kérdéssel válaszolni, hogy a csapat saját döntést hozzon a következő próbáról.",
                "Kérdezz rá arra, mit tekintenek bizonyítéknak, és mi alapján választanának új mérési helyzetet.",
                [
                    "Mi az az egy adat vagy megfigyelés, ami most hiányzik a döntésetekhez?",
                    "Melyik helyszínt mérnétek újra ugyanazzal a módszerrel?",
                    "Mitől lenne meggyőzőbb a válaszotok az osztály számára?"
                ],
                citations.Take(2).ToList(),
                null)
        ]);
    }

    if (string.Equals(request.TargetType, "pendingEvidenceDigest", StringComparison.Ordinal))
    {
        return new AgentAdviceResponse([
            new AgentAdviceItem(
                "pendingEvidenceDigest",
                null,
                request.TargetKey,
                "info",
                "figyelmet",
                "A függőben lévő bizonyítékok közös mintázata: a csapatok már gyűjtöttek adatot, de a mérési döntések és bizonytalanságok még nincsenek elég tisztán kimondva.",
                "Először azt kérd vissza, hogy mi volt megfigyelés, mi következtetés, és melyik mérési döntés befolyásolhatta az eredményt.",
                [],
                citations,
                null)
        ]);
    }

    if (string.Equals(request.TargetType, "closureSynthesis", StringComparison.Ordinal))
    {
        return new AgentAdviceResponse([
            new AgentAdviceItem(
                "closureSynthesis",
                request.TargetId,
                request.TargetKey,
                "info",
                "info",
                "A projektzárásban az látszik, hogy a bizonyítékok, segítségkérések és tanári hatásnapló együtt jó alapot adnak a következő futtatás finomításához.",
                "Záráskor kérj vissza egy csapatonkénti tanulási fordulópontot, majd tanárként jelöld ki, melyik differenciálási támaszt tartanád meg és melyiket módosítanád.",
                [
                    "Melyik tanulói döntési pontnál lett látható a legtöbb gondolkodás?",
                    "Hol kellett más támaszt adni a csapatoknak, mint amit előre terveztél?",
                    "Mit tartanál meg változatlanul a következő albumfuttatásban?"
                ],
                citations,
                null)
        ]);
    }

    var currentWeek = GetIntProperty(snapshot, "currentWeek", 1);
    var pendingEvidenceId = GetGuidProperty(snapshot, "pendingEvidenceId");
    var advices = new List<AgentAdviceItem>
    {
        new(
            "quality",
            null,
            "bizonyit",
            "suggestion",
            "figyelmet",
            "A mikroklíma-album erős tanulási ívet ad, de a bizonyíték akkor lesz igazán meggyőző, ha a csapatok külön választják a mérést, a következtetést és a bizonytalanságot.",
            "Illessz be egy rövid gyorskört, ahol a tanulók ellenőrzik a saját mérési protokolljukat, mielőtt javaslatot fogalmaznak meg.",
            [],
            citations,
            new AgentAdviceAction(
                "createSticker",
                "Mérési gyorskör draft megnyitása",
                JsonSerializer.SerializeToElement(
                    new CreateStickerAdviceActionPayload(
                        "Mérési gyorskör: mi számít bizonyítéknak?",
                        "cselekves",
                        "Rövid ellenőrző kör a mérési döntések és bizonytalanságok láthatóvá tételére.",
                        "Válasszatok ki egy mérést, és jelöljétek: mit figyeltetek meg, mire következtettetek, és hol maradt bizonytalanság.",
                        [
                            "Mutass egy példát arra, hogyan válik egy adat bizonyítékká.",
                            "Kérd meg a csapatokat, hogy három színnel jelöljék a megfigyelést, következtetést és bizonytalanságot.",
                            "Zárásként minden csapat írjon egy javított bizonyíték-mondatot."
                        ],
                        "A csapat dönti el, melyik mérését erősíti meg vagy méri újra.",
                        "Javított bizonyíték-mondat vagy rövid mérési kiegészítés.",
                        "Rövid jegyzet vagy mérési kiegészítés",
                        "Mi lett pontosabb a gondolkodásotokban a jelölés után?",
                        "Ha nincs idő új mérésre, egy korábbi adatot elemezzenek újra.",
                        "Papíron, három jelöléssel is működik.",
                        currentWeek,
                        null),
                    CreateJsonOptions())))
    };

    if (pendingEvidenceId.HasValue)
    {
        advices.Add(new AgentAdviceItem(
            "evidence",
            pendingEvidenceId.Value,
            request.TargetKey,
            "suggestion",
            "info",
            "A beküldésben látszik a tanulói gondolkodás és a bizonytalanság is, ezért jó alkalom javító visszajelzésre.",
            "A visszajelzés ismerje el a megfigyelést, majd egyetlen újramérési döntést kérjen vissza.",
            [],
            citations.Take(2).ToList(),
            new AgentAdviceAction(
                "draftFeedback",
                "Feedback draft használata",
                JsonSerializer.SerializeToElement(
                    new DraftFeedbackAdviceActionPayload(
                        pendingEvidenceId.Value,
                        "Jó, hogy külön jeleztétek, hol bizonytalan a mérés. A következő körben válasszatok ki egy mérési döntést, amit ugyanúgy megismételtek: helyszín, időpont vagy eszköz. Írjátok le, ettől hogyan lesz meggyőzőbb az eredmény."),
                    CreateJsonOptions()))));
    }

    return new AgentAdviceResponse(advices);
}

static IReadOnlyList<AiCitationDto> GuidedDemoCitations() =>
[
    new("matrica-anatomia", "A matrica anatómiája", "A jó matrica cselekvést, döntést, bizonyítékot és reflexiót köt össze.", "projected"),
    new("tanulasi-bizonyitek-es-portfolio", "Tanulási bizonyíték", "A bizonyíték akkor segíti a tanulást, ha értelmezhetővé teszi a tanulói döntést.", "projected"),
    new("visszajelzes-es-revizio", "Visszajelzés és revízió", "A visszajelzés célja nem lezárás, hanem javítható következő lépés.", "projected")
];

static Guid? GetGuidProperty(JsonElement value, string name)
{
    if (!value.TryGetProperty(name, out var property) || property.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
    {
        return null;
    }
    return property.ValueKind == JsonValueKind.String && Guid.TryParse(property.GetString(), out var parsed)
        ? parsed
        : null;
}

static int GetIntProperty(JsonElement value, string name, int fallback) =>
    value.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var parsed)
        ? parsed
        : fallback;

static string HashSnapshot(JsonElement snapshot)
{
    var bytes = Encoding.UTF8.GetBytes(CanonicalizeSnapshot(snapshot));
    return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
}

static string CanonicalizeSnapshot(JsonElement snapshot)
{
    using var stream = new MemoryStream();
    using (var writer = new Utf8JsonWriter(stream))
    {
        WriteCanonicalJson(writer, snapshot);
    }

    return Encoding.UTF8.GetString(stream.ToArray());
}

static void WriteCanonicalJson(Utf8JsonWriter writer, JsonElement value)
{
    switch (value.ValueKind)
    {
        case JsonValueKind.Object:
            writer.WriteStartObject();
            foreach (var property in value.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal))
            {
                writer.WritePropertyName(property.Name);
                WriteCanonicalJson(writer, property.Value);
            }
            writer.WriteEndObject();
            break;
        case JsonValueKind.Array:
            writer.WriteStartArray();
            foreach (var item in value.EnumerateArray())
            {
                WriteCanonicalJson(writer, item);
            }
            writer.WriteEndArray();
            break;
        default:
            value.WriteTo(writer);
            break;
    }
}

static AiAdvice CreateAdviceFromAgentItem(AgentAdviceItem item, AiAdviceRun run, GenerateAiAdviceRequest request, DateTimeOffset now)
{
    var targetType = string.IsNullOrWhiteSpace(item.TargetType)
        ? (string.IsNullOrWhiteSpace(request.TargetType) ? (run.OwnerType == "instance" ? "albumInstance" : "albumTemplate") : request.TargetType.Trim())
        : item.TargetType.Trim();
    var targetId = item.TargetId ?? request.TargetId;
    var recommendation = string.IsNullOrWhiteSpace(item.Recommendation) ? null : item.Recommendation.Trim();
    var actionType = string.IsNullOrWhiteSpace(item.Action?.Type) ? null : item.Action.Type.Trim();
    var actionLabel = string.IsNullOrWhiteSpace(item.Action?.Label) ? null : item.Action.Label.Trim();
    var actionPayloadJson = item.Action?.Payload.ValueKind is null or JsonValueKind.Undefined or JsonValueKind.Null
        ? null
        : item.Action.Payload.GetRawText();

    if (run.Audience == "student")
    {
        recommendation = null;
        actionType = null;
        actionLabel = null;
        actionPayloadJson = null;
    }
    else if (actionType == "draftFeedback")
    {
        var draftPayload = DeserializeJson<DraftFeedbackAdviceActionPayload>(actionPayloadJson);
        if (draftPayload is null || string.IsNullOrWhiteSpace(draftPayload.Draft))
        {
            actionType = null;
            actionLabel = null;
            actionPayloadJson = null;
        }
        else if (string.Equals(request.TargetType, "evidence", StringComparison.Ordinal) && request.TargetId.HasValue)
        {
            targetType = "evidence";
            targetId = request.TargetId.Value;
            actionPayloadJson = SerializeJson(new DraftFeedbackAdviceActionPayload(request.TargetId.Value, draftPayload.Draft));
        }
    }

    return new AiAdvice
    {
        RunId = run.Id,
        Audience = run.Audience,
        OwnerType = run.OwnerType,
        OwnerId = run.OwnerId,
        TargetType = targetType,
        TargetId = targetId,
        TargetKey = string.IsNullOrWhiteSpace(item.TargetKey) ? request.TargetKey : item.TargetKey.Trim(),
        Kind = string.IsNullOrWhiteSpace(item.Kind) ? "suggestion" : item.Kind.Trim(),
        Severity = string.IsNullOrWhiteSpace(item.Severity) ? "info" : item.Severity.Trim(),
        Status = AdviceStatuses.New,
        Message = item.Message.Trim(),
        Recommendation = recommendation,
        QuestionsJson = SerializeJson(item.Questions ?? []),
        CitationsJson = SerializeJson(item.Citations ?? []),
        ActionType = actionType,
        ActionLabel = actionLabel,
        ActionPayloadJson = actionPayloadJson,
        PromptVersion = run.PromptVersion,
        ProjectionVersion = run.ProjectionVersion,
        CreatedAt = now,
        UpdatedAt = now
    };
}

static AiAdviceDto MapAiAdvice(AiAdvice advice)
{
    var questions = DeserializeJson<List<string>>(advice.QuestionsJson) ?? [];
    var citations = DeserializeJson<List<AiCitationDto>>(advice.CitationsJson) ?? [];
    AiAdviceActionDto? action = null;
    if (!string.IsNullOrWhiteSpace(advice.ActionType) && !string.IsNullOrWhiteSpace(advice.ActionPayloadJson))
    {
        using var document = JsonDocument.Parse(advice.ActionPayloadJson);
        action = new AiAdviceActionDto(advice.ActionType, UiText(advice.ActionLabel ?? advice.ActionType), document.RootElement.Clone());
    }

    return new AiAdviceDto(
        advice.Id,
        advice.RunId,
        advice.Audience,
        advice.OwnerType,
        advice.OwnerId,
        advice.TargetType,
        advice.TargetId,
        advice.TargetKey,
        advice.Kind,
        advice.Severity,
        advice.Status,
        UiText(advice.Message),
        UiTextOrNull(advice.Recommendation),
        questions,
        citations,
        action,
        advice.Model,
        advice.PromptVersion,
        advice.ProjectionVersion,
        advice.CreatedAt,
        advice.UpdatedAt,
        advice.AppliedAt);
}

static string SerializeJson<T>(T value) => JsonSerializer.Serialize(value, CreateJsonOptions());

static T? DeserializeJson<T>(string? value) =>
    string.IsNullOrWhiteSpace(value) ? default : JsonSerializer.Deserialize<T>(value, CreateJsonOptions());

static JsonSerializerOptions CreateJsonOptions() => new(JsonSerializerDefaults.Web);

static IReadOnlyList<string> DefaultProjectReflectionPrompts() =>
[
    "Milyen kérdéssel indultatok, és hogyan változott meg az út során?",
    "Mi az, amit másképp gondoltok most a projekt végére?",
    "Mit csinálnátok másképp, ha újrakezdenétek?"
];

static IReadOnlyList<string> NormalizeProjectReflectionPrompts(IEnumerable<string>? prompts)
{
    var normalized = (prompts ?? [])
        .Select(prompt => prompt?.Trim())
        .Where(prompt => !string.IsNullOrWhiteSpace(prompt))
        .Take(5)
        .Select(prompt => prompt!)
        .ToList();

    return normalized.Count > 0 ? normalized : DefaultProjectReflectionPrompts();
}

static string SerializeProjectReflectionPrompts(IEnumerable<string>? prompts) =>
    SerializeJson(NormalizeProjectReflectionPrompts(prompts));

static IReadOnlyList<string> ProjectReflectionPrompts(AlbumTemplateVersion version)
{
    try
    {
        return NormalizeProjectReflectionPrompts(DeserializeJson<List<string>>(version.ProjectReflectionPromptsJson));
    }
    catch (JsonException)
    {
        return DefaultProjectReflectionPrompts();
    }
}

static IReadOnlyList<DifferentiationPathDto> DefaultDifferentiationPaths() =>
[
    new("kerdezes", DifferentiationPathKeys.Supported, "Támogatott út",
        "A tanár előkészített megfigyelési ellenőrzőlistát ad: helyszín, idő, hipotézis-keret.",
        "Új a környékben járó, vagy bizonytalan diákok.", 1),
    new("kerdezes", DifferentiationPathKeys.Base, "Alap út",
        "A csapat választ két helyszínt és önállóan ír egy hipotézist a megfigyelési jegyzet alapján.",
        "A csapatok többsége.", 2),
    new("kerdezes", DifferentiationPathKeys.Challenge, "Kihívás út",
        "A csapat három helyszínt hasonlít össze és javaslatot tesz egy ismételhető mérési protokollra.",
        "Tapasztaltabb, gyors haladó csapatok.", 3),
    new("kepzelet", DifferentiationPathKeys.Supported, "Támogatott út",
        "Készen kapott szerepkártya teljes leírással, érvtérkép-sablon kitöltött példával.",
        "Tanulók, akiknek az érveléshez támasz kell.", 4),
    new("kepzelet", DifferentiationPathKeys.Base, "Alap út",
        "A csapat húz egy szerepet, kitölti az érvtérképet és felkészül egy ütköztetésre.",
        "A csapatok többsége.", 5),
    new("kepzelet", DifferentiationPathKeys.Challenge, "Kihívás út",
        "A csapat két szerep konfliktusát modellezi, és javaslatot tesz a vitát feloldó kompromisszumra.",
        "Erős vitakultúrájú csapatok.", 6),
    new("cselekves", DifferentiationPathKeys.Supported, "Támogatott út",
        "Előre kijelölt helyszín, papír alapú mérési táblázat, tanári segítés a méréshez.",
        "Csapatok, akik a mérés előtt bizonytalanok.", 7),
    new("cselekves", DifferentiationPathKeys.Base, "Alap út",
        "A csapat választja a három helyszínt és vezeti a mérési táblázatot.",
        "A csapatok többsége.", 8),
    new("cselekves", DifferentiationPathKeys.Challenge, "Kihívás út",
        "A csapat saját mérési protokollt tervez, hibahatárt becsül és ismétlést szervez.",
        "Természettudományos érdeklődésű csapatok.", 9),
    new("reflexio", DifferentiationPathKeys.Supported, "Támogatott út",
        "Készen kapott bemutató-váz: három dia, sablon javaslattal.",
        "Akik nehezen lépnek nyilvános bemutatóra.", 10),
    new("reflexio", DifferentiationPathKeys.Base, "Alap út",
        "A csapat háromperces bemutatót készít a választott média formátumban.",
        "A csapatok többsége.", 11),
    new("reflexio", DifferentiationPathKeys.Challenge, "Kihívás út",
        "A csapat moderálja a kérdés-válasz szakaszt és írásban összegzi a közönség visszajelzését.",
        "Vezetésre kész csapatok.", 12),
];

static IReadOnlyList<DifferentiationPathDto> NormalizeDifferentiationPaths(IEnumerable<DifferentiationPathDto>? paths)
{
    var defaults = DefaultDifferentiationPaths();
    var overrides = (paths ?? [])
        .Select(path => new DifferentiationPathDto(
            NormalizeStickerPhase(path.Phase),
            DifferentiationPathKeys.Normalize(path.PathKey),
            Clean(path.Title),
            Clean(path.Description),
            Clean(path.RecommendedFor),
            path.SortOrder))
        .GroupBy(path => (path.Phase, path.PathKey))
        .ToDictionary(group => group.Key, group => group.First());

    return defaults
        .Select(defaultPath =>
        {
            var key = (defaultPath.Phase, defaultPath.PathKey);
            return overrides.TryGetValue(key, out var path)
                ? new DifferentiationPathDto(
                    defaultPath.Phase,
                    defaultPath.PathKey,
                    string.IsNullOrWhiteSpace(path.Title) ? defaultPath.Title : path.Title,
                    string.IsNullOrWhiteSpace(path.Description) ? defaultPath.Description : path.Description,
                    string.IsNullOrWhiteSpace(path.RecommendedFor) ? defaultPath.RecommendedFor : path.RecommendedFor,
                    defaultPath.SortOrder)
                : defaultPath;
        })
        .ToList();
}

static IReadOnlyList<DifferentiationPathDto> DifferentiationPaths(AlbumTemplateVersion version)
{
    var rows = version.DifferentiationPaths
        .OrderBy(path => path.SortOrder)
        .Select(path => new DifferentiationPathDto(
            NormalizeStickerPhase(path.Phase),
            DifferentiationPathKeys.Normalize(path.PathKey),
            UiText(path.Title),
            UiText(path.Description),
            UiText(path.RecommendedFor),
            path.SortOrder))
        .ToList();

    return NormalizeDifferentiationPaths(rows);
}

static List<AlbumTemplateVersionDifferentiationPath> CloneDifferentiationPaths(IEnumerable<DifferentiationPathDto> paths) =>
    NormalizeDifferentiationPaths(paths)
        .Select(path => new AlbumTemplateVersionDifferentiationPath
        {
            Phase = path.Phase,
            PathKey = DifferentiationPathKeys.Normalize(path.PathKey),
            Title = path.Title,
            Description = path.Description,
            RecommendedFor = path.RecommendedFor,
            SortOrder = path.SortOrder
        })
        .ToList();

static string UiText(string value) =>
    value
        .Replace("Evidence-portfólió", "Bizonyíték-portfólió", StringComparison.Ordinal)
        .Replace("evidence-portfólió", "bizonyíték-portfólió", StringComparison.Ordinal)
        .Replace("Low-resource", "Erőforrástakarékos", StringComparison.Ordinal)
        .Replace("low-resource", "erőforrástakarékos", StringComparison.Ordinal)
        .Replace("template / instance modell", "albumterv / futó album modell", StringComparison.Ordinal)
        .Replace("Template", "Albumterv", StringComparison.Ordinal)
        .Replace("template", "albumterv", StringComparison.Ordinal)
        .Replace("Instance", "Futó album", StringComparison.Ordinal)
        .Replace("instance", "futó album", StringComparison.Ordinal)
        .Replace("Evidence", "Bizonyíték", StringComparison.Ordinal)
        .Replace("evidence", "bizonyíték", StringComparison.Ordinal);

static string? UiTextOrNull(string? value) =>
    string.IsNullOrWhiteSpace(value) ? value : UiText(value);

static string? Limit(string? value, int maxLength)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return null;
    }

    var trimmed = value.Trim();
    return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
}

static IReadOnlyList<QualityDimensionDto> LoadQualitySync(IEnumerable<QualityDimension> quality) =>
    quality.OrderBy(dimension => dimension.Label).Select(MapQualityDimension).ToList();

static async Task<IReadOnlyList<QualityDimensionDto>> LoadQualityAsync(AlbumDbContext db, string ownerType, Guid ownerId, CancellationToken cancellationToken)
{
    var quality = await db.QualityDimensions
        .AsNoTracking()
        .Where(dimension => dimension.OwnerType == ownerType && dimension.OwnerId == ownerId)
        .ToListAsync(cancellationToken);

    return LoadQualitySync(quality);
}

static async Task<IReadOnlyList<AiNote>> LoadNotesAsync(AlbumDbContext db, string ownerType, Guid ownerId, CancellationToken cancellationToken) =>
    await db.AiNotes
        .AsNoTracking()
        .Where(note => note.OwnerType == ownerType && note.OwnerId == ownerId)
        .ToListAsync(cancellationToken);

static async Task<int> NextInstanceSortOrderAsync(AlbumDbContext db, Guid instanceId, int week, CancellationToken cancellationToken) =>
    (await db.InstanceStickers
        .Where(sticker => sticker.AlbumInstanceId == instanceId && sticker.Week == week)
        .Select(sticker => (int?)sticker.SortOrder)
        .MaxAsync(cancellationToken) ?? 0) + 1;

static int ClampInstanceWeek(int week, AlbumInstance instance)
{
    var minWeek = Math.Max(1, week);
    var maxWeek = instance.AlbumTemplateVersion?.Weeks.Count ?? 0;
    return maxWeek > 0 ? Math.Min(minWeek, maxWeek) : minWeek;
}

static string? NormalizeOptionalStickerState(string? state)
{
    if (string.IsNullOrWhiteSpace(state))
    {
        return null;
    }

    var normalized = state.Trim();
    return StickerStates.All.Contains(normalized) ? normalized : null;
}

static string? ValidateStickerRequest(CreateStickerRequest? request)
{
    if (request is null)
    {
        return "A matrica adatai hiányoznak.";
    }

    return string.IsNullOrWhiteSpace(request.Title) ? "A matrica címe kötelező." : null;
}

static string TeamProgressStateFromEvidence(string status) =>
    status switch
    {
        EvidenceStatuses.Revision => TeamProgressStates.Revision,
        EvidenceStatuses.Pending => TeamProgressStates.Pending,
        _ => TeamProgressStates.Done,
    };

static AiNote InstanceStickerNote(Guid instanceId, Guid stickerId, string label, string message) => new()
{
    OwnerType = "instance",
    OwnerId = instanceId,
    TargetType = "instanceSticker",
    TargetId = stickerId,
    Kind = "info",
    Label = label,
    Severity = "info",
    Message = message,
};

static async Task<InstanceStickerDto> MapInstanceStickerForResponseAsync(
    AlbumDbContext db,
    Guid stickerId,
    Guid instanceId,
    CancellationToken cancellationToken)
{
    var saved = await db.InstanceStickers
        .AsNoTracking()
        .Include(sticker => sticker.StickerVersion)
            .ThenInclude(version => version!.StickerResource)
        .Include(sticker => sticker.StickerVersion)
            .ThenInclude(version => version!.TeacherSteps)
        .SingleAsync(sticker => sticker.Id == stickerId, cancellationToken);
    var instanceNotes = await LoadNotesAsync(db, "instance", instanceId, cancellationToken);
    var versionNotes = await LoadNotesAsync(db, "stickerVersion", saved.StickerVersionId, cancellationToken);
    return MapInstanceSticker(saved, instanceNotes.Concat(versionNotes));
}

static AlbumTemplateVersion LatestTemplateVersion(AlbumTemplate template) =>
    template.Versions
        .Where(version => !version.IsDraft)
        .OrderByDescending(version => version.VersionNumber)
        .FirstOrDefault()
    ?? template.Versions
        .OrderByDescending(version => version.VersionNumber)
        .FirstOrDefault()
    ?? new AlbumTemplateVersion
    {
        AlbumTemplateId = template.Id,
        VersionNumber = 1,
        Title = template.Title,
        Subject = template.Subject,
        Grade = template.Grade,
        DurationType = NormalizeDurationType(template.DurationType),
        PatternKey = NormalizePatternKey(template.PatternKey),
        PatternName = PatternName(template.PatternKey, template.PatternName),
        PatternDescription = PatternDescription(template.PatternKey, template.PatternDescription),
        DrivingQuestion = template.DrivingQuestion,
        FinalProduct = template.FinalProduct,
        Audience = template.Audience,
        ProjectReflectionPromptsJson = SerializeProjectReflectionPrompts(null),
        CreatedAt = template.CreatedAt
    };

static AlbumTemplateVersion? DraftTemplateVersion(AlbumTemplate template) =>
    template.Versions.FirstOrDefault(version => version.IsDraft);

static AlbumTemplateVersion CreateAlbumTemplateVersion(
    CreateAlbumTemplateRequest request,
    Guid templateId,
    Guid versionId,
    int versionNumber,
    DateTimeOffset createdAt) => new()
    {
        Id = versionId,
        AlbumTemplateId = templateId,
        VersionNumber = versionNumber,
        Title = request.Title.Trim(),
        Subject = Clean(request.Subject),
        Grade = Clean(request.Grade),
        DurationType = NormalizeDurationType(request.DurationType),
        DrivingQuestion = request.DrivingQuestion.Trim(),
        FinalProduct = Clean(request.FinalProduct),
        Audience = Clean(request.Audience),
        PatternKey = NormalizePatternKey(request.PatternKey),
        PatternName = PatternName(request.PatternKey, request.PatternName),
        PatternDescription = PatternDescription(request.PatternKey, request.PatternDescription),
        ProjectReflectionPromptsJson = SerializeProjectReflectionPrompts(request.ProjectReflectionPrompts),
        CreatedAt = createdAt,
        Dispositions = (request.Dispositions ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select((value, index) => new AlbumTemplateVersionDisposition { Name = value.Trim(), SortOrder = index + 1 })
            .ToList(),
        Weeks = (request.WeekTitles ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select((value, index) => new AlbumTemplateVersionWeekPlan { WeekNumber = index + 1, Title = value.Trim() })
            .ToList(),
        DifferentiationPaths = CloneDifferentiationPaths(DefaultDifferentiationPaths())
    };

static StickerVersionDto MapStickerVersion(StickerVersion version, IEnumerable<AiNote> notes) =>
    new(
        version.Id,
        version.StickerResourceId,
        version.VersionNumber,
        UiText(version.Title),
        version.Phase,
        version.ActivityTypeKey,
        UiText(version.ShortDescription),
        UiText(version.StudentInstruction),
        version.TeacherSteps.OrderBy(step => step.SortOrder).Select(step => UiText(step.Text)).ToList(),
        UiText(version.StudentChoice),
        UiText(version.ExpectedProduct),
        UiText(version.EvidenceTypeLabel),
        UiText(version.ReflectionPrompt),
        UiText(version.BPlan),
        UiText(version.LowResource),
        notes.OrderByDescending(note => note.CreatedAt).Select(MapAiNote).ToList(),
        new ActivityMetadataDto(
            version.Subject,
            version.GradeLevel,
            version.EstimatedMinutes,
            version.Modality,
            version.GroupSize,
            version.ContextMode,
            DeserializeJson<List<string>>(version.CompetenciesJson) ?? [],
            DeserializeJson<List<string>>(version.NatReferencesJson) ?? []));

static AlbumTemplateVersionDto MapTemplateVersion(AlbumTemplateVersion version, IEnumerable<AiNote> notes) =>
    new(
        version.Id,
        version.AlbumTemplateId,
        version.VersionNumber,
        version.IsDraft,
        UiText(version.Title),
        UiText(version.Subject),
        UiText(version.Grade),
        NormalizeDurationType(version.DurationType),
        NormalizePatternKey(version.PatternKey),
        UiText(PatternName(version.PatternKey, version.PatternName)),
        UiText(PatternDescription(version.PatternKey, version.PatternDescription)),
        UiText(version.DrivingQuestion),
        UiText(version.FinalProduct),
        UiText(version.Audience),
        ProjectReflectionPrompts(version),
        version.CreatedAt,
        DifferentiationPaths(version),
        version.Dispositions.OrderBy(disposition => disposition.SortOrder).Select(disposition => UiText(disposition.Name)).ToList(),
        version.Weeks.OrderBy(week => week.WeekNumber).Select(week => new WeekPlanDto(week.WeekNumber, UiText(week.Title))).ToList(),
        version.Stickers
            .OrderBy(sticker => sticker.Week)
            .ThenBy(sticker => sticker.SortOrder)
            .Select(sticker => MapTemplateSticker(sticker, notes))
            .ToList());

static TemplateStickerDto MapTemplateSticker(AlbumTemplateVersionSticker sticker, IEnumerable<AiNote> notes)
{
    var version = sticker.StickerVersion!;
    var resource = version.StickerResource!;
    var scopedNotes = notes.Where(note =>
        (note.OwnerType == "template" && note.TargetType == "templateSticker" && note.TargetId == sticker.Id) ||
        (note.OwnerType == "stickerVersion" && note.OwnerId == version.Id));

    return new(
        sticker.Id,
        resource.Id,
        version.Id,
        version.VersionNumber,
        sticker.Week,
        sticker.SortOrder,
        UiText(version.Title),
        version.Phase,
        UiText(version.ShortDescription),
        UiText(version.StudentInstruction),
        version.TeacherSteps.OrderBy(step => step.SortOrder).Select(step => UiText(step.Text)).ToList(),
        UiText(version.StudentChoice),
        UiText(version.ExpectedProduct),
        UiText(version.EvidenceTypeLabel),
        UiText(version.ReflectionPrompt),
        UiText(version.BPlan),
        UiText(version.LowResource),
        scopedNotes.OrderByDescending(note => note.CreatedAt).Select(MapAiNote).ToList());
}

static InstanceStickerDto MapInstanceSticker(InstanceSticker sticker, IEnumerable<AiNote> notes)
{
    var version = sticker.StickerVersion!;
    var resource = version.StickerResource!;
    var scopedNotes = notes.Where(note =>
        (note.OwnerType == "instance" && note.TargetType == "instanceSticker" && note.TargetId == sticker.Id) ||
        (note.OwnerType == "stickerVersion" && note.OwnerId == version.Id));

    return new(
        sticker.Id,
        resource.Id,
        version.Id,
        version.VersionNumber,
        sticker.AlbumTemplateVersionStickerId ?? sticker.AlbumTemplateStickerId,
        sticker.Week,
        sticker.SortOrder,
        sticker.State,
        sticker.Deprecated,
        UiText(version.Title),
        version.Phase,
        UiText(version.ShortDescription),
        UiText(version.StudentInstruction),
        version.TeacherSteps.OrderBy(step => step.SortOrder).Select(step => UiText(step.Text)).ToList(),
        UiText(version.StudentChoice),
        UiText(version.ExpectedProduct),
        UiText(version.EvidenceTypeLabel),
        UiText(version.ReflectionPrompt),
        UiText(version.BPlan),
        UiText(version.LowResource),
        scopedNotes.OrderByDescending(note => note.CreatedAt).Select(MapAiNote).ToList());
}

static async Task<AlbumTemplateVersion?> LatestPublishedVersionAsync(AlbumDbContext db, Guid templateId, CancellationToken cancellationToken) =>
    await db.AlbumTemplateVersions
        .AsSplitQuery()
        .Include(v => v.Stickers).ThenInclude(s => s.StickerVersion)
        .Include(v => v.Weeks)
        .Where(v => v.AlbumTemplateId == templateId && !v.IsDraft)
        .OrderByDescending(v => v.VersionNumber)
        .FirstOrDefaultAsync(cancellationToken);

static async Task<UpgradePlanDto?> BuildUpgradePreviewAsync(AlbumDbContext db, Guid instanceId, CancellationToken cancellationToken)
{
    var instance = await db.AlbumInstances
        .AsSplitQuery()
        .Include(i => i.AlbumTemplate)
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Stickers)
                .ThenInclude(s => s.StickerVersion)
        .Include(i => i.AlbumTemplateVersion)
            .ThenInclude(v => v!.Weeks)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.StickerVersion)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.Evidence)
        .Include(i => i.Stickers)
            .ThenInclude(s => s.TeamProgress)
        .Include(i => i.WeekPlanOverrides)
        .SingleOrDefaultAsync(i => i.Id == instanceId, cancellationToken);
    if (instance is null || instance.AlbumTemplateVersion is null) return null;

    var targetVersion = await LatestPublishedVersionAsync(db, instance.AlbumTemplateId, cancellationToken);
    if (targetVersion is null) return null;

    var plan = InstanceUpgradePlanner.ComputeUpgradePlan(instance, instance.AlbumTemplateVersion, targetVersion);
    return new UpgradePlanDto(
        TargetVersionId: plan.TargetVersionId,
        TargetVersionNumber: plan.TargetVersionNumber,
        CurrentVersionNumber: instance.AlbumTemplateVersion.VersionNumber,
        FromDurationType: NormalizeDurationType(plan.FromDurationType),
        ToDurationType: NormalizeDurationType(plan.ToDurationType),
        FromUnitCount: plan.FromUnitCount,
        ToUnitCount: plan.ToUnitCount,
        CurrentWeekClamp: plan.CurrentWeekClamp,
        IsNoOp: plan.IsNoOp,
        Added: plan.Added.Select(ToUpgradeItemDto).ToList(),
        RemovedNoEvidence: plan.RemovedNoEvidence.Select(ToUpgradeItemDto).ToList(),
        RemovedKeptForEvidence: plan.RemovedKeptForEvidence.Select(ToUpgradeItemDto).ToList(),
        Moved: plan.Moved.Select(ToUpgradeItemDto).ToList(),
        Repointed: plan.Repointed.Select(ToUpgradeItemDto).ToList(),
        Unchanged: plan.Unchanged.Select(ToUpgradeItemDto).ToList());
}

static UpgradePlanItemDto ToUpgradeItemDto(UpgradePlanItem item) =>
    new(
        item.InstanceStickerId,
        item.StickerVersionId,
        item.NewStickerVersionId,
        item.StickerResourceId,
        UiText(item.Title),
        item.FromStickerVersionNumber,
        item.ToStickerVersionNumber,
        item.FromWeek,
        item.FromSort,
        item.ToWeek,
        item.ToSort,
        item.EvidenceCount,
        item.ProgressCount);

/** Default seed for a new instance's closure checklist. Order matters — drives SortOrder. */
static IEnumerable<AlbumInstanceClosureChecklistItem> DefaultClosureChecklistItems() => new (int Order, string Label)[]
{
    (1, "Iskolavezetés meghívva"),
    (2, "Próbabemutató megtartva"),
    (3, "Makett kész"),
    (4, "Bizonyítékokra épülő érvelés a diákban"),
    (5, "Reflexiók beérkeztek minden csapattól"),
    (6, "Iskolavezetés visszajelzése rögzítve"),
    (7, "Hosszú távú javaslatok továbbítva"),
}.Select(seed => new AlbumInstanceClosureChecklistItem
{
    SortOrder = seed.Order,
    Label = seed.Label,
    Done = false,
});

/** Per-instance overrides win over the template version's titles; absent keys fall through. */
static List<WeekPlanDto> MergeInstanceWeekPlans(
    IEnumerable<AlbumTemplateVersionWeekPlan> templateWeeks,
    IEnumerable<AlbumInstanceWeekPlan> overrides)
{
    var overrideMap = overrides.ToDictionary(o => o.WeekNumber, o => o.Title);
    return templateWeeks
        .OrderBy(week => week.WeekNumber)
        .Select(week => new WeekPlanDto(
            week.WeekNumber,
            overrideMap.TryGetValue(week.WeekNumber, out var title) ? UiText(title) : UiText(week.Title)))
        .ToList();
}

static TeamDto MapTeam(Team team) =>
    new(
        team.Id,
        team.Name,
        team.Members.OrderBy(member => member.SortOrder).Select(member => new TeamMemberDto(member.Id, member.Name)).ToList(),
        team.Focus,
        team.Color);

static TeamStickerProgressDto MapTeamProgress(InstanceStickerTeamProgress progress) =>
    new(
        progress.InstanceStickerId,
        progress.TeamId,
        progress.State,
        progress.LatestEvidenceId,
        progress.Reflection,
        progress.ReflectedAt,
        progress.UpdatedAt);

static TeamDifferentiationPathAssignmentDto MapTeamDifferentiationPath(InstanceStickerTeamDifferentiationPath path) =>
    new(path.InstanceStickerId, path.TeamId, DifferentiationPathKeys.Normalize(path.PathKey), path.AssignedAt);

static AlbumInstanceTeamReflectionDto MapTeamReflection(AlbumInstanceTeamReflection reflection) =>
    new(reflection.TeamId, reflection.Text, reflection.UpdatedAt);

static TeacherEffectLogDto MapTeacherEffectLog(AlbumInstanceTeacherEffectLog log) =>
    new(
        UiText(log.WorkedWell),
        UiText(log.EngagementSignals),
        UiText(log.AdaptationNotes),
        UiText(log.ReuseNextTime),
        log.UpdatedAt);

static TeamHelpRequestDto MapTeamHelpRequest(TeamHelpRequest request) =>
    new(
        request.Id,
        request.AlbumInstanceId,
        request.TeamId,
        request.InstanceStickerId,
        request.Question,
        request.CreatedAt,
        request.ResolvedAt);

static EvidenceDto MapEvidence(Evidence evidence) =>
    new(
        evidence.Id,
        evidence.InstanceStickerId,
        evidence.TeamId,
        evidence.Type,
        evidence.Status,
        evidence.Title,
        evidence.SubmittedBy,
        evidence.SubmittedAt,
        evidence.Description,
        evidence.HelpRequest,
        evidence.HelpRequested,
        evidence.Reflection,
        evidence.TeacherFeedback,
        evidence.FeedbackAt,
        evidence.SeenByTeamAt,
        evidence.ArchivedAt);

static QualityDimensionDto MapQualityDimension(QualityDimension dimension) =>
    new(dimension.Id, dimension.Code, UiText(dimension.Label), dimension.Score, dimension.State, UiTextOrNull(dimension.Reason));

static AiNoteDto MapAiNote(AiNote note) =>
    new(
        note.Id,
        note.OwnerType,
        note.OwnerId,
        note.TargetType,
        note.TargetId,
        note.TargetKey,
        note.Kind,
        UiText(note.Label),
        note.Severity,
        UiText(note.Message),
        UiTextOrNull(note.Recommendation));

static StickerResource CreateStickerResource(CreateStickerRequest request, Guid resourceId, Guid versionId, int versionNumber) => new()
{
    Id = resourceId,
    Title = request.Title.Trim(),
    Versions = [CreateStickerVersion(request, resourceId, versionId, versionNumber)]
};

static StickerVersion CreateStickerVersion(CreateStickerRequest request, Guid resourceId, Guid versionId, int versionNumber)
{
    // Lift any legacy metadata note-lines out of the teacher steps; the cleaned steps stay
    // as the real pedagogical sequence. An explicit structured Metadata payload wins over
    // anything parsed from the note-lines.
    var rawSteps = (request.TeacherSteps ?? [])
        .Where(value => !string.IsNullOrWhiteSpace(value))
        .Select(value => value.Trim());
    var (parsed, cleanedSteps) = ActivityMetadataNotes.Parse(rawSteps);
    var meta = request.Metadata;

    var competencies = ((meta?.Competencies?.Count > 0 ? meta.Competencies : parsed.Competencies) ?? [])
        .Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim()).ToList();
    var natReferences = ((meta?.NatReferences?.Count > 0 ? meta.NatReferences : parsed.NatReferences) ?? [])
        .Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim()).ToList();

    return new StickerVersion
    {
        Id = versionId,
        StickerResourceId = resourceId,
        VersionNumber = versionNumber,
        Title = request.Title.Trim(),
        Phase = NormalizeStickerPhase(request.Phase),
        ActivityTypeKey = ActivityTypeKeys.Normalize(request.ActivityTypeKey),
        Subject = NullIfBlank(meta?.Subject) ?? parsed.Subject,
        GradeLevel = NullIfBlank(meta?.GradeLevel) ?? parsed.GradeLevel,
        EstimatedMinutes = meta?.EstimatedMinutes,
        Modality = NullIfBlank(meta?.Modality),
        GroupSize = NullIfBlank(meta?.GroupSize),
        ContextMode = NullIfBlank(meta?.ContextMode),
        CompetenciesJson = competencies.Count > 0 ? SerializeJson(competencies) : null,
        NatReferencesJson = natReferences.Count > 0 ? SerializeJson(natReferences) : null,
        ShortDescription = Clean(request.ShortDescription),
        StudentInstruction = Clean(request.StudentInstruction),
        StudentChoice = Clean(request.StudentChoice),
        ExpectedProduct = Clean(request.ExpectedProduct),
        EvidenceTypeLabel = Clean(request.EvidenceTypeLabel),
        ReflectionPrompt = Clean(request.ReflectionPrompt),
        BPlan = Clean(request.BPlan),
        LowResource = Clean(request.LowResource),
        TeacherSteps = cleanedSteps
            .Select((value, index) => new StickerVersionTeacherStep { SortOrder = index + 1, Text = value })
            .ToList()
    };
}

static string NormalizeStickerPhase(string? value)
{
    return value?.Trim().ToLowerInvariant() switch
    {
        "kerdezes" => "kerdezes",
        "kepzelet" => "kepzelet",
        "cselekves" => "cselekves",
        "reflexio" => "reflexio",
        "bizonyit" or "bizonyitek" or "bizonyitekgyujtes" => "cselekves",
        _ => "kerdezes"
    };
}

static Team CreateTeam(CreateTeamRequest request) => new()
{
    Name = Clean(request.Name),
    Focus = Clean(request.Focus),
    Color = string.IsNullOrWhiteSpace(request.Color) ? "#7872d4" : request.Color.Trim(),
    Members = (request.Members ?? [])
        .Where(member => !string.IsNullOrWhiteSpace(member))
        .Select((member, index) => new TeamMember { Name = member.Trim(), SortOrder = index + 1 })
        .ToList()
};

static StickerVersion LatestVersion(StickerResource resource) =>
    resource.Versions.OrderByDescending(version => version.VersionNumber).First();

static IQueryable<Block> BlockGraph(AlbumDbContext db) =>
    db.Blocks
        .Include(block => block.Versions)
        .ThenInclude(version => version.Activities);

static BlockVersion LatestBlockVersion(Block block) =>
    block.Versions.OrderByDescending(version => version.VersionNumber).First();

static BlockVersion? DraftBlockVersion(Block block) =>
    block.Versions.SingleOrDefault(version => version.IsDraft);

static async Task<BlockDetailDto?> MapBlockDetailAsync(AlbumDbContext db, Guid id, CancellationToken cancellationToken)
{
    var block = await db.Blocks
        .AsNoTracking()
        .Include(block => block.Versions)
        .ThenInclude(version => version.Activities)
        .ThenInclude(activity => activity.StickerVersion)
        .ThenInclude(version => version!.StickerResource)
        .SingleOrDefaultAsync(block => block.Id == id, cancellationToken);
    if (block is null)
    {
        return null;
    }

    return new BlockDetailDto(
        block.Id,
        UiText(block.Name),
        block.ArchivedAt,
        block.Versions
            .OrderByDescending(version => version.VersionNumber)
            .Select(MapBlockVersion)
            .ToList());
}

static BlockVersionDto MapBlockVersion(BlockVersion version) =>
    new(
        version.Id,
        version.BlockId,
        version.VersionNumber,
        version.IsDraft,
        UiText(version.Name),
        version.FlowType,
        version.Grouping,
        version.Activities
            .OrderBy(activity => activity.SortOrder)
            .Select(activity => new BlockActivityDto(
                activity.Id,
                activity.StickerVersionId,
                activity.StickerVersion?.StickerResourceId ?? Guid.Empty,
                UiText(activity.StickerVersion?.StickerResource?.Title ?? activity.StickerVersion?.Title ?? string.Empty),
                activity.StickerVersion?.VersionNumber ?? 0,
                activity.Role,
                activity.SortOrder))
            .ToList());

static IQueryable<Topic> TopicGraph(AlbumDbContext db) =>
    db.Topics
        .Include(topic => topic.Versions)
        .ThenInclude(version => version.Blocks);

static TopicVersion LatestTopicVersion(Topic topic) =>
    topic.Versions.OrderByDescending(version => version.VersionNumber).First();

static TopicVersion? DraftTopicVersion(Topic topic) =>
    topic.Versions.SingleOrDefault(version => version.IsDraft);

static async Task<TopicDetailDto?> MapTopicDetailAsync(AlbumDbContext db, Guid id, CancellationToken cancellationToken)
{
    var topic = await db.Topics
        .AsNoTracking()
        .AsSplitQuery()
        .Include(topic => topic.Versions)
        .ThenInclude(version => version.Blocks)
        .ThenInclude(relation => relation.BlockVersion)
        .ThenInclude(blockVersion => blockVersion!.Block)
        .Include(topic => topic.Versions)
        .ThenInclude(version => version.Blocks)
        .ThenInclude(relation => relation.BlockVersion)
        .ThenInclude(blockVersion => blockVersion!.Activities)
        .SingleOrDefaultAsync(topic => topic.Id == id, cancellationToken);
    if (topic is null)
    {
        return null;
    }

    return new TopicDetailDto(
        topic.Id,
        UiText(topic.Name),
        topic.ArchivedAt,
        topic.Versions
            .OrderByDescending(version => version.VersionNumber)
            .Select(MapTopicVersion)
            .ToList());
}

static TopicVersionDto MapTopicVersion(TopicVersion version) =>
    new(
        version.Id,
        version.TopicId,
        version.VersionNumber,
        version.IsDraft,
        UiText(version.Name),
        version.Blocks
            .OrderBy(block => block.SortOrder)
            .Select(block => new TopicBlockDto(
                block.Id,
                block.BlockVersionId,
                block.BlockVersion?.BlockId ?? Guid.Empty,
                UiText(block.BlockVersion?.Block?.Name ?? block.BlockVersion?.Name ?? string.Empty),
                block.BlockVersion?.VersionNumber ?? 0,
                block.BlockVersion?.Activities.Count ?? 0,
                block.SortOrder))
            .ToList());

static string Clean(string? value) => string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

// Defaults to 'het' so legacy clients sending no DurationType still get a valid value.
static string NormalizeDurationType(string? value) =>
    DurationTypes.IsValid(value) ? value! : DurationTypes.Week;

static string NormalizePatternKey(string? value) => AlbumTemplatePatterns.Normalize(value);

static string PatternName(string? key, string? name)
{
    var normalizedKey = NormalizePatternKey(key);
    return string.IsNullOrWhiteSpace(name)
        ? AlbumTemplatePatterns.Name(normalizedKey)
        : name.Trim();
}

static string PatternDescription(string? key, string? description)
{
    var normalizedKey = NormalizePatternKey(key);
    return string.IsNullOrWhiteSpace(description)
        ? AlbumTemplatePatterns.Description(normalizedKey)
        : description.Trim();
}

static IReadOnlyList<Guid> StarterStickerVersionIds(string? patternKey) =>
    NormalizePatternKey(patternKey) switch
    {
        AlbumTemplatePatterns.ProductiveFailure =>
        [
            DemoSeeder.ProductiveFailureChallengeVersionId,
            DemoSeeder.ProductiveFailureFirstStrategyVersionId,
            DemoSeeder.ProductiveFailureDeadEndVersionId,
            DemoSeeder.ProductiveFailureConsolidationVersionId,
            DemoSeeder.ProductiveFailureRetryVersionId
        ],
        AlbumTemplatePatterns.InquiryCer =>
        [
            DemoSeeder.InquiryQuestionVersionId,
            DemoSeeder.InquiryHypothesisVersionId,
            DemoSeeder.InquiryDataVersionId,
            DemoSeeder.InquiryClaimVersionId,
            DemoSeeder.InquiryEvidenceVersionId,
            DemoSeeder.InquiryReasoningVersionId,
            DemoSeeder.InquiryRevisionVersionId
        ],
        _ =>
        [
            DemoSeeder.ObservationVersionId,
            DemoSeeder.PerspectiveVersionId,
            DemoSeeder.MeasurementVersionId,
            DemoSeeder.PresentationVersionId
        ]
    };

static async Task AddStarterStickersAsync(
    AlbumDbContext db,
    AlbumTemplateVersion version,
    string patternKey,
    DateTimeOffset addedAt,
    CancellationToken cancellationToken)
{
    var starterIds = StarterStickerVersionIds(patternKey);
    if (starterIds.Count == 0)
    {
        return;
    }

    var existingIds = await db.StickerVersions
        .Where(stickerVersion => starterIds.Contains(stickerVersion.Id))
        .Select(stickerVersion => stickerVersion.Id)
        .ToListAsync(cancellationToken);
    var existingSet = existingIds.ToHashSet();

    version.Stickers = starterIds
        .Where(existingSet.Contains)
        .Select((versionId, index) => new AlbumTemplateVersionSticker
        {
            StickerVersionId = versionId,
            Week = index + 1,
            SortOrder = 1,
            AddedAt = addedAt
        })
        .ToList();
}

public static class DemoAuth
{
    public const string TeacherRole = "teacher";
    public const string StudentRole = "student";

    public static RouteHandlerBuilder RequireDemoRole(this RouteHandlerBuilder builder, string role) =>
        builder.AddEndpointFilter(async (context, next) =>
        {
            return IsAuthorized(context.HttpContext, role)
                ? await next(context)
                : Unauthorized(role);
        });

    public static async ValueTask<object?> RequireAnyRole(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        return IsAuthorized(context.HttpContext, null)
            ? await next(context)
            : Unauthorized(null);
    }

    public static async ValueTask<object?> RequireAdviceAudienceRole(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var request = context.Arguments.OfType<GenerateAiAdviceRequest>().FirstOrDefault();
        var role = string.Equals(request?.Audience, StudentRole, StringComparison.OrdinalIgnoreCase)
            ? StudentRole
            : TeacherRole;

        return IsAuthorized(context.HttpContext, role)
            ? await next(context)
            : Unauthorized(role);
    }

    private static bool IsAuthorized(HttpContext httpContext, string? requiredRole)
    {
        var configuredToken = httpContext.RequestServices.GetRequiredService<IConfiguration>()["DemoAuth:Token"];
        if (string.IsNullOrWhiteSpace(configuredToken))
        {
            return true;
        }

        var providedToken = httpContext.Request.Headers["X-Demo-Token"].ToString();
        if (!FixedTimeEquals(configuredToken, providedToken))
        {
            return false;
        }

        var role = httpContext.Request.Headers["X-Demo-Role"].ToString();
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        if (requiredRole is null)
        {
            return string.Equals(role, TeacherRole, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role, StudentRole, StringComparison.OrdinalIgnoreCase);
        }

        return string.Equals(role, requiredRole, StringComparison.OrdinalIgnoreCase);
    }

    private static bool FixedTimeEquals(string expected, string actual)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);
        return expectedBytes.Length == actualBytes.Length &&
            CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }

    private static IResult Unauthorized(string? role) =>
        Results.Json(
            new { error = role is null ? "Demo token szükséges." : $"Demo {role} jogosultság szükséges." },
            statusCode: StatusCodes.Status401Unauthorized);
}
