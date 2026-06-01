import { AlbumMeta, DEFAULT_PROJECT_REFLECTION_PROMPTS, Evidence, QualityDim, Sticker, Team } from '../models/album.model';

export const TEAMS: Team[] = [
  { id: 'arnyek',  name: 'Árnyékkommandó',     members: [{ id: 'arnyek-1', name: 'Dóri' }, { id: 'arnyek-2', name: 'Marci' }, { id: 'arnyek-3', name: 'Hanna' }, { id: 'arnyek-4', name: 'Zétény' }], focus: 'Növényzet és árnyék',   color: '#7872d4' },
  { id: 'kovek',   name: 'Kőkutatók',           members: [{ id: 'kovek-1', name: 'Bence' }, { id: 'kovek-2', name: 'Petra' }, { id: 'kovek-3', name: 'Réka' }, { id: 'kovek-4', name: 'Tomi' }],    focus: 'Burkolatok hatása',     color: '#ef7c5b' },
  { id: 'felho',   name: 'Felhőfigyelők',       members: [{ id: 'felho-1', name: 'Vince' }, { id: 'felho-2', name: 'Léna' }, { id: 'felho-3', name: 'Boti' }, { id: 'felho-4', name: 'Adél' }],     focus: 'Mikroklíma és időjárás', color: '#5cb6a3' },
  { id: 'viz',     name: 'Vízkereső expedíció', members: [{ id: 'viz-1', name: 'Eszter' }, { id: 'viz-2', name: 'Csongor' }, { id: 'viz-3', name: 'Ági' }, { id: 'viz-4', name: 'Misi' }],  focus: 'Víz és párolgás',       color: '#e5b653' },
];

export const ALBUM_META: AlbumMeta = {
  title: 'Városi mikroklíma nyomában',
  subject: 'Integrált természettudomány',
  grade: '7-8. évfolyam',
  durationType: 'het',
  duration: '4 hét',
  drivingQ: 'Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?',
  finalProduct: 'Diákok által készített mikroklíma-javaslatcsomag makettel, mérési adatokkal és nyilvános bemutatóval',
  audience: 'Osztálytársak, természettudomány-tanárok, iskola vezetése',
  projectReflectionPrompts: [...DEFAULT_PROJECT_REFLECTION_PROMPTS],
  differentiationPaths: [],
  dispositions: ['Kíváncsiság', 'Képzelőerő', 'Együttműködés', 'Kitartás', 'Fegyelem'],
  weekTitles: [
    'Kérdezés és terepi megfigyelés',
    'Perspektívák és érvek',
    'Kísérlet és prototípus',
    'Bemutatás és reflexió',
  ],
  currentWeek: 3,
};

export const INITIAL_STICKERS: Sticker[] = [
  {
    id: 's1',
    week: 1,
    title: 'Hőnyomozók az iskola körül',
    phase: 'kerdezes',
    state: 'reflektalt',
    short: 'Terepi megfigyelés és hipotézisalkotás az iskola környékén.',
    studentInstruction:
      'Fotózzatok le két olyan helyet az iskola környékén, ahol szerintetek nyáron különösen meleg lehet. Írjatok mellé egy hipotézist: miért pont ott melegszik fel jobban a környezet?',
    teacherSteps: [
      'Mutasd be a vezérkérdést és a hőmérséklet-megfigyelés célját (5 perc).',
      'Vidd ki az osztályt a megfigyelési pontokra, csoportonként más-más útvonalat ajánlj (15 perc).',
      'A megfigyelés után gyűjtsd össze a hipotéziseket a táblán.',
      'Zárd egy közös kérdéssel: melyik feltevést tudnánk leghamarabb ellenőrizni?',
    ],
    studentChoice:
      'Választhattok: árnyékos és napos terület összehasonlítása, burkolatok összehasonlítása, növényzet szerepe vagy emberi használat megfigyelése.',
    expectedProduct: '2 fotó, 2 megfigyelési jegyzet, 1 hipotézis csapatonként.',
    evidenceType: 'Fotó + rövid jegyzet',
    reflection: 'Mi lepett meg a megfigyelés során, és mit mérnétek meg legközelebb pontosabban?',
    aiCheck: [
      { label: 'Van tanulói döntés', ok: 'igen' },
      { label: 'Van látható produktum', ok: 'igen' },
      { label: 'Van reflexió', ok: 'igen' },
      { label: 'Kockázat: eső esetén kültéri megfigyelés nehéz', ok: 'figyelmet' },
    ],
    bPlan: 'Esős időben használjatok korábbi iskolai fotókat vagy az iskola térképes nézetét.',
    lowResource:
      'Telefon nélküli csapatok rajzos vázlatot készítenek a két helyszínről, mellé szöveges leírást a felület és az árnyék állapotáról.',
  },
  {
    id: 's2',
    week: 2,
    title: 'Kinek mi számít élhető udvarnak?',
    phase: 'kepzelet',
    state: 'elkeszult',
    short: 'Perspektívák ütköztetése: kisdiák, sportoló, tanár, takarító, kerékpáros.',
    studentInstruction:
      'Húzzatok egy szerepkártyát (alsós gyerek, focista, tanár, takarító, kerékpáros). Az ő nézőpontjából írjátok le, milyen az élhető udvar, és milyen az, ami zavar a hőségben.',
    teacherSteps: [
      'Készítsd elő az 5 szerepkártyát; minden csapat egy-egy szerepet választ.',
      'Vezesd be az érvtérkép sablont (állítás → indok → példa).',
      'Tarts 10 perces ütköztetést: két csapat egymás mellé ül.',
      'Záráskor minden csapat egy mondatban összegezze a saját szerepe szükségletét.',
    ],
    studentChoice: 'A csapat dönti el, hogy egy szerepre fókuszál mélyen, vagy két szerep konfliktusát tárja fel.',
    expectedProduct: '1 szerepkártya kitöltve + 1 érvtérkép (papír vagy digitális).',
    evidenceType: 'Szerepkártya + érvtérkép',
    reflection: 'Melyik nézőpontot értettétek meg jobban a beszélgetés után, és melyik maradt nehéz?',
    aiCheck: [
      { label: 'Van tanulói döntés', ok: 'igen' },
      { label: 'Van látható produktum', ok: 'igen' },
      { label: 'Van reflexió', ok: 'igen' },
      { label: 'Több perspektívát mutat', ok: 'igen' },
    ],
    bPlan: 'Ha a vita túl gyorsan eljut konszenzusig, dobj be egy ellentmondó forrást.',
    lowResource: 'Nyomtatott szerepkártyák és A4-es érvtérkép sablon. Internet nem szükséges.',
  },
  {
    id: 's3',
    week: 3,
    title: 'Árnyék, víz, felület: mikroklíma-kísérlet',
    phase: 'cselekves',
    state: 'varakozik',
    short: 'Hőmérséklet-mérés különböző felületeken és körülmények között.',
    studentInstruction:
      'Mérjetek 3 különböző helyszínen hőmérsékletet (napos burkolat, árnyékos fűfelület, és egy harmadik általatok választott pont). Készítsetek mérési táblázatot napszakonként.',
    teacherSteps: [
      'Mutasd be a mérési protokollt (eszköz, idő, helyszín, ismétlés).',
      'Oszd ki a hőmérőket; csapatonként minimum 2 mérési időpont.',
      'Mérés közben járd be a helyszíneket, kérdezz, ne válaszolj rögtön.',
      'Az adatfelvitel után közös elemzés.',
    ],
    studentChoice: 'A csapat választja a 3. helyszínt és a mérés időpontjait.',
    expectedProduct: 'Mérési táblázat (legalább 6 adat) + rövid magyarázat.',
    evidenceType: 'Mérési adatlap + fotó a helyszínről',
    reflection: 'Milyen tényezőre nem gondoltatok előre, ami mégis befolyásolta a mérést?',
    aiCheck: [
      { label: 'Van tanulói döntés', ok: 'igen' },
      { label: 'Van látható produktum', ok: 'igen' },
      { label: 'Van reflexió', ok: 'igen' },
      { label: 'Eszközigény: hőmérő minden csapatnak', ok: 'figyelmet' },
    ],
    bPlan: 'Ha kevés a hőmérő, csapatok rotálják őket 15 perces időkeretekben.',
    lowResource:
      'Digitális hőmérő helyett árnyék–nap összehasonlító megfigyelési lap: vizuális becslés és tapintás-alapú jegyzet.',
  },
  {
    id: 's4',
    week: 4,
    title: 'Javaslatcsomag az iskola vezetésének',
    phase: 'reflexio',
    state: 'tervezett',
    short: 'A bizonyítékokra épülő javaslatcsomag bemutatása nyilvánosan.',
    studentInstruction:
      'Készítsetek 3 perces bemutatót: mit javasoltok az iskola hőtűrésének javítására, és melyik mérési adat támasztja alá?',
    teacherSteps: [
      'Hívd meg az iskolavezetés egy tagját a záró bemutatóra.',
      'Tartsatok 2 próbabemutatást csapaton belül.',
      'A bemutatók után minden csapat fogalmazzon egy mondatot: mit tanultál egy másik csapattól?',
      'Záró reflexióban a portfólióból válassz ki egy fontos pillanatot.',
    ],
    studentChoice: 'A csapat eldönti, hogy makettet, plakátot vagy videós bemutatót készít.',
    expectedProduct: 'Bemutató + makett vagy poszter + záró reflexió.',
    evidenceType: 'Prezentáció + reflexió',
    reflection: 'Melyik döntésetek változott meg a projekt során a bizonyítékok hatására?',
    aiCheck: [
      { label: 'Nyilvános bemutatás', ok: 'igen' },
      { label: 'Évidencia-alapú érvelés', ok: 'igen' },
      { label: 'Reflexió része', ok: 'igen' },
    ],
    bPlan: 'Ha az iskolavezetés nem ér rá, vegyétek fel videóra a bemutatót és kérjetek írásos visszajelzést.',
    lowResource: 'Plakát kézzel rajzolva A2-es lapra; mérési táblázat kézi grafikonnal.',
  },
];

export const INITIAL_EVIDENCE: Evidence[] = [
  {
    id: 'e1', stickerId: 's1', teamId: 'arnyek', type: 'foto',
    title: 'Sportpálya déli oldala – fotó és jegyzet',
    submittedBy: 'Árnyékkommandó', submittedAt: '1. hét péntek',
    description:
      'A déli oldalon álló műfüves felületnél a járda is forró volt. A jegyzetben azt írtuk, hogy a fűz fa körüli rész lényegesen hűvösebbnek tűnt.',
    status: 'elkeszult',
    helpRequested: false,
    teacherFeedback:
      'Jó megfigyelés. A következő körben próbáljátok pontosabban leírni a mérés időpontját.',
  },
  {
    id: 'e2', stickerId: 's2', teamId: 'arnyek', type: 'jegyzet',
    title: 'Szerepkártya: alsós gyerek',
    submittedBy: 'Árnyékkommandó', submittedAt: '2. hét csütörtök',
    description:
      'A kisebbeknek a délutáni napsütésben nincs hová leülniük az udvaron. Az érvtérkép a játszótér árnyékhiányára épült.',
    status: 'elkeszult',
    helpRequested: false,
    teacherFeedback:
      'Erős nézőpont. A példák konkrétak. Köszönöm a jól dokumentált érvtérképet.',
  },
  {
    id: 'e3', stickerId: 's3', teamId: 'arnyek', type: 'meres',
    title: 'A műfüves pálya mellett 6 fokkal melegebb volt',
    submittedBy: 'Árnyékkommandó', submittedAt: '3. hét szerda',
    description:
      'A napos műfüves részen 34°C-ot mértünk, az árnyékos fás részen 28°C-ot. Szerintünk a burkolat és az árnyék együtt számít.',
    helpRequest: 'Nem vagyunk biztosak benne, hogy elég pontos volt-e a mérés.',
    reflection: 'Azt hittük, csak az árnyék számít, de a burkolat is nagyon sokat változtatott.',
    status: 'varakozik',
    helpRequested: false,
    teacherFeedback: null,
  },
  {
    id: 'e4', stickerId: 's3', teamId: 'kovek', type: 'meres',
    title: 'Aszfalt vs. kavics: 4 fokos különbség',
    submittedBy: 'Kőkutatók', submittedAt: '3. hét szerda',
    description:
      'Aszfalt 36°C, kavics 32°C. Csak két mérést tudtunk venni, mert egy hőmérő hibásan mutatott.',
    helpRequest: 'Lehet hogy nem ugyanabban a napszakban mértünk.',
    reflection: 'Más napszakban újra mérnénk és többször ismételnénk.',
    status: 'varakozik',
    helpRequested: false,
    teacherFeedback: null,
  },
  {
    id: 'e5', stickerId: 's3', teamId: 'felho', type: 'meres',
    title: 'Tanári épület melletti rész',
    submittedBy: 'Felhőfigyelők', submittedAt: '3. hét szerda',
    description:
      'Két helyszínen mértünk, az adatok közel azonosak. A módszer leírása nem pontos: nem jegyeztük le a mérés idejét.',
    helpRequest: 'Nem tudjuk eldönteni, mi az érdemi különbség.',
    reflection: 'Lehet, hogy nem voltak elég különböző helyszínek.',
    status: 'varakozik',
    helpRequested: false,
    teacherFeedback: null,
  },
];

export const QUALITY_DIMS: QualityDim[] = [
  { id: 'aktiv',    label: 'Tanulói aktivitás',          score: 92, state: 'ok'   },
  { id: 'valaszt',  label: 'Választási lehetőség',       score: 85, state: 'ok'   },
  { id: 'nyilt',    label: 'Nyílt végű probléma',        score: 88, state: 'ok'   },
  { id: 'produkt',  label: 'Látható produktum',          score: 90, state: 'ok'   },
  { id: 'bizonyit', label: 'Bizonyítékgyűjtés',          score: 70, state: 'warn' },
  { id: 'egyutt',   label: 'Együttműködés',              score: 80, state: 'ok'   },
  { id: 'feedback', label: 'Visszajelzés és javítás',    score: 78, state: 'ok'   },
  { id: 'reflex',   label: 'Reflexió',                   score: 86, state: 'ok'   },
  { id: 'lowres',   label: 'Erőforrástakarékos megvalósíthatóság', score: 55, state: 'warn' },
  { id: 'tanari',   label: 'Tanári kontroll és rugalmasság', score: 82, state: 'ok' },
];
