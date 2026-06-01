# Tactical Patterns — Advanced Reference

## Specification Pattern

Encapsulate a business rule that can be combined and reused.

```csharp
public interface ISpecification<T>
{
    bool IsSatisfiedBy(T candidate);
}

public class EligibleForDiscountSpec : ISpecification<Order>
{
    private readonly int _minimumLines;
    private readonly Money _minimumTotal;

    public EligibleForDiscountSpec(int minimumLines, Money minimumTotal)
    {
        _minimumLines = minimumLines;
        _minimumTotal = minimumTotal;
    }

    public bool IsSatisfiedBy(Order order) =>
        order.Lines.Count >= _minimumLines && order.Total.Amount >= _minimumTotal.Amount;
}

// Composable specs
public class AndSpecification<T>(ISpecification<T> left, ISpecification<T> right) : ISpecification<T>
{
    public bool IsSatisfiedBy(T candidate) => left.IsSatisfiedBy(candidate) && right.IsSatisfiedBy(candidate);
}
```

## Policy / Strategy Pattern

Represent a business rule or decision algorithm that may vary.

```csharp
public interface IDiscountPolicy
{
    Money Calculate(Order order);
}

public class BulkDiscountPolicy : IDiscountPolicy
{
    public Money Calculate(Order order)
    {
        var total = order.Total;
        return total.Amount >= 1000m
            ? Money.Of(total.Amount * 0.10m, total.Currency)
            : Money.Of(0, total.Currency);
    }
}

public class NoDiscountPolicy : IDiscountPolicy
{
    public Money Calculate(Order order) => Money.Of(0, order.Total.Currency);
}
```

Use a factory or DI to select the policy based on customer tier, campaign, etc.

## Saga / Process Manager

Coordinates a long-running business process spanning multiple aggregates or bounded contexts.

```csharp
// State-machine-based saga
public class OrderFulfillmentSaga
{
    public OrderId OrderId { get; private set; }
    public SagaState State { get; private set; }

    public IEnumerable<ICommand> Handle(OrderConfirmed @event)
    {
        State = SagaState.AwaitingInventoryReservation;
        yield return new ReserveInventory(@event.OrderId);
    }

    public IEnumerable<ICommand> Handle(InventoryReserved @event)
    {
        State = SagaState.AwaitingPayment;
        yield return new ChargePayment(OrderId);
    }

    public IEnumerable<ICommand> Handle(PaymentCharged @event)
    {
        State = SagaState.AwaitingShipment;
        yield return new ScheduleShipment(OrderId);
    }

    public IEnumerable<ICommand> Handle(InventoryReservationFailed @event)
    {
        State = SagaState.Cancelled;
        yield return new CancelOrder(OrderId, "Out of stock");
    }
}
```

Keep saga state persisted — treat the saga as an aggregate with its own repository.

## Event Sourcing

Store state as a sequence of domain events; replay to rebuild current state.

```csharp
public class EventSourcedOrder : AggregateRoot<OrderId>
{
    public OrderStatus Status { get; private set; }
    private readonly List<OrderLine> _lines = new();

    // Apply method is called both when raising new events and when replaying history
    public void Apply(OrderPlaced e)
    {
        Id = e.OrderId;
        Status = OrderStatus.Pending;
    }

    public void Apply(OrderLineAdded e)
    {
        _lines.Add(new OrderLine(e.LineId, e.ProductId, e.Quantity, e.UnitPrice));
    }

    public void Apply(OrderConfirmed e)
    {
        Status = OrderStatus.Confirmed;
    }

    // Command methods raise events; state changes happen only in Apply
    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("Only pending orders can be confirmed.");
        Raise(new OrderConfirmed(Id, DateTimeOffset.UtcNow));
    }

    // Replay from event stream
    public static EventSourcedOrder Rehydrate(IEnumerable<IDomainEvent> history)
    {
        var order = new EventSourcedOrder();
        foreach (var e in history)
            order.ApplyEvent(e);
        return order;
    }
}
```

## Domain Exception

Prefer domain-specific exceptions over generic ones.

```csharp
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

public class OrderNotFoundException : DomainException
{
    public OrderNotFoundException(OrderId id) : base($"Order '{id}' was not found.") { }
}

public class OrderAlreadyConfirmedException : DomainException
{
    public OrderAlreadyConfirmedException(OrderId id) : base($"Order '{id}' is already confirmed.") { }
}
```

## Guard Clauses

Centralize common validation to keep constructors/methods clean.

```csharp
public static class Guard
{
    public static T NotNull<T>(T? value, string paramName) where T : class =>
        value ?? throw new ArgumentNullException(paramName);

    public static int GreaterThan(int value, int min, string paramName) =>
        value > min ? value : throw new DomainException($"{paramName} must be greater than {min}.");

    public static string NotNullOrWhiteSpace(string? value, string paramName) =>
        string.IsNullOrWhiteSpace(value) ? throw new DomainException($"{paramName} is required.") : value;
}
```

## Result / Either Pattern (optional)

Avoid exceptions for expected domain failures; use explicit results.

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(T value) { IsSuccess = true; Value = value; }
    private Result(string error) { IsSuccess = false; Error = error; }

    public static Result<T> Ok(T value) => new(value);
    public static Result<T> Fail(string error) => new(error);
}
```

Use this when the caller should handle failure paths explicitly (e.g., payment declined) rather than catching exceptions.
