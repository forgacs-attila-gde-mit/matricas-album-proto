---
title: Matricás pilot mérése
type: concept
sources:
  - raw/kutatas/2016-04-29--creating-creative-learning-environments--ce-2016-75078.md
  - raw/interjuk/2026-05-14--lannert-judit-te-podcast.srt
updated: 2026-06-01
lang: hu
---

# Matricás pilot mérése

Hogyan mérünk egy Matricás Album pilotot úgy, hogy a végén ne véleményvita maradjon, hanem döntésre alkalmas pedagógiai adat. A pilotnak nem elég használati visszajelzést gyűjtenie ("tetszett / nem tetszett"); azt kell megmutatnia, hogy egy [[matricas-album|Matricás Album]] futtatása mérhetően jobb tanulási folyamatot és látható tanulói [[Evidence|bizonyítékot]] hoz-e létre, mint a kiindulás. A mérési filozófia két forrásból ered: a pécsi Creative Partnerships matematika-pilot kvázi-kísérleti értékelési gyakorlatából és a Lannert-interjú "a tanári munka kutatói elem" gondolatából.

## Mérési filozófia: a tanár mint kutató

A Lannert Judit Te Podcast-interjú (origin Lecke.ai) a pedagógiai fejlesztést akkor tartja védhetőnek, ha a tanár előre megmondja, **milyen kompetenciát** akar fejleszteni, **milyen eszközzel** próbálkozik, **mit figyel meg**, és a végén **milyen bizonyíték** alapján reflektál (([forrás](../../raw/interjuk/2026-05-14--lannert-judit-te-podcast.srt))). Ez a négyes szerkezet — cél → beavatkozás → megfigyelhető evidence → utóreflexió — a Matricás pilot mérési gerince. Minden kipróbált tevékenységhez legyen előzetes tanulási cél, közben keletkező látható [[tanulasi-bizonyitek-evidence|tanulási bizonyíték]], és a végén rövid tanári utóreflexió.

A pécsi pilot tanulsága ezt egészíti ki egy fontos figyelmeztetéssel: a kreatív tanulási beavatkozás hatását **nem szabad egyetlen pontszámra szűkíteni**. A Creative Partnerships matematika-pilot külön kezelte az önképet, társas kompetenciát, empátiát, tanulási motivációt, olvasást és matematikai teljesítményt, és ezek **eltérő irányba mozdultak**: a pilot önképben, társas kompetenciában, olvasásban és matematikában kedvezőbb képet adott, empátiában és általános tanulási motivációban viszont nem (([forrás](../../raw/kutatas/2016-04-29--creating-creative-learning-environments--ce-2016-75078.md))). Egy Matricás pilotot ezért több, egymást kiegészítő mutatóval kell figyelni, nem egyetlen "kreativitás-" vagy "elégedettség-" számmal.

## A pilot mérési minimuma

Egy Matricás pilotba legalább ennyi mérendő be:

- **Tanári időráfordítás** előtte/utána: csökken-e a tervezésre és értékelésre fordított idő.
- **Tanári kontrollérzet és bizalom**: mer-e a tanár az AI-támogatás mellett is döntéseket hozni; a [[pedagogia-elobb-ai-masodik|pedagógia előbb, AI második]] guardrail tartja-e magát.
- **Generált / szervezett anyag minősége** tanári rubrika alapján.
- **Tanulói aktivitás / bevonódás** proxyja: ki és hogyan kapcsolódik be.
- **Újrahasznosítás**: előveszi-e a tanár újra a Matricás Album anyagát.
- **Support- és onboarding-terhelés**: mennyi kézi segítség kellett az induláshoz.

## Heti megfigyelési ciklus (Hatásnapló / TeacherEffectLog)

A Matricás pilot nem csak a projekt végén mér, hanem **hetente**. A pilotban részt vevő tanárnak aktivitásalapú működést kell kipróbálnia, az osztály bevonódását tudatosan megfigyelnie és rendszeres visszajelzést adnia. A heti megfigyelés rövid tanári jegyzet:

- melyik tevékenység (matrica) működött,
- hol akadt el a flow,
- milyen volt a tanulói bevonódás,
- mit módosítana a következő alkalomra.

Architekturálisan a heti megfigyelés ma frontend/localStorage-híd, amely példányra (`AlbumInstance`) és egységre kulcsolt. A [[projekterettsegi|Projektzárás]] (closure) során emelhető be a persistált **Hatásnapló** (`TeacherEffectLog`) mezőibe — a beemelés tudatosan tanári döntés, semmilyen lokális jegyzet nem persistálódik automatikusan értékelésként. A Hatásnapló nem adminisztratív teher: nem hosszú beszámolót kér, hanem döntésre használható pedagógiai nyomot ("mi alapján folytatjuk, módosítjuk vagy állítjuk le ezt a tevékenységet").

## Pedagógiai hatásjelzők a használati adat fölött

A pécsi kvázi-kísérleti logika és a Lannert-keret alapján a használati minimum fölé érdemes pedagógiai hatásjelzőket felvenni:

- Van-e **nyílt végű tanulói produktum**, nem csak kész feladatmegoldás?
- Megjelenik-e a folyamatban kérdezés, képzelet, cselekvés és reflexió?
- Erősödik-e a tanári **módszertani tudatosság**, még akkor is, ha átmenetileg csökken a magabiztosság?
- Tud-e a tanár **adaptálni**, vagy csak elfogad/elutasít egy AI-outputot?
- Van-e **különbség** tanulói háttér, osztálytípus vagy iskolai infrastruktúra szerint?

## Pre/post és rubrika

A pécsi pilot jó minimumot mutat egy pedagógiai hatáspilothoz: bemeneti és kimeneti (pre/post) mérés, ahol lehetséges kontrollcsoport, attitűdskálák és kvalitatív/órai megfigyelés együtt adtak dönthetőbb képet (([forrás](../../raw/kutatas/2016-04-29--creating-creative-learning-environments--ce-2016-75078.md))). Egy Matricás pilotban ez nem teljes pszichometriai rendszert jelent, hanem:

- **rövid pre/post** a célzott kompetenciára (pl. érvelés, modellezés),
- **tanári rubrika** a látható [[Evidence|evidence]] minőségére (kompetencia, bizonyíték, feedback, revízió, reflexió),
- **tanulói produktumok mintavétele** és reflexiós válaszok elemzése,
- **csoportmunka-megfigyelés**.

Az evidence itt a kulcs: a matricát lezáró tanulási bizonyíték az, ami a pilotot mérhetővé teszi. A "matrica = evidence-szel záruló tanulási epizód" invariáns nélkül a pilot visszacsúszik puszta elégedettségmérésbe.

## Miért a Kreatív Partnerség a mérési minta?

A [[kreativ-partnerseg|Kreatív Partnerség]] bevezetési és mérési modellként releváns: problémából indul, tanári-közös tervezést használ, látható tanulási eredményt céloz, és nem csak elégedettséget, hanem pedagógiai hatást mér. A Matricás pilotnak ugyanezt a fegyelmet kell átvennie — előre definiált siker/kudarc küszöbökkel, hogy a [[Lauder]]-pilot tényleg döntést tudjon megalapozni, ne csak benyomást.

## A Lauder-pilot konkrét sikerküszöbe

A Lauder esetében a következő döntési pont nem általános elégedettségi mérés, hanem prototípus-readiness. A siker minimuma külön mérendő: tud-e a tanár meglévő matricákat (Matricatár) rendezni, heti egységbe szervezni, kötelező/választható elemeket kijelölni, eszközigényt és időjárásfüggést kezelni, NAT/kerettantervi kapcsolatot használni, majd ebből ténylegesen órákra és reflexiós pontokra készülni. A heti megfigyelési ciklus ezt egészíti ki azzal, hogy a tanár nemcsak a projekt végén, hanem futás közben is tudatosan figyeli és visszajelzi az osztály bevonódását.
