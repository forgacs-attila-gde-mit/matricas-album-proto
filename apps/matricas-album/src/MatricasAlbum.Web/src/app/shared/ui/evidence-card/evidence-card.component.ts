import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Evidence } from '../../../core/models/album.model';
import { AlbumStore } from '../../../core/services/album.store';
import { AttachmentChipComponent } from '../attachment-chip/attachment-chip.component';
import { ChipComponent } from '../chip/chip.component';
import { IconComponent } from '../icon/icon.component';
import { StatePillComponent } from '../state-pill/state-pill.component';
import { TeamChipComponent } from '../team-chip/team-chip.component';

interface AttachmentMeta {
  icon: string;
  bg: string;
  color: string;
  title: string;
  sub: string;
}

/**
 * Evidence summary card used on the portfolio page, the feedback queue,
 * and inside team / sticker views. Clicking the card or the inner
 * "attachment chip" opens the evidence drawer.
 */
@Component({
  selector: 'ma-evidence-card',
  standalone: true,
  imports: [
    IconComponent, ChipComponent, StatePillComponent,
    TeamChipComponent, AttachmentChipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card evidence-card" (click)="open()">
      <div class="row" style="margin-bottom: 0; justify-content: space-between;">
        <div class="row">
          @if (team(); as t) { <ma-team-chip [team]="t" /> }
          <ma-chip icon="calendar_today">{{ evidence().submittedAt }}</ma-chip>
        </div>
        <ma-state-pill [state]="evidence().status === 'beadva' ? 'bekuldve' : evidence().status === 'javitas' ? 'javitas' : evidence().status === 'elkeszult' ? 'elkeszult' : 'varakozik'" />
      </div>

      <div class="row" style="gap: 14px; align-items: flex-start;">
        <div class="thumb">
          <ma-icon [name]="typeIcon()" size="lg" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div class="t-title">{{ evidence().title }}</div>
          <div class="muted t-body-sm clamp">{{ evidence().description }}</div>
        </div>
      </div>

      @if (!compact() && attachment(); as a) {
        <ma-attachment-chip
          [icon]="a.icon" [iconBg]="a.bg" [iconColor]="a.color"
          [title]="a.title" [sub]="a.sub"
          (open)="open()"
        />
      }

      @if (evidence().teacherFeedback) {
        <div class="feedback">
          <div class="card-section-title" style="color: var(--primary-700);">Tanári visszajelzés</div>
          <div class="t-body-sm" style="color: var(--n-800);">{{ evidence().teacherFeedback }}</div>
        </div>
      }
    </div>
  `,
  styleUrl: './evidence-card.component.scss',
})
export class EvidenceCardComponent {
  private readonly store = inject(AlbumStore);

  readonly evidence = input.required<Evidence>();
  readonly compact = input(false);

  readonly team = computed(() =>
    this.store.teams.find(t => t.id === this.evidence().teamId) ?? null
  );

  readonly typeIcon = computed(() => {
    const t = this.evidence().type;
    return t === 'foto' ? 'photo_camera'
         : t === 'meres' ? 'thermostat'
         : t === 'jegyzet' ? 'edit_note'
         : 'photo_library';
  });

  readonly attachment = computed((): AttachmentMeta | null => {
    const id = this.evidence().id;
    if (id === 'e2') return {
      icon: 'account_tree', bg: 'var(--primary-100)', color: 'var(--primary-700)',
      title: 'Érvtérkép — alsós gyerek szerepe', sub: '1 állítás • 3 indok • 3 példa',
    };
    if (id === 'e3' || id === 'e4' || id === 'e5') return {
      icon: 'table_chart', bg: '#ffe7df', color: '#b1391a',
      title: 'Mérési táblázat — 6 sor', sub: '3 helyszín • nap vs. árnyék átlag: +5,5°C',
    };
    if (id === 'e1') return {
      icon: 'photo_camera', bg: '#fef3c7', color: '#a16207',
      title: 'Fotó + megfigyelési jegyzet', sub: '1 fotó • hipotézis-mondat',
    };
    return null;
  });

  open(): void {
    this.store.openEvidence(this.evidence().id);
  }
}
