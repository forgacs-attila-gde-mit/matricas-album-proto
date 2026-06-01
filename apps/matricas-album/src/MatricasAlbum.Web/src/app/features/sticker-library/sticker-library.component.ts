import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlbumStore } from '../../core/services/album.store';
import { ACTIVITY_TYPES, activityTypeLabel, type ActivityTypeId } from '../../core/tokens/activity-types';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';

@Component({
  selector: 'ma-sticker-library',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent, PhaseChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="local_library">Matricatár</ma-chip>
          <h1 style="margin-top: 14px;">Globális matricák</h1>
          <div class="sub">
            Újrafelhasználható, verziózott tanulási epizódok. Albumterv készítésekor ezekből válogatsz.
          </div>
        </div>
        <div class="row" style="gap: 12px;">
          <button
            type="button"
            class="archive-toggle"
            [class.archive-toggle-active]="showArchived()"
            (click)="showArchived.set(!showArchived())"
          >
            <ma-icon name="archive" size="sm" />
            <span>Archivált is</span>
            @if (archivedCount() > 0) {
              <span class="archive-toggle-count">{{ archivedCount() }}</span>
            }
          </button>
          <ma-btn variant="primary" icon="bookmark_added" (clicked)="store.openStickerWizard()">
            Új matrica
          </ma-btn>
        </div>
      </div>

      <div class="type-filter" role="group" aria-label="Szűrés tevékenységtípus szerint">
        <button
          type="button"
          class="type-chip"
          [class.type-chip-active]="selectedType() === null"
          (click)="selectedType.set(null)"
        >Mind</button>
        @for (type of activityTypes; track type.id) {
          <button
            type="button"
            class="type-chip"
            [class.type-chip-active]="selectedType() === type.id"
            (click)="toggleType(type.id)"
          >
            <ma-icon [name]="type.icon" size="sm" />
            <span>{{ type.label }}</span>
          </button>
        }
      </div>

      <div class="library-grid">
        @for (sticker of visibleStickers(); track sticker.id) {
          <button
            type="button"
            class="library-card"
            [class.library-card-archived]="sticker.archivedAt"
            (click)="store.openStickerResource(sticker.id)"
          >
            <div class="row-between">
              <ma-phase-chip [phase]="sticker.phase" />
              <div class="row wrap">
                @if (sticker.activityTypeKey) {
                  <ma-chip tone="primary" icon="category">{{ typeLabel(sticker.activityTypeKey) }}</ma-chip>
                }
                @if (sticker.archivedAt) {
                  <ma-chip tone="neutral" icon="archive">Archivált</ma-chip>
                }
                <ma-chip icon="history">v{{ sticker.latestVersionNumber }}</ma-chip>
                <ma-chip icon="link">{{ sticker.templateUsageCount }} terv</ma-chip>
              </div>
            </div>
            <div>
              <div class="t-title-lg">{{ sticker.title }}</div>
              <div class="muted t-body" style="margin-top: 8px;">{{ sticker.short }}</div>
            </div>
          </button>
        } @empty {
          <div class="empty-state">
            <ma-icon name="bookmark_added" size="xl" />
            <div>
              <div class="t-title">
                @if (selectedType() !== null) {
                  Nincs ilyen típusú matrica a tárban
                } @else if (!showArchived() && archivedCount() > 0) {
                  Csak archivált matricák vannak a tárban
                } @else {
                  Nincs még matrica a tárban
                }
              </div>
              <div class="muted t-body-sm">
                @if (selectedType() !== null) {
                  Válassz másik tevékenységtípust, vagy a „Mind" gombbal töröld a szűrőt.
                } @else if (!showArchived() && archivedCount() > 0) {
                  Kapcsold be az „Archivált is" gombot a megjelenítéshez.
                } @else {
                  Hozz létre egy globális matricát, hogy albumtervekbe rendezhesd.
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .library-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .library-card {
      min-height: 184px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 22px;
      padding: 22px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
      text-align: left;
      font: inherit;
      color: inherit;
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }

    .library-card:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }

    .library-card:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 2px;
    }

    .library-card-archived {
      opacity: 0.65;
      background: var(--n-50, #faf8f5);
    }

    .archive-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--n-300);
      background: white;
      color: var(--n-800);
      font-size: 14px;
      cursor: pointer;
      transition: background 120ms, border-color 120ms, color 120ms;
    }
    .archive-toggle:hover { border-color: var(--n-500); }
    .archive-toggle-active {
      background: var(--n-800);
      border-color: var(--n-800);
      color: white;
    }
    .archive-toggle-count {
      background: var(--n-200);
      color: var(--n-800);
      font-size: 12px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 999px;
    }
    .archive-toggle-active .archive-toggle-count {
      background: white;
      color: var(--n-800);
    }

    .type-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }
    .type-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 999px;
      border: 1px solid var(--n-300);
      background: white;
      color: var(--n-800);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      transition: background 120ms, border-color 120ms, color 120ms;
    }
    .type-chip:hover { border-color: var(--primary-300); }
    .type-chip-active {
      background: var(--primary-500, #6c5ce0);
      border-color: var(--primary-500, #6c5ce0);
      color: white;
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      gap: 14px;
      padding: 22px;
      border: 1px dashed var(--n-300);
      border-radius: 16px;
      background: var(--n-50);
      color: var(--n-700);
    }

    @media (max-width: 1100px) {
      .library-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class StickerLibraryComponent {
  readonly store = inject(AlbumStore);
  readonly showArchived = signal(false);
  // Tevékenységtípus facet: null = all types. The list is the closed system taxonomy.
  readonly activityTypes = ACTIVITY_TYPES;
  readonly selectedType = signal<ActivityTypeId | null>(null);

  readonly archivedCount = computed(() =>
    this.store.stickerLibrary().filter(sticker => sticker.archivedAt).length,
  );

  readonly visibleStickers = computed(() => {
    const type = this.selectedType();
    return this.store.stickerLibrary()
      .filter(sticker => this.showArchived() || !sticker.archivedAt)
      .filter(sticker => type === null || sticker.activityTypeKey === type);
  });

  toggleType(id: ActivityTypeId): void {
    this.selectedType.update(current => (current === id ? null : id));
  }

  typeLabel(key: string | null | undefined): string {
    return activityTypeLabel(key);
  }
}
