import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AlbumApi,
  CreateAlbumInstancePayload,
  CreateAlbumTemplatePayload,
  CreateEvidencePayload,
  CreateStickerPayload,
} from './album-api.service';
import { AlbumStore } from './album.store';

export interface GuidedDemoState {
  readonly active: boolean;
  readonly panelOpen: boolean;
  readonly busyStepId: string | null;
}

export interface GuidedDemoStep {
  readonly id: string;
  readonly title: string;
  readonly philosophy: string;
  readonly actionLabel: string;
  readonly routeLabel: string;
  readonly completed: boolean;
  readonly disabled: boolean;
}

export interface GuidedDemoFixture {
  readonly stickers: CreateStickerPayload[];
  readonly template: CreateAlbumTemplatePayload;
  readonly instance: CreateAlbumInstancePayload;
  readonly evidence: Omit<CreateEvidencePayload, 'stickerId' | 'teamId'>;
  readonly helpRequest: string;
  readonly teacherFeedback: string;
  readonly stickerReflection: string;
  readonly projectReflection: string;
}

const STORAGE_KEY = 'ma-guided-demo-active';
const TEMPLATE_TITLE = 'Városi mikroklíma nyomában';
const INSTANCE_TITLE = '7.B mikroklíma projekt';

const FIXTURE: GuidedDemoFixture = {
  stickers: [
    {
      title: 'Hőnyomozók az iskola körül',
      phase: 'kerdezes',
      shortDescription: 'Terepi megfigyelés és hipotézisalkotás az iskola környékének hőérzetéről.',
      studentInstruction: 'Fotózzatok le két olyan helyet az iskola környékén, ahol szerintetek nyáron különösen meleg lehet. Írjatok mellé egy hipotézist: miért pont ott melegszik fel jobban a környezet?',
      teacherSteps: [
        'Indítsd a vezérkérdéssel: hogyan lehetne élhetőbb az iskola környéke a hőségben?',
        'Küldd ki a csapatokat rövid megfigyelő sétára.',
        'Zárásként gyűjtsétek össze, melyik feltevést lehetne méréssel ellenőrizni.',
      ],
      studentChoice: 'A csapat dönti el, hogy árnyékot, burkolatot, növényzetet vagy emberi használatot figyel meg.',
      expectedProduct: 'Két fotó, rövid helyszínleírás és egy ellenőrizhető hipotézis.',
      evidenceTypeLabel: 'Fotó + megfigyelési jegyzet',
      reflectionPrompt: 'Mi változott az első feltételezésetekben a terepi séta után?',
      bPlan: 'Rossz időben az iskolaablakból vagy korábbi fotókból is választhatnak helyszínt.',
      lowResource: 'Telefon nélkül papíros helyszínvázlat és rövid jegyzet is elég.',
    },
    {
      title: 'Nézőpontok az udvarról',
      phase: 'kepzelet',
      shortDescription: 'Érintettek nézőpontjainak feltárása és érvek rendezése.',
      studentInstruction: 'Válasszatok egy szerepet: alsós diák, sportoló, tanár, karbantartó vagy szülő. Írjátok le, neki mitől lenne élhetőbb az udvar hőségben.',
      teacherSteps: [
        'Adj rövid szerepkártyákat, majd kérj saját példákat.',
        'Kérd, hogy minden csapat egy állítást és három indokot írjon.',
        'Ütköztessétek, hol férnek össze és hol ütköznek a nézőpontok.',
      ],
      studentChoice: 'Egy szerepet mélyen vagy két szerep konfliktusát is vizsgálhatják.',
      expectedProduct: 'Szerepkártya és rövid érvtérkép.',
      evidenceTypeLabel: 'Jegyzet vagy érvtérkép',
      reflectionPrompt: 'Melyik nézőpont változtatta meg leginkább a saját javaslatotokat?',
      bPlan: 'Ha nincs idő interjúra, a szerepkártyákból induljanak ki.',
      lowResource: 'Papíros szerepkártyával és táblai érvtérképpel futtatható.',
    },
    {
      title: 'Árnyék, víz, felület: mikroklíma-kísérlet',
      phase: 'cselekves',
      shortDescription: 'Egyszerű mérési vagy megfigyelési kísérlet a mikroklíma tényezőiről.',
      studentInstruction: 'Hasonlítsatok össze két helyszínt. Rögzítsétek, mikor, mit, hányszor és milyen eszközzel mértetek vagy figyeltetek meg.',
      teacherSteps: [
        'Tisztázzátok, mitől lesz ugyanúgy megismételhető a mérés.',
        'Kérj legalább két adatpontot vagy két összehasonlítható megfigyelést.',
        'A végén minden csapat nevezze meg a legnagyobb mérési bizonytalanságát.',
      ],
      studentChoice: 'Választhatnak hőmérsékletet, árnyékot, burkolatot, párolgást vagy emberi használatot.',
      expectedProduct: 'Mérési táblázat vagy megfigyelési protokoll következtetéssel.',
      evidenceTypeLabel: 'Mérés + rövid következtetés',
      reflectionPrompt: 'Melyik mérési döntés befolyásolhatta legjobban az eredményt?',
      bPlan: 'Eszközhiány esetén kategóriás megfigyeléssel dolgozzanak.',
      lowResource: 'Egy hőmérő vagy papíros megfigyelési skála is elég.',
    },
    {
      title: 'Javaslatcsomag próbabemutató',
      phase: 'reflexio',
      shortDescription: 'Bizonyítékokra épített javaslat bemutatása közönségnek.',
      studentInstruction: 'Készítsetek háromperces bemutatót: mi volt a kérdésetek, milyen bizonyítékot találtatok, és mit javasoltok az iskola környékére.',
      teacherSteps: [
        'Adj próbaközönséget vagy páros visszajelzést.',
        'Kérj egy bizonyíték-mondatot és egy vállalt javaslatot.',
        'Zárásként minden csapat javítson egy diát vagy mondatot a visszajelzés alapján.',
      ],
      studentChoice: 'Választhatnak makettet, posztert, térképet vagy rövid diát.',
      expectedProduct: 'Háromperces bemutató bizonyítékkal és javaslattal.',
      evidenceTypeLabel: 'Prezentáció vagy poszter',
      reflectionPrompt: 'Mit értett meg a közönség, és min javítottatok a próba után?',
      bPlan: 'Ha nincs prezentációs eszköz, papírposzterrel és szóban mutassák be.',
      lowResource: 'Papír, filc és egy próbaközönség elég.',
    },
  ],
  template: {
    title: TEMPLATE_TITLE,
    subject: 'Integrált természettudomány',
    grade: '7. évfolyam',
    durationType: 'het',
    drivingQuestion: 'Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?',
    finalProduct: 'Diákok által készített mikroklíma-javaslatcsomag mérésekkel, érvekkel és próbabemutatóval.',
    audience: 'Osztálytársak, természettudomány-tanárok, iskola vezetése',
    dispositions: ['kíváncsiság', 'együttműködés', 'kitartás', 'bizonyítékalapú gondolkodás'],
    weekTitles: [
      'Kérdezés és terepi megfigyelés',
      'Nézőpontok és érvek',
      'Kísérlet és bizonyíték',
      'Bemutatás és reflexió',
    ],
  },
  instance: {
    title: INSTANCE_TITLE,
    className: '7.B',
    teams: [
      { name: 'Árnyékkommandó', focus: 'Növényzet és árnyék', color: '#7872d4', members: ['Dóri', 'Marci', 'Hanna', 'Zétény'] },
      { name: 'Kőkutatók', focus: 'Burkolatok hatása', color: '#ef7c5b', members: ['Bence', 'Petra', 'Réka', 'Tomi'] },
      { name: 'Felhőfigyelők', focus: 'Mikroklíma és időjárás', color: '#5cb6a3', members: ['Vince', 'Léna', 'Boti', 'Adél'] },
      { name: 'Vízkereső expedíció', focus: 'Víz és párolgás', color: '#e5b653', members: ['Eszter', 'Csongor', 'Ági', 'Misi'] },
    ],
  },
  evidence: {
    type: 'foto',
    title: 'A sportpálya déli oldala sokkal melegebbnek tűnik',
    description: 'A napos műfüves részen érezhetően melegebb volt, mint a fák alatti járdán. Azt gondoljuk, hogy az árnyék és a burkolat együtt számít.',
    helpRequest: 'Nem vagyunk biztosak benne, hogyan lehetne ezt pontosabban bizonyítani.',
    helpRequested: true,
    reflection: 'Először csak az árnyékra figyeltünk, de a burkolat is fontosnak tűnik.',
  },
  helpRequest: 'Melyik mérési döntésre figyeljünk, ha újra akarjuk mérni a két helyszínt?',
  teacherFeedback: 'Jó, hogy külön jeleztétek, hol bizonytalan a mérés. A következő körben válasszatok ki egy mérési döntést, amit ugyanúgy megismételtek: helyszín, időpont vagy eszköz. Írjátok le, ettől hogyan lesz meggyőzőbb az eredmény.',
  stickerReflection: 'A visszajelzés után rájöttünk, hogy nem elég azt mondani, melegebb volt: azt is le kell írni, hogyan mértük.',
  projectReflection: 'A csapatunk megtanulta, hogy egy jó javaslat mögött nem csak ötlet, hanem megmutatható bizonyíték is van.',
};

@Injectable({ providedIn: 'root' })
export class GuidedDemoService {
  private readonly api = inject(AlbumApi);
  private readonly store = inject(AlbumStore);
  private readonly router = inject(Router);

  readonly panelOpen = signal(false);
  readonly active = signal(localStorage.getItem(STORAGE_KEY) === 'true');
  readonly busyStepId = signal<string | null>(null);

  readonly state = computed<GuidedDemoState>(() => ({
    active: this.active(),
    panelOpen: this.panelOpen(),
    busyStepId: this.busyStepId(),
  }));

  readonly steps = computed<GuidedDemoStep[]>(() => {
    const stickerDone = this.fixtureStickersReady();
    const templateDone = this.templateReady();
    const instanceDone = this.instanceReady();
    const evidenceDone = this.evidenceReady();
    const feedbackDone = this.feedbackReady();
    const reflectionDone = this.reflectionReady();
    const emptyDemoWorkspace = this.active()
      && !this.store.activeInstanceId()
      && this.store.stickerLibrary().length === 0
      && this.store.templates().length === 0
      && this.store.instances().length === 0;
    const demoProgressStarted = stickerDone || templateDone || instanceDone || evidenceDone || feedbackDone || reflectionDone;

    return [
      {
        id: 'start',
        title: 'Indítás: mi az album?',
        philosophy: 'Üres műhelyből indulunk, hogy látszódjon: az album tanulási út, nem előre gyártott jutalomfüzet.',
        actionLabel: 'Üres bemutató-műhely indítása',
        routeLabel: 'Műhely',
        completed: this.active() && (emptyDemoWorkspace || demoProgressStarted),
        disabled: false,
      },
      {
        id: 'stickers',
        title: 'Matricatár: tevékenységformák',
        philosophy: 'A matricák kis tanulási epizódok: cselekvés, döntés, bizonyíték és reflexió tartozik hozzájuk.',
        actionLabel: '4 minta-matrica létrehozása',
        routeLabel: 'Matricatár',
        completed: stickerDone,
        disabled: false,
      },
      {
        id: 'template',
        title: 'Albumterv: tanulási út',
        philosophy: 'Az albumterv nem óravázlat: heti egységekbe rendezi, hogyan épülnek egymásra a bizonyítékok.',
        actionLabel: 'Albumterv összeállítása',
        routeLabel: 'Albumtervek',
        completed: templateDone,
        disabled: !stickerDone,
      },
      {
        id: 'instance',
        title: 'Futó album: osztály és csapatok',
        philosophy: 'A futó album az a konkrét tanulási helyzet, ahol csapatok, bizonyítékok és tanári döntések jelennek meg.',
        actionLabel: '7.B futó album indítása',
        routeLabel: 'Futó album',
        completed: instanceDone,
        disabled: !templateDone,
      },
      {
        id: 'student',
        title: 'Diák nézet: bizonyíték és kérdés',
        philosophy: 'A tanulói oldal azt mutatja meg, hogy a matrica mögött saját döntés és beküldhető bizonyíték áll.',
        actionLabel: 'Minta-bizonyíték beküldése',
        routeLabel: 'Diák nézet',
        completed: evidenceDone,
        disabled: !instanceDone,
      },
      {
        id: 'feedback',
        title: 'Tanári visszajelzés: AI draft + döntés',
        philosophy: 'Az AI nem dönt a tanár helyett: gyorsan ad egy szerkeszthető visszajelzés-draftot.',
        actionLabel: 'AI draft és tanári feedback',
        routeLabel: 'Visszajelzési sor',
        completed: feedbackDone,
        disabled: !evidenceDone,
      },
      {
        id: 'reflection',
        title: 'Revízió és reflexió',
        philosophy: 'A visszajelzés akkor ér valamit, ha látszik, hogyan változott a tanulói gondolkodás.',
        actionLabel: 'Minta-reflexió mentése',
        routeLabel: 'Reflexió',
        completed: reflectionDone,
        disabled: !feedbackDone,
      },
      {
        id: 'closure',
        title: 'Projektzárás',
        philosophy: 'A zárás a bizonyítékokból és reflexiókból áll össze: mit tudunk megmutatni egy valódi közönségnek?',
        actionLabel: 'Projektzárás megnyitása',
        routeLabel: 'Projektzárás',
        completed: reflectionDone && this.store.closureChecklist().some(item => item.done),
        disabled: !reflectionDone,
      },
    ];
  });

  readonly stepCount = computed(() => this.steps().length);
  readonly completedStepCount = computed(() => this.steps().filter(step => step.completed).length);
  readonly nextStep = computed<GuidedDemoStep | null>(() => this.steps().find(step => !step.completed) ?? null);
  readonly currentStepIndex = computed(() => {
    const steps = this.steps();
    const next = this.nextStep();
    if (!next) return steps.length;
    const index = steps.findIndex(step => step.id === next.id);
    return index >= 0 ? index + 1 : 1;
  });

  constructor() {
    this.api.setGuidedDemoMode(this.active());
    effect(() => {
      const enabled = this.active();
      this.api.setGuidedDemoMode(enabled);
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    });
  }

  open(): void {
    this.active.set(true);
    this.panelOpen.set(true);
  }

  close(): void {
    this.panelOpen.set(false);
  }

  stop(): void {
    this.active.set(false);
    this.panelOpen.set(false);
    this.store.showToast('Bemutató mód kikapcsolva.', 'check_circle');
  }

  async runStep(stepId: string): Promise<void> {
    if (this.busyStepId()) return;
    this.active.set(true);
    this.busyStepId.set(stepId);
    try {
      switch (stepId) {
        case 'start': await this.resetToEmpty(); break;
        case 'stickers': await this.createStickers(); break;
        case 'template': await this.createTemplate(); break;
        case 'instance': await this.createInstance(); break;
        case 'student': await this.submitStudentEvidence(); break;
        case 'feedback': await this.runTeacherFeedback(); break;
        case 'reflection': await this.saveReflections(); break;
        case 'closure': await this.openClosure(); break;
      }
    } finally {
      this.busyStepId.set(null);
    }
  }

  async navigateStep(stepId: string): Promise<void> {
    switch (stepId) {
      case 'start':
        await this.router.navigate(['/teacher']);
        break;
      case 'stickers':
        await this.router.navigate(['/teacher/sticker-library']);
        break;
      case 'template': {
        const template = this.demoTemplate();
        await this.router.navigate(template ? ['/teacher/templates', template.id] : ['/teacher/templates']);
        break;
      }
      case 'instance':
        await this.navigateTeacherInstance('plan');
        break;
      case 'student':
        await this.navigateStudent('current');
        break;
      case 'feedback':
        await this.navigateTeacherInstance('feedback');
        break;
      case 'reflection':
        await this.navigateStudent('reflection');
        break;
      case 'closure':
        await this.navigateTeacherInstance('closure');
        break;
    }
  }

  private async resetToEmpty(): Promise<void> {
    await this.store.resetGuidedDemoData();
  }

  private async createStickers(): Promise<void> {
    this.store.setRole('teacher');
    for (const sticker of FIXTURE.stickers) {
      if (this.store.stickerLibrary().some(item => item.title === sticker.title)) continue;
      await firstValueFrom(this.api.createSticker(sticker));
      await this.store.loadWorkspace();
    }
    await this.router.navigate(['/teacher/sticker-library']);
    this.store.showToast('A bemutató matricái létrejöttek.', 'bookmark_added');
  }

  private async createTemplate(): Promise<void> {
    await this.createStickers();

    let templateId = this.demoTemplate()?.id;
    if (!templateId) {
      templateId = await firstValueFrom(this.api.createTemplate(FIXTURE.template));
    }

    let detail = await firstValueFrom(this.api.getAlbumTemplate(templateId));
    let draft = detail.versions.find(version => version.isDraft);
    const hasPublishedPlan = detail.versions.some(version => !version.isDraft && version.stickers.length >= FIXTURE.stickers.length);

    if (!hasPublishedPlan) {
      if (!draft) {
        detail = await firstValueFrom(this.api.createTemplateDraft(templateId));
        draft = detail.versions.find(version => version.isDraft);
      }
      if (draft) {
        for (const [index, sticker] of FIXTURE.stickers.entries()) {
          const libraryItem = this.store.stickerLibrary().find(item => item.title === sticker.title);
          if (!libraryItem) continue;
          const alreadyAdded = draft.stickers.some(item => item.stickerVersionId === libraryItem.latestVersionId);
          if (!alreadyAdded) {
            detail = await firstValueFrom(this.api.addStickerToTemplateVersion(draft.id, libraryItem.latestVersionId, index + 1, 1));
            draft = detail.versions.find(version => version.isDraft) ?? draft;
          }
        }
        detail = await firstValueFrom(this.api.publishTemplateDraft(templateId));
      }
    }

    await this.store.loadWorkspace();
    this.store.activeAlbumTemplate.set(detail);
    this.store.activeTemplateId.set(templateId);
    await this.router.navigate(['/teacher/templates', templateId]);
    this.store.showToast('A mikroklíma albumterv összeállt.', 'edit_note');
  }

  private async createInstance(): Promise<void> {
    await this.createTemplate();
    const existing = this.demoInstance();
    if (existing) {
      await this.store.selectInstance(existing.id);
      await this.navigateTeacherInstance('plan');
      return;
    }

    const template = this.demoTemplate();
    if (!template) return;
    await this.store.createInstance(template.id, FIXTURE.instance);
    await this.navigateTeacherInstance('plan');
  }

  private async submitStudentEvidence(): Promise<void> {
    await this.ensureInstanceLoaded();
    if (this.evidenceReady()) {
      await this.navigateStudent('current');
      return;
    }

    this.store.setRole('student');
    const team = this.store.teams[0];
    const sticker = this.store.currentStickerForStudent();
    if (!team || !sticker) return;
    this.store.setStudentTeam(team.id);
    await this.navigateStudent('current');
    await this.store.submitEvidence({ ...FIXTURE.evidence, stickerId: sticker.id, teamId: team.id });
    await this.store.submitHelpRequest(FIXTURE.helpRequest, sticker.id);
  }

  private async runTeacherFeedback(): Promise<void> {
    await this.ensureInstanceLoaded();
    this.store.setRole('teacher');
    await this.navigateTeacherInstance('feedback');
    if (this.feedbackReady()) return;

    await this.store.refreshTeacherAdvice();
    const advice = this.store.teacherAdvices().find(item => item.action?.type === 'draftFeedback');
    if (advice) {
      await this.store.applyAdvice(advice.id);
    }
    const evidence = this.demoEvidence();
    if (evidence) {
      this.store.openEvidence(evidence.id);
      await this.store.submitFeedback(evidence.id, FIXTURE.teacherFeedback, 'elkeszult');
    }
  }

  private async saveReflections(): Promise<void> {
    await this.ensureInstanceLoaded();
    const evidence = this.demoEvidence();
    if (!evidence) return;
    const canReflect = await this.ensureReflectionPrerequisite(evidence.id, evidence.stickerId, evidence.teamId);
    if (!canReflect) return;
    this.store.setRole('student');
    this.store.setStudentTeam(evidence.teamId);
    await this.navigateStudent('reflection');
    if (!this.store.progressFor(evidence.stickerId, evidence.teamId)?.reflection) {
      await this.store.saveStickerReflection(evidence.stickerId, FIXTURE.stickerReflection);
    }
    if (!this.store.projectReflectionForTeam(evidence.teamId)) {
      await this.store.saveProjectReflection(FIXTURE.projectReflection);
    }
  }

  private async openClosure(): Promise<void> {
    await this.ensureInstanceLoaded();
    this.store.setRole('teacher');
    const firstItems = this.store.closureChecklist().slice(0, 4);
    for (const item of firstItems) {
      if (!item.done) await this.store.toggleClosureChecklistItem(item.id, true);
    }
    await this.navigateTeacherInstance('closure');
  }

  private async ensureInstanceLoaded(): Promise<void> {
    const existing = this.demoInstance();
    if (existing && existing.id !== this.store.activeInstanceId()) {
      await this.store.selectInstance(existing.id);
    }
  }

  private async navigateTeacherInstance(page: string): Promise<void> {
    const id = this.store.activeInstanceId() ?? this.demoInstance()?.id;
    await this.router.navigate(id ? ['/teacher/instances', id, page] : ['/teacher/instances']);
  }

  private async navigateStudent(page: string): Promise<void> {
    const id = this.store.activeInstanceId() ?? this.demoInstance()?.id;
    await this.router.navigate(id ? ['/student/instances', id, page] : ['/student/home']);
  }

  private fixtureStickersReady(): boolean {
    return FIXTURE.stickers.every(sticker => this.store.stickerLibrary().some(item => item.title === sticker.title));
  }

  private templateReady(): boolean {
    return !!this.demoTemplate() && this.fixtureStickersReady();
  }

  private instanceReady(): boolean {
    return !!this.demoInstance();
  }

  private evidenceReady(): boolean {
    return !!this.demoEvidence();
  }

  private feedbackReady(): boolean {
    const evidence = this.demoEvidence();
    if (!evidence) return false;
    const progress = this.store.progressFor(evidence.stickerId, evidence.teamId);
    return progress?.state === 'elkeszult' || progress?.state === 'reflektalt';
  }

  private reflectionReady(): boolean {
    const evidence = this.demoEvidence();
    if (!evidence) return false;
    return !!this.store.progressFor(evidence.stickerId, evidence.teamId)?.reflection
      && !!this.store.projectReflectionForTeam(evidence.teamId);
  }

  private demoTemplate() {
    return this.store.templates().find(template => template.title === TEMPLATE_TITLE) ?? null;
  }

  private demoInstance() {
    return this.store.instances().find(instance => instance.title === INSTANCE_TITLE) ?? null;
  }

  private demoEvidence() {
    return this.store.evidence().find(evidence => evidence.title === FIXTURE.evidence.title) ?? null;
  }

  private async ensureReflectionPrerequisite(evidenceId: string, stickerId: string, teamId: string): Promise<boolean> {
    const progress = this.store.progressFor(stickerId, teamId);
    if (progress?.state === 'elkeszult' || progress?.state === 'reflektalt') return true;

    this.store.setRole('teacher');
    await this.store.submitFeedback(evidenceId, FIXTURE.teacherFeedback, 'elkeszult');
    const updatedProgress = this.store.progressFor(stickerId, teamId);
    return updatedProgress?.state === 'elkeszult' || updatedProgress?.state === 'reflektalt';
  }
}
