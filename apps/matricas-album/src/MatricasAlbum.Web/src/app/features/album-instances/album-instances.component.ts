import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AlbumInstanceListItem } from '../../core/models/album.model';
import { Router } from '@angular/router';
import { AlbumStore } from '../../core/services/album.store';
import { instanceProgressPercent } from '../../shared/util/instance-progress.util';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-album-instances',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="groups">Futó albumok</ma-chip>
          <h1 style="margin-top: 14px;">Albumfuttatások</h1>
          <div class="sub">
            Osztályhoz kötött futó albumok saját csapatokkal, bizonyítékokkal és haladási állapottal.
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
          <ma-btn variant="primary" icon="groups" (clicked)="store.openInstanceWizard()">
            Indítás osztállyal
          </ma-btn>
        </div>
      </div>

      <div class="instance-list">
        @for (instance of visibleInstances(); track instance.id) {
          <article class="instance-row" [class.active]="instance.id === store.activeInstanceId()" [class.row-archived]="instance.archivedAt">
            <div class="instance-main">
              <div class="row wrap">
                @if (instance.id === store.activeInstanceId()) {
                  <ma-chip tone="primary" icon="radio_button_checked">Aktív</ma-chip>
                }
                @if (instance.archivedAt) {
                  <ma-chip tone="neutral" icon="archive">Archivált</ma-chip>
                }
                <ma-chip icon="calendar_month">{{ instance.currentWeek }}. hét</ma-chip>
                <ma-chip icon="bookmark_added">{{ instance.stickerCount }} matrica</ma-chip>
                @if (instance.pendingEvidenceCount > 0) {
                  <ma-chip tone="warning" icon="rate_review">{{ instance.pendingEvidenceCount }} visszajelzésre vár</ma-chip>
                }
              </div>
              <div>
                <div class="t-title-lg">{{ instance.title }}</div>
                <div class="muted t-body-sm" style="margin-top: 4px;">
                  {{ instance.className }} · albumterv: {{ instance.templateTitle }}
                </div>
                <div class="muted t-body" style="margin-top: 8px;">„{{ instance.drivingQ }}”</div>
              </div>
              <div class="progress-block">
                <div class="row-between">
                  <div class="muted t-body-sm">Albumfuttatás haladása</div>
                  <div class="t-body-sm">{{ progress(instance) }}%</div>
                </div>
                <div class="progress"><div [style.width.%]="progress(instance)"></div></div>
              </div>
            </div>
            <div class="row wrap actions">
              <ma-btn variant="secondary" icon="radio_button_checked" (clicked)="store.selectInstance(instance.id)">
                Aktiválás
              </ma-btn>
              <ma-btn variant="primary" icon="open_in_new" (clicked)="openInstance(instance.id)">
                Megnyitás
              </ma-btn>
            </div>
          </article>
        } @empty {
          <div class="empty-state">
            <ma-icon name="groups" size="xl" />
            <div>
              <div class="t-title">Nincs futó album</div>
              <div class="muted t-body-sm">Indíts egy albumtervet osztállyal, hogy legyen aktív albumfuttatás.</div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .instance-list {
      display: grid;
      gap: 14px;
    }

    .instance-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 24px;
      align-items: center;
      padding: 22px;
      border: 1px solid var(--n-200);
      border-radius: 16px;
      background: white;
    }

    .instance-row.active {
      border-color: var(--primary-500);
      box-shadow: inset 0 0 0 1px var(--primary-500);
    }

    .instance-main {
      min-width: 0;
      display: grid;
      gap: 12px;
    }

    .progress-block {
      max-width: 420px;
    }

    .actions {
      justify-content: flex-end;
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

    .row-archived { opacity: 0.66; }
    .archive-toggle {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 12px; border: 1px solid var(--n-300); border-radius: 12px;
      background: white; cursor: pointer; color: var(--n-700); font-size: 13px;
    }
    .archive-toggle:hover { background: var(--n-50); }
    .archive-toggle-active { background: var(--primary-50, #f3f0ff); border-color: var(--primary-300, #c7bff0); color: var(--primary-800, #3c3278); }
    .archive-toggle-count { padding: 2px 6px; border-radius: 999px; background: var(--n-200); color: var(--n-700); font-size: 11px; }
    .archive-toggle-active .archive-toggle-count { background: var(--primary-200, #d8d1ff); color: var(--primary-800, #3c3278); }

    @media (max-width: 920px) {
      .instance-row {
        grid-template-columns: 1fr;
      }

      .actions {
        justify-content: flex-start;
      }
    }
  `,
})
export class AlbumInstancesComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  readonly showArchived = signal(false);

  readonly archivedCount = computed(() =>
    this.store.instances().filter(instance => instance.archivedAt).length,
  );

  readonly visibleInstances = computed(() => {
    const all = this.store.instances();
    return this.showArchived() ? all : all.filter(instance => !instance.archivedAt);
  });

  progress(instance: AlbumInstanceListItem): number {
    return instanceProgressPercent(instance);
  }

  async openInstance(id: string): Promise<void> {
    await this.router.navigate(['/teacher/instances', id, 'plan']);
  }
}
