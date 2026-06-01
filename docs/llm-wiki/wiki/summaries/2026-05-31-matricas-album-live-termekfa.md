---
title: "Matricás Album termékvízió live subtree (2026-05-31)"
type: summary
sources:
  - raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md
updated: 2026-06-01
lang: hu
---

# Matricás Album termékvízió live subtree (2026-05-31)

## Rövid összefoglaló

A 2026-05-29-ig bővült Confluence-oldalfa a [[matricas-album|Matricás albumot]] már nem csak többhetes albumként, hanem progresszív pedagógiai tervezőrendszerként írja le. A legerősebb frissítés: a célcsoport 7-8. évfolyamos természettudományos tanár autonómiát támogató iskolai közegben; a belépés fokozatos (`ötlet -> óra/blokk -> tanterv`); a tervezési hierarchia a live oldalak és az utólagos termékdöntés alapján a prototípusban `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`; az AI pedig javasol és előtölt, nem dönt a tanár helyett.

## Kulcs állítások

- A pilot célcsoportja nem általános tanári populáció, hanem 7-8. évfolyamos természettudományos pedagógusok köre, különösen biológia, kémia, fizika és földrajz tantárgyaknál, támogató intézményi környezetben. Ez egybeesik a [[KreativKiserletezoTanar|Kreatív kísérletező tanár]] szegmenssel.
- A modell tananyagközpontú működés helyett tevékenységalapú, kompetenciafejlesztő, reflektív és valós tapasztalatokra épülő tanulást támogat.
- A progresszív UX három kezdőútja: `Kezdj egy ötlettel`, `Kezdj egy órával`, `Kezdj egy tantervvel`; a pedagógus mindig csak egy szinttel lép feljebb.
- A Tevekenyseg a legkisebb építőelem, a Blokk tevékenységekből épít pedagógiai flow-t, a Témakör több blokkot fog össze, a Modul több témakört, a Tanterv pedig modulokat.
- A későbbi termékdöntés alapján a prototípus-hierarchiában a `Témakör` nem közvetlenül blokkot, hanem `Tanulási egység`-eket tartalmaz; a Blokk ezek alatt jelenik meg.
- A tevékenységtípusok platformszinten fixek: felfedező, kísérletező, feldolgozó, kommunikációs, kollaboratív, reflektív; a felhasználó nem hoz létre új típust.
- A fizikai/nyomtatható éves csomag hosszabb távú vagy külön validálandó irányként jelenik meg: éves terv, matricakészlet, albumfüzetek és közös osztálytermi objektum.

## Új entitások/koncepciók

- `Témakör` mint első osztályú termékszint a Modul és a Blokk között.
- Progresszív pedagógiai tervezési hierarchia: ötletből Tevekenyseg, majd Blokk, Témakör, Modul, Tanterv.
- AI belépési copilot: javaslat, előtöltés, admincsökkentés, tanári kontroll mellett.
- Tevékenységtípusok fix platform-taxonómiája.
- Nyomtatható matricakészlet és közös osztálytermi objektum mint külön fizikai/hibrid termékvonal.

## Ellentmondás vagy megerősítés korábbi forrásokkal

Megerősíti a Lauder science workshop és a 2026-05-20-i Lauder-bemutató fő irányát: a 7-8. évfolyamos természettudományos, tevékenységalapú pilot a legerősebb beachhead. Ugyanakkor a live terv szélesebb, mint a korábbi album-only MVP: Tanterv, Modul, Témakör, Blokk és Tevekenyseg hierarchiát ír le.

Konkrét ellentmondás: a `3. Rendszerstruktúra és alapfogalmak` oldal hierarchiája kihagyja a `Témakör` szintet, míg több későbbi gyermekoldal és a UX oldal első osztályú szintként kezeli. Az utólagos termékdöntés szerint a `Témakör` első osztályú szint és `Tanulási egység`-eket tartalmaz; a jelenlegi prototípus-hierarchia ezért `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`. A döntés rögzítése: [[ADR002-temakor-elso-osztalyu-szint|Témakör mint első osztályú szint]].

## Nyitva hagyott kérdések

- A prototípusban mikor kell láthatóvá tenni a teljes `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység` hierarchiát, és meddig elég az activity/block belépési élmény?
- A nyomtatható matricakészlet pilot-scope vagy későbbi fizikai termékvonal?
- Milyen minimális tanári visszajelzési ciklus kell ahhoz, hogy a rendszer tényleg tanuljon a pilotból, ne csak lezáró reflexiót gyűjtsön?
