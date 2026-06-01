---
cim: "Modul - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/737673247/Modul+-+adatmodell
azonosito: "737673247"
szulo: "728727553"
szint: modul
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A modul adatmodell a rendszer legmagasabb szintű pedagógiai szervezési egységének strukturált leírása.

A modul több témakört fog össze, és egy átfogó tanulási és kompetenciafejlesztési ívet reprezentál.

---

## 2. Modul adatmodell

```
Module {
  id,
  name,
  description,
  topics,
  learningGoals,
  competencies,
  curriculumAlignment,
  progression,
  structure,
  duration,
  prerequisites,
  outcomes,
  assessmentFramework,
  subjects,
  gradeLevels,
  tags,
  metadata
}
```

---

## 3. Mezők részletesen

## 3.1 id

Egyedi azonosító

*  UUID vagy string
*  stabil rendszerhivatkozás

---

## 3.2 name

Modul neve

*  emberi olvasásra szánt cím
*  pl. „Mechanika alapjai", „Anyagok világa"

---

## 3.3 description

Rövid modul leírás

*  a modul pedagógiai fókusza
*  mit fed le a tanulási ív

---

## 3.4 topics

A modulhoz tartozó témakörök listája.

```
topics: [
  TopicReference
]
```

*  a modul nem tartalmazza a témakörök belső struktúráját
*  csak hivatkozásokat kezel

---

## 3.5 learningGoals

A modul tanulási céljai.

*  hosszabb távú pedagógiai célok
*  kompetenciafejlesztési irányok
*  tanulási ív célkitűzései

---

## 3.6 competencies

Fejlesztett kompetenciák.

*  kulcskompetenciák
*  tantárgyi kompetenciák
*  transzverzális készségek

---

## 3.7 curriculumAlignment

Tantervi illeszkedés.

```
curriculumAlignment {
  NAT,
  localCurriculum,
  frameworkReferences
}
```

---

## 3.8 progression

A tanulási progresszió leírása.

*  témakörök közötti fejlődési ív
*  tudásépítés logikája
*  egyszerű → komplex szerkezet

---

## 3.9 structure

A modul belső szerkezeti logikája.

*  témakörök sorrendje
*  modul fázisai
*  opcionális tanulási ágak

---

## 3.10 duration

A modul időkerete.

*  teljes időtartam
*  témakörökre bontott idő (opcionális)

---

## 3.11 prerequisites

Előfeltételek.

*  szükséges előzetes tudás
*  korábbi modulok vagy témakörök
*  kompetencia-elvárások

---

## 3.12 outcomes

Várt kimenetek.

*  tanulási eredmények
*  kompetencia szintek
*  megfigyelhető tudásformák

---

## 3.13 assessmentFramework

Értékelési keretrendszer.

*  formáló és szummatív elemek
*  értékelési fókuszok
*  mérési szempontok

---

## 3.14 subjects

Kapcsolódó tantárgyak.

*  egy vagy több tantárgy
*  multidiszciplináris modulok támogatása

---

## 3.15 gradeLevels

Évfolyamok.

*  egy vagy több szint
*  rugalmas besorolás

---

## 3.16 tags

Keresési és ajánlási címkék.

*  pedagógiai kulcsszavak
*  tematikus és kompetencia címkék

---

## 3.17 metadata

```
metadata {
  version,
  createdAt,
  updatedAt,
  source,
  isSystemDefined
}
```

---

## 4. Adatmodell elvi működése

## 4.1 aggregációs felső réteg

A modul:

*  témaköröket szervez
*  nem tartalmazza azok belső struktúráját

---

## 4.2 lazán csatolt hierarchia

*  témakörök önállóan is működnek
*  a modul csak összefűzi őket pedagógiai ívvé

---

## 4.3 skálázhatóság

A modell támogatja:

*  rövid modulokat (1–2 témakör)
*  hosszú, több témakörös tanulási íveket
*  multidiszciplináris struktúrákat

---

## 5. Összefoglalás

A modul adatmodell a rendszer legmagasabb szintű pedagógiai struktúráját írja le, amely témaköröket integrál egy koherens tanulási és kompetenciafejlesztési ívbe, biztosítva a tantervi illeszkedést, a progressziót és a hosszú távú pedagógiai szervezést.
