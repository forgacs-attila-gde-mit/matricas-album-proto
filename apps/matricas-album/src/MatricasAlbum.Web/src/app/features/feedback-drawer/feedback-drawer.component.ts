import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DraftFeedbackAdviceActionPayload } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { EvidenceAttachmentComponent } from '../../shared/attachments/evidence-attachment.component';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent, ChipTone } from '../../shared/ui/chip/chip.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { FieldComponent } from '../../shared/ui/field/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TeamChipComponent } from '../../shared/ui/team-chip/team-chip.component';

type NextStep = 'javitas' | 'lezar' | 'megj';
export type FeedbackDrawerMode = 'teacher' | 'student';

interface StatusChip {
  tone: ChipTone;
  icon: string;
  label: string;
}

@Component({
  selector: 'ma-feedback-drawer',
  standalone: true,
  imports: [
    FormsModule,
    AiCardComponent, BtnComponent, ChipComponent, DrawerComponent,
    EvidenceAttachmentComponent, FieldComponent, IconComponent, TeamChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-drawer.component.html',
  styleUrl: './feedback-drawer.component.scss',
})
export class FeedbackDrawerComponent {
  readonly store = inject(AlbumStore);
  readonly mode = input<FeedbackDrawerMode>('teacher');
  readonly evidence = this.store.activeEvidence;
  readonly open = computed(() => this.evidence() !== null);

  readonly feedback = signal(
    'Jó megfigyelés, hogy nem csak az árnyékot, hanem a burkolatot is figyeltétek. ' +
    'A következő körben írjátok le pontosabban, mikor mértetek, és ugyanazzal az eszközzel ' +
    'mértetek-e mindkét helyen.'
  );
  readonly nextStep = signal<NextStep>('javitas');

  readonly team = computed(() => {
    const evidence = this.evidence();
    return evidence ? this.store.teams.find(team => team.id === evidence.teamId) ?? null : null;
  });

  readonly sticker = computed(() => {
    const evidence = this.evidence();
    return evidence ? this.store.stickers().find(sticker => sticker.id === evidence.stickerId) ?? null : null;
  });

  readonly progress = computed(() => {
    const evidence = this.evidence();
    if (!evidence) return null;
    return this.store.progressFor(evidence.stickerId, evidence.teamId);
  });

  readonly statusChip = computed<StatusChip>(() => {
    const state = this.progress()?.state ?? this.evidence()?.status ?? 'varakozik';
    switch (state) {
      case 'javitas':    return { tone: 'warning', icon: 'redo', label: 'Javítás kérve' };
      case 'elkeszult':  return { tone: 'success', icon: 'check', label: 'Lezárt' };
      case 'reflektalt': return { tone: 'success', icon: 'task_alt', label: 'Lezárt, reflektálva' };
      default:           return { tone: 'warning', icon: 'schedule', label: 'Visszajelzésre vár' };
    }
  });

  readonly canArchive = computed(() => {
    const evidence = this.evidence();
    return this.mode() === 'teacher' && !!evidence && !evidence.teacherFeedback;
  });

  readonly evidenceAdvice = computed(() => {
    const evidence = this.evidence();
    if (!evidence) return null;
    return this.store.teacherAdvices().find(advice =>
      advice.targetType === 'evidence'
      && advice.targetId === evidence.id
      && advice.status !== 'elutasitott'
      && advice.status !== 'hibas'
    ) ?? null;
  });

  readonly evidenceAdviceDraft = computed(() => {
    const payload = this.evidenceAdvice()?.action?.payload as Partial<DraftFeedbackAdviceActionPayload> | undefined;
    return typeof payload?.draft === 'string' && payload.draft.trim() ? payload.draft.trim() : null;
  });

  constructor() {
    effect(() => {
      this.evidence();
      const draft = this.store.feedbackDraft();
      if (draft) {
        this.feedback.set(draft);
        this.store.setFeedbackDraft(null);
      }
      this.nextStep.set('javitas');
    });
  }

  close(): void { this.store.openEvidence(null); }

  setNextStep(step: NextStep): void { this.nextStep.set(step); }
  updateFeedback(value: string): void { this.feedback.set(value); }

  async refreshAiDraft(): Promise<void> {
    const evidence = this.evidence();
    if (!evidence) return;
    await this.store.requestEvidenceFeedbackDraft(evidence.id);
  }

  async applyAiDraft(): Promise<void> {
    const advice = this.evidenceAdvice();
    if (!advice?.action || advice.action.type !== 'draftFeedback') return;
    await this.store.applyAdvice(advice.id);
  }

  async send(): Promise<void> {
    const evidence = this.evidence();
    if (!evidence) return;

    const status = this.nextStep() === 'javitas' ? 'javitas' : 'elkeszult';
    await this.store.submitFeedback(evidence.id, this.feedback(), status);
    this.close();
  }

  async archive(): Promise<void> {
    const evidence = this.evidence();
    if (!evidence) return;
    await this.store.archiveEvidence(evidence.id);
  }
}
