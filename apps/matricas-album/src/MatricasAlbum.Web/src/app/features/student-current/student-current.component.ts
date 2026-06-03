import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvidenceType } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { FieldComponent } from '../../shared/ui/field/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';
import { StatePillComponent } from '../../shared/ui/state-pill/state-pill.component';
import { StickerStampComponent } from '../../shared/ui/sticker-stamp/sticker-stamp.component';

type EvidenceFormControls = {
  title: FormControl<string>;
  description: FormControl<string>;
  helpRequested: FormControl<boolean>;
  helpRequest: FormControl<string>;
  reflection: FormControl<string>;
};
type EvidenceField = 'title' | 'description' | 'helpRequest' | 'reflection';

interface EvidencePlaceholders {
  title: string;
  description: string;
  helpRequest: string;
  reflection: string;
}

const DEFAULT_PLACEHOLDERS: EvidencePlaceholders = {
  title: 'Pl. „Térképrészlet és helyszínfotók"',
  description: 'Mit csináltatok, mit figyeltetek meg, milyen adatokat vagy érveket gyűjtöttetek?',
  helpRequest: 'Mit nem értetek, vagy hol kértek tanári segítséget? (Opcionális.)',
  reflection: 'Mit gondoltok másképp most, mint az elején?',
};

const PLACEHOLDERS_BY_TYPE: Record<string, EvidencePlaceholders> = {
  foto: {
    title: 'Pl. „Helyszínfotó - mérés közben"',
    description: 'Mit látunk a képen? Hol és mikor készült, és miért fontos a kutatáshoz?',
    helpRequest: 'Mit szeretnétek pontosabban megérteni a képen láthatókkal kapcsolatban?',
    reflection: 'A fotó alapján mit gondoltok másképp, mint korábban?',
  },
  meres: {
    title: 'Pl. „Hőmérséklet-mérés - 3 helyszín"',
    description: 'Mit, hol és mikor mértetek? Milyen eszközzel? Milyen számokat kaptatok?',
    helpRequest: 'Bizonytalanok vagytok a mérés pontosságában vagy a módszerben?',
    reflection: 'A mérés milyen várt vagy meglepő összefüggést mutatott?',
  },
  jegyzet: {
    title: 'Pl. „Interjú-összefoglaló - tanári kar"',
    description: 'Mit írtatok le? Kihez kapcsolódik, és miért gyűjtöttétek össze?',
    helpRequest: 'Mit nem értetek a forrásokban vagy a megfigyelésekben?',
    reflection: 'Mit emelnétek ki a jegyzetből, ami megváltoztatta a gondolkodásotokat?',
  },
  prezentacio: {
    title: 'Pl. „Mini-prezentáció - érvek és vizuális"',
    description: 'Milyen szerkezetet választottatok, és mi a legfontosabb állítás vagy érv?',
    helpRequest: 'Hol kértek tanári visszajelzést a prezentáció szerkezetére?',
    reflection: 'Melyik részen volt a legnehezebb döntés, és miért?',
  },
};

function placeholdersFor(evidenceType: string | undefined): EvidencePlaceholders {
  if (!evidenceType) return DEFAULT_PLACEHOLDERS;
  const normalized = evidenceType.toLowerCase();
  if (PLACEHOLDERS_BY_TYPE[normalized]) return PLACEHOLDERS_BY_TYPE[normalized];
  if (normalized.includes('fotó')) return PLACEHOLDERS_BY_TYPE['foto'];
  if (normalized.includes('mérés') || normalized.includes('adat')) return PLACEHOLDERS_BY_TYPE['meres'];
  if (normalized.includes('prezent')) return PLACEHOLDERS_BY_TYPE['prezentacio'];
  return DEFAULT_PLACEHOLDERS;
}

interface StudentQuestionCard {
  /** Unique key per question: `${adviceId}::${index}` — used for dismissal persistence. */
  readonly key: string;
  readonly text: string;
}

const DISMISSED_QUESTIONS_STORAGE_KEY = 'student-dismissed-questions-v1';

@Component({
  selector: 'ma-student-current',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BtnComponent, ChipComponent, FieldComponent, IconComponent,
    PhaseChipComponent, StatePillComponent, StickerStampComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-current.component.html',
  styleUrl: '../student-album/student-album.component.scss',
})
export class StudentCurrentComponent {
  readonly store = inject(AlbumStore);

  readonly active = this.store.currentStickerForStudent;
  readonly team = this.store.selectedStudentTeam;
  readonly activeProgress = this.store.currentStudentProgress;

  /** Dismissed-question keys, persisted in localStorage so closing a card sticks across refreshes. */
  readonly dismissedKeys = signal<ReadonlySet<string>>(this.loadDismissedKeys());
  private readonly lastAdviceContext = signal<string | null>(null);

  /** One card per AI-generated question, with dismissed ones filtered out. */
  readonly visibleQuestionCards = computed<StudentQuestionCard[]>(() => {
    const dismissed = this.dismissedKeys();
    const cards: StudentQuestionCard[] = [];
    for (const advice of this.store.studentAdvices()) {
      const questions = advice.questions ?? [];
      questions.forEach((text, index) => {
        const key = `${advice.id}::${index}`;
        if (!dismissed.has(key)) cards.push({ key, text });
      });
    }
    return cards;
  });

  /** Count of dismissed-but-still-present cards so we can offer a "show all again" affordance. */
  readonly dismissedVisibleCount = computed(() => {
    const dismissed = this.dismissedKeys();
    let count = 0;
    for (const advice of this.store.studentAdvices()) {
      const questions = advice.questions ?? [];
      questions.forEach((_, index) => {
        if (dismissed.has(`${advice.id}::${index}`)) count += 1;
      });
    }
    return count;
  });

  constructor() {
    effect(() => {
      const context = `${this.team()?.id ?? 'no-team'}::${this.active()?.id ?? 'no-sticker'}`;
      const previous = this.lastAdviceContext();
      if (previous === null) {
        this.lastAdviceContext.set(context);
        return;
      }
      if (previous !== context) {
        this.store.clearStudentAdvice();
        this.dismissedKeys.set(new Set());
        this.persistDismissedKeys(new Set());
        this.lastAdviceContext.set(context);
      }
    });
  }

  dismissQuestion(key: string): void {
    const next = new Set(this.dismissedKeys());
    next.add(key);
    this.dismissedKeys.set(next);
    this.persistDismissedKeys(next);
  }

  restoreAllQuestions(): void {
    this.dismissedKeys.set(new Set());
    this.persistDismissedKeys(new Set());
  }

  private loadDismissedKeys(): ReadonlySet<string> {
    if (typeof localStorage === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(DISMISSED_QUESTIONS_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  private persistDismissedKeys(keys: ReadonlySet<string>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(DISMISSED_QUESTIONS_STORAGE_KEY, JSON.stringify([...keys]));
    } catch {
      // Quota / private mode — ignore.
    }
  }

  readonly evidenceForm = new FormGroup<EvidenceFormControls>({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    helpRequested: new FormControl(false, { nonNullable: true }),
    helpRequest: new FormControl('', { nonNullable: true }),
    reflection: new FormControl('', { nonNullable: true }),
  });
  readonly evidenceFormSubmitted = signal(false);

  readonly placeholders = computed(() => placeholdersFor(this.active()?.evidenceType));

  banner() {
    const active = this.active();
    if (!active) return { tone: 'info', icon: 'info', msg: 'Nincs aktív matrica.' };

    const progress = this.activeProgress();
    const progressState = progress?.state ?? null;

    if (progressState === 'varakozik') return { tone: 'warning', icon: 'schedule', msg: 'Beküldtétek, a tanár áttekinti és visszajelzést ír.' };
    if (progressState === 'javitas') return { tone: 'warning', icon: 'redo', msg: 'A tanári visszajelzés alapján egy ponton újabb gondolatot kérünk.' };
    if (progressState === 'elkeszult' || progressState === 'reflektalt') return { tone: 'success', icon: 'check', msg: 'Lezárt matrica - nézzétek meg a portfólióban.' };

    if (active.state === 'tervezett') return { tone: 'info', icon: 'lock', msg: 'Ez a matrica még nem aktív. A tanár nyitja meg a megfelelő időben.' };
    return { tone: 'primary', icon: 'play_arrow', msg: 'Ez a matrica most aktív. Töltsétek fel a bizonyítékot, ha elkészültetek.' };
  }

  isEvidenceFieldInvalid(field: EvidenceField): boolean {
    const control = this.evidenceForm.controls[field];
    return control.invalid && (control.touched || this.evidenceFormSubmitted());
  }

  askTeacher(): void {
    this.evidenceForm.controls.helpRequested.setValue(true);
    this.store.setEvidenceFlowOpen(true);
    this.store.showToast('Segítségkérés bejelölve a beküldésben.', 'support_agent');
  }

  async submitEvidence(): Promise<void> {
    const sticker = this.active();
    const team = this.team();
    if (!sticker || !team) return;
    this.evidenceFormSubmitted.set(true);
    this.evidenceForm.markAllAsTouched();
    if (this.evidenceForm.invalid) return;

    const form = this.trimmedEvidenceForm();

    await this.store.submitEvidence({
      stickerId: sticker.id,
      teamId: team.id,
      type: this.inferEvidenceType(sticker.evidenceType),
      title: form.title,
      description: form.description,
      helpRequest: form.helpRequest || null,
      helpRequested: form.helpRequested,
      reflection: form.reflection || null,
    });
    this.evidenceFormSubmitted.set(false);
    this.evidenceForm.reset({ title: '', description: '', helpRequest: '', reflection: '', helpRequested: false });
  }

  private trimmedEvidenceForm() {
    const value = this.evidenceForm.getRawValue();
    return {
      title: value.title.trim(),
      description: value.description.trim(),
      helpRequested: value.helpRequested,
      helpRequest: value.helpRequest.trim(),
      reflection: value.reflection.trim(),
    };
  }

  private inferEvidenceType(label: string): EvidenceType {
    const normalized = label.toLowerCase();
    if (normalized.includes('fotó')) return 'foto';
    if (normalized.includes('mérés') || normalized.includes('adat')) return 'meres';
    if (normalized.includes('prezent')) return 'prezentacio';
    return 'jegyzet';
  }
}
