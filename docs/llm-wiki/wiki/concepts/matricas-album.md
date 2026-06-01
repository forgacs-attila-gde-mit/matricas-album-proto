---
title: "Matricás album — domain belépő koncepció"
type: concept
sources:
  - raw/confluence/2026-04-21--matricas-album--631963649.md
  - raw/confluence/2026-05-31--matricas-album-termekvizio-live-subtree--722370562.md
updated: 2026-06-01
lang: hu
---

# Matricás album

A Matricás album egy több héten átívelő, tevékenységalapú tanulási keret, és egyben a Lecke.ai / DPA termék flagship demonstrátora. A tanár nem csak óravázlatot vagy feladatsort készít, hanem **albumot** állít össze: vezérkérdést, matricákat, heti/egységszintű ciklust, tanulói outputokat, bizonyítékokat és reflexiós pontokat. Ez a koncepció a domain belépőpontja — a működő prototípus aktuális állapotát a [[matricas-album-projekt-allapot|projekt-állapot összegzés]] írja le, a domain-objektumok pedig az [[AlbumDomain]] oldalon élnek.

## Az album-metafora

A legerősebb termékmetafora nem a jutalomgyűjtés, hanem a tanulási **expedíció**: az album a többhetes tanulási ív térképe, a **matrica** pedig bizonyítékkal és reflexióval záruló tanulási epizód. Ez a megkülönböztetés a koncepció lényege — a Matricás album nem badge- vagy pontgyűjtő rendszer.

A matrica a legfontosabb egység: nem feladat és nem jutalom, hanem mini-forgatókönyv, amely tartalmazza a tanulói tevékenységet, a pedagógiai célt, a playbookot, az eszközigényt, az outputot, az [[Evidence|bizonyítékot]], az értékelési módot és a B tervet. Egy óra vagy feladatsor nem izolált kimenet, hanem egy hosszabb tanulási ív része. Az album így a meglévő tanári workflow fölé kerülő meta-réteg.

## Terméklogika

A live termékterv (2026-05-29-ig frissült Confluence-oldalfa) szerint a Matricás albumot már nem csak album-only demonstrátorként kell olvasni, hanem **progresszív pedagógiai tervezőrendszerként**. A célcsoport szűkebb és konkrétabb: 7-8. évfolyamos természettudományos tanárok, főleg biológia, kémia, fizika és földrajz területen, autonómiát és módszertani kísérletezést támogató iskolai közegben.

A legfontosabb prototípus-implikáció a belépési élmény: a tanár ne teljes rendszert lásson elsőre, hanem három indulási utat — `Kezdj egy ötlettel`, `Kezdj egy órával`, `Kezdj egy tantervvel`. Az UX progresszív: tevékenységből blokk, blokkból témakör, témakörből modul, modulból tanterv lesz, mindig csak egy következő döntési ponttal.

A termékdöntési olvasatban a hierarchia `Tanterv -> Modul -> Témakör -> Tanulási egység -> Blokk -> Tevékenység`. A `Témakör` első osztályú szint, nem puszta UX-címke (lásd [[ADR002-temakor-elso-osztalyu-szint]]). A jelenlegi prototípus ezt még nem adatbázis-hierarchiaként, hanem kompatibilitási rétegként valósítja meg.

## Az AI szerepe

Az AI nem pedagógiai döntéshozó: javasol, előtölt, alternatívát ad és csökkenti az adminisztrációt, de a tanári kontroll végig megmarad. Ez a [[pedagogia-elobb-ai-masodik|pedagógia előbb, AI második]] guardrail. Az [[AiAdvice]] entitás célzottan ad tanácsot (tanári tanács, diák szókratészi kérdések, evidence-digest, segítség-triage, matrica-javaslat, feedback-vázlat, projektzáró szintézis), de teljes tanterv/modul/témakör/blokk struktúrát nem generálhat visszafordíthatatlan alapértelmezésként.

## Stratégiai érték

A funkció azért fontos, mert a Lecke.ai-t elmozdítja a "még egy feladatgenerátor" pozícióból a tanulási élménytervező rendszer felé. Ez illeszkedik a [[kreativ-tanulas|kreatív tanulás]] keretéhez: tanulói aktivitás, produktum, reflexió, differenciálás és tanári facilitálás kerül a középpontba.

A Matricás album nem feltétlenül az első core validációs workflow, hanem flagship demonstrátor. Azt mutatja meg, milyen lenne a Lecke.ai, ha nem gyors outputgyárként, hanem többhetes [[projekterettsegi|projektutat]], [[tanulasi-bizonyitek-evidence|tanulási bizonyítékokat]] és reflektált projektzárást támogató pedagógiai asszisztensként működne.

## Projektérettségi mint albumhorgony

A [[projekterettsegi|projektérettségi]] gondolata erős legitimációs horgony az albumkoncepciónak: egy osztály vagy csoport komplex produktumon keresztül bizonyít együttműködést, logikus gondolkodást, alkotást, szerepvállalást és reflexiót. Ez terméknyelven szinte közvetlenül albumlogika: a többhetes album a projektút, a matricák a bizonyítékkal záruló epizódok, a projektzárás pedig kompetencia-bemutató. Egy matrica akkor projektérettségi-kompatibilis, ha tanulói produktumot, bizonyítékot és reflexiót kér, és a játékos haladásjelzés csak láthatóvá teszi a tanulási utat.

## Pilot-minimum (Lauder)

A [[Lauder]]-kontextus pontosítja, mi a szeptemberig értelmesen kipróbálható minimum: a pilot osztályfőnök számára használható, önállóan próbálható szoftver a matricák szervezésére, a Lauder meglévő matrica-könyvtárával feltöltve. Ez nem teljes albumplatform, hanem operatív **matrica-infrastruktúra**: matrica-könyvtár (Matricatár), heti egységek, kötelező/választható jelölés, eszközigény, időjárásfüggés, szükséges előzetes tanári tudásátadás, NAT/kerettantervi kapcsolás és kiosztási opciók.

Az AI-szerep itt szűkebb, mint egy általános pedagógiai ajánlómotor: értékesebb lehet a kevésbé magabiztos tanár támogatása, a matrica-sablonok előkészítése és olyan tevékenységek létrehozása, amelyekben a diákok az AI világáról tanulnak. A pilot mérési kereteit a [[matricas-pilot-merese]] tárgyalja.

## Kockázatok és nyitott kérdések

- **Tanári szabadság vs. bénultság:** előre definiált sablonok nélkül a túl nagy szabadság bénítóvá válhat. A `Pedagógiai minta` (album-sablon minta: `altalanos`, `produktiv-hibazas`, `kutatas-bizonyitas`) ezt enyhíti, de nem helyettesíti az onboardingot.
- **Eszközigényes matricák:** logisztikai akadályt jelenthetnek, ezért külön "low-resource" jelölés kell. A [[nyomtatott-vs-digitalis]] feszültség itt is releváns.
- **Evidence-réteg pontosítása:** koncepcionálisan körvonalazott, implementációs szinten még pontosítandó, milyen bizonyítéktípusok, milyen preview és milyen tanári feedback legyen az MVP része.
- **NAT-kapcsolat:** tisztázandó, hogy explicit tantervi mapping kell-e, vagy elég implicit pedagógiai illeszkedés.
- **Diákfelület MVP-szerepe:** stakeholder-demóban hasznos, de termék-MVP-ben elsőre lehet, hogy tanári tervező és projektzáró evidence-portfólió is elég.
- **Heterogenitás:** a Lauder/természettudományos pilot erős, de nem reprezentatív; új szegmens csak validált futtatások után.

## Kapcsolódó oldalak

- [[matricas-album-projekt-allapot]] — a működő prototípus kanonikus állapotképe.
- [[AlbumDomain]], [[Evidence]], [[AiAdvice]] — a domain-objektumok.
- [[kreativ-tanulas]], [[tanulasi-bizonyitek-evidence]], [[projekterettsegi]] — pedagógiai háttér.
- [[matricas-pilot-merese]] — pilot- és hatásmérés.
