---
title: Matricás Album end-to-end demo prompt
type: prompt
sources:
  - apps/matricas-album/docs/felhasznaloi-kezikonyv.md
updated: 2026-06-01
lang: mixed
---

# Matricás Album end-to-end demo prompt

A generative-prototyping prompt that produces a **single, clickable, end-to-end Hungarian demo** of the [[matricas-album|Matricás Album]]. The prompt body is in English so any prototyping tool can consume it; **the produced prototype itself must be entirely in Hungarian**. It walks one continuous story: teacher album planning → student [[Evidence|Evidence]] submission → teacher feedback → adaptive album update → [[projekterettsegi|projektérettségi]]-style project closure.

> **Domain-token rule.** Persisted enums and domain object names stay Hungarian verbatim in the generated UI — never translated. See [[Glossary|Glossary]] for the hu↔en bridge. Tokens that must appear exactly: `matrica` / `Tevékenység (matrica)`, `Album` / `Albumterv` / `Futó album`, `Matricatár`, `Műhely`, states `tervezett|aktiv` and `varakozik|javitas|elkeszult|reflektalt|bekuldve`, time units `het|ora|fazis`, differentiation paths `tamogatott|alap|kihivas`, advice states `uj|elfogadott|elutasitott|alkalmazott|hibas`, quality states `ok|warn|miss`.

## How this maps to the product

This demo is the narrative form of the flow documented in the [[matricas-album|Matricás Album]] user manual: `Műhely` → progressive entry (`Kezdj egy ötlettel / órával / tantervvel`) → `Albumterv` → `Futó album` with `Csapatok` → student work → `Bizonyíték` → `Visszajelzési sor` → `Reflexió` → `Projektzárás`. The mandatory-evidence guarantee below is the demo-time expression of the core product invariant: a `matrica` is an evidence-bearing learning episode, not a reward badge.

---

## The prompt (English — paste into the prototyping tool)

```text
Build a high-fidelity, clickable web app prototype for a Hungarian educational product concept called "Matricás album" for Lecke.ai.

The instructions in this prompt are in English, but the entire prototype itself must be in Hungarian:
- all UI labels,
- all sample project data,
- all teacher and student messages,
- all AI assistant copy,
- all tooltips,
- all empty states,
- all demo content.

Do not create a marketing landing page. The first screen must be the actual usable product experience.

## Product Concept

"Matricás album" is not a simple reward badge system. It is a multi-week learning experience design tool for teachers and students.

The teacher designs a project-based learning album. The album contains "matricák" (stickers), where each sticker is a small executable learning scenario, not just a task.

Each sticker should include:
- pedagogical goal,
- student activity,
- teacher facilitation steps,
- student choice point,
- expected product,
- evidence to collect,
- reflection question,
- assessment/rubric hint,
- low-resource alternative,
- B plan if the lesson does not go as expected.

The album is a visible map of the learning journey. Stickers move through states (keep these Hungarian labels verbatim):
1. Tervezett
2. Aktív
3. Bizonyíték beküldve
4. Tanári visszajelzésre vár
5. Javítás alatt
6. Elkészült
7. Reflektált

The prototype must demonstrate how teacher and student actions affect the album over time.

## Pedagogical Principles To Respect

1. Pedagogy first, AI second. The AI supports the teacher, checks quality, suggests options and makes the learning process richer, but the teacher remains in control.
2. Student activity is central. The student must ask, imagine, act, create, discuss, revise and reflect. Learning must not be reduced to passive content consumption.
3. Visible learning evidence. Every important sticker should produce visible evidence: photo, argument map, mini essay, group note, measurement table, prototype, presentation slide or reflection.
4. Reflection and feedback are mandatory. Every phase must contain teacher feedback and student reflection, not only completion status.
5. Open-ended but structured. The teacher receives enough structure to feel safe, but students still have real choice points.
6. No shallow gamification. Avoid rankings, streak addiction, loot-box style mechanics or pure point collection. Stickers represent completed learning episodes with evidence and reflection.
7. Lannert-compatible creative learning. Show the album as a tool for curiosity, imagination, action, collaboration, persistence, student autonomy and reflective learning.

## MANDATORY EVIDENCE RULE (do not violate)

Evidence tabs must never be empty or purely descriptive. Every tab, panel or route called "Bizonyíték", "Bizonyítékok", "Evidence" or "Evidence-portfólió" must contain at least one concrete, visible, demo-ready sample evidence item. Use realistic mock content such as a measurement table, a photo placeholder with caption, an argument map, a prototype sketch card, a submitted reflection or a teacher feedback note. Do not show an empty state as the main evidence experience. Whenever the user opens any "Bizonyíték" surface, the viewer must immediately see one or more concrete evidence examples, not only labels or placeholders.

## Prototype Format

Create a responsive, modern web app prototype.

If the prototyping tool allows choosing the implementation framework, build the prototype as an AngularJS 1.x single-page application. Use AngularJS-style state management for role switching, selected album, selected sticker, evidence submission, teacher feedback and adaptive micro-sticker insertion. If AngularJS is not available, use the closest supported implementation, but keep the UI stateful and component-like.

It should feel like a professional teacher-facing SaaS product with a warm, playful learning layer. Use a clean, information-dense interface rather than a marketing page.

Use a role switcher at the top (Hungarian labels):
- "Tanári nézet"
- "Diák nézet"
- "Projektzáró nézet"

The prototype may be a single-page app with tabs or routes. It must be clickable and stateful enough to show changes in the album as the project progresses. Use realistic sample data. Do not use lorem ipsum.

## Demo Project To Show

Use this Hungarian sample project verbatim:

- Project title: "Városi mikroklíma nyomában"
- Subject area: "Integrált természettudomány"
- Grade: "7. évfolyam"
- Duration: "4 hét"
- Driving question: "Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?"
- Final product: "Diákok által készített mikroklíma-javaslatcsomag makettel, mérési adatokkal és nyilvános bemutatóval"
- Audience: "Osztálytársak, természettudomány-tanárok, iskola vezetése"

Creative dispositions to show: Kíváncsiság, Képzelőerő, Együttműködés, Kitartás, Fegyelem.

Project constraints: low-cost school environment; mixed ability group; limited devices; usable in 45 or 90 minute blocks; teacher must be able to print key materials.

## Core Entities (render in the UI, fields Hungarian)

Album: cím, vezérkérdés, évfolyam, tantárgy, időtáv, végső produktum, közönség, kreatív diszpozíciók, heti bontás, album állapota, evidence-portfólió, tanári reflexió.

Sticker: matrica neve, rövid leírás, fázis (Kérdezés / Képzelet / Cselekvés / Reflexió), állapot, tanulói instrukció, tanári teendők, tanulói döntési pont, várható produktum, evidence típusa, reflektív kérdés, AI minőségellenőrzés, B terv, low-resource változat.

Student Team: csapatnév, tagok, választott fókusz, beküldött bizonyítékok, visszajelzés, következő lépés.

Evidence: típus, cím, rövid leírás, feltöltő, státusz, tanári visszajelzés, javítási javaslat, kapcsolódó matrica.

Required sample evidence items (make the prototype concrete):
- Photo evidence: "Forró pont a műfüves pálya mellett" with a realistic photo placeholder, caption and observation note.
- Measurement table: "Árnyékos fa alatt vs. napos burkolat" with at least 3 measured values and timestamps.
- Argument map: "Kinek mi számít élhető udvarnak?" showing at least three stakeholder perspectives.
- Prototype sketch: "Árnyékoló pihenőzóna vázlata" with a sketch-like card and short justification.
- Final reflection: "Mit változtatott meg a bizonyíték?" with a student/team reflection and teacher response.

## Required Screens And States

1. Teacher Dashboard — "Albumjaim": active project card "Városi mikroklíma nyomában", progress summary, current week, student team evidence count, AI alerts, next teacher action. Sample copy: "Aktív album", "4 hétből 2. hét", "12 beküldött bizonyíték", "3 tanári visszajelzésre vár", "AI javaslat: a 3. heti matrica túl sok eszközt igényelhet, készíts low-resource változatot." Button: "Album megnyitása".

2. Album Creation Wizard — "Új album tervezése": Step 1 "Projekt alapjai" (title, subject, grade, duration, driving question); Step 2 "Tanulási cél és produktum" (final product, audience, creative dispositions, assessment style); Step 3 "Osztálykörnyezet" (class size, available tools, student autonomy level, risk level, print-first / digital-first preference); Step 4 "AI albumvázlat" (AI proposes a 4-week album with stickers; teacher can approve, edit or regenerate). Show that AI does not publish automatically: "Az AI csak javaslatot tett. A publikálás tanári döntés." and "Ellenőrzés: van tanulói döntés, produktum, bizonyíték és reflexió minden héten."

3. Teacher Album Timeline (4-week visual timeline):
   - 1. hét "Kérdezés és terepi megfigyelés" — sticker "Hőnyomozók az iskola körül" — evidence: photo + observation note
   - 2. hét "Perspektívák és érvek" — sticker "Kinek mi számít élhető udvarnak?" — evidence: role card + argument map
   - 3. hét "Kísérlet és prototípus" — sticker "Árnyék, víz, felület: mikroklíma-kísérlet" — evidence: measurement table + prototype sketch
   - 4. hét "Bemutatás és reflexió" — sticker "Javaslatcsomag az iskola vezetésének" — evidence: presentation + final reflection
   Each sticker is clickable.

4. Sticker Detail Panel: title, phase, student instruction, teacher facilitation steps, expected product, evidence, reflection question, differentiation ideas, B plan, low-resource version, AI quality check. Example sticker "Hőnyomozók az iskola körül" with Hungarian instruction, choice point, expected product, reflection question, and an AI quality check listing "Van tanulói döntés: igen", "Van látható produktum: igen", "Van reflexió: igen", a risk and a B terv.

5. Student Album View: project title, driving question, team name, current sticker, completed stickers, evidence portfolio, next action, reflection prompt. Sample team "Árnyékkommandó" (members: Dóri, Marci, Hanna, Zétény). It must feel like a learning journey, not a grading dashboard. The "Bizonyítékok" tab must show actual submitted sample evidence for "Árnyékkommandó" with a visible content preview — not an empty upload-only screen. Copy: "A következő matricát akkor kapjátok meg, ha a megfigyelésetekhez írtatok egy saját kérdést is." and "Nem a tökéletes válasz a cél, hanem hogy látszódjon, hogyan gondolkodtatok."

6. Student Evidence Submission Flow: inputs = evidence title, upload placeholder, short description, team hypothesis, what they need help with, reflection response. After submitting: sticker status → "Bizonyíték beküldve"; evidence appears in portfolio; teacher dashboard shows pending feedback; AI creates a neutral summary for the teacher but does not grade. Sample submitted evidence: "A műfüves pálya mellett 6 fokkal melegebb volt" (34°C napos műfű vs. 28°C árnyékos fás rész; help request: "Nem vagyunk biztosak benne, hogy elég pontos volt-e a mérés."; reflection: "Azt hittük, csak az árnyék számít, de a burkolat is nagyon sokat változtatott."). After submission the "Bizonyítékok" tab must visibly contain this item as a realistic preview card (title, measured values, hypothesis, uncertainty/help request, reflection, status chip, teacher feedback placeholder or response).

7. Teacher Feedback Queue: team submissions, AI evidence summary, missing-reflection warning if applicable, suggested feedback, rubric hints, next-step suggestions. Show real evidence cards, not only a list count — at least the measurement evidence above, one weaker item with missing measurement conditions, and one visual/prototype item from another team. The teacher must approve or edit feedback. Copy: "AI összegzés tanári ellenőrzéshez", "Javasolt visszajelzés", "Szerkesztem és elküldöm", "Visszaküldöm javításra", "Elfogadom és lezárom a matricát". After feedback: student evidence status → "Javítás alatt"; sticker stays active; portfolio shows teacher feedback.

8. Adaptive Album Update: after multiple teams submit weak measurement evidence, the AI suggests adding a micro-sticker "Mérési gyorstalpaló" as a teacher-only suggestion (not auto-inserted). AI text: "Több csapat bizonytalan a mérés pontosságában. Javasolt egy 15 perces mérési gyorstalpaló a 3. hét előtt." Teacher options: "Beillesztem a 2. hét végére", "Csak tanári jegyzetként mentem", "Elutasítom". When accepted, the timeline updates and the micro-sticker appears between week 2 and week 3. Show the album as a living learning plan, not a static worksheet.

9. Week 3 Prototype And Revision: students create a prototype solution (shade map, plant placement, reflective surface, water station, timetable change). They choose one approach and justify it with evidence. Sticker "Kicsiben kipróbáljuk", output "Mini makett vagy vázlat + mérési adat + indoklás". Teacher view shows which teams chose what, who needs help, which evidence is strong, which assumptions are weak. AI warning when reasoning is missing: "Ez a javaslat érdekes, de még nem látszik, milyen mérési bizonyíték támasztja alá."

10. Project Closure — "Projektzárás": completed album timeline, final student products, portfolio evidence, teacher reflection, student self-reflections, final presentation checklist, exportable summary. Final product: "Mikroklíma-javaslatcsomag az iskola vezetésének". Student reflection prompts: "Melyik döntésetek változott meg a bizonyítékok alapján?", "Miben dolgozott jól a csapatotok?", "Mit csinálnátok másképp egy következő projektben?", "Melyik matrica segített a legtöbbet?". Teacher reflection prompts: "Hol volt valódi tanulói döntés?", "Melyik evidence mutatta legjobban a gondolkodás fejlődését?", "Melyik matricát használnád újra?", "Mi szorult túl sok tanári irányításra?".

11. Lannert Check / Creative Learning Quality Panel — "Kreatív tanulási ellenőrző": assess the album across tanulói aktivitás, választási lehetőség, nyílt végű probléma, látható produktum, bizonyítékgyűjtés, együttműködés, visszajelzés és javítás, reflexió, low-resource megvalósíthatóság, tanári kontroll és rugalmasság. Indicators: "Rendben" / "Figyelmet kér" / "Hiányzik".

12. Differentiation View — "Differenciálás": three support modes "Támogatott út" / "Alap út" / "Kihívás út". For "Hőnyomozók": supported = teacher gives observation checklist; base = students choose two locations and write a hypothesis; challenge = students compare three locations and propose a measurement protocol. Copy: "A különbség ne több munka legyen, hanem más típusú támasz."

## Required Interactions

Switch teacher/student view; create or inspect the album plan; open sticker detail; publish the album; submit student evidence; show album status update after submission; teacher reviews evidence; teacher sends feedback; student revises evidence; teacher accepts a sticker as complete; AI suggests an adaptive micro-sticker; teacher accepts the micro-sticker and the timeline updates; open project closure view; show final portfolio and reflection. If full persistence is not possible, simulate with local UI state.

## Visual Design

Calm, professional, school-friendly. Avoid childish cartoon overload, casino-like gamification, rank lists, generic purple-blue gradient SaaS look, decorative blobs, marketing hero sections, empty dashboards. Use clear navigation, timeline, sticker cards, evidence cards, status chips, teacher action queue, role switcher, compact quality panel, small helpful icons, readable Hungarian text. Sticker visuals: small distinctive sticker-like cards with icons and phase colors, but a sticker always represents learning evidence and reflection, not a reward-only badge. Suggested phase colors — Kérdezés: blue-green; Képzelet: warm yellow; Cselekvés: coral; Reflexió: violet or deep blue. Keep contrast accessible.

## Information Architecture

Use a clear two-level IA. Do not put collection-level navigation and selected-album navigation at the same hierarchy level.

Global app navigation contains only app-level destinations: "Albumjaim", "Új album tervezése", "Sablonok" or "Minták" if needed, "Beállítások" only if needed.

After the teacher opens an album, show a clearly nested selected-album workspace with the album title visible (e.g. "Aktív album: Városi mikroklíma nyomában"). Contextual navigation inside it: "Áttekintés", "Albumterv", "Matricák", "Csapatok", "Bizonyíték-portfólió", "Kreatív tanulási ellenőrző", "Projektzárás". These belong to the selected album and must be visually nested under it — not siblings of "Albumjaim". Use breadcrumbs or a two-level sidebar: "Albumjaim > Városi mikroklíma nyomában > Bizonyíték-portfólió".

In student view: "Aktuális matrica", "Csapatunk", "Bizonyítékok", "Visszajelzések", "Reflexió".

## AI Behavior

AI can: suggest album structure, propose stickers, detect missing reflection, suggest low-resource alternatives, summarize student submissions for the teacher, propose feedback drafts, suggest an adaptive micro-sticker, generate differentiated paths, help prepare closure summary.

AI must NOT: publish without teacher approval, grade final creative work automatically, replace teacher judgment, rank students, produce generic tasks unrelated to evidence, optimize only for speed or completion.

AI labels (Hungarian): "AI javaslat", "Tanári jóváhagyás szükséges", "Minőségellenőrzés", "Hiányzó elem", "Javasolt B terv".

## Sample Hungarian Microcopy (use these or similar, verbatim Hungarian)

"A matrica nem jutalom, hanem egy lezárt tanulási epizód bizonyítékkal és reflexióval."
"Az AI javasol, a tanár dönt."
"A következő lépés attól függ, milyen bizonyítékokat hoztak a csapatok."
"Nem az a cél, hogy minden csapat ugyanarra jusson, hanem hogy az érvelésük látható legyen."
"A projekt végére nem csak egy plakát készül, hanem egy bizonyítékokra épülő javaslatcsomag."
"Ez a matrica túl zárt lenne: adj hozzá tanulói döntési pontot."
"Hiányzik a reflexiós kérdés."
"Jó evidence, de még nem látszik a mérés körülménye."
"Low-resource változat: digitális hőmérő helyett árnyék-nap összehasonlító megfigyelési lap."

## What To Avoid In The Generated Prototype

Do not present the album as a sticker reward chart, a simple to-do list, a lesson plan generator only, a homework tracker, a points-based gamification layer, or a chatbot-only interface. Do not make the teacher disappear. Do not make the student passive. Do not make the AI sound magical. Do not use English UI text in the prototype. Do not use placeholder content.

## Acceptance Criteria

The prototype is successful if a viewer can follow the full end-to-end story:
1. A teacher defines a multi-week project.
2. AI proposes an album, but the teacher controls it.
3. The album is made of learning stickers with evidence and reflection.
4. Students see their current sticker and submit evidence.
5. Student submissions change the album state.
6. The teacher reviews evidence and gives feedback.
7. Students revise and complete stickers.
8. The album adapts when student needs emerge.
9. The project closes with a final product, portfolio and reflection.
10. The concept clearly shows creative learning, not shallow gamification.

Make the prototype polished enough for stakeholder demonstration.
```

---

## Demo-output spec (Hungarian — what a correct run must show)

A fenti prompt akkor sikeres, ha a generált, magyar nyelvű demó az alábbi end-to-end ívet kattinthatóan végigviszi. Ez a [[matricas-album|Matricás Album]] termékmag demó-szintű kivetülése.

1. **Tanári tervezés.** A `Műhely`/„Albumjaim" felületről a tanár megnyitja vagy megtervezi a „Városi mikroklíma nyomában" albumot. Az „AI albumvázlat" lépésben az AI javasol egy 4 hetes `Albumterv`-et matricákkal, de **a publikálás tanári döntés** („Az AI javasol, a tanár dönt").
2. **Diák bizonyíték-beküldés.** Az „Árnyékkommandó" csapat az aktuális matricán választ (`tanulói döntési pont`), dolgozik, majd beküldi a „A műfüves pálya mellett 6 fokkal melegebb volt" [[Evidence|bizonyítékot]]. A matrica állapota `bekuldve`/„Bizonyíték beküldve" lesz, az elem **azonnal láthatóan** megjelenik a „Bizonyítékok" fülön.
3. **Tanári visszajelzés.** A `Visszajelzési sor`-ban a tanár valós bizonyítékkártyákat lát (nem csak darabszámot), az AI szerkeszthető feedback-draftot ad, a tanár pedig dönt: „Visszaküldöm javításra" / „Elfogadom és lezárom a matricát". Javításra küldéskor az állapot `javitas`/„Javítás alatt".
4. **Adaptív albumfrissítés.** Több gyenge mérési bizonyíték után az AI **csak tanári javaslatként** felveti a „Mérési gyorstalpaló" mikromatricát; elfogadás esetén az idővonal a 2. és 3. hét közé frissül — az album élő tanulási terv, nem statikus feladatlap.
5. **Projektzárás.** A `Projektzárás` nézet megmutatja a lezárt album-térképet, a portfólió-bizonyítékokat, a csapat-reflexiókat és a tanári reflexiót/`Hatásnapló`-t, valamint egy exportálható/nyomtatható zárócsomagot — a [[projekterettsegi|projektérettségi]]-narratíva csúcspontját.

### Kötelező bizonyíték-garancia (a demó elfogadási feltétele)

Minden „Bizonyíték" / „Bizonyítékok" / „Evidence" / „Evidence-portfólió" felületen **legalább egy konkrét, látható, demóra kész** [[Evidence|bizonyíték]]-elemnek kell lennie — soha nem üres állapot a fő élmény. Az öt kötelező mintaelem: a „Forró pont a műfüves pálya mellett" fotó, az „Árnyékos fa alatt vs. napos burkolat" mérési tábla, a „Kinek mi számít élhető udvarnak?" érvtérkép, az „Árnyékoló pihenőzóna vázlata" prototípusvázlat és a „Mit változtatott meg a bizonyíték?" záró reflexió. Ez a garancia a „matrica = bizonyítékot termelő tanulási epizód" invariáns demó-szintű kikényszerítése.

### Technikai preferencia

A prototípus lehetőleg **AngularJS 1.x** SPA, AngularJS-stílusú állapotkezeléssel (szerepváltás, kiválasztott album, kiválasztott matrica, bizonyíték-beküldés, tanári feedback, adaptív mikromatrica-beszúrás). Ha az adott eszközben nincs AngularJS, a legközelebbi támogatott megoldás használható, de a felület maradjon állapottartó és komponens-szerű.

## Megalapozottság

Részben megerősített. A prompt a 2026-04-21-i albumkoncepcióból és a kapcsolódó kreatív-tanulás/funkciómintát vizsgáló forrásokból nőtt ki (origin Lecke.ai), és a delivery-repo felhasználói kézikönyvével (`apps/matricas-album/docs/felhasznaloi-kezikonyv.md`) konzisztens end-to-end élményt ír le. A demó egy bemutatóra szánt reprezentáció, nem a végleges termék specifikációja.
