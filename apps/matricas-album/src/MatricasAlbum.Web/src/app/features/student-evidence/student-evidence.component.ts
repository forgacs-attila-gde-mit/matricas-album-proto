import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Evidence, EvidenceStatus, EvidenceType, Sticker, TeamStickerProgress } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { ChipComponent, ChipTone } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

type StatusFilter = 'all' | EvidenceStatus;
type TypeFilter = 'all' | EvidenceType;

interface EvidenceRow {
  readonly evidence: Evidence;
  readonly sticker: Sticker | null;
  readonly progress: TeamStickerProgress | null;
  readonly statusTone: ChipTone;
  readonly statusIcon: string;
  readonly statusLabel: string;
}

const STATUS_PRESENTATION: Record<EvidenceStatus, { label: string; tone: ChipTone; icon: string }> = {
  beadva:    { label: 'Beadva',       tone: 'warning', icon: 'upload_file' },
  varakozik: { label: 'Visszajelzésre vár', tone: 'warning', icon: 'schedule' },
  javitas:   { label: 'Javítás kérve', tone: 'warning', icon: 'redo' },
  elkeszult: { label: 'Lezárt',       tone: 'success', icon: 'check' },
};

const TYPE_LABELS: Record<EvidenceType, string> = {
  foto:        'Fotó',
  meres:       'Mérés',
  jegyzet:     'Jegyzet',
  prezentacio: 'Prezentáció',
};

@Component({
  selector: 'ma-student-evidence',
  standalone: true,
  imports: [ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" style="margin-top: 24px;">
      @if (allEntries().length === 0) {
        <div class="card" style="text-align: center; padding: 32px;">
          <ma-icon name="photo_library" size="xl" />
          <div class="t-title-lg" style="margin-top: 8px;">Még nincs bizonyíték a csapatotoktól</div>
          <div class="muted t-body-sm" style="margin-top: 6px;">
            Indítsatok el egy matricát az Aktuális matrica oldalon, és a beküldött bizonyítékok itt fognak megjelenni.
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="row-between">
            <div>
              <div class="card-section-title">Csapatunk evidence-portfóliója</div>
              <div class="t-title-lg">A team minden bizonyítéka</div>
            </div>
            <ma-chip icon="photo_library">{{ visibleEntries().length }} / {{ allEntries().length }}</ma-chip>
          </div>

          <div class="filter-strip" aria-label="Bizonyíték szűrők">
            <span class="filter-strip-label">Szűrés</span>
            @for (option of statusOptions; track option.value) {
              <button
                type="button"
                class="filter-pill"
                [class.filter-pill-active]="statusFilter() === option.value"
                (click)="setStatusFilter(option.value)"
              >
                Állapot: {{ option.label }}
              </button>
            }
            @for (option of typeOptions; track option.value) {
              <button
                type="button"
                class="filter-pill"
                [class.filter-pill-active]="typeFilter() === option.value"
                (click)="setTypeFilter(option.value)"
              >
                Típus: {{ option.label }}
              </button>
            }
            <button
              type="button"
              class="filter-pill"
              [class.filter-pill-active]="onlyHelp()"
              (click)="toggleOnlyHelp()"
            >
              <ma-icon name="back_hand" size="sm" /> Csak segítségkérés
            </button>
            @if (filtersActive()) {
              <button type="button" class="filter-pill filter-reset" (click)="resetFilters()">
                <ma-icon name="close" size="sm" /> Visszaállítás
              </button>
            }
          </div>
        </div>

        @if (visibleEntries().length === 0) {
          <div class="card" style="text-align: center; padding: 28px;">
            <div class="muted t-body">Nincs ilyen bizonyítékunk a szűréshez.</div>
          </div>
        } @else {
          <div class="evidence-list">
            @for (row of visibleEntries(); track row.evidence.id) {
              <button type="button" class="evidence-row" (click)="openEvidence(row.evidence.id)">
                <ma-icon name="photo_library" />
                <div class="evidence-row-text">
                  <div class="t-title">{{ row.evidence.title }}</div>
                  <div class="muted t-body-sm">
                    @if (row.sticker; as st) { <span>Matrica: {{ st.title }} · </span> }
                    <span>{{ formatDate(row.evidence.submittedAt) }}</span>
                  </div>
                  <div class="row" style="margin-top: 6px; gap: 6px; flex-wrap: wrap;">
                    <ma-chip icon="category">{{ typeLabel(row.evidence.type) }}</ma-chip>
                    <ma-chip [tone]="row.statusTone" [icon]="row.statusIcon">{{ row.statusLabel }}</ma-chip>
                    @if (row.evidence.helpRequested) {
                      <ma-chip tone="danger" icon="back_hand">Segítség kérve</ma-chip>
                    }
                  </div>
                  @if (row.evidence.teacherFeedback) {
                    <div class="t-body-sm evidence-feedback">
                      <strong>Tanári visszajelzés:</strong> {{ row.evidence.teacherFeedback }}
                    </div>
                  }
                </div>
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .filter-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-top: 14px;
    }
    .filter-strip-label {
      font-size: 12.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--n-600);
      margin-right: 4px;
    }
    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--n-200);
      background: white;
      color: var(--n-800);
      font-size: 13px;
      cursor: pointer;
      transition: background 120ms, border-color 120ms, color 120ms;

      &:hover { border-color: var(--primary-300); }
    }
    .filter-pill-active {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;

      &:hover { border-color: var(--primary-500); }
    }
    .filter-reset {
      border-color: var(--danger-200, #f0c5c5);
      color: var(--danger-700, #9f2e2e);
    }
    .evidence-list {
      display: grid;
      gap: 10px;
    }
    .evidence-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--n-200);
      border-radius: 12px;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: border-color 120ms, box-shadow 120ms;

      &:hover {
        border-color: var(--primary-300);
        box-shadow: var(--shadow-md);
      }

      ma-icon { color: var(--n-500); margin-top: 2px; }
    }
    .evidence-row-text {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .evidence-feedback {
      margin-top: 8px;
      color: var(--n-700);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
  `,
})
export class StudentEvidenceComponent {
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;

  readonly statusFilter = signal<StatusFilter>('all');
  readonly typeFilter = signal<TypeFilter>('all');
  readonly onlyHelp = signal(false);
  readonly filtersActive = computed(() => this.statusFilter() !== 'all' || this.typeFilter() !== 'all' || this.onlyHelp());

  readonly statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all',       label: 'Mind' },
    { value: 'varakozik', label: 'Visszajelzésre vár' },
    { value: 'javitas',   label: 'Javítás kérve' },
    { value: 'elkeszult', label: 'Lezárt' },
  ];

  readonly typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all',         label: 'Mind' },
    { value: 'foto',        label: 'Fotó' },
    { value: 'meres',       label: 'Mérés' },
    { value: 'jegyzet',     label: 'Jegyzet' },
    { value: 'prezentacio', label: 'Prezentáció' },
  ];

  readonly allEntries = computed<EvidenceRow[]>(() => {
    const team = this.team();
    if (!team) return [];
    return this.store.evidence()
      .filter(evidence => evidence.teamId === team.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map(evidence => {
        const presentation = STATUS_PRESENTATION[evidence.status] ?? STATUS_PRESENTATION.varakozik;
        return {
          evidence,
          sticker: this.store.stickers().find(sticker => sticker.id === evidence.stickerId) ?? null,
          progress: this.store.progressFor(evidence.stickerId, team.id),
          statusTone: presentation.tone,
          statusIcon: presentation.icon,
          statusLabel: presentation.label,
        };
      });
  });

  readonly visibleEntries = computed(() => {
    const status = this.statusFilter();
    const type = this.typeFilter();
    const onlyHelp = this.onlyHelp();
    return this.allEntries().filter(row => {
      if (status !== 'all' && row.evidence.status !== status) return false;
      if (type !== 'all' && row.evidence.type !== type) return false;
      if (onlyHelp && !row.evidence.helpRequested) return false;
      return true;
    });
  });

  setStatusFilter(value: StatusFilter): void { this.statusFilter.set(value); }
  setTypeFilter(value: TypeFilter): void { this.typeFilter.set(value); }
  toggleOnlyHelp(): void { this.onlyHelp.update(v => !v); }
  resetFilters(): void {
    this.statusFilter.set('all');
    this.typeFilter.set('all');
    this.onlyHelp.set(false);
  }

  typeLabel(type: EvidenceType): string { return TYPE_LABELS[type] ?? type; }

  formatDate(submittedAt: string): string {
    return submittedAt; // already a human-readable string from the API mapper
  }

  openEvidence(id: string): void {
    this.store.openEvidence(id);
  }
}
