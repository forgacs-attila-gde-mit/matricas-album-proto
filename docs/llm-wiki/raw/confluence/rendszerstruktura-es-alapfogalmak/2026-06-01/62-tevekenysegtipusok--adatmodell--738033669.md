---
cim: "Tevékenységtípusok - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/738033669/Tev+kenys+gt+pusok+-+adatmodell
azonosito: "738033669"
szulo: "725811208"
szint: tevekenysegtipusok
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A tevékenységtípus adatmodell a pedagógiai működési minták strukturált leírását adja.

A modell célja:

* tevékenységek kategorizálása
* pedagógiai ajánlórendszer támogatása
* kereshetőség és szűrés
* AI-alapú generálás és besorolás támogatása

---

# 2. Adatmodell

```
ActivityType {
  id,
  key,
  name,
  description,
  pedagogyModel,
  interactionModel,
  cognitiveFocus,
  structureFlexibility,
  defaultGroupForm,
  allowedActivityPatterns,
  tags,
  compatibility,
  examples,
  metadata
}
```

---

# 3. Mezők részletesen

## 3.1 id

Egyedi azonosító

*  UUID vagy string
*  rendszer-szintű hivatkozás

---

## 3.2 key

Stabil technikai kulcs

Példák:

*  "felfedezo"
*  "kiserletezo"
*  "feldolgozo"

👉 nem lokalizált

---

## 3.3 name

Megjelenített név

*  lokalizálható
*  UI-ban használt

---

## 3.4 description

Rövid, rendszer-szintű leírás

*  mit jelent a típus
*  nem példa, nem narratíva

---

## 3.5 pedagogyModel

A domináns pedagógiai működés típusa

Enum:

*  exploratory
*  experimental
*  analytical
*  communicative
*  collaborative
*  reflective

👉 ez a "core meaning layer"

---

## 3.6 interactionModel

Tanulói interakció típusa

Enum:

*  individual
*  pair
*  group
*  mixed
*  open

---

## 3.7 cognitiveFocus

Kognitív dominancia

Lista (multi-value):

*  observation
*  analysis
*  creation
*  reasoning
*  communication
*  reflection

---

## 3.8 structureFlexibility

A típus strukturális kötöttsége

Enum:

*  low (szabad, exploratív)
*  medium (félig strukturált)
*  high (erősen strukturált)

---

## 3.9 defaultGroupForm

Alapértelmezett munkaszervezés

*  individual
*  pair
*  group
*  whole_class

---

## 3.10 allowedActivityPatterns

Milyen activity struktúrákkal kompatibilis

Példák:

*  single_step
*  multi_step
*  project_based
*  discussion_based
*  experiment_based

---

## 3.11 tags

Keresési és ajánlási címkék

*  string array
*  pl: "science", "reflection", "collaboration"

---

## 3.12 compatibility

Más tevékenységtípusokkal való együttműködés

```
compatibility {
  strongWith: [],
  weakWith: [],
  conflictingWith: []
}
```

👉 AI használja blokktervezéshez

---

## 3.13 examples

Strukturált példák (nem hosszú narratívák)

```
examples {
  title,
  shortScenario
}
```

👉 max 2–3 sor / példa

---

## 3.14 metadata

```
metadata {
  version,
  createdAt,
  updatedAt,
  source,
  isSystemDefined
}
```
