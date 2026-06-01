using System.Net.Http.Json;
using System.Text.Json;
using MatricasAlbum.Api.Contracts;

namespace MatricasAlbum.Api.Services;

public sealed class AiAdviceAgentClient(HttpClient httpClient)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AgentAdviceResponse> GenerateAsync(AgentAdviceRequest request, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync("/advise", request, JsonOptions, cancellationToken);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<AgentAdviceResponse>(JsonOptions, cancellationToken);
        return payload ?? new AgentAdviceResponse([]);
    }
}

public sealed record AgentAdviceRequest(
    string Audience,
    string OwnerType,
    Guid OwnerId,
    string? TargetType,
    Guid? TargetId,
    string? TargetKey,
    string PromptVersion,
    string ProjectionVersion,
    JsonElement Snapshot,
    string? TraceId = null);

public sealed record AgentAdviceResponse(IReadOnlyList<AgentAdviceItem> Advices);

public sealed record AgentAdviceItem(
    string TargetType,
    Guid? TargetId,
    string? TargetKey,
    string Kind,
    string Severity,
    string Message,
    string? Recommendation,
    IReadOnlyList<string>? Questions,
    IReadOnlyList<AiCitationDto>? Citations,
    AgentAdviceAction? Action);

public sealed record AgentAdviceAction(
    string Type,
    string Label,
    JsonElement Payload);
