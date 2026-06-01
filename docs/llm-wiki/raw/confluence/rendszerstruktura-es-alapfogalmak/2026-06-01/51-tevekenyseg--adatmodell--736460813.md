---
cim: "Tevékenység - adatmodell"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/736460813/Tev+kenys+g+-+adatmodell
azonosito: "736460813"
szulo: "728301572"
szint: tevekenyseg
facet: adatmodell
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Áttekintés

A tevékenység egy újrafelhasználható pedagógiai egység, amely egy konkrét tanulási aktivitást ír le.

Az adatmodell célja:

* egységes tárolási struktúra
* újrafelhasználhatóság biztosítása
* blokkokba és nagyobb rendszerekbe integrálhatóság
* AI és manuális generálás támogatása

---

# 2. Adatmodell szerkezete

## 2.1 Alap struktúra

```
Activity {
  id,
  name,
  instruction,
  type,
  metadata,
  pedagogy,
  context,
  resources,
  relations,
  lifecycle
}
```

---

# 3. Mezők részletesen

## 3.1 Alap mezők

### id

Egyedi azonosító.

*  típusa: string / UUID
*  cél: hivatkozás, újrafelhasználás

---

### name

A tevékenység neve.

*  rövid, tanulóbarát cím
*  pl.: „Sebességmérés papírrepülővel"

---

### instruction

A tevékenység végrehajtási leírása.

Tartalmazhat:

*  lépések
*  feladatleírás
*  tanulói instrukciók

👉 Ez a „mit csinál a diák?"

---

### type

A tevékenység domináns pedagógiai típusa.

Pl.:

*  kísérletező
*  kommunikációs
*  reflektív
*  gyakorló
*  problémamegoldó

👉 csak 1 fő típus

---

# 3.2 Metadata (általános jellemzők)

```
metadata {
  shortDescription,
  estimatedTime,
  difficulty,
  groupSize,
  modality
}
```

### shortDescription

Rövid összefoglalás (1-2 mondat)

### estimatedTime

Időigény (percben)

### difficulty

Szint (pl. 1–5 vagy alap/közép/emelt)

### groupSize

*  egyéni
*  pármunka
*  csoport
*  osztály

### modality

Tanulási forma:

*  offline
*  online
*  blended

---

# 3.3 Pedagógiai réteg

```
pedagogy {
  competencies,
  methods,
  reflectionPrompts
}
```

### competencies

Fejlesztett kompetenciák listája

(pl. matematikai gondolkodás, kommunikáció, együttműködés)

---

### methods

Alkalmazott pedagógiai módszerek

(pl. projekt, kísérlet, vita, felfedeztetés)

---

### reflectionPrompts

Reflektív kérdések (opcionális)

(pl. „Mit tanultál?", „Mi volt nehéz?")

---

# 3.4 Kontextus

```
context {
  subject,
  gradeLevel,
  topics,
  natReferences
}
```

### subject

Tantárgy

### gradeLevel

Évfolyam

### topics

Kapcsolódó témák

### natReferences

NAT azonosítók / kompetenciák

---

# 3.5 Erőforrások

```
resources {
  tools,
  materials,
  attachments,
  externalLinks
}
```

### tools

Eszközök (pl. laptop, mérőeszköz)

### materials

Fizikai anyagok

### attachments

Fájlok, képek, dokumentumok

### externalLinks

Külső hivatkozások

---

# 3.6 Kapcsolatok (Relations)

Ez a rendszer egyik legfontosabb része.

```
relations {
  blocks,
  versions,
  derivedFrom,
  reusedIn
}
```

### blocks

Mely blokkokban szerepel

### versions

Verziók (AI/teacher módosítások)

### derivedFrom

Miből lett adaptálva

### reusedIn

Hol van újrahasznosítva

---

# 3.7 Lifecycle (állapotmodell)

```
lifecycle {
  status,
  createdAt,
  updatedAt,
  source
}
```

### status

*  draft
*  active
*  archived

### source

*  manual
*  ai
*  adapted
*  library

---

# 4. Kulcs elv

👉 A tevékenység:

* **nem óra**
* **nem tanterv**
* **nem blokk**

Hanem:

> egy önálló, újrafelhasználható pedagógiai „atom"

---

# 5. Fontos rendszerlogika

## Egy tevékenység:

*  több blokkban is szerepelhet
*  több kontextusban működik
*  verziózható
*  AI által generálható és módosítható
