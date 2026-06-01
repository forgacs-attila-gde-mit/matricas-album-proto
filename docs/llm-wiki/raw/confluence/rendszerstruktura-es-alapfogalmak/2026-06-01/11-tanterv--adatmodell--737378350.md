---
cim: "Tanterv - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/737378350/Tanterv+-+adatmodell
azonosito: "737378350"
szulo: "728498190"
szint: tanterv
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A tanterv adatmodell a rendszer legfelső szintű pedagógiai és szabályozási keretrendszerének strukturált leírása.

A tanterv modulokat, kompetenciákat és tanulási kimeneteket szervez egy egységes, normatív struktúrába.

---

## 2. Tanterv adatmodell

```
Curriculum {
  id,
  name,
  description,
  modules,
  subjects,
  gradeLevels,
  competencyFramework,
  learningOutcomes,
  progressionModel,
  structure,
  assessmentPolicy,
  curriculumStandards,
  duration,
  prerequisites,
  tags,
  versioning,
  governance,
  metadata
}
```

---

## 3. Mezők részletesen

## 3.1 id

Egyedi azonosító

*  UUID vagy string
*  stabil, hosszú távú referencia

---

## 3.2 name

Tanterv neve

*  pl. „Általános iskolai természettudományok", „Digitális kompetencia keretrendszer"

---

## 3.3 description

A tanterv rövid leírása

*  pedagógiai célrendszer
*  lefedett területek
*  alkalmazási kontextus

---

## 3.4 modules

A tantervhez tartozó modulok listája.

```
modules: [
  ModuleReference
]
```

*  a tanterv nem tartalmaz belső modulstruktúrát
*  csak hivatkozásokat kezel

---

## 3.5 subjects

Kapcsolódó tantárgyak.

*  egy vagy több tantárgy
*  multidiszciplináris tantervek támogatása

---

## 3.6 gradeLevels

Évfolyamok.

*  alsó tagozat
*  felső tagozat
*  középiskola
*  vagy vegyes struktúrák

---

## 3.7 competencyFramework

Kompetencia keretrendszer.

```
competencyFramework {
  keyCompetencies,
  subjectCompetencies,
  transversalCompetencies
}
```

---

## 3.8 learningOutcomes

Tanulási kimenetek.

*  mérhető pedagógiai eredmények
*  tudás, készségek, attitűdök
*  standardizált elvárások

---

## 3.9 progressionModel

Tanulási progressziós modell.

*  kompetenciafejlődési ív
*  modulok közötti előrehaladás
*  spirális vagy lineáris logika

---

## 3.10 structure

A tanterv szerkezeti leírása.

*  modulok hierarchiája
*  tantárgyi bontás
*  évfolyami struktúra

---

## 3.11 assessmentPolicy

Értékelési irányelvek.

*  formáló és szummatív értékelés
*  kompetencia alapú mérés
*  követelményrendszer

---

## 3.12 curriculumStandards

Szabályozási referencia.

*  NAT vagy más nemzeti standardok
*  intézményi előírások
*  nemzetközi keretek (opcionális)

---

## 3.13 duration

Időkeret.

*  teljes tantervi lefedés ideje
*  évfolyami vagy ciklus alapú bontás

---

## 3.14 prerequisites

Előfeltételek.

*  korábbi tanulási szintek
*  kompetencia belépési szintek
*  moduláris előkövetelmények

---

## 3.15 tags

Keresési és kategorizálási címkék.

*  pedagógiai fókusz
*  tantárgyi kategóriák
*  kompetencia címkék

---

## 3.16 versioning

Verziókezelés.

```
versioning {
  version,
  createdAt,
  updatedAt,
  changelog,
  status
}
```

---

## 3.17 governance

Irányítási és szabályozási metaadatok.

*  ki készítette
*  intézményi felelős
*  jóváhagyási státusz
*  validációs szint

---

## 3.18 metadata

```
metadata {
  source,
  region,
  language,
  isSystemDefined
}
```

---

## 4. Adatmodell elvi működése

## 4.1 normatív felső réteg

A tanterv:

*  meghatározza a rendszer kereteit
*  szabályozási szintet képvisel
*  nem végrehajtási struktúra

---

## 4.2 hierarchikus illeszkedés

*  tanterv → modul → témakör → blokk → tevékenység
*  minden alacsonyabb szint a tantervhez igazodik

---

## 4.3 stabil referencia réteg

A tanterv:

*  ritkán változik
*  verziózott és auditálható
*  hosszú távú struktúra

---

## 5. Összefoglalás

A tanterv adatmodell a rendszer legfelső szintű, normatív pedagógiai keretrendszerét írja le, amely modulokon keresztül határozza meg a teljes tanulási struktúrát, biztosítva a kompetenciaalapú koherenciát, a tanulási kimenetek egységességét és a szabályozási megfelelést.
