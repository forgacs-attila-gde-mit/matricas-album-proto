# DDD Patterns — C# Examples

## Base Classes

```csharp
public abstract class Entity<TId>
{
    public TId Id { get; protected set; } = default!;
    public override bool Equals(object? obj) =>
        obj is Entity<TId> other && EqualityComparer<TId>.Default.Equals(Id, other.Id);
    public override int GetHashCode() => EqualityComparer<TId>.Default.GetHashCode(Id!);
}

public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<IDomainEvent> _events = new();
    public IReadOnlyList<IDomainEvent> DomainEvents => _events.AsReadOnly();
    protected void Raise(IDomainEvent @event) => _events.Add(@event);
    public void ClearEvents() => _events.Clear();
}

public interface IDomainEvent { }
```

## Strongly-Typed ID

```csharp
public readonly record struct OrderId(Guid Value)
{
    public static OrderId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
```

## Strongly-Typed Primitives

**String-backed VO:**

```csharp
public readonly record struct Currency(string Value)
{
    public static readonly Currency Usd = Of("USD");
    public static readonly Currency Eur = Of("EUR");

    public static Currency Of(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException("Currency is required.");
        if (value.Length != 3) throw new DomainException("Currency must be a 3-letter ISO code.");
        return new Currency(value.ToUpperInvariant());
    }

    public override string ToString() => Value;
}

public readonly record struct EmailAddress(string Value)
{
    public static EmailAddress Of(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException("Email is required.");
        if (!value.Contains('@')) throw new DomainException("Invalid email address.");
        return new EmailAddress(value.ToLowerInvariant());
    }

    public override string ToString() => Value;
}
```

**Bool-backed VO:**

```csharp
public readonly record struct IsActive(bool Value)
{
    public static readonly IsActive Yes = new(true);
    public static readonly IsActive No = new(false);

    public static implicit operator bool(IsActive a) => a.Value;
    public override string ToString() => Value ? "Active" : "Inactive";
}
```

**Prefer an enum when the two states have distinct business names:**

```csharp
public enum OrderVisibility { Public, Private }
public enum PaymentStatus { Pending, Captured, Refunded, Failed }
```

## Value Object

```csharp
public sealed record Money(decimal Amount, Currency Currency)
{
    public static Money Of(decimal amount, Currency currency)
    {
        if (amount < 0) throw new DomainException("Amount cannot be negative.");
        return new Money(amount, currency);
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException($"Cannot add {Currency} and {other.Currency}.");
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Multiply(int factor) => new(Amount * factor, Currency);
}
```

## Entity

```csharp
public class OrderLine : Entity<OrderLineId>
{
    public ProductId ProductId { get; private set; }
    public Quantity Quantity { get; private set; }
    public Money UnitPrice { get; private set; }

    internal OrderLine(OrderLineId id, ProductId productId, Quantity quantity, Money unitPrice)
        : base(id)
    {
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }

    internal void IncreaseQuantity(Quantity by) =>
        Quantity = Quantity.Add(by);
}
```

## Aggregate Root

```csharp
public class Order : AggregateRoot<OrderId>
{
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();

    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money Total => _lines.Aggregate(
        Money.Of(0, Currency.Usd),
        (sum, l) => sum.Add(l.UnitPrice.Multiply(l.Quantity.Value)));

    public static Order Place(OrderId id, CustomerId customerId)
    {
        var order = new Order { Id = id, CustomerId = customerId, Status = OrderStatus.Pending };
        order.Raise(new OrderPlaced(id, customerId, DateTimeOffset.UtcNow));
        return order;
    }

    public void AddLine(ProductId productId, Quantity quantity, Money unitPrice)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("Cannot modify a non-pending order.");

        var existing = _lines.FirstOrDefault(l => l.ProductId == productId);
        if (existing is not null)
            existing.IncreaseQuantity(quantity);
        else
            _lines.Add(new OrderLine(OrderLineId.New(), productId, quantity, unitPrice));
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException("Only pending orders can be confirmed.");
        if (!_lines.Any())
            throw new DomainException("Cannot confirm an empty order.");

        Status = OrderStatus.Confirmed;
        Raise(new OrderConfirmed(Id, DateTimeOffset.UtcNow));
    }
}
```

## Domain Events

```csharp
public sealed record OrderPlaced(OrderId OrderId, CustomerId CustomerId, DateTimeOffset OccurredAt) : IDomainEvent;
public sealed record OrderConfirmed(OrderId OrderId, DateTimeOffset OccurredAt) : IDomainEvent;
```

## Domain Service

```csharp
public class OrderFulfillmentService
{
    public void Fulfill(Order order, IReadOnlyList<InventoryReservation> reservations)
    {
        if (!reservations.All(r => r.IsFulfilled))
            throw new DomainException("Cannot fulfill order — insufficient inventory.");

        order.MarkFulfilled(reservations);
    }
}
```

## Guard Clauses

```csharp
public static class Guard
{
    public static T NotNull<T>(T? value, string paramName) where T : class =>
        value ?? throw new ArgumentNullException(paramName);

    public static int GreaterThan(int value, int min, string paramName) =>
        value > min ? value : throw new DomainException($"{paramName} must be greater than {min}.");
}
```

## Domain Exception

```csharp
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

public class OrderNotFoundException : DomainException
{
    public OrderNotFoundException(OrderId id) : base($"Order '{id}' was not found.") { }
}
```
