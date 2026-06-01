# Matricás album — Angular változat

Modern Angular forrásfájlok, amelyek a React clickable prototípus felépítését tükrözik. Idiómátikus Angular 19 kód: standalone komponensek, signals, `inject()`, új vezérlőfolyam (`@if`, `@for`), `input()` / `output()` signal-alapú API.

## Mit kapsz

```
angular/
  src/
    app/
      core/
        models/      – TS interface-ek (Album, Sticker, Evidence, Team)
        services/    – AlbumStore (signal-alapú állapotkezelő)
        tokens/      – phases, states, mock-data
      shared/
        ui/          – kicsi újrahasznosítható komponensek (Chip, Icon, Sticker, …)
        attachments/ – Érvtérkép, mérési táblázat, fotó-melléklet
      layout/        – Shell, Topbar, Sidebars, RoleSwitcher
      features/      – Oldalkomponensek: Dashboard, AlbumPlan, FeedbackQueue, …
    styles/          – Globális tokenek és tipográfia
    main.ts          – bootstrapApplication belépési pont
    index.html
  angular.json
  package.json
  tsconfig*.json
```

A teljes React prototípus core flow-ja végig van portolva: Dashboard → Albumterv (időfolyam + adaptív micro-matrica) → Sticker részlet drawer → Visszajelzési sor → Visszajelzés drawer (érvtérkép / mérési táblázat melléklettel) → Diák nézet → Projektzárás → Nyomtatási előnézet. A kevésbé központi nézetek (Albumvarázsló, Album minőségellenőrző, Differenciálás, Csapatok lista, Stickers lista) **vázkomponensként** kerültek be — a struktúra és a kötések állnak, a React verzió `src/teacher.jsx` és `src/student.jsx` fájljainak megfelelő szakaszait kell áthozni a sablonokba.

## Indítás

```bash
cd angular
npm install
npm start          # ng serve, http://localhost:4200
```

## Beillesztés a Lecke monorepóba

A `src/app/` mappa egy az egyben másolható egy meglévő Angular alkalmazás (`apps/teacher-app/src/app/feature-album/`) alá. A globális `--n-*`, `--primary-*`, `--phase-*` CSS-változók a Lecke teacher-app `design-tokens.css`-ben már léteznek; az új betűkkel kezdődő tokenek (`--phase-*`, `--header-h`) hozzáadandók a `tailwind-extends.css`-be vagy egy lokális partial-be.

## Referencia mock

A React clickable prototípus (`Matricás album.html`) marad a vizuális referenciaként a stakeholderek demójához. Az Angular kódot ehhez kell pixel-fidelisen illeszteni.
