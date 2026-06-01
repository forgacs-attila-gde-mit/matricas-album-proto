---
title: "ADR003: A matrica tanulási atom marad; a platform-spec mint fölérendelt réteg"
type: adr
sources:
  - raw/confluence/rendszerstruktura-es-alapfogalmak/2026-06-01/00-root--rendszerstruktura-es-alapfogalmak--726106121.md
updated: 2026-06-01
lang: mixed
---

# ADR003: A matrica tanulási atom marad; a platform-spec mint fölérendelt réteg

Status: accepted (2026-06-01, terméktulajdonosi döntés)

## Decision

A 2026-06-01-i gold-standard ingest (`726106121` subtree — lásd [[2026-06-01-rendszerstruktura-gold-standard]]) három, a Matricás Album termékhez nem illeszkedő pontjára a termék így döntött:

- **A `matrica` a tanulási atom marad — nem fokozzuk le jutalmazási elemmé.** A platform-spec gyökéroldalának „4. Jutalmazás és reflektív működés" szakasza a `matricá`-t visszajelzési/motivációs (jutalom-jellegű) elemként írja le, amely *nem* strukturális szint. Ezt az olvasatot a Matricás Album **elveti**: nálunk a `Tevékenység (matrica)` a legkisebb tanulási egység, és érvényben marad a „matrica = bizonyíték-hordozó tanulási epizód, **nem** jelvény/badge" guardrail (lásd [[pedagogia-elobb-ai-masodik]], [[tanulasi-bizonyitek-evidence]], [[matricas-album]]).
- **A platform-szintű rendszerstruktúra fölérendelt réteg, nem maga a termék.** A `726106121` fa a Lecke.ai-szintű tanulási rendszer váza (nincs benne `album`, `Evidence`, `differenciálás`, `Hatásnapló`). A terméket ehhez **szelektíven** illesztjük, nem 1:1-ben; a pontos megfeleltetés későbbi finomítás.
- **A Confluence-re fel nem került ChatGPT-ábrát egyelőre figyelmen kívül hagyjuk.** Az ábra `Feladat` szintje és egyéb sávjai (Módszertani könyvtár, Kapcsolódás, Alapelv) **nem** kerülnek be a modellbe, amíg Confluence-re nem kerülnek és meg nem erősítik őket. A `raw/ChatGPT Image Jun 1, 2026, 03_01_22 PM.png` bizonytalan jövőbeli jelzés marad.

## Context

Forrás és az eredeti ütközések (C3, C4, C5): [[2026-06-01-rendszerstruktura-gold-standard]] „6. Ellentmondások és döntések". A párhuzamos hierarchia-döntés (C1, C2 — a `Tanulási egység` kivétele, a `Témakör` megtartása) az [[ADR002-temakor-elso-osztalyu-szint]]-ben szerepel. A „pedagógia előbb, AI második" és az anti-gamifikáció alapelv eleve ezt a matrica-olvasatot védi.

## Consequences

- A [[REFACTOR-001-gold-standard-rendszerstruktura|REFACTOR-001]] terv a `Tevékenység (matrica)` mint atom köré épül; a creation-UX és a hierarchia-entitások ezt nem írják felül.
- A jutalmazás-/haladás-funkciók (pl. „Megszerzett matricák", progress) a meglévő, bizonyíték-központú keretben maradnak; nincs badge-/pont-/loot-mechanika.
- A platform↔termék megfeleltetés nyitott finomítási pont, de **nem blokkolja** a `REFACTOR-001` fázisait.
- Ha a ChatGPT-ábra tartalma később Confluence-re kerül (pl. a `Feladat` szint), külön ingest + döntés tárgya lesz.
