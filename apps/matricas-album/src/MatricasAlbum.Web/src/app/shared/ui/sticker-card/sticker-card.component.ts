import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Sticker } from '../../../core/models/album.model';
import { AlbumStore } from '../../../core/services/album.store';
import { phaseInfo } from '../../../core/tokens/phases';
import { ChipComponent, ChipTone } from '../chip/chip.component';
import { IconComponent } from '../icon/icon.component';
import { PhaseChipComponent } from '../phase-chip/phase-chip.component';
import { StatePillComponent } from '../state-pill/state-pill.component';

interface ProgressAggregate {
  tone: ChipTone;
  label: string;
}

@Component({
  selector: 'ma-sticker-card',
  standalone: true,
  imports: [ChipComponent, IconComponent, PhaseChipComponent, StatePillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sticker" [class]="'phase-' + phaseInfo().color" [class.sticker-deprecated]="sticker().deprecated" (click)="cardClick.emit()">
      <div class="sticker-phase-bar"></div>
      <div class="sticker-row">
        <div class="sticker-icon">
          <ma-icon [name]="phaseInfo().icon" />
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="t-title" style="color: var(--n-900);">{{ sticker().title }}</div>
          <div class="t-body-sm muted clamp" [class.clamp-1]="compact()">
            {{ sticker().short }}
          </div>
        </div>
      </div>
      <div class="row-between" style="margin-top: 4px;">
        <ma-phase-chip [phase]="sticker().phase" />
        <div class="row" style="gap: 6px;">
          @if (sticker().deprecated) {
            <ma-chip tone="neutral" icon="archive">Sablonból eltávolítva</ma-chip>
          }
          @if (showProgressAggregate() && aggregate(); as a) {
            <ma-chip [tone]="a.tone" icon="groups">{{ a.label }}</ma-chip>
          }
          <ma-state-pill [state]="sticker().state" />
        </div>
      </div>
    </div>
  `,
  styleUrl: './sticker-card.component.scss',
})
export class StickerCardComponent {
  readonly sticker = input.required<Sticker>();
  readonly compact = input(false);
  readonly showProgressAggregate = input(false);
  readonly cardClick = output<void>();
  readonly phaseInfo = computed(() => phaseInfo(this.sticker().phase));

  private readonly store = inject(AlbumStore);

  readonly aggregate = computed<ProgressAggregate | null>(() => {
    const total = this.store.teams.length;
    if (total === 0) return null;
    const id = this.sticker().id;
    const rows = this.store.teamProgress().filter(progress => progress.instanceStickerId === id);
    const pending = rows.filter(row => row.state === 'varakozik').length;
    const revision = rows.filter(row => row.state === 'javitas').length;
    const done = rows.filter(row => row.state === 'elkeszult' || row.state === 'reflektalt').length;

    if (done === total) return { tone: 'success', label: `${total}/${total} kész` };
    if (revision > 0) return { tone: 'warning', label: `${revision}/${total} javít` };
    if (pending > 0) return { tone: 'primary', label: `${pending}/${total} beküldte` };
    if (done > 0) return { tone: 'neutral', label: `${done}/${total} kész` };
    return { tone: 'neutral', label: `0/${total} csapat` };
  });
}
