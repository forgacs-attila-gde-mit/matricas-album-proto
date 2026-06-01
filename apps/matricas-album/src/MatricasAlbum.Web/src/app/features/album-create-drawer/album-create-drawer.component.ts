import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ALBUM_TEMPLATE_PATTERNS,
  AlbumTemplatePatternKey,
  DEFAULT_PROJECT_REFLECTION_PROMPTS,
} from '../../core/models/album.model';
import { CreateAlbumInstancePayload, CreateAlbumTemplatePayload, CreateStickerPayload } from '../../core/services/album-api.service';
import { AlbumStore, type StickerEntryContext, type TemplateEntryContext } from '../../core/services/album.store';
import { PhaseId } from '../../core/tokens/phases';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { MatricaPreviewComponent } from './matrica-preview.component';

interface InstanceStickerUnitOption {
  readonly week: number;
  readonly title: string;
  readonly relation: 'past' | 'current' | 'future';
}

interface LessonActivityDraft {
  readonly id: string;
  title: string;
  minutes: number;
  participation: LessonParticipationMode;
  resources: string;
}

type ActivityInteractionMode = 'kutatas' | 'vita' | 'alkotas' | 'reflexio' | 'gyakorlas';
type ActivityParticipantMode = 'egyeni' | 'paros' | 'csoportos' | 'teljes-osztaly';
type ActivityContextMode = 'iskola' | 'otthon' | 'kozosseg' | 'terep' | 'digitalis';
type ActivityTypeId = 'felfedezo' | 'kiserletezo' | 'feldolgozo' | 'kommunikacios' | 'kollaborativ' | 'reflektiv';
type LessonParticipationMode = 'required' | 'optional' | 'extra';

interface ActivityTypeOption {
  readonly id: ActivityTypeId;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

interface CurriculumModuleDraft {
  readonly id: string;
  title: string;
  topics: string[];
}

const CONCEPT_ONBOARDING_STORAGE_KEY = 'matricas-album:onboarding:v1:dismissed';

const ACTIVITY_TYPES: readonly ActivityTypeOption[] = [
  { id: 'felfedezo', label: 'Felfedező', description: 'Megfigyelés, gyűjtés, kérdésindítás.', icon: 'travel_explore' },
  { id: 'kiserletezo', label: 'Kísérletező', description: 'Próbálkozás, mérés, tesztelés.', icon: 'science' },
  { id: 'feldolgozo', label: 'Feldolgozó', description: 'Információ értelmezése és rendezése.', icon: 'library_books' },
  { id: 'kommunikacios', label: 'Kommunikációs', description: 'Magyarázat, vita, prezentáció, interjú.', icon: 'record_voice_over' },
  { id: 'kollaborativ', label: 'Kollaboratív', description: 'Közös alkotás és szerepmunka.', icon: 'groups' },
  { id: 'reflektiv', label: 'Reflektív', description: 'Önértékelés, visszatekintés, tanulság.', icon: 'self_improvement' },
];

@Component({
  selector: 'ma-album-create-drawer',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, DrawerComponent, IconComponent, MatricaPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './album-create-drawer.component.html',
  styleUrl: './album-create-drawer.component.scss',
})
export class AlbumCreateDrawerComponent {
  readonly store = inject(AlbumStore);
  readonly saving = signal(false);
  readonly conceptOnboardingVisible = signal(!this.loadConceptOnboardingDismissed());
  /** REFACTOR-001 Task 1.3: collapses the advanced "Részletes tervezés" metadata in matrica creation. */
  readonly advancedOpen = signal(false);
  private lastAppliedTemplateContext: TemplateEntryContext | null = null;
  private lastAppliedStickerContext: StickerEntryContext | null = null;

  /** Only non-archived stickers can be picked into a new template. */
  readonly assignableStickers = computed(() =>
    this.store.stickerLibrary().filter(item => !item.archivedAt),
  );
  /** Archived templates remain readable but cannot start new running albums; draft-only templates lack a published version. */
  readonly assignableTemplates = computed(() =>
    this.store.templates().filter(item => !item.archivedAt && !item.isDraftOnly),
  );

  constructor() {
    // When the wizard opens in newVersion mode, prefill the sticker form fields from the parent version.
    effect(() => {
      const prefill = this.store.newVersionPrefill();
      if (!prefill) return;
      const v = prefill.latestVersion;
      this.stickerTitle = v.title;
      this.stickerPhase = v.phase;
      this.stickerShort = v.short;
      this.stickerInstruction = v.studentInstruction;
      this.stickerEvidence = v.evidenceType;
    });

    effect(() => {
      const prefill = this.store.newTemplateVersionPrefill();
      if (!prefill) return;
      const v = prefill.latestVersion;
      this.templateTitle = v.title;
      this.subject = v.subject;
      this.grade = v.grade;
      this.durationType = v.durationType;
      this.selectedPatternKey = v.patternKey;
      this.drivingQuestion = v.drivingQ;
      this.finalProduct = v.finalProduct;
      this.audience = v.audience;
      this.projectReflectionPrompts = [...v.projectReflectionPrompts];
      this.dispositions = v.dispositions.join(', ');
      this.weekTitles = v.weeks.map(week => week.title);
    });

    effect(() => {
      const prefill = this.store.instanceStickerPrefill();
      if (!prefill) return;
      const source = prefill.source;
      this.stickerTitle = source?.title ?? '';
      this.stickerPhase = source?.phase ?? 'kerdezes';
      this.stickerShort = source?.short ?? '';
      this.stickerInstruction = source?.studentInstruction ?? '';
      this.stickerEvidence = source?.evidenceType ?? 'Jegyzet + reflexió';
      this.instanceStickerWeek = this.coerceInstanceStickerWeek(source?.week ?? this.currentInstanceStickerWeek());
    });

    effect(() => {
      const context = this.store.templateEntryContext();
      if (!this.store.wizardOpen() || this.store.wizardMode() !== 'template') {
        this.lastAppliedTemplateContext = null;
        return;
      }

      if (this.lastAppliedTemplateContext !== context) {
        this.applyTemplateEntryPreset(context);
        this.lastAppliedTemplateContext = context;
      }
    });

    effect(() => {
      const context = this.store.stickerEntryContext();
      if (!this.store.wizardOpen() || this.store.wizardMode() !== 'sticker') {
        this.lastAppliedStickerContext = null;
        return;
      }

      if (this.lastAppliedStickerContext !== context) {
        this.prepareStickerEntry(context);
        this.lastAppliedStickerContext = context;
      }
    });
  }

  activityIdea = '';
  activityIdeaDrafted = false;
  readonly activityTypes = ACTIVITY_TYPES;
  selectedActivityType: ActivityTypeId = 'felfedezo';
  metadataSubject = 'Integrált természettudomány';
  metadataGrade = '7-8. évfolyam';
  metadataCompetencies = 'megfigyelés, mérés, érvelés';
  metadataNatLinks = '';
  metadataInteractionMode: ActivityInteractionMode = 'kutatas';
  metadataParticipantMode: ActivityParticipantMode = 'csoportos';
  metadataEstimatedMinutes = 20;
  metadataContextMode: ActivityContextMode = 'iskola';
  metadataContextNote = 'iskolai környezetből induló megfigyelés';
  contextCurriculum = '';
  contextModule = '';
  contextTopic = '';
  contextLearningUnit = '';
  contextBlock = '';
  selectedAdaptStickerId = '';
  selectedAdaptTemplateId = '';
  stickerTitle = '';
  stickerPhase: PhaseId = 'kerdezes';
  stickerShort = '';
  stickerInstruction = '';
  stickerEvidence = 'Jegyzet + reflexió';
  instanceStickerWeek = 1;

  readonly templatePatterns = ALBUM_TEMPLATE_PATTERNS;
  selectedPatternKey: AlbumTemplatePatternKey = 'altalanos';
  templateTitle = '';
  subject = 'Integrált természettudomány';
  grade = '7-8. évfolyam';
  durationType: 'het' | 'ora' | 'fazis' = 'het';
  drivingQuestion = '';
  finalProduct = '';
  audience = 'Osztálytársak és tanárok';
  projectReflectionPrompts = [...DEFAULT_PROJECT_REFLECTION_PROMPTS];
  dispositions = 'kíváncsiság, együttműködés, kitartás';
  weekTitles = [
    'Kérdezés és ráhangolódás',
    'Nézőpontok és tervezés',
    'Alkotás és bizonyítékgyűjtés',
    'Bemutatás és reflexió',
  ];
  lessonActivities = this.defaultLessonActivities();
  lessonBlockTopicName = 'Mozgás és mérés';
  lessonBlockLearningUnitName = 'Sebesség mérése a hétköznapokban';
  lessonBlockModuleName = 'Erők és kölcsönhatások';
  lessonBlockCurriculumName = '7-8. évfolyam természettudomány';
  lessonBlockReflectionPrompt = 'Melyik bizonyíték változtatta meg leginkább a gondolkodásotokat?';
  lessonBlockAlternativePath = 'Ha kevés az idő, a megosztás legyen kétperces csapatkör; ha van plusz idő, kérj összehasonlítást másik mérési módszerrel.';
  curriculumModules = this.defaultCurriculumModules();
  selectedStickerVersionIds = new Set<string>();

  instanceTitle = '';
  className = '7.B';
  teamLines = 'Árnyékkommandó | Növényzet és árnyék | Dóri, Marci, Hanna\nKőkutatók | Burkolatok hatása | Bence, Petra, Réka';

  canSubmit(): boolean {
    if (this.saving()) return false;
    const mode = this.store.wizardMode();
    if (mode === 'sticker' || mode === 'newVersion' || mode === 'instanceSticker' || mode === 'instanceStickerEdit') {
      return this.stickerTitle.trim().length > 0;
    }
    if (mode === 'template' || mode === 'newTemplateVersion') return this.templateTitle.trim().length > 0 && this.drivingQuestion.trim().length > 0;
    return this.instanceTitle.trim().length > 0 && !!this.selectedTemplateId();
  }

  selectedTemplateId(): string | null {
    const templates = this.assignableTemplates();
    const activeTemplateId = this.store.activeTemplateId();
    return templates.some(template => template.id === activeTemplateId)
      ? activeTemplateId
      : templates[0]?.id ?? null;
  }

  isLibrarySelected(versionId: string): boolean {
    if (this.selectedStickerVersionIds.size === 0) return true;
    return this.selectedStickerVersionIds.has(versionId);
  }

  toggleLibrarySticker(versionId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (this.selectedStickerVersionIds.size === 0) {
      for (const item of this.assignableStickers()) this.selectedStickerVersionIds.add(item.latestVersionId);
    }
    if (checked) this.selectedStickerVersionIds.add(versionId);
    else this.selectedStickerVersionIds.delete(versionId);
  }

  adaptSelectedActivity(): void {
    const source = this.assignableStickers().find(item => item.id === this.selectedAdaptStickerId);
    if (!source) return;

    this.stickerTitle = `${source.title} adaptációja`;
    this.stickerPhase = source.phase;
    this.stickerShort = source.short || 'Meglévő tevékenység tanári helyzetre igazított változata.';
    this.stickerInstruction = `Dolgozzatok a(z) "${source.title}" tevékenység adaptált változatán. Rögzítsétek a bizonyítékot, majd írjátok le, mit kellett módosítani a saját helyzetetekhez.`;
    this.stickerEvidence = 'Adaptált produktum + rövid reflexió';
    this.selectedActivityType = this.inferActivityType(`${source.title} ${source.short}`);
    this.contextLearningUnit = this.contextLearningUnit || 'Adaptált tanulási egység';
    this.contextBlock = this.contextBlock || 'Meglévő tevékenységből adaptált órai blokk';
  }

  adaptSelectedTemplate(): void {
    const source = this.assignableTemplates().find(item => item.id === this.selectedAdaptTemplateId);
    if (!source) return;

    this.templateTitle = `${source.title} adaptációja`;
    this.subject = source.subject;
    this.grade = source.grade;
    this.durationType = this.store.templateEntryContext() === 'lesson' ? 'ora' : source.durationType;
    this.drivingQuestion = source.drivingQ;
    this.selectedPatternKey = source.patternKey;

    if (this.lessonBuilderVisible()) {
      this.lessonBlockCurriculumName = source.title;
      this.lessonBlockModuleName = source.patternName;
      this.lessonBlockTopicName = source.drivingQ.replace(/[?!.]+$/, '');
      this.lessonBlockLearningUnitName = 'Adaptált tanulási egység';
      this.resetLessonActivities();
    }
  }

  instanceStickerUnitOptions(): InstanceStickerUnitOption[] {
    const currentWeek = this.currentInstanceStickerWeek();
    const selectedWeek = Number(this.instanceStickerWeek) || currentWeek;
    const startWeek = Math.min(currentWeek, selectedWeek);
    const unitCount = Math.max(this.store.album.weekTitles.length, currentWeek);
    return Array.from({ length: unitCount - startWeek + 1 }, (_, index) => {
      const week = startWeek + index;
      return {
        week,
        title: this.store.album.weekTitles[week - 1] ?? '',
        relation: week < currentWeek ? 'past' : week === currentWeek ? 'current' : 'future',
      };
    });
  }

  instanceStickerUnitLabel(option: InstanceStickerUnitOption): string {
    const prefix = option.relation === 'past' ? 'Korábbi' : option.relation === 'current' ? 'Aktív' : 'Későbbi';
    const title = option.title ? ` - ${option.title}` : '';
    return `${prefix}: ${option.week}. ${this.store.albumUnitLabel}${title}`;
  }

  instanceStickerPlacementHelp(): string {
    const hasPastSelected = (Number(this.instanceStickerWeek) || 0) < this.currentInstanceStickerWeek();
    return hasPastSelected
      ? 'A meglévő korábbi elhelyezés megőrizhető; új helynek az aktív vagy későbbi egységek választhatók.'
      : 'Csak az aktív egység és a későbbi egységek választhatók.';
  }

  dismissConceptOnboarding(): void {
    if (typeof localStorage === 'undefined') {
      this.conceptOnboardingVisible.set(true);
      return;
    }

    try {
      localStorage.setItem(CONCEPT_ONBOARDING_STORAGE_KEY, 'true');
      this.conceptOnboardingVisible.set(false);
    } catch {
      this.conceptOnboardingVisible.set(true);
    }
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((open) => !open);
  }

  stickerEntryIsIdea(): boolean {
    return this.store.stickerEntryContext() === 'idea';
  }

  canDraftActivityIdea(): boolean {
    return this.activityIdea.trim().length >= 3;
  }

  draftActivityFromIdea(): void {
    const idea = this.activityIdea.trim();
    if (!idea) return;

    const cleanIdea = this.cleanActivityIdea(idea);
    this.stickerTitle = `${this.capitalize(cleanIdea)} vizsgálata`;
    this.stickerPhase = this.inferIdeaPhase(cleanIdea);
    this.stickerShort = `Gyors 7-8. évfolyamos természettudományos tevékenység: ${cleanIdea}, tanulói döntéssel és látható bizonyítékkal.`;
    this.stickerInstruction =
      `Vizsgáljátok meg: ${cleanIdea}. Válasszatok egy mérhető vagy megfigyelhető döntési pontot, rögzítsétek a bizonyítékot, majd írjátok le, mi változott a gondolkodásotokban.`;
    this.stickerEvidence = this.inferIdeaEvidenceType(cleanIdea);
    this.metadataEstimatedMinutes = this.inferIdeaMinutes(cleanIdea);
    this.metadataInteractionMode = this.inferIdeaInteractionMode(cleanIdea);
    this.metadataParticipantMode = 'csoportos';
    this.metadataContextMode = this.inferIdeaContextMode(cleanIdea);
    this.metadataContextNote = this.inferIdeaContextNote(cleanIdea);
    this.metadataCompetencies = this.inferIdeaCompetencies(cleanIdea);
    this.selectedActivityType = this.inferActivityType(cleanIdea);
    this.contextTopic = this.inferIdeaTopic(cleanIdea);
    this.contextLearningUnit = `${this.capitalize(cleanIdea)} tanulási egység`;
    this.contextBlock = `${this.capitalize(cleanIdea)} órai blokk`;
    this.activityIdeaDrafted = true;
  }

  startLessonFromCurrentActivity(): void {
    const title = this.stickerTitle.trim() || this.cleanActivityIdea(this.activityIdea) || 'Új tevékenység';
    const activityMinutes = this.coerceLessonMinutes(this.metadataEstimatedMinutes);

    this.store.openTemplateWizard('lesson');
    this.lastAppliedTemplateContext = 'lesson';
    this.applyTemplateEntryPreset('lesson');
    this.templateTitle = `Órai blokk: ${title}`;
    this.subject = this.metadataSubject.trim() || this.subject;
    this.grade = this.metadataGrade.trim() || this.grade;
    this.drivingQuestion = `Hogyan vizsgáljuk meg: ${title.toLocaleLowerCase('hu-HU')}?`;
    this.finalProduct = `Órai bizonyíték a(z) "${title}" tevékenységből, rövid megosztással és reflexióval.`;
    this.lessonBlockTopicName = this.contextTopic.trim() || this.lessonBlockTopicName;
    this.lessonBlockLearningUnitName = this.contextLearningUnit.trim() || this.lessonBlockLearningUnitName;
    this.lessonBlockCurriculumName = this.contextCurriculum.trim() || this.lessonBlockCurriculumName;
    this.lessonBlockModuleName = this.contextModule.trim() || this.lessonBlockModuleName;
    this.lessonActivities = [
      { id: 'lesson-activity-1', title: 'Ráhangoló kérdés és előzetes becslés', minutes: 5, participation: 'required', resources: 'tábla vagy közös jegyzet' },
      { id: 'lesson-activity-2', title, minutes: activityMinutes, participation: 'required', resources: this.activityTypeLabel(this.selectedActivityType) },
      { id: 'lesson-activity-3', title: 'Bizonyítékok gyors megosztása', minutes: 10, participation: 'required', resources: this.stickerEvidence.trim() || 'bizonyíték' },
      { id: 'lesson-activity-4', title: 'Reflexió és következő kérdés', minutes: 10, participation: 'optional', resources: 'kilépőkártya' },
    ];
    this.syncLessonActivitiesToUnits();
  }

  close(): void {
    if (!this.saving()) {
      this.store.setWizardOpen(false);
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.saving.set(true);
    const mode = this.store.wizardMode();
    const ok =
      mode === 'sticker' ? await this.store.createSticker(this.toStickerPayload()) :
      mode === 'newVersion' ? await this.submitNewVersion() :
      mode === 'instanceSticker' ? await this.store.createInstanceSticker(this.toInstanceStickerPayload(), this.selectedInstanceStickerWeek()) :
      mode === 'instanceStickerEdit' ? await this.submitInstanceStickerEdit() :
      mode === 'template' ? await this.store.createTemplate(this.toTemplatePayload()) :
      mode === 'newTemplateVersion' ? await this.submitNewTemplateVersion() :
      await this.store.createInstance(this.selectedTemplateId()!, this.toInstancePayload());
    this.saving.set(false);

    if (ok) this.reset(mode);
  }

  private async submitNewVersion(): Promise<boolean> {
    const prefill = this.store.newVersionPrefill();
    if (!prefill) return false;
    // Editable fields come from the form; non-editable fields inherit the parent version's values
    // so a new version doesn't silently regress the unedited ones.
    const parent = prefill.latestVersion;
    const payload: CreateStickerPayload = {
      title: this.stickerTitle.trim(),
      phase: this.stickerPhase,
      shortDescription: this.stickerShort.trim(),
      studentInstruction: this.stickerInstruction.trim(),
      teacherSteps: parent.teacherSteps,
      studentChoice: parent.studentChoice,
      expectedProduct: parent.expectedProduct,
      evidenceTypeLabel: this.stickerEvidence.trim(),
      reflectionPrompt: parent.reflectionPrompt,
      bPlan: parent.bPlan,
      lowResource: parent.lowResource,
    };
    return await this.store.createStickerVersion(prefill.parentResourceId, payload);
  }

  private async submitNewTemplateVersion(): Promise<boolean> {
    const prefill = this.store.newTemplateVersionPrefill();
    if (!prefill) return false;
    return await this.store.createTemplateVersion(prefill.templateId, this.toTemplatePayload());
  }

  private async submitInstanceStickerEdit(): Promise<boolean> {
    const source = this.store.instanceStickerPrefill()?.source;
    if (!source) return false;
    return await this.store.forkInstanceSticker(source.id, this.toInstanceStickerPayload(), this.selectedInstanceStickerWeek());
  }

  private currentInstanceStickerWeek(): number {
    return Math.max(1, Number(this.store.album.currentWeek) || 1);
  }

  private coerceInstanceStickerWeek(value: number): number {
    const currentWeek = this.currentInstanceStickerWeek();
    const unitCount = Math.max(this.store.album.weekTitles.length, currentWeek);
    const week = Number(value) || currentWeek;
    return Math.min(Math.max(week, 1), unitCount);
  }

  private selectedInstanceStickerWeek(): number {
    this.instanceStickerWeek = this.coerceInstanceStickerWeek(this.instanceStickerWeek);
    return this.instanceStickerWeek;
  }

  private selectedStickerVersions(): string[] {
    if (this.selectedStickerVersionIds.size === 0) {
      return this.assignableStickers().map(item => item.latestVersionId);
    }
    return [...this.selectedStickerVersionIds];
  }

  private loadConceptOnboardingDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(CONCEPT_ONBOARDING_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  selectTemplatePattern(key: AlbumTemplatePatternKey): void {
    this.selectedPatternKey = key;
    const preset = this.templatePreset(key);
    this.templateTitle = preset.title;
    this.subject = preset.subject;
    this.grade = preset.grade;
    this.durationType = preset.durationType;
    this.drivingQuestion = preset.drivingQuestion;
    this.finalProduct = preset.finalProduct;
    this.audience = preset.audience;
    this.projectReflectionPrompts = [...(preset.projectReflectionPrompts ?? DEFAULT_PROJECT_REFLECTION_PROMPTS)];
    this.dispositions = preset.dispositions.join(', ');
    this.weekTitles = [...preset.weekTitles];
    if (this.lessonBuilderVisible()) {
      this.resetLessonActivities();
    }
    if (this.curriculumBuilderVisible()) {
      this.resetCurriculumModules();
    }
  }

  templateDrawerTitle(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'Új órai blokk'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'Új tantervi váz'
        : 'Új albumterv mintából';
  }

  headerPrimaryChipLabel(): string {
    if (this.store.wizardMode() === 'sticker') return 'Tevékenység';
    if (this.store.wizardMode() === 'template' && this.store.templateEntryContext() === 'lesson') return 'Blokk-vázlat';
    if (this.store.wizardMode() === 'template' && this.store.templateEntryContext() === 'curriculum') return 'Tantervi vázlat';
    if (this.store.wizardMode() === 'template') return 'Albumterv';
    return '';
  }

  headerBridgeLabel(): string {
    if (this.store.wizardMode() === 'sticker') return 'tevékenység (matrica) / album modell';
    if (this.store.wizardMode() === 'template' && this.store.templateEntryContext() === 'lesson') return 'blokk -> tanulási egység -> albumterv';
    if (this.store.wizardMode() === 'template' && this.store.templateEntryContext() === 'curriculum') return 'tanterv -> albumterv-vázlat';
    return 'albumterv / futó album modell';
  }

  templateEntryEyebrow(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'Kezdj egy órával'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'Kezdj egy tantervvel'
        : 'Kezdj egy tanulási úttal';
  }

  templateEntryTitle(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'Most egy kezelhető órai blokk vázlata készül.'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'Most egy magas szintű tantervi váz indul.'
        : 'Most egy újrafuttatható albumterv indul.';
  }

  templateEntryBody(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'A pilot fókusza 7-8. évfolyamos természettudomány: a rendszer ezt albumterv-vázlatként menti, hogy később kapcsolható legyen témakörhöz és tanulási egységhez.'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'A teljes tantervi hierarchia később kerül külön modellbe; ez a 7-8. évfolyamos természettudományi váz a pilotbiztos első tervezési felület.'
        : 'Az albumterv továbbra is kérdésből, bizonyítékokból, visszajelzésből és reflexióból épül, a pilotban 7-8. évfolyamos természettudományi helyzetekkel.';
  }

  templateTitleLabel(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'Blokk-vázlat címe'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'Tantervi vázlat címe'
        : 'Albumterv címe';
  }

  templateOutlineTitle(): string {
    return this.store.templateEntryContext() === 'lesson'
      ? 'Blokk tevékenységsora'
      : this.store.templateEntryContext() === 'curriculum'
        ? 'Mentési vázlat'
        : 'Albumvázlat';
  }

  primarySubmitLabel(): string {
    const mode = this.store.wizardMode();
    if (mode === 'sticker') return this.stickerEntryIsIdea() ? 'Tevékenység mentése' : 'Tevékenység létrehozása';
    if (mode === 'newVersion') return 'Új verzió mentése';
    if (mode === 'template') {
      return this.store.templateEntryContext() === 'lesson'
        ? 'Blokk-vázlat mentése'
        : this.store.templateEntryContext() === 'curriculum'
          ? 'Tantervi vázlat mentése'
          : 'Albumterv létrehozása';
    }
    if (mode === 'newTemplateVersion') return 'Új verzió mentése';
    if (mode === 'instanceSticker') return 'Hozzáadás futó albumhoz';
    if (mode === 'instanceStickerEdit') return 'Futó változat mentése';
    return 'Futó album indítása';
  }

  curriculumExampleModule(): string {
    return this.curriculumModules[0]?.title.trim() || 'Modul';
  }

  curriculumExampleTopic(): string {
    return this.curriculumModules[0]?.topics[0]?.trim() || 'Témakör';
  }

  curriculumExampleLearningUnit(): string {
    const topic = this.curriculumExampleTopic();
    return topic === 'Témakör' ? 'Tanulási egység' : `${topic} tanulási egység`;
  }

  templateUnitLabel(): string {
    if (this.store.wizardMode() === 'template' && this.lessonBuilderVisible()) return 'tevékenység';
    if (this.store.wizardMode() === 'template' && this.curriculumBuilderVisible()) return 'tanulási egység';
    return this.durationType === 'het' ? 'hét' : this.durationType === 'ora' ? 'óra' : 'fázis';
  }

  activityMetadataVisible(): boolean {
    return this.store.wizardMode() === 'sticker';
  }

  lessonBuilderVisible(): boolean {
    return this.store.templateEntryContext() === 'lesson';
  }

  curriculumBuilderVisible(): boolean {
    return this.store.templateEntryContext() === 'curriculum';
  }

  lessonTotalMinutes(): number {
    return this.lessonActivities.reduce((total, item) => total + this.coerceLessonMinutes(item.minutes), 0);
  }

  moveLessonActivity(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= this.lessonActivities.length) return;

    const next = [...this.lessonActivities];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    this.lessonActivities = next;
    this.syncLessonActivitiesToUnits();
  }

  addLessonActivity(): void {
    if (this.lessonActivities.length >= 5) return;

    this.lessonActivities = [
      ...this.lessonActivities,
      {
        id: `lesson-activity-${Date.now()}`,
        title: 'Új tevékenység',
        minutes: 5,
        participation: 'optional',
        resources: '',
      },
    ];
    this.syncLessonActivitiesToUnits();
  }

  removeLessonActivity(index: number): void {
    if (this.lessonActivities.length <= 3) return;

    this.lessonActivities = this.lessonActivities.filter((_, itemIndex) => itemIndex !== index);
    this.syncLessonActivitiesToUnits();
  }

  syncLessonActivitiesToUnits(): void {
    for (const activity of this.lessonActivities) {
      activity.minutes = this.coerceLessonMinutes(activity.minutes);
    }
    this.weekTitles = this.lessonActivities.map(activity => {
      const title = activity.title.trim() || 'Tevékenység';
      return `${title} (${activity.minutes} perc, ${this.lessonParticipationLabel(activity.participation)})`;
    });
  }

  addCurriculumModule(): void {
    this.curriculumModules = [
      ...this.curriculumModules,
      { id: `curriculum-module-${Date.now()}`, title: 'Új modul', topics: ['Új témakör'] },
    ];
    this.syncCurriculumModulesToUnits();
  }

  removeCurriculumModule(index: number): void {
    if (this.curriculumModules.length <= 1) return;
    this.curriculumModules = this.curriculumModules.filter((_, itemIndex) => itemIndex !== index);
    this.syncCurriculumModulesToUnits();
  }

  addCurriculumTopic(moduleIndex: number): void {
    this.curriculumModules = this.curriculumModules.map((module, index) =>
      index === moduleIndex ? { ...module, topics: [...module.topics, 'Új témakör'] } : module,
    );
    this.syncCurriculumModulesToUnits();
  }

  removeCurriculumTopic(moduleIndex: number, topicIndex: number): void {
    this.curriculumModules = this.curriculumModules.map((module, index) => {
      if (index !== moduleIndex || module.topics.length <= 1) return module;
      return { ...module, topics: module.topics.filter((_, itemIndex) => itemIndex !== topicIndex) };
    });
    this.syncCurriculumModulesToUnits();
  }

  syncCurriculumModulesToUnits(): void {
    this.weekTitles = this.curriculumModules
      .flatMap(module => module.topics.map(topic => `${module.title.trim() || 'Modul'} -> ${topic.trim() || 'Témakör'}`))
      .filter(Boolean);
  }

  private selectedPattern() {
    return this.templatePatterns.find(pattern => pattern.key === this.selectedPatternKey) ?? this.templatePatterns[0];
  }

  private defaultLessonActivities(): LessonActivityDraft[] {
    return [
      { id: 'lesson-activity-1', title: 'Ráhangoló kérdés és előzetes becslés', minutes: 5, participation: 'required', resources: 'tábla vagy közös jegyzet' },
      { id: 'lesson-activity-2', title: 'Mérés vagy megfigyelés csoportokban', minutes: 20, participation: 'required', resources: 'mérőeszköz, jegyzetlap' },
      { id: 'lesson-activity-3', title: 'Bizonyítékok rövid megosztása', minutes: 10, participation: 'optional', resources: 'csapatjegyzetek' },
      { id: 'lesson-activity-4', title: 'Kilépőkártya és reflexió', minutes: 10, participation: 'required', resources: 'kilépőkártya' },
    ];
  }

  private defaultCurriculumModules(): CurriculumModuleDraft[] {
    return [
      { id: 'curriculum-module-1', title: 'Mozgás és mérés', topics: ['Sebesség a hétköznapokban', 'Mérési módszerek összehasonlítása'] },
      { id: 'curriculum-module-2', title: 'Energia és környezet', topics: ['Energiaátalakulások megfigyelése', 'Fenntartható döntések az iskolában'] },
      { id: 'curriculum-module-3', title: 'Élő rendszerek', topics: ['Iskolaudvari mikroélőhelyek', 'Változás és alkalmazkodás'] },
    ];
  }

  private resetLessonActivities(): void {
    this.lessonActivities = this.defaultLessonActivities();
    this.syncLessonActivitiesToUnits();
  }

  private resetCurriculumModules(): void {
    this.curriculumModules = this.defaultCurriculumModules();
    this.syncCurriculumModulesToUnits();
  }

  private coerceLessonMinutes(value: number): number {
    const minutes = Number(value) || 1;
    return Math.min(90, Math.max(1, Math.round(minutes)));
  }

  lessonParticipationLabel(mode: LessonParticipationMode): string {
    switch (mode) {
      case 'optional': return 'választható';
      case 'extra': return 'extra';
      default: return 'kötelező';
    }
  }

  private prepareStickerEntry(context: StickerEntryContext): void {
    this.activityIdea = '';
    this.activityIdeaDrafted = false;
    this.selectedAdaptStickerId = '';
    if (context === 'idea' && !this.stickerEvidence.trim()) {
      this.stickerEvidence = 'Jegyzet + reflexió';
    }
  }

  private cleanActivityIdea(value: string): string {
    return value.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  }

  private capitalize(value: string): string {
    return value ? value.charAt(0).toLocaleUpperCase('hu-HU') + value.slice(1) : value;
  }

  private inferIdeaPhase(idea: string): PhaseId {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(mér|adat|kísérlet|teszt|épít|prototípus|sebesség)/.test(lower)) return 'cselekves';
    if (/(szerep|vita|érv|nézőpont|interjú)/.test(lower)) return 'kepzelet';
    if (/(reflex|bemutat|prezent|összeg)/.test(lower)) return 'reflexio';
    return 'kerdezes';
  }

  private inferIdeaEvidenceType(idea: string): string {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(mér|adat|sebesség|hőmér|kísérlet)/.test(lower)) return 'Mérési adatlap + rövid reflexió';
    if (/(fotó|kép|megfigyel)/.test(lower)) return 'Fotó + megfigyelési jegyzet';
    if (/(interjú|kérdés|vélemény)/.test(lower)) return 'Jegyzet + idézet + reflexió';
    return 'Rövid jegyzet + produktumfotó';
  }

  private inferIdeaMinutes(idea: string): number {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(bemutat|prezent|vita|érv)/.test(lower)) return 15;
    if (/(mér|kísérlet|épít|prototípus|terep)/.test(lower)) return 25;
    return 20;
  }

  private inferIdeaInteractionMode(idea: string): ActivityInteractionMode {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(vita|érv|nézőpont|szerep)/.test(lower)) return 'vita';
    if (/(épít|modell|poszter|prototípus)/.test(lower)) return 'alkotas';
    if (/(reflex|kilépő|összeg)/.test(lower)) return 'reflexio';
    if (/(gyakor|ismétl)/.test(lower)) return 'gyakorlas';
    return 'kutatas';
  }

  private inferIdeaContextMode(idea: string): ActivityContextMode {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(otthon|család|házi)/.test(lower)) return 'otthon';
    if (/(közösség|szülő|utca|település)/.test(lower)) return 'kozosseg';
    if (/(terep|udvar|kert|park|folyó)/.test(lower)) return 'terep';
    if (/(digit|online|videó|adatbázis)/.test(lower)) return 'digitalis';
    return 'iskola';
  }

  private inferIdeaContextNote(idea: string): string {
    const context = this.inferIdeaContextMode(idea);
    if (context === 'otthon') return 'otthoni megfigyelésből vagy családi tapasztalatból indul';
    if (context === 'kozosseg') return 'helyi közösségi tapasztalathoz kapcsolódik';
    if (context === 'terep') return 'iskolán kívüli vagy udvari terepi megfigyelés';
    if (context === 'digitalis') return 'digitális forrás vagy adat értelmezése';
    return 'iskolai környezetből induló megfigyelés';
  }

  private inferIdeaCompetencies(idea: string): string {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(mér|adat|sebesség|hőmér|kísérlet)/.test(lower)) return 'mérés, adatértelmezés, bizonyítékalapú érvelés';
    if (/(vita|érv|nézőpont|szerep)/.test(lower)) return 'nézőpontváltás, érvelés, kommunikáció';
    if (/(épít|modell|prototípus)/.test(lower)) return 'tervezés, alkotás, iteráció';
    return 'megfigyelés, kérdésalkotás, rövid reflexió';
  }

  private inferActivityType(idea: string): ActivityTypeId {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(mér|kísérlet|teszt|sebesség|hőmér|prototípus)/.test(lower)) return 'kiserletezo';
    if (/(cikk|videó|adat|infografika|forrás|elemz)/.test(lower)) return 'feldolgozo';
    if (/(vita|érv|prezent|interjú|magyaráz|bemutat)/.test(lower)) return 'kommunikacios';
    if (/(csoport|közös|szerep|együtt)/.test(lower)) return 'kollaborativ';
    if (/(reflex|napló|önértékel|visszatekint)/.test(lower)) return 'reflektiv';
    return 'felfedezo';
  }

  private inferIdeaTopic(idea: string): string {
    const lower = idea.toLocaleLowerCase('hu-HU');
    if (/(sebesség|mozgás|erő)/.test(lower)) return 'Mozgás és mérés';
    if (/(energia|hő|áram|fény)/.test(lower)) return 'Energia a hétköznapokban';
    if (/(növény|állat|élő|ökológ|környezet)/.test(lower)) return 'Élő környezet megfigyelése';
    if (/(víz|levegő|talaj|időjárás)/.test(lower)) return 'Környezet és fenntarthatóság';
    return 'Tanulói kérdésből induló témakör';
  }

  private activityTypeLabel(type: ActivityTypeId): string {
    return this.activityTypes.find(option => option.id === type)?.label ?? 'Felfedező';
  }

  private applyTemplateEntryPreset(context: TemplateEntryContext): void {
    this.selectTemplatePattern('altalanos');

    if (context === 'lesson') {
      this.templateTitle = 'Órai blokk: új tevékenységsor';
      this.subject = 'Integrált természettudomány';
      this.grade = '7-8. évfolyam';
      this.durationType = 'ora';
      this.drivingQuestion = 'Mit vizsgálunk meg ezen az órán?';
      this.finalProduct = 'Órai bizonyíték rövid megosztással és lezáró reflexióval.';
      this.audience = 'Osztálytársak';
      this.projectReflectionPrompts = [
        'Mi volt a legfontosabb megfigyelésetek ezen az órán?',
        'Melyik bizonyíték segített pontosítani a gondolkodásotokat?',
        'Mit vinnétek tovább a következő tanulási egységbe?',
      ];
      this.dispositions = 'kíváncsiság, együttműködés, pontos megfigyelés, reflexió';
      this.lessonBlockTopicName = 'Mozgás és mérés';
      this.lessonBlockLearningUnitName = 'Sebesség mérése a hétköznapokban';
      this.lessonBlockModuleName = 'Erők és kölcsönhatások';
      this.lessonBlockCurriculumName = '7-8. évfolyam természettudomány';
      this.lessonBlockReflectionPrompt = 'Melyik bizonyíték változtatta meg leginkább a gondolkodásotokat?';
      this.lessonBlockAlternativePath = 'Ha kevés az idő, a megosztás legyen kétperces csapatkör; ha van plusz idő, kérj összehasonlítást másik mérési módszerrel.';
      this.resetLessonActivities();
      return;
    }

    if (context === 'curriculum') {
      this.templateTitle = '7-8. évfolyam természettudomány tantervi váz';
      this.subject = 'Integrált természettudomány';
      this.grade = '7-8. évfolyam';
      this.durationType = 'het';
      this.drivingQuestion = 'Hogyan kapcsolódnak a témakörök a diákok hétköznapi tapasztalataihoz?';
      this.finalProduct = 'Tantervi portfólió témakörökkel, tanulási egységekkel és reflektív bizonyítékokkal.';
      this.audience = 'Szaktanárok, osztály és intézményi szakmai közösség';
      this.projectReflectionPrompts = [
        'Melyik témakör hozta a legerősebb bevonódást?',
        'Hol volt szükség adaptációra a csoport igényei miatt?',
        'Melyik tanulási egységet érdemes újrafuttatni vagy megosztani más tanárokkal?',
      ];
      this.dispositions = 'kíváncsiság, együttműködés, problémamegoldás, kommunikáció, reflektív tanulás';
      this.resetCurriculumModules();
    }
  }

  private templatePreset(key: AlbumTemplatePatternKey): CreateAlbumTemplatePayload {
    if (key === 'produktiv-hibazas') {
      return {
        title: 'Produktív hibázás album',
        subject: 'Matematika',
        grade: '8. évfolyam',
        durationType: 'fazis',
        patternKey: key,
        patternName: 'Produktív hibázás',
        patternDescription: 'Kihívó probléma, látható zsákutcák, tanári konszolidáció és újrapróba.',
        drivingQuestion: 'Mikor igazságos egy átlag, és mikor vezet félre?',
        finalProduct: 'Hibaelemző mini-portfólió javított megoldással és új helyzetben alkalmazott döntéssel.',
        audience: 'Osztálytársak és matematika tanár',
        projectReflectionPrompts: [
          'Mit gondoltatok először, és mi bizonyult félrevezetőnek?',
          'Melyik zsákutca segített abban, hogy pontosabb legyen a fogalom?',
          'Mit választanátok most másképp egy új adatsornál?',
        ],
        dispositions: ['kíváncsiság', 'hibatűrés', 'stratégia-váltás', 'bizonyítás', 'reflexió'],
        weekTitles: ['Kihívó probléma', 'Próbálkozás és stratégiaépítés', 'Hibák láthatóvá tétele', 'Tanári konszolidáció', 'Új helyzetben alkalmazás'],
      };
    }

    if (key === 'kutatas-bizonyitas') {
      return {
        title: 'Kutatás-bizonyítás album',
        subject: 'Integrált természettudomány',
        grade: '7-8. évfolyam',
        durationType: 'fazis',
        patternKey: key,
        patternName: 'Kutatás-bizonyítás',
        patternDescription: 'Kérdésből induló kutatás állítással, bizonyítékkal és indoklással.',
        drivingQuestion: 'Milyen bizonyítékkal tudunk meggyőző állítást tenni?',
        finalProduct: 'CER-poszter vagy rövid prezentáció állítással, bizonyítékkal, indoklással és revízióval.',
        audience: 'Osztálytársak és szaktanárok',
        projectReflectionPrompts: [
          'Melyik bizonyíték erősítette vagy gyengítette az első állításotokat?',
          'Hol kellett pontosítanotok az indoklást?',
          'Mitől lett meggyőzőbb a végső magyarázatotok?',
        ],
        dispositions: ['kérdezés', 'bizonyítékalapúság', 'érvelés', 'revízió'],
        weekTitles: ['Kutatási kérdés', 'Hipotézis', 'Adatgyűjtés', 'Állítás', 'Bizonyíték kiválasztása', 'Indoklás', 'Revízió'],
      };
    }

    return {
      title: 'Új albumterv',
      subject: 'Integrált természettudomány',
      grade: '7-8. évfolyam',
      durationType: 'het',
      patternKey: 'altalanos',
      patternName: 'Általános album',
      patternDescription: 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.',
      drivingQuestion: 'Mi a vezérkérdésünk?',
      finalProduct: '',
      audience: 'Osztálytársak és tanárok',
      projectReflectionPrompts: [...DEFAULT_PROJECT_REFLECTION_PROMPTS],
      dispositions: ['kíváncsiság', 'együttműködés', 'kitartás'],
      weekTitles: ['Kérdezés és ráhangolódás', 'Nézőpontok és tervezés', 'Alkotás és bizonyítékgyűjtés', 'Bemutatás és reflexió'],
    };
  }

  private toStickerPayload(): CreateStickerPayload {
    return {
      title: this.stickerTitle.trim(),
      phase: this.stickerPhase,
      shortDescription: this.stickerShort.trim(),
      studentInstruction: this.stickerInstruction.trim(),
      teacherSteps: [
        ...this.activityMetadataTeacherSteps(),
        'Mutasd be a célt.',
        'Adj választási lehetőséget.',
        'Zárd reflexióval.',
      ],
      studentChoice: 'A csapat dönthet a feldolgozás módjáról.',
      expectedProduct: this.stickerEvidence.trim(),
      evidenceTypeLabel: this.stickerEvidence.trim(),
      reflectionPrompt: 'Mi változott a gondolkodásotokban a feladat közben?',
      bPlan: 'Papíralapú vagy szóbeli változatban is futtatható.',
      lowResource: 'Eszközigénye alacsony, digitális eszköz nélkül is működik.',
    };
  }

  private toInstanceStickerPayload(): CreateStickerPayload {
    const source = this.store.instanceStickerPrefill()?.source;
    return {
      title: this.stickerTitle.trim(),
      phase: this.stickerPhase,
      shortDescription: this.stickerShort.trim(),
      studentInstruction: this.stickerInstruction.trim(),
      teacherSteps: source?.teacherSteps ?? ['Mutasd be a célt.', 'Adj választási lehetőséget.', 'Zárd reflexióval.'],
      studentChoice: source?.studentChoice ?? 'A csapat dönthet a feldolgozás módjáról.',
      expectedProduct: source?.expectedProduct ?? this.stickerEvidence.trim(),
      evidenceTypeLabel: this.stickerEvidence.trim(),
      reflectionPrompt: source?.reflection ?? 'Mi változott a gondolkodásotokban a feladat közben?',
      bPlan: source?.bPlan ?? 'Papíralapú vagy szóbeli változatban is futtatható.',
      lowResource: source?.lowResource ?? 'Eszközigénye alacsony, digitális eszköz nélkül is működik.',
    };
  }

  private activityMetadataTeacherSteps(): string[] {
    if (!this.activityMetadataVisible()) return [];

    const subjectGrade = [this.metadataSubject, this.metadataGrade].map(value => value.trim()).filter(Boolean).join(' / ');
    const inheritedContext = [
      this.contextCurriculum.trim() ? `Tanterv: ${this.contextCurriculum.trim()}` : '',
      this.contextModule.trim() ? `Modul: ${this.contextModule.trim()}` : '',
      this.contextTopic.trim() ? `Témakör: ${this.contextTopic.trim()}` : '',
      this.contextLearningUnit.trim() ? `Tanulási egység: ${this.contextLearningUnit.trim()}` : '',
      this.contextBlock.trim() ? `Blokk: ${this.contextBlock.trim()}` : '',
    ].filter(Boolean).join(' -> ');
    const lines = [
      `Tevékenységtípus: ${this.activityTypeLabel(this.selectedActivityType)}`,
      subjectGrade ? `Tervezési meta: ${subjectGrade}` : '',
      inheritedContext ? `Öröklött keret: ${inheritedContext}` : '',
      this.metadataCompetencies.trim() ? `Kompetenciák: ${this.metadataCompetencies.trim()}` : '',
      this.metadataNatLinks.trim() ? `NAT-kapcsolódás: ${this.metadataNatLinks.trim()}` : '',
      `Munkaforma: ${this.interactionModeLabel(this.metadataInteractionMode)}, ${this.participantModeLabel(this.metadataParticipantMode)}, kb. ${this.coerceLessonMinutes(this.metadataEstimatedMinutes)} perc`,
      `Valós kontextus: ${this.contextModeLabel(this.metadataContextMode)}${this.metadataContextNote.trim() ? ` - ${this.metadataContextNote.trim()}` : ''}`,
    ];

    return lines.filter(Boolean);
  }

  private interactionModeLabel(mode: ActivityInteractionMode): string {
    switch (mode) {
      case 'vita': return 'vita / érvelés';
      case 'alkotas': return 'alkotás / prototípus';
      case 'reflexio': return 'reflexió';
      case 'gyakorlas': return 'gyakorlás';
      default: return 'kutatás / megfigyelés';
    }
  }

  private participantModeLabel(mode: ActivityParticipantMode): string {
    switch (mode) {
      case 'egyeni': return 'egyéni munka';
      case 'paros': return 'páros munka';
      case 'teljes-osztaly': return 'teljes osztály';
      default: return 'csoportmunka';
    }
  }

  private contextModeLabel(mode: ActivityContextMode): string {
    switch (mode) {
      case 'otthon': return 'otthon';
      case 'kozosseg': return 'helyi közösség';
      case 'terep': return 'terep / iskolaudvar';
      case 'digitalis': return 'digitális forrás';
      default: return 'iskola';
    }
  }

  private toTemplatePayload(): CreateAlbumTemplatePayload {
    const pattern = this.selectedPattern();
    const finalProduct = this.templateFinalProduct();
    const reflectionPrompts = this.templateReflectionPrompts();
    return {
      title: this.templateTitle.trim(),
      subject: this.subject.trim(),
      grade: this.grade.trim(),
      durationType: this.durationType,
      patternKey: pattern.key,
      patternName: pattern.name,
      patternDescription: pattern.description,
      drivingQuestion: this.drivingQuestion.trim(),
      finalProduct,
      audience: this.audience.trim(),
      projectReflectionPrompts: reflectionPrompts,
      dispositions: this.dispositions.split(',').map(value => value.trim()).filter(Boolean),
      weekTitles: this.weekTitles.map(value => value.trim()).filter(Boolean),
    };
  }

  private templateFinalProduct(): string {
    const base = this.finalProduct.trim();
    if (this.lessonBuilderVisible()) {
      const context = [
        this.lessonBlockCurriculumName.trim() ? `Tanterv: ${this.lessonBlockCurriculumName.trim()}` : '',
        this.lessonBlockModuleName.trim() ? `Modul: ${this.lessonBlockModuleName.trim()}` : '',
        this.lessonBlockTopicName.trim() ? `Témakör: ${this.lessonBlockTopicName.trim()}` : '',
        this.lessonBlockLearningUnitName.trim() ? `Tanulási egység: ${this.lessonBlockLearningUnitName.trim()}` : '',
        this.templateTitle.trim() ? `Blokk: ${this.templateTitle.trim()}` : '',
      ].filter(Boolean).join(' -> ');
      const activityLines = this.lessonActivities.map((activity, index) =>
        `${index + 1}. ${activity.title.trim() || 'Tevékenység'} (${this.coerceLessonMinutes(activity.minutes)} perc, ${this.lessonParticipationLabel(activity.participation)}${activity.resources.trim() ? `, eszköz: ${activity.resources.trim()}` : ''})`,
      );
      return [
        base || 'Órai bizonyíték rövid megosztással és lezáró reflexióval.',
        context ? `Elhelyezési javaslat: ${context}` : '',
        'Órai blokk részletei:',
        ...activityLines,
        this.lessonBlockAlternativePath.trim() ? `Alternatív út: ${this.lessonBlockAlternativePath.trim()}` : '',
      ].filter(Boolean).join('\n');
    }

    if (this.curriculumBuilderVisible()) {
      const outline = this.curriculumModules
        .map(module => `${module.title.trim() || 'Modul'}: ${module.topics.map(topic => topic.trim()).filter(Boolean).join(', ')}`)
        .join('\n');
      return [
        base || 'Tantervi portfólió témakörökkel, tanulási egységekkel és reflektív bizonyítékokkal.',
        'Szerkeszthető modul/témakör előnézet:',
        outline,
      ].filter(Boolean).join('\n');
    }

    return base;
  }

  private templateReflectionPrompts(): string[] {
    if (this.lessonBuilderVisible()) {
      return [
        this.lessonBlockReflectionPrompt.trim() || 'Melyik bizonyíték változtatta meg leginkább a gondolkodásotokat?',
        ...this.projectReflectionPrompts,
      ];
    }
    return this.projectReflectionPrompts;
  }

  private toInstancePayload(): CreateAlbumInstancePayload {
    return {
      title: this.instanceTitle.trim(),
      className: this.className.trim(),
      teams: this.teamLines
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [name, focus, members] = line.split('|').map(part => part?.trim() ?? '');
          return {
            name: name || `Csapat ${index + 1}`,
            focus: focus || 'Saját fókusz',
            color: ['#7872d4', '#ef7c5b', '#5cb6a3', '#e5b653'][index % 4],
            members: (members || '').split(',').map(member => member.trim()).filter(Boolean),
          };
        }),
    };
  }

  private reset(mode: string): void {
    if (mode === 'sticker' || mode === 'newVersion' || mode === 'instanceSticker' || mode === 'instanceStickerEdit') {
      this.activityIdea = '';
      this.activityIdeaDrafted = false;
      this.resetActivityMetadata();
      this.stickerTitle = '';
      this.stickerShort = '';
      this.stickerInstruction = '';
      this.instanceStickerWeek = this.currentInstanceStickerWeek();
    }
    if (mode === 'template' || mode === 'newTemplateVersion') {
      this.templateTitle = '';
      this.drivingQuestion = '';
      this.finalProduct = '';
      this.projectReflectionPrompts = [...DEFAULT_PROJECT_REFLECTION_PROMPTS];
      this.selectedStickerVersionIds.clear();
      this.selectedAdaptTemplateId = '';
      this.selectedPatternKey = 'altalanos';
      this.lessonActivities = this.defaultLessonActivities();
      this.curriculumModules = this.defaultCurriculumModules();
    }
    if (mode === 'instance') {
      this.instanceTitle = '';
    }
  }

  private resetActivityMetadata(): void {
    this.selectedActivityType = 'felfedezo';
    this.metadataSubject = 'Integrált természettudomány';
    this.metadataGrade = '7-8. évfolyam';
    this.metadataCompetencies = 'megfigyelés, mérés, érvelés';
    this.metadataNatLinks = '';
    this.metadataInteractionMode = 'kutatas';
    this.metadataParticipantMode = 'csoportos';
    this.metadataEstimatedMinutes = 20;
    this.metadataContextMode = 'iskola';
    this.metadataContextNote = 'iskolai környezetből induló megfigyelés';
    this.contextCurriculum = '';
    this.contextModule = '';
    this.contextTopic = '';
    this.contextLearningUnit = '';
    this.contextBlock = '';
    this.selectedAdaptStickerId = '';
  }
}
