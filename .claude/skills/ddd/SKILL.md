---
name: ddd
description: Apply Domain-Driven Design (DDD) patterns to software design and implementation. Use when the user asks to model a domain, design aggregates, entities, value objects, domain events, repositories, or bounded contexts; when they ask for DDD tactical or strategic patterns; or when reviewing/refactoring code to align with DDD principles. Triggers on phrases like "design the domain", "model this as DDD", "create an aggregate", "value object for", "bounded context", "ubiquitous language", "domain event", or "apply DDD to".
---

Apply Domain-Driven Design principles to model complex domains, design clean boundaries, and write expressive C# that reflects real business concepts.

**Typing convention**: Entity and VO properties **never** use `string` or `bool` directly. Every concept gets its own strongly-typed `readonly record struct` or enum.

## Workflow

1. **Understand the domain** — Clarify the business problem and invariants before modeling.
2. **Identify Bounded Contexts** — Draw explicit boundaries; establish the Ubiquitous Language for each context.
3. **Model the core** — Apply tactical patterns. Domain layer has zero infrastructure dependencies.
4. **Validate invariants** — Business rules enforce inside the domain model, not in application services.

## Tactical Patterns (summary)

| Pattern | Purpose |
|---------|---------|
| **Strongly-Typed Primitive** | Wrap `string`/`bool` in a named `readonly record struct`; wrap IDs the same way |
| **Value Object** | Immutable, identity-less; equality by value |
| **Entity** | Has persistent identity; state changes only through domain methods, never public setters |
| **Aggregate Root** | Consistency boundary; all external access goes through the root; raises domain events |
| **Domain Event** | Immutable past-tense record of something that happened; raised inside aggregates |
| **Domain Service** | Stateless operation spanning multiple aggregates; receives domain objects, never touches persistence |

Load `references/patterns-csharp.md` for full C# implementations of all patterns above.

## Strategic Patterns (summary)

- **Bounded Context** — Named boundary where a model and its Ubiquitous Language apply consistently.
- **Context Map** — Documents BC integration: Shared Kernel, Customer/Supplier, ACL, Published Language, Conformist.
- **ACL** — Translation layer protecting a downstream BC from upstream model changes.

Load `references/strategic-patterns.md` for detailed integration patterns and examples.

## Gotchas

- **No `string` or `bool` on entity/VO properties.** A raw primitive is always a design smell — wrap it.
- **Aggregate boundaries by invariant.** If two entities don't need to change together transactionally, they belong in separate aggregates.
- **Domain events ≠ integration events.** Domain events are in-process; translate to integration events at the BC boundary for external messaging.
- **No anemic domain models.** If all logic lives in services and aggregates are just getters/setters, the model isn't modeling anything.
- **Domain services don't touch persistence.** The application layer loads and saves; domain services operate on what's handed to them.
- **Ubiquitous Language in code.** If the domain expert says "confirm," the method is `order.Confirm()` — not `order.SetStatusApproved()`.

## Output Format

1. **Ubiquitous Language glossary** — key terms in this Bounded Context
2. **Aggregate map** — aggregates, invariants, owned entities/VOs
3. **Strongly-typed primitives** — all string-backed VOs, bool-backed VOs, and IDs
4. **Domain Events** — events raised per aggregate
5. **C# domain model** — compilable classes, zero infrastructure dependencies

Load `references/tactical-patterns.md` for advanced patterns: Specifications, Policies, Sagas, Event Sourcing.
