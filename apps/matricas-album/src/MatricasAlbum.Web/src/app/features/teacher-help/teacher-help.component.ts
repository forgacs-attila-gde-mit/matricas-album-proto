import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface HelpBookSection {
  readonly id: string;
  readonly title: string;
  readonly lead: string;
  readonly body: readonly string[];
  readonly focus: readonly string[];
  readonly questions: readonly string[];
}

const HELP_SECTIONS: readonly HelpBookSection[] = [
  {
    id: 'album-ut',
    title: 'Az album mint tanulási út',
    lead: 'Az album a tanulás látható útvonala: kérdésből, bizonyítékokból, döntésekből és reflexiókból épül fel.',
    body: [
      'A matricák nem önálló jutalmak, hanem lezárt tanulási állomások. Minden állomás akkor erős, ha kapcsolódik a vezérkérdéshez és hagy maga után látható bizonyítékot.',
      'A tanár feladata az út keretezése: miért indulunk el, mire figyelünk közben, hogyan látjuk, hogy haladunk, és mihez kezdünk a megszülető bizonyítékokkal.',
    ],
    focus: ['Albumív', 'állomások egymásra épülése', 'bizonyítéktermelő matricák', 'rövid záró reflexió'],
    questions: ['Mit bizonyít ez az állomás?', 'Hogyan visz közelebb a végső produktumhoz?', 'Mi változott a csapat gondolkodásában?'],
  },
  {
    id: 'vezerkerdes',
    title: 'Vezérkérdés, produktum, közönség',
    lead: 'A vezérkérdés irányt ad, a produktum láthatóvá teszi a tanulást, a közönség pedig valódi tétet ad a pontosságnak.',
    body: [
      'Jó vezérkérdésre nem elég egyetlen definíció. Kutatást, összehasonlítást, döntést és indoklást kér.',
      'A produktum nem dísz a végén: a matricák bizonyítékai miatt lesz hiteles. A közönség kiválasztása segít eldönteni, milyen nyelven, mélységben és formában kell bemutatni a tanulást.',
    ],
    focus: ['Nyitott, vizsgálható kérdés', 'bizonyítékhoz kötött produktum', 'konkrét közönség', 'érthetőségi próba'],
    questions: ['Kinek készül a produktum?', 'Milyen bizonyíték nélkül lenne hiteltelen?', 'Milyen választási lehetőségük van a tanulóknak?'],
  },
  {
    id: 'matrica',
    title: 'A matrica anatómiája',
    lead: 'Egy matrica akkor működik, ha cselekvést, döntést, bizonyítékot és reflexiót köt össze.',
    body: [
      'A jó matrica elég kicsi ahhoz, hogy belátható legyen, de elég tartalmas ahhoz, hogy gondolkodást igényeljen.',
      'A tanulói döntési pont különösen fontos: forrás, módszer, bizonyíték, forma vagy javítási irány választása nélkül a tanulók könnyen végrehajtóvá válnak.',
    ],
    focus: ['Diákutasítás', 'tanulói döntési pont', 'várható bizonyíték', 'reflexiós kérdés', 'B terv'],
    questions: ['Mi számít késznek?', 'Miben dönthet a csapat?', 'Milyen bizonyíték marad a munka után?'],
  },
  {
    id: 'bizonyitek',
    title: 'Tanulási bizonyíték és portfólió',
    lead: 'A bizonyíték láthatóvá teszi a gondolkodást; a portfólió megőrzi a tanulási út emlékezetét.',
    body: [
      'Bizonyíték lehet adat, jegyzet, fotó, vázlat, forrásrészlet, próba, döntési indoklás vagy javított változat.',
      'A portfólió nem raktár. Akkor használható, ha a csapat időnként kiválasztja és értelmezi, mely bizonyítékok mutatják legjobban a haladást.',
    ],
    focus: ['Megfigyelés és következtetés szétválasztása', 'bizonyíték-mondat', 'válogatott portfólió', 'változás nyoma'],
    questions: ['Melyik bizonyíték a legerősebb?', 'Mi benne adat, és mi következtetés?', 'Mit hagynátok ki, ha válogatni kellene?'],
  },
  {
    id: 'feedback',
    title: 'Visszajelzés és revízió',
    lead: 'A visszajelzés akkor teljes, ha a tanulóknak van idejük és módjuk javítani.',
    body: [
      'A jó feedback rövid, konkrét és cselekvéshez kötött: mit látunk, miért fontos, és mi lehet a következő javító lépés.',
      'A revízió nem büntetés. A tanulás egyik legértékesebb bizonyítéka, mert megmutatja, hogyan lett pontosabb egy állítás, produktumrész vagy mérés.',
    ],
    focus: ['Megfigyelés', 'értelmező kérdés', 'kicsi javító lépés', 'eredeti és javított változat összevetése'],
    questions: ['Mit változtattatok a visszajelzés alapján?', 'Mitől lett jobb?', 'Milyen új bizonyíték kellene a javításhoz?'],
  },
  {
    id: 'kutatas',
    title: 'Kérdezés és kutatás',
    lead: 'A kérdések munka közben pontosodnak: a jó kutatás először figyelmet, majd bizonyítékot kér.',
    body: [
      'A kutatás lehet megfigyelés, interjú, mérés, összehasonlítás, forrásolvasás vagy próba. Nem a forma a lényeg, hanem hogy a tanulók saját bizonyítékot keressenek.',
      'Ha a kérdés túl tág, tedd vizsgálhatóbbá: mit tudunk megfigyelni, összehasonlítani, megkérdezni vagy kipróbálni az adott időben?',
    ],
    focus: ['Vizsgálható kérdés', 'forrás és adat minősége', 'ellenpélda keresése', 'kutatásból következő döntés'],
    questions: ['Mit tudtok ténylegesen megfigyelni?', 'Milyen bizonyíték gyengítené az elképzeléseteket?', 'Mi változott a kérdésetekben?'],
  },
  {
    id: 'alkotas',
    title: 'Alkotás és nyilvánosság',
    lead: 'A produktum akkor erős, ha mások számára is értelmezhető, bizonyítékokra épül, és látszik rajta a tanulói döntés.',
    body: [
      'A produktum lehet modell, térkép, javaslat, bemutató, vitaanyag, magyarázat vagy közös esemény.',
      'A nyilvánosság nem feltétlenül nagy rendezvény. Egy másik csoport, szülői kör, iskolai közösség vagy próbaközönség is segíthet észrevenni, mi érthető és mi homályos.',
    ],
    focus: ['Közönséghez igazítás', 'bizonyíték beépítése', 'próbabemutató', 'érthetőség és felelősség'],
    questions: ['Mit kell megértenie a közönségnek?', 'Melyik bizonyítékot mutatjátok meg?', 'Mit próbálnátok ki bemutatás előtt?'],
  },
  {
    id: 'csapat',
    title: 'Csapatmunka és szerepek',
    lead: 'A csapatmunka akkor tanulás, ha a döntések, szerepek és hozzájárulások láthatók.',
    body: [
      'A szerepek nem állandó címkék. Egy állomáson lehet kérdező, bizonyítékfelelős, időfigyelő, forrásellenőr vagy revíziófelelős; később érdemes váltani.',
      'A tanárnak nem a teljes együttműködést kell vezérelnie, hanem a kulcspontokat kell láthatóvá tennie: ki miért felel, hogyan döntött a csapat, és mi alapján vitatkozik.',
    ],
    focus: ['Szerepek cseréje', 'arányos részvétel', 'bizonyítékról szóló vita', 'egyéni hozzájárulás nyoma'],
    questions: ['Ki milyen bizonyítékkal járult hozzá?', 'Hol volt valódi közös döntés?', 'Melyik szerepet érdemes cserélni?'],
  },
  {
    id: 'differencialas',
    title: 'Differenciálás albumon belül',
    lead: 'Ugyanazon albumívben több út is járható: eltérő forrás, bizonyíték, szerep, tempó vagy támogatási szint.',
    body: [
      'A differenciálás nem azt jelenti, hogy egyes csapatok kevesebbet tanulnak. A közös mag marad: kérdés, bizonyíték, döntés és reflexió.',
      'Eszközszegény helyzetben is lehet választási lehetőséget adni: papír, beszélgetés, megfigyelés, rajz, közös tábla vagy rövid interjú is működhet.',
    ],
    focus: ['Közös minimum', 'választható útvonalak', 'támasz célcsökkentés helyett', 'eszközszegény változat'],
    questions: ['Melyik út segítene bizonyítékot gyűjteni?', 'Milyen támasz kell a következő lépéshez?', 'Hogyan egészíti ki a munkátok a többiekét?'],
  },
  {
    id: 'reflexio',
    title: 'Reflexió és gondolkodásváltozás',
    lead: 'A reflexió azt teszi láthatóvá, hogyan változott a tanulók gondolkodása a bizonyítékok hatására.',
    body: [
      'A jó reflexió nem csak arról szól, hogy tetszett-e a feladat. Azt mutatja meg, mit gondoltunk korábban, mit látunk most pontosabban, és milyen kérdés maradt nyitva.',
      'A gondolkodásváltozás lehet kicsi: egy pontosabb fogalom, javított állítás, újramért adat vagy átrendezett produktumrész.',
    ],
    focus: ['Fordulópont kiválasztása', 'bizonyítékhoz kötött reflexió', 'nyitott kérdés', 'javított gondolat megőrzése'],
    questions: ['Mit gondoltatok másképp az elején?', 'Melyik bizonyíték változtatott rajta?', 'Mi maradt nyitva?'],
  },
  {
    id: 'facilitalas',
    title: 'Tanári facilitálás',
    lead: 'A tanár keretet ad, figyel, kérdez és visszajelez, miközben a tanulói döntések felelőssége megmarad.',
    body: [
      'Nem kell minden csapat minden lépését követni. A kulcspontok fontosak: értik-e a vezérkérdést, van-e bizonyíték, hogyan választanak, mit kezdenek a visszajelzéssel.',
      'A jó beavatkozás rövid ciklus: megfigyelés, értelmező kérdés, következő kis lépés.',
    ],
    focus: ['Keretezés', 'tanári kör', 'köztes megosztás', 'revíziós idő', 'döntéshozói felelősség'],
    questions: ['Milyen döntést kell most meghozni?', 'Milyen bizonyíték alapján döntötök?', 'Hol kell segítség, és hol tudtok saját próbát tenni?'],
  },
  {
    id: 'minoseg',
    title: 'Album minőségellenőrző',
    lead: 'A jó album pedagógiailag gazdag, tanulóknak érthető, tanárnak tartható, és eszközszegény helyzetben is működőképes.',
    body: [
      'A minőségellenőrző nem minősítés, hanem újratervezési eszköz. Egyszerre legfeljebb egy-két javítandó szempontot érdemes választani.',
      'A leggyakoribb erősítési pontok: bizonyítéktermelő matricák, tanulói döntési pontok, visszajelzés utáni revízió, tartható B terv és látható portfólió.',
    ],
    focus: ['Vezérkérdés', 'bizonyíték', 'döntési pont', 'revízió', 'portfólió', 'B terv'],
    questions: ['Melyik minőségi szempont a legsürgősebb?', 'Mitől lesz hitelesebb a produktum?', 'Mi működne kevés eszközzel is?'],
  },
  {
    id: 'gyors-sablon',
    title: 'Gyors albumtervezési sablon',
    lead: 'Egy induló albumhoz elég egy világos kérdés, közönség, 3-5 bizonyítéktermelő matrica és egy revíziós pont.',
    body: [
      'A sablon célja nem a teljes lezárás, hanem a pedagógiai gerinc megrajzolása. A részletek a futás közben igazíthatók, ha a közös cél és a bizonyítékalap megmarad.',
      'Tervezéskor érdemes előbb a végső produktumot és közönséget tisztázni, majd visszafelé kijelölni, milyen bizonyítékokra lesz szükség.',
    ],
    focus: ['Vezérkérdés', 'közönség', 'produktum', 'matrica-sor', 'bizonyítékforma', 'visszajelzési pont'],
    questions: ['Melyik bizonyíték nélkül nem indulhat el az album?', 'Hol lesz az első revíziós pont?', 'Mi az eszközszegény B terv?'],
  },
  {
    id: 'alapallas',
    title: 'Végső alapállás',
    lead: 'A Matricás album akkor jó, ha nem a matricák gyűjtése, hanem a tanulás láthatóvá tétele kerül középre.',
    body: [
      'A tanár nem kész válaszokat gyárt, hanem olyan helyzetet teremt, ahol a tanulók kérdeznek, bizonyítékot gyűjtenek, döntéseket hoznak, javítanak és reflektálnak.',
      'Az album lehet egyszerű, papíralapú és rövid is. A lényeg, hogy a tanulók útja követhető, a bizonyítékaik értelmezhetők, a produktumuk pedig mások számára is érthető legyen.',
    ],
    focus: ['Látható tanulás', 'tanulói felelősség', 'bizonyíték', 'revízió', 'közönségnek szóló produktum'],
    questions: ['Mitől lesz ez valódi tanulási út?', 'Hol látszik a tanulói felelősség?', 'Mit ért meg belőle egy külső néző?'],
  },
];

@Component({
  selector: 'ma-teacher-help',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow help-page">
      <div class="page-head help-head">
        <div>
          <ma-chip tone="primary" icon="help">Pedagógiai súgó</ma-chip>
          <h1>Matricás album módszertani súgó</h1>
          <div class="sub">
            Gyakorlati kézikönyv tanároknak: albumtervezés, matricák, bizonyítékok, visszajelzés,
            differenciálás és záró produktum egy tanulási útban.
          </div>
        </div>
        <div class="help-search" role="search">
          <ma-icon name="search" />
          <input
            type="search"
            [value]="query()"
            (input)="setQuery($any($event.target).value)"
            placeholder="Keresés a súgóban"
            aria-label="Keresés a pedagógiai súgóban"
          />
          @if (query()) {
            <button type="button" class="clear-search" aria-label="Keresés törlése" (click)="resetSearch()">
              <ma-icon name="close" size="sm" />
            </button>
          }
        </div>
      </div>

      <div class="help-layout">
        <aside class="help-toc" aria-label="Tartalomjegyzék">
          <div class="card-section-title">Tartalom</div>
          @for (section of filteredSections(); track section.id; let i = $index) {
            <button type="button" (click)="scrollTo(section.id)">
              <span>{{ i + 1 }}.</span>
              {{ section.title }}
            </button>
          }
        </aside>

        <main class="help-book">
          @if (filteredSections().length === 0) {
            <div class="empty-card">
              <ma-icon name="search_off" size="xl" />
              <div class="t-title-lg">Nincs találat</div>
              <div class="muted t-body">Próbálj rövidebb vagy általánosabb keresést.</div>
              <ma-btn variant="secondary" icon="refresh" (clicked)="resetSearch()">Keresés törlése</ma-btn>
            </div>
          } @else {
            @for (section of filteredSections(); track section.id; let i = $index) {
              <article class="chapter-card" [id]="section.id">
                <div class="chapter-num">{{ i + 1 }}</div>
                <div class="chapter-body">
                  <h2>{{ section.title }}</h2>
                  <p class="lead">{{ section.lead }}</p>
                  @for (paragraph of section.body; track paragraph) {
                    <p>{{ paragraph }}</p>
                  }

                  <div class="chapter-grid">
                    <div>
                      <div class="card-section-title">Gyakorlati fókusz</div>
                      <ul>
                        @for (item of section.focus; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </div>
                    <div>
                      <div class="card-section-title">Tanári kérdések</div>
                      <ul>
                        @for (question of section.questions; track question) {
                          <li>{{ question }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: `
    .help-page { max-width: 1240px; }
    .help-head { align-items: flex-start; }
    .help-head h1 { margin-top: 14px; }
    .help-search {
      width: min(360px, 100%);
      min-height: 48px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      background: #fff;
      border: 1px solid var(--n-200);
      border-radius: 14px;
      color: var(--n-500);
    }
    .help-search input {
      min-width: 0;
      flex: 1;
      border: 0;
      outline: 0;
      font: inherit;
      color: var(--n-800);
      background: transparent;
    }
    .clear-search {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--n-100);
      color: var(--n-600);
    }
    .help-layout {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }
    .help-toc {
      position: sticky;
      top: 20px;
      background: #fff;
      border: 1px solid var(--n-200);
      border-radius: 18px;
      padding: 18px;
      max-height: calc(100vh - 140px);
      overflow: auto;
    }
    .help-toc button {
      display: flex;
      width: 100%;
      gap: 8px;
      padding: 8px 6px;
      border: 0;
      border-radius: 10px;
      color: var(--n-700);
      background: transparent;
      text-align: left;
      text-decoration: none;
      font-size: 13px;
      line-height: 18px;
    }
    .help-toc button:hover { background: var(--n-100); color: var(--primary-700); }
    .help-toc span { color: var(--n-400); min-width: 24px; }
    .help-book { display: flex; flex-direction: column; gap: 18px; }
    .chapter-card {
      scroll-margin-top: 24px;
      display: grid;
      grid-template-columns: 52px minmax(0, 1fr);
      gap: 20px;
      background: #fff;
      border: 1px solid var(--n-200);
      border-radius: 22px;
      padding: 28px;
    }
    .chapter-num {
      width: 40px;
      height: 40px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-100);
      color: var(--primary-700);
      font-weight: 600;
    }
    .chapter-body h2 {
      margin: 0;
      font-size: 24px;
      line-height: 32px;
      font-weight: 500;
    }
    .chapter-body p {
      margin: 10px 0 0;
      color: var(--n-700);
      font-size: 14px;
      line-height: 22px;
    }
    .chapter-body .lead {
      color: var(--n-800);
      font-size: 16px;
      line-height: 24px;
    }
    .chapter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--n-200);
    }
    .chapter-grid ul {
      margin: 0;
      padding-left: 18px;
      color: var(--n-700);
      font-size: 14px;
      line-height: 22px;
    }
    .empty-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      background: #fff;
      border: 1px solid var(--n-200);
      border-radius: 22px;
      padding: 44px 24px;
    }
    @media (max-width: 980px) {
      .help-head { flex-direction: column; }
      .help-search { width: 100%; }
      .help-layout { grid-template-columns: 1fr; }
      .help-toc { position: static; max-height: none; }
      .chapter-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .chapter-card { grid-template-columns: 1fr; padding: 22px; }
    }
  `,
})
export class TeacherHelpComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly query = signal('');
  readonly filteredSections = computed(() => {
    const value = normalize(this.query());
    if (!value) return HELP_SECTIONS;
    return HELP_SECTIONS.filter(section => normalize(sectionText(section)).includes(value));
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const topic = params.get('topic');
        if (topic) {
          window.setTimeout(() => this.scrollTo(topic));
        }
      });
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  resetSearch(): void {
    this.query.set('');
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function sectionText(section: HelpBookSection): string {
  return [
    section.title,
    section.lead,
    ...section.body,
    ...section.focus,
    ...section.questions,
  ].join(' ');
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('hu');
}
