---
cim: "Blokk - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/738099217/Blokk+-+adatmodell
azonosito: "738099217"
szulo: "728465410"
szint: blokk
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A blokk adatmodell a tanulási folyamatokat szervező egység strukturált leírását adja.

A blokk nem tartalmi elem, hanem egy olyan keretrendszer, amely tevékenységeket rendez pedagógiai sorrendbe, szerepekbe és kontextusokba.

---

## 2. Blokk adatmodell

```
Block {
  id,
  name,
  description,
  activities,
  structure,
  pedagogyContext,
  flowType,
  duration,
  grouping,
  rules,
  outcomes,
  metadata
}
```

---

## 3. Mezők részletesen

## 3.1 id

Egyedi azonosító

*  típusa: UUID vagy string
*  a blokk egyértelmű hivatkozása

---

## 3.2 name

A blokk neve

*  emberi olvasásra szánt cím
*  pl. „Sebességvizsgálat", „Anyagok kísérlete"

---

## 3.3 description

Rövid pedagógiai leírás

*  mit szervez a blokk
*  milyen tanulási célt szolgál

---

## 3.4 activities

A blokkban szereplő tevékenységek kapcsolatai.

```
activities: [
  ActivityBlockRelation
]
```

Ez a kapcsolat rétegen keresztül történik, nem közvetlen embedként

---

## 3.5 structure

A blokk belső szerkezeti logikája.

Lehetséges elemek:

*  sorrend
*  fázisok
*  csoportosítás
*  ágak (branching)

---

## 3.6 pedagogyContext

A blokk pedagógiai kerete.

Tartalmazhat:

*  tantárgy
*  évfolyam
*  kompetenciaterület
*  tanulási cél

---

## 3.7 flowType

A tanulási folyamat típusa.

Enum:

*  linear (lineáris)
*  cyclical (ciklikus)
*  exploratory (feltáró)
*  project_based (projekt alapú)
*  mixed (vegyes)

---

## 3.8 duration

A blokk időkerete.

*  összidő
*  tevékenységenkénti bontás opcionálisan

---

## 3.9 grouping

A tanulásszervezés formája.

Lehetséges értékek:

*  individual
*  pair
*  group
*  whole_class
*  dynamic

---

## 3.10 rules

A blokk működési szabályai.

```
rules {
  orderingRequired,
  optionalActivitiesAllowed,
  skippingAllowed,
  lockedActivities,
  adaptiveFlow
}
```

---

## 3.11 outcomes

A blokk várt pedagógiai kimenetei.

*  kompetenciák
*  tanulási eredmények
*  megfigyelhető viselkedések

---

## 3.12 metadata

```
metadata {
  createdAt,
  updatedAt,
  source,
  version,
  tags
}
```

---

## 4. Adatmodell elvi működése

## 4.1 nem tartalom, hanem keret

A blokk:

*  nem tárolja a tevékenységek tartalmát
*  csak szervezi és strukturálja őket

---

## 4.2 kapcsolat alapú működés

A blokk nem "beágyazza" a tevékenységeket, hanem:

*  kapcsolja őket
*  szerepet rendel hozzájuk
*  kontextust ad

---

## 4.3 újrafelhasználhatóság

Egy blokk:

*  újra felhasználható
*  adaptálható
*  más tevékenységkombinációkkal is működik

---

## 5. Összefoglalás

A blokk adatmodell egy strukturális és szervezési keretrendszer, amely tevékenységeket tanulási folyamatokká rendezi, meghatározva azok sorrendjét, szerepét, kontextusát és pedagógiai működési logikáját, miközben nem módosítja az egyes tevékenységek alapstruktúráját.
