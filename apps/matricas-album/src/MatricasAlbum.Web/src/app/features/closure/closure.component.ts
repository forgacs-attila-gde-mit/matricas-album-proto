import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Team } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { phaseInfo } from '../../core/tokens/phases';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { EvidenceCardComponent } from '../../shared/ui/evidence-card/evidence-card.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface TeamReflectionBlock {
  team: Team;
  text: string | null;
  updatedAt: string | null;
}

interface LearningLoopSnapshotItem {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly helper: string;
}

interface PilotObservationDraft {
  readonly engagementSignals?: string;
  readonly adaptationNotes?: string;
  readonly nextStep?: string;
  readonly updatedAt?: string;
}

interface PilotObservationBridge {
  readonly count: number;
  readonly engagementSignals: string;
  readonly adaptationNotes: string;
  readonly nextSteps: string;
  readonly updatedAt: string | null;
}

@Component({
  selector: 'ma-closure',
  standalone: true,
  imports: [FormsModule, AiCardComponent, BtnComponent, ChipComponent, EvidenceCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './closure.component.html',
  styleUrl: './closure.component.scss',
})
export class ClosureComponent {
  readonly store = inject(AlbumStore);
  readonly phaseInfo = phaseInfo;
  readonly effectLogSaving = signal(false);
  readonly workedWell = signal('');
  readonly engagementSignals = signal('');
  readonly adaptationNotes = signal('');
  readonly reuseNextTime = signal('');
  readonly pilotObservationBridge = signal<PilotObservationBridge | null>(null);

  readonly learningLoopSnapshotItems = computed<LearningLoopSnapshotItem[]>(() => {
    const stickers = this.store.stickers().filter(sticker => !sticker.deprecated);
    const evidence = this.store.evidence().filter(item => !item.archivedAt);
    const helpRequests = this.store.helpRequests();
    const progressRows = this.store.teamProgress();
    const teamReflections = this.store.teamReflections();
    const checklist = this.store.closureChecklist();
    const teacherEffectLog = this.store.teacherEffectLog();

    const activeStickers = stickers.filter(sticker => sticker.state === 'aktiv').length;
    const closedStickers = stickers.filter(sticker => sticker.state === 'elkeszult' || sticker.state === 'reflektalt').length;
    const pendingEvidence = evidence.filter(item => item.status === 'varakozik').length;
    const openHelpRequests = helpRequests.filter(request => !request.resolvedAt).length;
    const feedbackCount = evidence.filter(item => !!item.teacherFeedback?.trim()).length;
    const revisionSignals = progressRows.filter(row => row.state === 'javitas').length;
    const stickerReflections = progressRows.filter(row => !!row.reflection?.trim()).length;
    const checklistDone = checklist.filter(item => item.done).length;

    return [
      {
        icon: 'map',
        label: 'Matricák állapota',
        value: `${activeStickers} aktív / ${closedStickers} lezárt`,
        helper: `${stickers.length} matrica látszik az albumtérképen.`,
      },
      {
        icon: 'upload_file',
        label: 'Bizonyítékok',
        value: `${evidence.length} beadás`,
        helper: pendingEvidence > 0 ? `${pendingEvidence} beadás vár tanári visszajelzésre.` : 'Nincs visszajelzésre váró beadás.',
      },
      {
        icon: 'support_agent',
        label: 'Segítségkérések',
        value: `${helpRequests.length} jelzés`,
        helper: openHelpRequests > 0 ? `${openHelpRequests} nyitott tanári beavatkozási pont.` : 'Nincs nyitott segítségkérés.',
      },
      {
        icon: 'redo',
        label: 'Visszajelzés és revízió',
        value: `${feedbackCount} visszajelzés / ${revisionSignals} revízió`,
        helper: 'A tanári visszacsatolás és javítási körök látható jelei.',
      },
      {
        icon: 'self_improvement',
        label: 'Reflexiók',
        value: `${teamReflections.length}/${this.store.teams.length} csapat`,
        helper: `${stickerReflections} matrica-szintű reflexió rögzült.`,
      },
      {
        icon: 'checklist',
        label: 'Záró checklist',
        value: checklist.length > 0 ? `${checklistDone}/${checklist.length} kész` : '0 elem',
        helper: checklist.length > 0 ? 'A záró bemutató előkészítettsége.' : 'Ehhez a futtatáshoz még nincs checklist.',
      },
      {
        icon: 'edit_note',
        label: 'Tanári hatásnapló',
        value: teacherEffectLog ? 'Rögzítve' : 'Hiányzik',
        helper: teacherEffectLog ? 'A tanári utóreflexió pilot-adatként mentve van.' : 'A tanári utóreflexió még nincs rögzítve.',
      },
    ];
  });

  /** One block per team with the team's project reflection text (or null if not yet written). */
  readonly teamReflections = computed<TeamReflectionBlock[]>(() => {
    const reflections = this.store.teamReflections();
    return this.store.teams.map(team => {
      const row = reflections.find(r => r.teamId === team.id) ?? null;
      return { team, text: row?.text ?? null, updatedAt: row?.updatedAt ?? null };
    });
  });

  constructor() {
    effect(() => {
      const log = this.store.teacherEffectLog();
      this.workedWell.set(log?.workedWell ?? '');
      this.engagementSignals.set(log?.engagementSignals ?? '');
      this.adaptationNotes.set(log?.adaptationNotes ?? '');
      this.reuseNextTime.set(log?.reuseNextTime ?? '');
    });

    effect(() => {
      this.store.activeInstanceId();
      this.pilotObservationBridge.set(this.loadPilotObservationBridge());
    });
  }

  toggleChecklistItem(itemId: string, currentDone: boolean): void {
    void this.store.toggleClosureChecklistItem(itemId, !currentDone);
  }

  async saveTeacherEffectLog(): Promise<void> {
    if (this.effectLogSaving()) return;
    this.effectLogSaving.set(true);
    await this.store.saveTeacherEffectLog({
      workedWell: this.workedWell().trim(),
      engagementSignals: this.engagementSignals().trim(),
      adaptationNotes: this.adaptationNotes().trim(),
      reuseNextTime: this.reuseNextTime().trim(),
    });
    this.effectLogSaving.set(false);
  }

  requestClosureSynthesis(): void {
    void this.store.requestClosureSynthesis();
  }

  applyPilotObservationsToEffectLog(): void {
    const bridge = this.pilotObservationBridge();
    if (!bridge) return;

    this.engagementSignals.set(this.mergeEffectLogText(this.engagementSignals(), bridge.engagementSignals));
    this.adaptationNotes.set(this.mergeEffectLogText(this.adaptationNotes(), bridge.adaptationNotes));
    this.reuseNextTime.set(this.mergeEffectLogText(this.reuseNextTime(), bridge.nextSteps));
    this.store.showToast('Heti pilot-megfigyelések beemelve a hatásnaplóba.', 'edit_note');
  }

  teacherEffectLogUpdatedLabel(): string | null {
    const updatedAt = this.store.teacherEffectLog()?.updatedAt;
    if (!updatedAt) return null;
    return new Intl.DateTimeFormat('hu-HU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  }

  pilotObservationBridgeUpdatedLabel(): string | null {
    const updatedAt = this.pilotObservationBridge()?.updatedAt;
    if (!updatedAt) return null;
    return new Intl.DateTimeFormat('hu-HU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  }

  private loadPilotObservationBridge(): PilotObservationBridge | null {
    if (typeof localStorage === 'undefined') return null;
    const instanceId = this.store.activeInstanceId() ?? 'mock-instance';
    const prefix = `matricas-album:pilot-observation:v1:${instanceId}:`;
    const observations: Array<{ unit: number; draft: PilotObservationDraft }> = [];

    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith(prefix)) continue;
        const unit = Number(key.slice(prefix.length)) || 1;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const draft = JSON.parse(raw) as PilotObservationDraft;
        if (!draft.engagementSignals?.trim() && !draft.adaptationNotes?.trim() && !draft.nextStep?.trim()) continue;
        observations.push({ unit, draft });
      }
    } catch {
      return null;
    }

    if (observations.length === 0) return null;
    observations.sort((a, b) => a.unit - b.unit);

    const engagementSignals = this.formatObservationLines(observations, 'engagementSignals');
    const adaptationNotes = this.formatObservationLines(observations, 'adaptationNotes');
    const nextSteps = this.formatObservationLines(observations, 'nextStep');
    const updatedValues = observations
      .map(item => item.draft.updatedAt)
      .filter((value): value is string => !!value)
      .sort();
    const updatedAt = updatedValues.length > 0 ? updatedValues[updatedValues.length - 1] : null;

    return {
      count: observations.length,
      engagementSignals,
      adaptationNotes,
      nextSteps,
      updatedAt,
    };
  }

  private formatObservationLines(
    observations: Array<{ unit: number; draft: PilotObservationDraft }>,
    field: keyof Pick<PilotObservationDraft, 'engagementSignals' | 'adaptationNotes' | 'nextStep'>,
  ): string {
    return observations
      .map(({ unit, draft }) => {
        const value = draft[field]?.trim();
        return value ? `${this.unitLabel(unit)}: ${value}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  private unitLabel(unit: number): string {
    const title = this.store.album.weekTitles[unit - 1]?.trim();
    return `${unit}. ${this.store.albumUnitLabel}${title ? ` - ${title}` : ''}`;
  }

  private mergeEffectLogText(current: string, addition: string): string {
    const cleanCurrent = current.trim();
    const cleanAddition = addition.trim();
    if (!cleanAddition) return cleanCurrent;
    if (!cleanCurrent) return cleanAddition;
    if (cleanCurrent.includes(cleanAddition)) return cleanCurrent;
    return `${cleanCurrent}\n\n${cleanAddition}`;
  }
}
