---
title: "ADR002: Témakör is a first-class hierarchy level"
type: adr
sources:
  - raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md
updated: 2026-06-01
lang: mixed
---

# ADR002: Témakör is a first-class hierarchy level

Status: accepted; **resolved/updated 2026-06-01** (lásd „## Resolution (2026-06-01)" lent — a `Tanulási egység` kikerült, a `Témakör` first-class marad)

## Decision

`Témakör` is a **first-class level** in the product hierarchy and **contains** `Tanulási egység`. The locked planning chain is:

`Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`

> **Frissítés (2026-06-01):** a `Tanulási egység` szint a termékdöntéssel **kikerült** — az érvényes lánc `Tanterv → Modul → Témakör → Blokk → Tevékenység`, a `Témakör` közvetlenül `Blokk`-okat tartalmaz. A `Témakör` first-class marad. Részletek lent: „## Resolution (2026-06-01)". Az alábbi `Tanulási egység`-hivatkozások történetiek.

`Témakör` is **not** a UX label or a tag — it owns the conceptual topic, NAT/kerettanterv links, and topic-level competency emphasis (see [[Glossary]]). Any schema- or API-level rename to introduce this hierarchy (e.g. `Topic` / `LearningUnit` objects) happens **only after an explicit mapping/migration spike**, never as a side effect of terminology alignment.

## Context

A `2026-05-31--matricas-album-termekvizio-live-subtree` Confluence-oldalfa rekurzív újraellenőrzése egy forrásszintű ellentmondást talált, amelyet sémamunka előtt rendezni kell.

- A `3. Rendszerstruktúra és alapfogalmak` oldal a hierarchiát `Tanterv -> Modul -> Tanulási egység -> Blokk -> Tevékenység` alakban írja le, és **nem tartalmazza** a `Témakör` szintet (([forrás](../../raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md))).
- Ugyanennek a live oldalfának a későbbi gyermekoldalai viszont a `Témakör` szintet **első osztályú** termékszintként kezelik: a `Témakörök`, `Témakörök létrehozása`, `Modulok létrehozása`, `Tanterv létrehozása` és `4. Felhasználói élmény` oldalak a `Modul` és a `Blokk` közé, a `Tanulási egység` fölé helyezik (([forrás](../../raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md))).

Ez a forráson belüli ellentmondás (single-source contradiction): ugyanaz a live termékfa két helyen mást mond. A termékdöntés a `Témakör`-t tartalmazó, gazdagabb olvasatot fogadja el, mert a létrehozási és felhasználói-élmény oldalak már így működnek; a kimaradó leírás a régebbi, még nem frissített oldal. A teljes live termékfa-olvasat a [[2026-05-31-matricas-album-live-termekfa|2026-05-31 live termékfa]] összefoglalóban él.

## Aktuális értelmezés

A `Témakör` valódi szint, és `Tanulási egység`-eket tartalmaz. A prototípus- és roadmap-olvasatban a tervezési hierarchia ezért:

`Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`

A jelenlegi implementáció ezt **kompatibilitási rétegként** kezeli: a `Témakör`, `Modul`, `Tanterv` és `Blokk` egyelőre nem külön schema-entitás, a `Tanulási egység` szerepét pedig átmenetileg a meglévő `AlbumTemplateVersionWeekPlan` / `AlbumInstanceWeekPlan` (`Week`/`WeekNumber`, `DurationType`) tölti be. A progresszív tervező UI a `Tanulási egység` kontextust láthatóan a `Témakör` és a `Blokk` közé helyezi, hogy a rögzített hierarchia már a sémamunka előtt látszódjon.

## Consequences

- A fő wiki és a Matricás Album prototípus finomításai a `Témakör`-t első osztályú szintként kezelik prózában, UI-ban és roadmapen — de a megnevezés magyar marad (lásd [[Glossary]]).
- Schema- vagy API-szintű átnevezés (`Curriculum`, `Module`, `Topic`, `LearningUnit`, `Block` entitások) **nem** indulhat el külön mapping/spike előtt. Addig nem szabad `Topic` / `LearningUnit` sémaobjektumokat bevezetni, és nem szabad a `Week` / `WeekNumber` / `CurrentWeek` mezőket `UnitIndex`-re átnevezni.
- A meglévő tervezési metaadatok (placement context: `Tanterv`, `Modul`, `Témakör`, `Tanulási egység`, `Blokk`) ma frontend-mezők, amelyek tanári jegyzetekbe szerializálódnak — ezek **no-regression híd**, nem kérdezhető schema-oszlopok; strukturált szűrést vagy adaptációs logikát nem szabad rájuk építeni.
- A tanár ne legyen kényszerítve a teljes hierarchia kezelésére, mielőtt egyetlen tevékenységet létre tud hozni vagy futtatni.
- A forrásellentmondás addig nyitva marad, amíg a régebbi `3. Rendszerstruktúra` oldal nincs összhangolva; az implementáció a fenti rögzített hierarchiához igazodik. A teljes domain-objektum térkép: [[AlbumDomain]].

## Resolution (2026-06-01) — a `Tanulási egység` kikerül

Terméktulajdonosi döntés (C1 + C2 a [[2026-06-01-rendszerstruktura-gold-standard]] „6. Ellentmondások és döntések" szakaszában):

- a `Témakör` **first-class marad**;
- a `Tanulási egység` szint **kikerül** a hierarchiából.

Az érvényes (rögzített) lánc tehát: **`Tanterv → Modul → Témakör → Blokk → Tevékenység`** — a `Témakör` közvetlenül `Blokk`-okat tartalmaz (a friss spec `Topic { blocks }` adatmodellje szerint). A korábbi flag ezzel **lezárva**.

Következmény a sémamunkára: ne vezess be `Tanulási egység` / `LearningUnit` szintet; a jelenlegi `AlbumTemplateVersionWeekPlan` / `AlbumInstanceWeekPlan` (`Week`/`WeekNumber`) átmeneti egységsorai a `Blokk`-réteghez rendelődnek a `REFACTOR-001` migrációban, nem egy önálló `Tanulási egység` szinthez. A `matrica` fogalma változatlan marad — lásd [[ADR003-matrica-tanulasi-atom]].
