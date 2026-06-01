import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ALBUM_TEMPLATE_PATTERNS, AlbumTemplatePatternKey } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-album-templates',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="edit_note">Albumtervek</ma-chip>
          <h1 style="margin-top: 14px;">Újrafelhasználható albumtervek</h1>
          <div class="sub">
            Egy albumterv több osztállyal is elindítható, eltérő csapatokkal és külön futási állapottal.
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
          <ma-btn variant="primary" icon="edit_note" (clicked)="store.startNewTemplate()">
            Új albumterv
          </ma-btn>
        </div>
      </div>

      <div class="pattern-filter" role="tablist" aria-label="Album-minták szűrése">
        <button
          type="button"
          class="pattern-filter-btn"
          [class.pattern-filter-btn-active]="patternFilter() === 'all'"
          (click)="patternFilter.set('all')"
        >
          Összes
        </button>
        @for (pattern of patterns; track pattern.key) {
          <button
            type="button"
            class="pattern-filter-btn"
            [class.pattern-filter-btn-active]="patternFilter() === pattern.key"
            (click)="patternFilter.set(pattern.key)"
          >
            {{ pattern.name }}
            @if (patternCount(pattern.key) > 0) {
              <span>{{ patternCount(pattern.key) }}</span>
            }
          </button>
        }
      </div>

      <div class="template-list">
        @for (template of visibleTemplates(); track template.id) {
          <button
            type="button"
            class="template-row"
            [class.active]="template.id === store.activeTemplateId()"
            [class.template-row-archived]="template.archivedAt"
            (click)="openTemplate(template.id)"
          >
            <div class="template-main">
              <div class="row wrap">
                @if (template.id === store.activeTemplateId()) {
                  <ma-chip tone="primary" icon="radio_button_checked">Kijelölve</ma-chip>
                }
                @if (template.archivedAt) {
                  <ma-chip tone="neutral" icon="archive">Archivált</ma-chip>
                }
                <ma-chip icon="bookmark_added">{{ template.stickerCount }} matrica</ma-chip>
                <ma-chip icon="content_copy">{{ template.instanceCount }} futtatás</ma-chip>
                <ma-chip icon="category">{{ template.patternName }}</ma-chip>
              </div>
              <div>
                <div class="t-title-lg">{{ template.title }}</div>
                <div class="muted t-body-sm" style="margin-top: 4px;">
                  {{ template.subject }} · {{ template.grade }} · {{ template.duration }}
                </div>
                <div class="muted t-body" style="margin-top: 8px;">„{{ template.drivingQ }}”</div>
              </div>
            </div>
            <ma-icon name="chevron_right" />
          </button>
        } @empty {
          <div class="empty-state">
            <ma-icon name="edit_note" size="xl" />
            <div>
              <div class="t-title">
                @if (!showArchived() && archivedCount() > 0) {
                  Csak archivált albumtervek vannak
                } @else {
                  Nincs albumterv
                }
              </div>
              <div class="muted t-body-sm">
                @if (!showArchived() && archivedCount() > 0) {
                  Kapcsold be az „Archivált is" gombot a megjelenítéshez.
                } @else {
                  Albumterv nélkül nem indítható futó album.
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .template-list {
      display: grid;
      gap: 14px;
    }

    .pattern-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }

    .pattern-filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--n-300);
      border-radius: 999px;
      background: white;
      color: var(--n-700);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }

    .pattern-filter-btn span {
      min-width: 20px;
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--n-100);
      color: var(--n-700);
      text-align: center;
      font-size: 12px;
      font-weight: 700;
    }

    .pattern-filter-btn-active {
      border-color: var(--primary-500);
      background: var(--primary-50, #f5f1ff);
      color: var(--primary-700, #5b3fd6);
    }

    .template-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      width: 100%;
      padding: 22px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }

    .template-row.active {
      border-color: var(--primary-500);
      box-shadow: inset 0 0 0 1px var(--primary-500);
    }

    .template-row-archived {
      opacity: 0.65;
      background: var(--n-50, #faf8f5);
    }

    .template-row:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }

    .template-row:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 2px;
    }

    .template-main {
      min-width: 0;
      display: grid;
      gap: 12px;
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

    .empty-state {
      display: flex;
      gap: 14px;
      padding: 22px;
      border: 1px dashed var(--n-300);
      border-radius: 16px;
      background: var(--n-50);
      color: var(--n-700);
    }

    @media (max-width: 860px) {
      .template-row {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `,
})
export class AlbumTemplatesComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  readonly patterns = ALBUM_TEMPLATE_PATTERNS;
  readonly showArchived = signal(false);
  readonly patternFilter = signal<AlbumTemplatePatternKey | 'all'>('all');

  readonly archivedCount = computed(() =>
    this.store.templates().filter(template => template.archivedAt).length,
  );

  readonly visibleTemplates = computed(() => {
    const all = this.store.templates();
    const archivedFiltered = this.showArchived() ? all : all.filter(template => !template.archivedAt);
    const pattern = this.patternFilter();
    return pattern === 'all'
      ? archivedFiltered
      : archivedFiltered.filter(template => template.patternKey === pattern);
  });

  patternCount(patternKey: AlbumTemplatePatternKey): number {
    return this.store.templates().filter(template => template.patternKey === patternKey && (this.showArchived() || !template.archivedAt)).length;
  }

  async openTemplate(id: string): Promise<void> {
    await this.router.navigate(['/teacher/templates', id]);
  }
}
