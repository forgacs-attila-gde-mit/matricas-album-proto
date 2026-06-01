---
title: Nyomtatott vs digitális megjelenés
type: concept
sources:
  - raw/confluence/2026-05-20--lauder-lecke-bemutatasa--709296137.md
updated: 2026-06-01
lang: hu
---

# Nyomtatott vs digitális megjelenés

Egy pedagógiai modell több output-megjelenése. A Matricás Album központi tervezési elve, hogy a fizikai matrica/füzet és a digitális album **ne** legyen két külön termékvonal, hanem **ugyanannak a pedagógiai modellnek eltérő operációs megjelenése**. A tanári workflow egy; a kimenet lehet nyomtatható, digitális vagy hibrid.

## A feszültség (megőrzött ellentmondás)

A nyomtatott vs digitális kérdés valódi, terepen megfigyelt feszültség, ezért külön szakaszként tartjuk meg — nem oldjuk fel "helyes válasszal".

- **Intézmények között**: egyes iskolákban a nyomtatható feladatlap konkrét "wow" érték, máshol a laptopos/online használat természetesebb. Az egyik iskolában a nyomtatási fejléc erős pozitív reakciót váltott ki; egy másik iskolában viszont gyengébb az infrastruktúra: kevés nyomtató és papír.
- **Egy partneren belül is**: a [[Lauder]]-bemutató ezt a feszültséget már egyetlen iskolán belül is megmutatja. Az egyik tanár fizikai matricát és dedikált füzetet képzel el, míg a pilot osztályfőnök szerint a **digitális** matricák nyitottabbá tennék a rendszert, és elkerülnék a nyomtatási költséget és logisztikát (([forrás](../../raw/confluence/2026-05-20--lauder-lecke-bemutatasa--709296137.md))).

Ez a [[matricas-album|Matricás Album]] szempontjából azt jelenti, hogy nincs egyetlen "jó" output-modell: a heterogenitás itt nem hiba, hanem tervezési kiindulópont.

## Kezelés: egy modell, három kimenet

A termék ne kényszerítsen egyetlen output-modellt. Ugyanabból a tanári workflow-ból legyen levezethető:

- **fizikai album** (nyomtatható matrica / dedikált füzet, nyomtatható prompt),
- **digitális album** (digitális matricafolyam),
- **hibrid** osztályszintű haladásjelzés.

A három megjelenés ugyanannak a pedagógiai modellnek az operációs változata. Ezt a "delivery mode" elágazás fejezi ki: a futó albumból (`AlbumInstance`) ágazik szét a fizikai / digitális / hibrid kézbesítés, miközben a mögöttes tervezés, tevékenységek (matricák), evidence és tanári támogatás közös. A rendszer ezért tárolhat **printable / package jelzést** a kimenethez, anélkül hogy a domaint három külön termékre bontaná.

## Következmény a domainre

A nyomtatott/digitális választás kimeneti (rendering) döntés, nem domain-szakadás. A közös mag — verziózott tevékenység, tanulási út, futtatás, evidence, feedback, reflexió — független attól, hogy a tanulói felület végül papíron vagy képernyőn jelenik-e meg. Ezt a közös magot az [[AlbumDomain]] írja le. A jövőbeli `Tanterv`-szintű csomagolás (print/export package context) is ehhez a logikához illeszkedik: a megjelenés a hierarchia tetején dől el, nem tevékenységenként külön termékben.
