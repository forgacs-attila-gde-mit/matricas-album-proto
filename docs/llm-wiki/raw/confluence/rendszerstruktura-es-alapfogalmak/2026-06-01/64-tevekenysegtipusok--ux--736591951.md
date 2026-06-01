---
cim: "Tevékenységtípusok - UX"
forras-tipus: confluence
url: https://gdemikk.atlassian.net/wiki/spaces/AI/pages/736591951/Tev+kenys+gt+pusok+-+UX
azonosito: "736591951"
szulo: "725811208"
szint: tevekenysegtipusok
facet: ux
modositva: "2026-06-01"
lekerve: 2026-06-01
nyelv: hu
---

## 1. Alapelv

A tevékenységtípusok a rendszer által definiált, zárt pedagógiai kategóriák.

* nem hozhatók létre felhasználó által
* nem szerkeszthetők pedagógus által
* csak rendszer szinten bővíthetők verziózással
* AI sem hoz létre új típust, csak javasol besorolást

A felhasználó szerepe:

> kiválasztás, megértés és alkalmazás – nem definiálás

---

# 2. UX szerep a rendszerben

A tevékenységtípus UX célja nem létrehozás, hanem:

* gyors azonosítás
* pedagógiai jelentés közvetítése
* szűrés és keresés támogatása
* AI döntések alapja
* blokk- és activity szerkesztés támogatása

---

# 3. Megjelenítés UX-ben

## 3.1 Lista / választó nézet

A típusok egyszerű, skimmable kártyákként jelennek meg:

* ikon
* név
* 1 soros leírás
* pedagógiai működés jelölése

Nincs szerkesztés, nincs létrehozás.

---

## 3.2 Részletes nézet

Egy típus megnyitásakor:

* definíció
* pedagógiai működés leírása
* interakciós minta
* kognitív fókusz
* példák
* kompatibilitási jelölések

Ez információs, nem szerkesztő felület.

---

## 3.3 Inline használat activity létrehozásnál

Tevékenység létrehozáskor:

* a rendszer javasol típust
* a felhasználó elfogadja vagy felülbírálja
* de csak a meglévő típusok közül választhat

---

# 4. AI szerep

Az AI:

* nem hoz létre új típust
* nem módosít típust
* csak:

    * besorol
    * javasol
    * indokol


---

# 5. Rendszer UI szerep

A tevékenységtípus UI:

* navigációs réteg
* nem authoring felület
* nem admin eszköz

Funkciói:

* szűrés
* ajánlás
* kontextusmagyarázat
* pedagógiai orientáció

---

# 6. Kapcsolat activity létrehozással

## 6.1 default flow

* activity létrehozás → AI vagy user input
* rendszer javasol tevékenységtípust
* user elfogadja / módosítja
* véglegesítés

---

## 6.2 constraint

* csak system-defined típus választható
* nincs custom type
* nincs override új típus létrehozására

---

# 7. UX alapelv

A tevékenységtípus:

> nem döntési kreatív felület, hanem pedagógiai értelmezési infrastruktúra

---

# 8. Összefoglalás

A tevékenységtípus UX egy zárt, rendszervezérelt kategória-réteg, amely:

* nem szerkeszthető
* nem bővíthető felhasználó által
* nem AI-generált dinamikusan
* csak értelmezhető, kiválasztható és alkalmazható
