import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiCitation, CreateStickerAdviceActionPayload, DraftFeedbackAdviceActionPayload } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { normalizePhase } from '../../core/tokens/phases';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';

@Component({
  selector: 'ma-ai-advice-drawer',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, DrawerComponent, IconComponent, PhaseChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-advice-drawer.component.html',
  styleUrl: './ai-advice-drawer.component.scss',
})
export class AiAdviceDrawerComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  readonly advice = this.store.activeAdvice;
  readonly stickerDraft = signal<CreateStickerAdviceActionPayload | null>(null);
  readonly feedbackDraft = signal<DraftFeedbackAdviceActionPayload | null>(null);
  readonly reviewConfirmed = signal(false);

  constructor() {
    effect(() => {
      const advice = this.advice();
      this.reviewConfirmed.set(false);
      if (advice?.action?.type === 'createSticker') {
        this.stickerDraft.set(this.toStickerPayload(advice.action.payload));
        this.feedbackDraft.set(null);
      } else if (advice?.action?.type === 'draftFeedback') {
        this.feedbackDraft.set(this.toFeedbackPayload(advice.action.payload));
        this.stickerDraft.set(null);
      } else {
        this.stickerDraft.set(null);
        this.feedbackDraft.set(null);
      }
    });
  }

  close(): void { this.store.closeAdvice(); }

  openCitation(citation: AiCitation): void {
    const topic = helpTopicForSourceId(citation.sourceId);
    this.close();
    void this.router.navigate(['/teacher/help'], topic ? { queryParams: { topic } } : undefined);
  }

  citationPreview(citation: AiCitation): HelpTopicPreview {
    return helpTopicPreviewForSourceId(citation.sourceId) ?? {
      title: citation.label,
      description: 'Kapcsolódó módszertani súgófejezet. Kattintással megnyitható a Pedagógiai súgóban.',
    };
  }

  canApply(): boolean {
    const advice = this.advice();
    if (!advice || !this.reviewConfirmed()) return false;
    // Action-less advice (plain "Tanári tanács" with no createSticker / draftFeedback payload)
    // is accepted by ticking the checkbox + clicking Véglegesítés — nothing to draft.
    if (!advice.action) return true;
    if (advice.action.type === 'createSticker') return this.stickerDraft() !== null;
    if (advice.action.type === 'draftFeedback') return this.feedbackDraft() !== null;
    return false;
  }

  setReviewConfirmed(value: boolean): void {
    this.reviewConfirmed.set(value);
  }

  update<K extends keyof CreateStickerAdviceActionPayload>(key: K, value: CreateStickerAdviceActionPayload[K]): void {
    const current = this.stickerDraft();
    if (!current) return;
    this.stickerDraft.set({ ...current, [key]: value });
  }

  updateStep(index: number, value: string): void {
    const current = this.stickerDraft();
    if (!current) return;
    const steps = current.teacherSteps.slice();
    steps[index] = value;
    this.stickerDraft.set({ ...current, teacherSteps: steps });
  }

  addStep(): void {
    const current = this.stickerDraft();
    if (!current) return;
    this.stickerDraft.set({ ...current, teacherSteps: [...current.teacherSteps, ''] });
  }

  removeStep(index: number): void {
    const current = this.stickerDraft();
    if (!current) return;
    this.stickerDraft.set({ ...current, teacherSteps: current.teacherSteps.filter((_, i) => i !== index) });
  }

  updateFeedbackDraft(value: string): void {
    const current = this.feedbackDraft();
    if (!current) return;
    this.feedbackDraft.set({ ...current, draft: value });
  }

  async apply(): Promise<void> {
    const advice = this.advice();
    if (!advice || !this.canApply()) return;
    if (advice.action?.type === 'createSticker' && this.stickerDraft()) {
      await this.store.applyAdvice(advice.id, this.stickerDraft()!);
      return;
    }
    if (advice.action?.type === 'draftFeedback' && this.feedbackDraft()) {
      await this.store.applyAdvice(advice.id, this.feedbackDraft()!);
      return;
    }
    // Action-less advice: nothing to apply server-side beyond marking it accepted.
    await this.store.setAdviceStatus(advice.id, 'elfogadott');
    this.close();
  }

  private toStickerPayload(value: Record<string, unknown>): CreateStickerAdviceActionPayload {
    return {
      title: this.asString(value['title'], 'AI mikro-matrica'),
      phase: normalizePhase(this.asString(value['phase'], 'cselekves')),
      shortDescription: this.asString(value['shortDescription']),
      studentInstruction: this.asString(value['studentInstruction']),
      teacherSteps: Array.isArray(value['teacherSteps']) ? value['teacherSteps'].map(step => String(step)) : [],
      studentChoice: this.asString(value['studentChoice']),
      expectedProduct: this.asString(value['expectedProduct']),
      evidenceTypeLabel: this.asString(value['evidenceTypeLabel'], 'Rövid bizonyíték'),
      reflectionPrompt: this.asString(value['reflectionPrompt']),
      bPlan: this.asString(value['bPlan']),
      lowResource: this.asString(value['lowResource']),
      week: this.asNumber(value['week']) ?? this.store.album.currentWeek,
      sortOrder: this.asNumber(value['sortOrder']),
    };
  }

  private toFeedbackPayload(value: Record<string, unknown>): DraftFeedbackAdviceActionPayload {
    return {
      evidenceId: this.asString(value['evidenceId']),
      draft: this.asString(value['draft']),
    };
  }

  private asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
}

const HELP_TOPIC_BY_SOURCE_ID: Record<string, string> = {
  'album-mint-tanulasi-ut': 'album-ut',
  'vezerkerdes-produktum-kozonseg': 'vezerkerdes',
  'matrica-anatomia': 'matrica',
  'tanulasi-bizonyitek-es-portfolio': 'bizonyitek',
  'visszajelzes-es-revizio': 'feedback',
  'kerdezes-es-kutatas': 'kutatas',
  'alkotas-es-nyilvanossag': 'alkotas',
  'csapatmunka-es-szerepek': 'csapat',
  'differencialas-albumon-belul': 'differencialas',
  'reflexio-es-gondolkodasvaltozas': 'reflexio',
  'tanari-facilitalas': 'facilitalas',
  'minosegi-ellenorzo': 'minoseg',
};

interface HelpTopicPreview {
  readonly title: string;
  readonly description: string;
}

const HELP_TOPIC_PREVIEW_BY_SOURCE_ID: Record<string, HelpTopicPreview> = {
  'album-mint-tanulasi-ut': {
    title: 'Az album mint tanulási út',
    description: 'Hogyan áll össze az album kérdésekből, bizonyítékokból, döntésekből és reflexiókból követhető tanulási úttá.',
  },
  'vezerkerdes-produktum-kozonseg': {
    title: 'Vezérkérdés, produktum, közönség',
    description: 'Hogyan kapcsolódik össze a nyitott vezérkérdés, a bizonyítékokra épülő produktum és a valódi közönség.',
  },
  'matrica-anatomia': {
    title: 'A matrica anatómiája',
    description: 'Mitől lesz egy matrica lezárt tanulási epizód: cselekvés, döntés, bizonyíték és reflexió együtt.',
  },
  'tanulasi-bizonyitek-es-portfolio': {
    title: 'Tanulási bizonyíték és portfólió',
    description: 'Hogyan teszi láthatóvá a bizonyíték a gondolkodást, és hogyan rendezhető ebből értelmes portfólió.',
  },
  'visszajelzes-es-revizio': {
    title: 'Visszajelzés és revízió',
    description: 'Hogyan lesz a visszajelzésből javítható következő lépés, nem csak lezáró tanári megjegyzés.',
  },
  'kerdezes-es-kutatas': {
    title: 'Kérdezés és kutatás',
    description: 'Hogyan pontosodnak a tanulói kérdések megfigyelés, mérés, forráshasználat és saját bizonyítékok alapján.',
  },
  'alkotas-es-nyilvanossag': {
    title: 'Alkotás és nyilvánosság',
    description: 'Hogyan válik a produktum mások számára is érthető, bizonyítékokra épülő tanulási eredménnyé.',
  },
  'csapatmunka-es-szerepek': {
    title: 'Csapatmunka és szerepek',
    description: 'Hogyan tehetők láthatóvá a csapaton belüli döntések, szerepek és egyéni hozzájárulások.',
  },
  'differencialas-albumon-belul': {
    title: 'Differenciálás albumon belül',
    description: 'Hogyan adható többféle út ugyanazon albumívben úgy, hogy a közös tanulási cél megmaradjon.',
  },
  'reflexio-es-gondolkodasvaltozas': {
    title: 'Reflexió és gondolkodásváltozás',
    description: 'Hogyan látszik a tanulók gondolkodásának változása bizonyítékok, javítások és nyitott kérdések mentén.',
  },
  'tanari-facilitalas': {
    title: 'Tanári facilitálás',
    description: 'Hogyan ad keretet a tanár úgy, hogy a tanulói döntések felelőssége és önállósága megmaradjon.',
  },
  'minosegi-ellenorzo': {
    title: 'Album minőségellenőrző',
    description: 'Milyen szempontok jelzik, hogy az album valódi tanulási bizonyítékokat és tartható munkamenetet hoz létre.',
  },
};

function helpTopicForSourceId(sourceId: string): string | null {
  return HELP_TOPIC_BY_SOURCE_ID[sourceId] ?? null;
}

function helpTopicPreviewForSourceId(sourceId: string): HelpTopicPreview | null {
  return HELP_TOPIC_PREVIEW_BY_SOURCE_ID[sourceId] ?? null;
}
