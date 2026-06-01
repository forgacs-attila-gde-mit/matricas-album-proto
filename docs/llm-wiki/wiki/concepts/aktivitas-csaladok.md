---
title: Aktivitás-családok (MethodFamily / Pattern)
type: concept
sources:
  - raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md
updated: 2026-06-01
lang: hu
---

# Aktivitás-családok (MethodFamily / Pattern)

A domain által támogatott módszercsaládok katalógusa. A vezető termékállítás: a Matricás Album nem "kreatív projektet" vagy "csoportmunkát" generál absztraktban, hanem konkrét, órán **futtatható aktivitás-playbookokat** ad a tanár kezébe. Ezek a playbookok nem módszertannevek, hanem egy közös pedagógiai ciklus paraméterezett változatai. Ezért a domain nem tárol módszerenként külön bounded contextet: a módszer egy `MethodFamily` / `Pattern` mező és sablonlogika a [[matricas-album|Matricás Album]] activity-kártyáin. Ez a koncepció táplálja az [[ADR001-kozos-activity-domain|ADR001]] döntését.

## A közös szerkezet

Egy jó aktivitásban — bármelyik családból — ugyanaz a hat elem ismétlődik:

1. **Kihívás vagy kérdés**: éles problémahelyzet, driving question, dilemma, jelenség, modellezési vagy prototípuskihívás.
2. **Tanulói döntési pont**: stratégia, hipotézis, bizonyítékválasztás, modellfeltételezés, kompromisszum vagy revíziós döntés.
3. **Tanári scaffold**: tanári lépések, kérdések, szerepek, adatcsomag, B-terv, low-resource változat.
4. **Látható evidence**: jegyzet, mérés, poszter, modell, prototípus, érvtábla, reflexió, feedback utáni javítás.
5. **Feedback és revízió**: tanári vagy társas visszajelzés, javítás, lezárás.
6. **Progress és reflexió**: csapatonkénti állapot, segítségkérés, záró reflexió, tanári [[matricas-pilot-merese|Hatásnapló]].

Ez a hat elem köti össze a [[6k-kompetenciak|6K kompetenciákat]], az OECD transzformatív kompetenciáit és a tanári workflow-t úgy, hogy a szoftver támogat, de nem helyettesít.

## Evidence-szintek (A–D)

A piackutatás minden módszercsaládot megalapozottsági szint szerint rangsorol, hogy a pilot ne "kutatási szépséget", hanem bizonyítottan ható módszereket vigyen be:

- **A** — meta-analízis, RCT vagy erős kvázi-kísérleti alap. Első jelöltek: **produktív kudarc**, **guided inquiry**, aktív STEM-tanulás, **metakognitív önszabályozás**, strukturált kollaboratív problémamegoldás.
- **B** — több empirikus vizsgálattal vagy tartós nemzetközi programgyakorlattal alátámasztva: **Peer Instruction**, **argument-driven inquiry / CER**, több PBL-scaffold, structured academic controversy.
- **C** — erős, jól operacionalizált gyakorlati keret korlátozottabb hatásméréssel: Studio Thinking, EL Education learning expedition, Design for Change, Geo-Inquiry.
- **D** — inspiratív, de önmagában pilotba nem viendő elem; csak egy A–C szintű playbook részeként érdemes használni.

## A legerősebb aktivitás-családok

**Produktív kudarc.** A tanulók előbb egy nehéz, de értelmes problémára készítenek saját megoldásváltozatokat, majd a tanár ezekre építve ad célzott magyarázatot. Matematikában és természettudományban kiváló első jelölt, mert a hibás vagy részleges stratégia nem kudarcadminisztráció, hanem a későbbi fogalmi tisztázás alapanyaga (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

**Guided inquiry és 5E.** A kutatásalapú tanulás nem azt jelenti, hogy a diákokat magukra hagyjuk. Az evidence a tanár által vezetett kérdésfeltevés, változókontroll, adatértelmezés és fogalmi lezárás felé mutat. Közvetlenül fordítható biológia-, fizika-, kémia- és földrajzórákra (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

**Peer Instruction és ConcepTests.** A rövid, fogalmi választásra épülő ciklus — egyéni válasz, társas magyarázat, újraszavazás, tanári lezárás — különösen alkalmas fizikai és biológiai tévképzetek feltárására. Alacsony erőforrású, gyorsan pilotolható, mert nem igényel teljes projektátalakítást (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

**Argument-driven inquiry és CER.** A tanulók nem csak választ adnak, hanem állítást (claim), bizonyítékot (evidence) és indoklást (reasoning) építenek; ezt társas kritika, poszter vagy rövid írásos revízió követi. Jó híd a természettudományos gondolkodás, a kommunikáció és a kritikai gondolkodás között (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

**Strukturált kollaboratív problémamegoldás.** A csoportmunka csak akkor termékértékű, ha szerepek, közös cél, egyéni felelősség, vitapont és látható döntési nyom van benne. Az aktivitásnak nem "dolgozzatok csapatban" utasításra, hanem problémakeretre, döntési protokollra és outputkritériumra kell épülnie (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

**Metakognitív önszabályozás.** A tanár modellezi, hogyan kell tervet készíteni, monitorozni a megértést, stratégiát váltani és értékelni az eredményt. Nem külön "tanulásmódszertan óra", hanem minden magasabb rendű aktivitás kötelező vezérlőrétege (([forrás](../../raw/kutatas/2026-05-21--4k-6k-aktivitas-piackutatas-forrascsomag.md))).

## Anti-patternök

A katalógus negatív mintákat is rögzít — ezek a guardrailek, amelyeket a domain nem enged "aktivitásnak" minősülni:

- **"Alkossatok csapatokat és csináljatok projektet"** — szerepek, döntési pont, outputkritérium és feedback nélkül nem aktivitás, csak szervezési forma.
- **"Kutassatok utána"** — forráskritikai scaffold, kérdéskeret és szintéziskritérium nélkül csak információgyűjtési házi feladat.
- **"Legyetek kreatívak"** — explicit divergens ötletgenerálás, ötletértékelés és revízió nélkül a kreativitás nem fejleszthető kompetenciaként.
- **"Az AI készítse el"** — ha a modell adja az ötletet, az érvet, a rubrikát és a reflexiót is, a tanulói döntési pont eltűnik. A terméknek tanári kontrollt és tanulói gondolkodási helyzetet kell védenie.

## Pilot-shortlist

Az első pilotba 8 aktivitás-családot érdemes vinni: produktív kudarc, Peer Instruction, guided inquiry/5E, CER / argument-driven inquiry, strukturált kollaboratív problémamegoldás, metakognitív problémanapló, Geo-Inquiry és design challenge. Ebből négy rövid órán belüli, négy pedig többórás vagy projektív forma — így egyszerre mérhető, hogy a tanári workflow-támogatás működik-e gyors mikroaktivitásoknál és komplexebb tanulási folyamatoknál is.

## Termékbe fordítás

A módszercsaládok nem önállóan élnek, hanem activity-kártyaként a domainben. A legjobb Matricás Album-illeszkedés: learning expedition, design challenge, Geo-Inquiry, Studio Thinking és CER. A matrica itt nem jutalom, hanem **bizonyítékjelölő** — például "három adatforrást összevetett", "revíziót végzett társas kritika után", "felelősségi dilemmát azonosított". A részletes domain-leképezést és azt, hogy mely családok férnek el egyetlen közös motorban, az [[ADR001-kozos-activity-domain|ADR001]] rögzíti; a teljes evidence-besorolású katalógus és tantárgyi shortlist a [[4k-6k-activity-piackutatas|4K/6K aktivitás-piackutatás]] összefoglalóban él. A közös domain elemeit (verziózott activity-kártya, tanulási út, osztálytermi futtatás, evidence/feedback/reflexió ciklus) az [[AlbumDomain]] írja le.
