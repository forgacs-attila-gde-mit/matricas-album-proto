---
cim: "Témakör - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/738263073/T+mak+r+-+adatmodell
azonosito: "738263073"
szulo: "731480065"
szint: temakor
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A témakör adatmodell a rendszer tematikus szervezési egységének strukturált leírása.

A témakör célja a blokkok és tevékenységek magasabb szintű, pedagógiailag koherens csoportosítása.

---

## 2. Témakör adatmodell

```
Topic {
  id,
  name,
  description,
  blocks,
  activities,
  learningGoals,
  competencies,
  curriculumAlignment,
  progression,
  structure,
  duration,
  subjects,
  gradeLevels,
  tags,
  prerequisites,
  outcomes,
  metadata
}
```

---

## 3. Mezők részletesen

## 3.1 id

Egyedi azonosító

*  UUID vagy string
*  stabil hivatkozási kulcs

---

## 3.2 name

Témakör neve

*  emberi olvasásra szánt cím
*  pl. „Mozgás és erő", „Környezet és élővilág"

---

## 3.3 description

Rövid tematikus leírás

*  miről szól a témakör
*  milyen pedagógiai fókuszt képvisel

---

## 3.4 blocks

A témakörhöz tartozó blokkok listája.

```
blocks: [
  BlockReference
]
```

*  a témakör nem tartalmazza a blokkok belső szerkezetét
*  csak hivatkozásokat kezel

---

## 3.5 activities

Opcionális közvetlen tevékenység hivatkozások.

*  ritkán használt
*  főleg gyors keresési vagy preview célokra

---

## 3.6 learningGoals

A témakör tanulási céljai.

*  pedagógiai célkitűzések
*  tematikus célok
*  kompetenciafejlesztési irányok

---

## 3.7 competencies

Fejlesztett kompetenciák listája.

*  kulcskompetenciák
*  tantárgyi kompetenciák
*  transzverzális készségek

---

## 3.8 curriculumAlignment

Tantervi illeszkedés.

```
curriculumAlignment {
  NAT,
  localCurriculum,
  frameworkReferences
}
```

---

## 3.9 progression

A tanulási ív leírása.

*  hogyan épül fel a tudás a témakörben
*  blokkok közötti fejlődési logika
*  egyszerű → komplex struktúra

---

## 3.10 structure

A témakör belső szervezési logikája.

*  blokkok sorrendje
*  tematikus egységek
*  opcionális fázisok

---

## 3.11 duration

A témakör időkerete.

*  teljes időtartam
*  blokkokra bontott idő (opcionális)

---

## 3.12 subjects

Kapcsolódó tantárgyak.

*  egy vagy több tantárgy
*  multidiszciplináris támogatás

---

## 3.13 gradeLevels

Évfolyamok.

*  egy vagy több szint
*  rugalmas besorolás

---

## 3.14 tags

Keresési és ajánlási címkék.

*  pedagógiai kulcsszavak
*  tematikus jelölők

---

## 3.15 prerequisites

Előfeltételek.

*  szükséges előzetes tudás
*  korábbi témakörök
*  kompetencia-elvárások

---

## 3.16 outcomes

Várt eredmények.

*  tanulási kimenetek
*  kompetenciafejlődés
*  megfigyelhető tudásformák

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

## 4.1 aggregációs réteg

A témakör:

*  blokkokat szervez
*  nem írja felül azok működését

---

## 4.2 lazán kapcsolt struktúra

*  a blokkok önállóan is létezhetnek
*  a témakör csak hivatkozásokat kezel

---

## 4.3 skálázhatóság

A modell támogatja:

*  egyszerű témakörök
*  komplex, több blokkból álló tematikák
*  multidiszciplináris struktúrák

---

## 5. Összefoglalás

A témakör adatmodell egy magas szintű pedagógiai strukturális leírás, amely blokkokat és tanulási egységeket tematikusan szervez, biztosítva a tanulási folyamatok koherenciáját, progresszióját és tantervi illeszkedését, miközben megtartja az alsóbb szintek (blokkok és tevékenységek) rugalmasságát és újrafelhasználhatóságát.
