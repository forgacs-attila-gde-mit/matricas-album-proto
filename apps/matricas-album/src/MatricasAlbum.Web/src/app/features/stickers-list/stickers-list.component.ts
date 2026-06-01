import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlbumStore } from '../../core/services/album.store';
import { PhaseId } from '../../core/tokens/phases';
import { Sticker } from '../../core/models/album.model';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';
import { StickerCardComponent } from '../../shared/ui/sticker-card/sticker-card.component';

interface PhaseGroup {
  readonly phase: PhaseId;
  readonly items: ReadonlyArray<Sticker>;
}

type PhaseFilter = PhaseId | 'all';
type StateFilter = Sticker['state'] | 'all';
type ProgressFilter = 'all' | 'none' | 'pending' | 'revision' | 'done';

@Component({
  selector: 'ma-stickers-list',
  standalone: true,
  imports: [
    ChipComponent, IconComponent,
    PhaseChipComponent, StickerCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <h1>Futó matricák</h1>
          <div class="sub">Az aktív futó album tanulási epizódjai és aktuális állapotuk.</div>
        </div>
        <button type="button" class="filter-action" (click)="toggleFilters()">
          <ma-icon name="filter_list" size="sm" />
          Szűrés
        </button>
      </div>

      @if (filtersOpen()) {
        <div class="filter-panel">
          <div class="filter-group">
            <div class="filter-label">Fázis</div>
            <button type="button" class="filter-pill" [class.active]="phaseFilter() === 'all'" (click)="phaseFilter.set('all')">Mind</button>
            @for (phase of phaseOrder; track phase) {
              <button type="button" class="filter-pill" [class.active]="phaseFilter() === phase" (click)="phaseFilter.set(phase)">
                {{ phaseLabel(phase) }}
              </button>
            }
          </div>
          <div class="filter-group">
            <div class="filter-label">Állapot</div>
            @for (state of stateOptions; track state.value) {
              <button type="button" class="filter-pill" [class.active]="stateFilter() === state.value" (click)="stateFilter.set(state.value)">
                {{ state.label }}
              </button>
            }
          </div>
          <div class="filter-group">
            <div class="filter-label">Csapat-progress</div>
            @for (progress of progressOptions; track progress.value) {
              <button type="button" class="filter-pill" [class.active]="progressFilter() === progress.value" (click)="progressFilter.set(progress.value)">
                {{ progress.label }}
              </button>
            }
          </div>
          <label class="deprecated-toggle">
            <input type="checkbox" [checked]="showDeprecated()" (change)="showDeprecated.set($any($event.target).checked)" />
            Rejtett / kivezetett matricák is
          </label>
        </div>
      }

      <div class="stack">
        @for (g of groups(); track g.phase) {
          @if (g.items.length > 0) {
            <div>
              <div class="row" style="margin-bottom: 10px;">
                <ma-phase-chip [phase]="g.phase" />
                <span class="muted t-body-sm">{{ g.items.length }} matrica</span>
              </div>
              <div class="grid-3">
                @for (s of g.items; track s.id) {
                  <ma-sticker-card
                    [sticker]="s"
                    (cardClick)="store.openSticker(s.id)"
                  />
                }
                @if (g.phase === 'cselekves' && store.microStickerAccepted()) {
                  <div class="micro-card">
                    <div class="phase-bar"></div>
                    <div class="head">
                      <div class="icon"><ma-icon name="speed" /></div>
                      <div style="flex: 1;">
                        <div class="t-title">Mérési gyorstalpaló</div>
                        <div class="t-body-sm muted" style="margin-top: 4px;">
                          15 perces gyors gyakorlat — adaptív mikromatrica.
                        </div>
                      </div>
                    </div>
                    <ma-chip tone="primary" icon="auto_awesome">
                      AI által javasolt mikromatrica
                    </ma-chip>
                  </div>
                }
              </div>
            </div>
          }
        }
        @if (filteredStickers().length === 0) {
          <div class="empty">
            <ma-icon name="filter_alt_off" size="xl" />
            <div class="t-title" style="margin-top: 8px;">Nincs találat ezekkel a szűrőkkel</div>
            <div class="t-body-sm muted">Válassz kevesebb feltételt, vagy kapcsold be a rejtett matricákat.</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .micro-card {
      position: relative;
      background: white;
      border: 1px solid var(--n-200);
      border-radius: 22px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: 100%;
      overflow: hidden;
    }
    .phase-bar {
      position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: var(--phase-cselekves-line);
    }
    .head { display: flex; gap: 12px; align-items: flex-start; }
    .icon {
      width: 44px; height: 44px;
      border-radius: 14px;
      display: grid; place-items: center;
      flex-shrink: 0;
      background: var(--phase-cselekves-bg);
      color: var(--phase-cselekves-fg);
    }
    .filter-action {
      border: 1px solid var(--n-200);
      background: white;
      border-radius: 10px;
      min-height: 40px;
      padding: 0 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 700;
    }
    .filter-panel {
      border: 1px solid var(--n-200);
      border-radius: 8px;
      background: white;
      padding: 14px;
      margin-bottom: 18px;
      display: grid;
      gap: 12px;
    }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .filter-label {
      width: 132px;
      color: var(--n-600);
      font-size: 0.85rem;
      font-weight: 700;
    }
    .filter-pill {
      border: 1px solid var(--n-200);
      background: var(--n-50);
      color: var(--n-700);
      border-radius: 999px;
      min-height: 32px;
      padding: 0 12px;
      cursor: pointer;
    }
    .filter-pill.active {
      background: var(--primary-50);
      border-color: var(--primary-300);
      color: var(--primary-800);
      font-weight: 700;
    }
    .deprecated-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--n-700);
      font-size: 0.9rem;
    }
  `,
})
export class StickersListComponent {
  readonly store = inject(AlbumStore);

  readonly filtersOpen = signal(false);
  readonly phaseFilter = signal<PhaseFilter>('all');
  readonly stateFilter = signal<StateFilter>('all');
  readonly progressFilter = signal<ProgressFilter>('all');
  readonly showDeprecated = signal(false);

  readonly phaseOrder: ReadonlyArray<PhaseId> = [
    'kerdezes', 'kepzelet', 'cselekves', 'reflexio',
  ];
  readonly stateOptions: ReadonlyArray<{ value: StateFilter; label: string }> = [
    { value: 'all', label: 'Mind' },
    { value: 'tervezett', label: 'Tervezett' },
    { value: 'aktiv', label: 'Aktív' },
    { value: 'varakozik', label: 'Várakozik' },
    { value: 'javitas', label: 'Javítás' },
    { value: 'elkeszult', label: 'Elkészült' },
    { value: 'reflektalt', label: 'Reflektált' },
  ];
  readonly progressOptions: ReadonlyArray<{ value: ProgressFilter; label: string }> = [
    { value: 'all', label: 'Mind' },
    { value: 'none', label: 'Még nincs' },
    { value: 'pending', label: 'Beadva' },
    { value: 'revision', label: 'Javítás alatt' },
    { value: 'done', label: 'Lezárt/reflektált' },
  ];

  readonly filteredStickers = computed(() => {
    const phase = this.phaseFilter();
    const state = this.stateFilter();
    const progress = this.progressFilter();
    return this.store.stickers().filter(sticker => {
      if (!this.showDeprecated() && sticker.deprecated) return false;
      if (phase !== 'all' && sticker.phase !== phase) return false;
      if (state !== 'all' && sticker.state !== state) return false;
      return this.matchesProgress(sticker, progress);
    });
  });

  readonly groups = computed<ReadonlyArray<PhaseGroup>>(() => {
    const all = this.filteredStickers();
    return this.phaseOrder.map(phase => ({
      phase,
      items: all.filter(s => s.phase === phase),
    }));
  });

  toggleFilters(): void {
    this.filtersOpen.update(value => !value);
  }

  phaseLabel(phase: PhaseId): string {
    switch (phase) {
      case 'kerdezes': return 'Kérdezés';
      case 'kepzelet': return 'Képzelet';
      case 'cselekves': return 'Cselekvés';
      case 'reflexio': return 'Reflexió';
    }
  }

  private matchesProgress(sticker: Sticker, filter: ProgressFilter): boolean {
    if (filter === 'all') return true;
    const rows = this.store.teamProgress().filter(row => row.instanceStickerId === sticker.id);
    if (filter === 'none') return rows.length === 0;
    if (filter === 'pending') return rows.some(row => row.state === 'varakozik');
    if (filter === 'revision') return rows.some(row => row.state === 'javitas');
    return rows.some(row => row.state === 'elkeszult' || row.state === 'reflektalt');
  }
}
