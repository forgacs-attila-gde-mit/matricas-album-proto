# Strategic Patterns — Reference

## Bounded Context

A named boundary where a specific domain model and Ubiquitous Language apply consistently. Terms can mean different things in different contexts.

| Context | "Customer" |
|---------|-----------|
| Sales | Prospect + contact info + account rep |
| Billing | Payer + payment method + invoice address |
| Shipping | Recipient + delivery address |

**Rules:**
- One team owns one Bounded Context.
- A BC has its own codebase / deployable unit (or at minimum its own namespace/project).
- Never share domain model classes across BCs. Share data via published events or APIs.

## Ubiquitous Language

- Build a glossary of terms used consistently by both developers and domain experts within a BC.
- When a domain expert says "confirm the order," that exact word ("confirm") should appear in code: `order.Confirm()`.
- If developers use different words than domain experts, that's a model smell — reconcile them.

```csharp
// Bad: developer-invented term
order.SetStatusToApproved();

// Good: ubiquitous language
order.Confirm();
```

## Context Map — Integration Patterns

### Shared Kernel
Two BCs share a small, explicitly defined subset of the domain model (e.g., a common `Money` type). Changes to the shared kernel require coordination. Use sparingly.

### Customer / Supplier
Downstream BC (customer) depends on upstream BC (supplier). Upstream team plans releases considering downstream needs.

### Conformist
Downstream adopts the upstream model as-is — no translation. Acceptable when the upstream is a third-party system or when translation cost is high and the model is acceptable.

### Anti-Corruption Layer (ACL)
A translation layer at the downstream boundary that converts the upstream model to the downstream's own model. Protects the downstream BC's language.

```csharp
// ACL: translates external Shipping API response into domain object
public class ShippingApiAdapter : IShipmentRepository
{
    private readonly ShippingApiClient _client;

    public async Task<Shipment?> FindByOrderAsync(OrderId orderId, CancellationToken ct)
    {
        var response = await _client.GetShipmentAsync(orderId.Value.ToString(), ct);
        if (response is null) return null;

        return new Shipment(
            ShipmentId.Of(response.TrackingNumber),
            orderId,
            MapStatus(response.Status),
            response.EstimatedDelivery
        );
    }

    private static ShipmentStatus MapStatus(string externalStatus) => externalStatus switch
    {
        "PICKED_UP" => ShipmentStatus.InTransit,
        "DELIVERED"  => ShipmentStatus.Delivered,
        "EXCEPTION"  => ShipmentStatus.Failed,
        _            => ShipmentStatus.Unknown,
    };
}
```

### Published Language
An upstream BC publishes a well-documented event/API contract (e.g., OpenAPI, Avro schema, CloudEvents). Downstreams integrate against this contract.

### Open Host Service
An upstream BC provides a formal API (REST, gRPC, GraphQL) that multiple downstreams consume. The protocol is the integration language.

## Event-Driven Integration Between BCs

Domain events become integration events at the BC boundary.

```
Order BC                           Inventory BC
──────────────────────────────     ──────────────────────────────
OrderConfirmed (domain event)  →   integration event bus
                                   → InventoryReservationHandler
                                       → ReserveInventory command
                                       → InventoryReserved (domain event)
```

**Translation layer (within Order BC):**

```csharp
public class OrderConfirmedIntegrationEventHandler : INotificationHandler<OrderConfirmed>
{
    private readonly IEventBus _bus;

    public async Task Handle(OrderConfirmed notification, CancellationToken ct)
    {
        // Translate domain event → integration event (different schema/contract)
        var integrationEvent = new OrderConfirmedIntegrationEvent(
            notification.OrderId.Value,
            notification.OccurredAt
        );
        await _bus.PublishAsync(integrationEvent, ct);
    }
}
```

Keep domain events internal (same process/BC). Only publish integration events externally.

## Identifying Bounded Contexts

Use **Event Storming** to discover contexts:
1. Post domain events on a timeline (orange sticky notes).
2. Identify commands that cause events (blue).
3. Identify aggregates that handle commands (yellow).
4. Draw boundaries around cohesive clusters — these are your BCs.

Signals a boundary is in the wrong place:
- The same class name means different things on both sides.
- Developers from two teams constantly need to coordinate on "shared" classes.
- A change in one area always ripples into another unrelated area.
