import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { StickerVersionView } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';
import { StickerStampComponent } from '../../shared/ui/sticker-stamp/sticker-stamp.component';

@Component({
  selector: 'ma-sticker-resource-detail-drawer',
  standalone: true,
  imports: [BtnComponent, ChipComponent, DrawerComponent, IconComponent, PhaseChipComponent, StickerStampComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ma-drawer [open]="open()" (close)="close()" ariaLabel="Matrica részletei">
      @if (resource(); as r) {
        <div class="drawer-header">
          <div class="row-between">
            <div class="row">
              <button type="button" class="icon-btn" (click)="close()">
                <ma-icon name="close" />
              </button>
              @if (selectedVersion(); as v) {
                <ma-sticker-stamp [phase]="v.phase" [size]="60" />
              }
              <div>
                <div class="row" style="margin-bottom: 4px; gap: 6px; flex-wrap: wrap;">
                  @if (selectedVersion(); as v) {
                    <ma-phase-chip [phase]="v.phase" />
                    @if (r.versions.length > 1) {
                      <label class="version-select" title="Verzióváltás">
                        <ma-icon name="history" size="sm" />
                        <select
                          [value]="selectedVersionId() ?? r.versions[0].id"
                          (change)="selectVersion($any($event.target).value)"
                          aria-label="Verzió"
                        >
                          @for (version of r.versions; track version.id) {
                            <option [value]="version.id">
                              v{{ version.versionNumber }}{{ version.id === r.versions[0].id ? ' · legutóbbi' : '' }}
                            </option>
                          }
                        </select>
                      </label>
                    } @else {
                      <ma-chip icon="history">v{{ v.versionNumber }}</ma-chip>
                    }
                    @if (isLatest()) {
                      <ma-chip tone="primary" icon="star">Legutóbbi</ma-chip>
                    }
                  }
                  @if (r.archivedAt) {
                    <ma-chip tone="neutral" icon="archive">Archivált</ma-chip>
                  }
                </div>
                <div class="t-title-lg">{{ r.title }}</div>
                @if (selectedVersion(); as v) {
                  <div class="muted t-body-sm">{{ v.short }}</div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-body version-content">
          @if (selectedVersion(); as v) {
            <div class="card">
              <div class="card-section-title">Tanulói instrukció</div>
              <div class="t-body">{{ v.studentInstruction }}</div>
            </div>
            <div class="card">
              <div class="card-section-title">Tanári facilitáció (lépésről lépésre)</div>
              <ol style="margin: 0; padding-left: 22px;">
                @for (step of v.teacherSteps; track step; let i = $index) {
                  <li class="t-body" style="margin-bottom: 6px;">{{ step }}</li>
                } @empty {
                  <li class="muted t-body-sm">Nincs rögzített lépés.</li>
                }
              </ol>
            </div>
            <div class="grid-2">
              <div class="card">
                <div class="card-section-title">Tanulói döntési pont</div>
                <div class="t-body">{{ v.studentChoice }}</div>
              </div>
              <div class="card">
                <div class="card-section-title">Várható produktum</div>
                <div class="t-body">{{ v.expectedProduct }}</div>
              </div>
            </div>
            <div class="grid-2">
              <div class="card">
                <div class="card-section-title">Bizonyíték típusa</div>
                <div class="t-body">{{ v.evidenceType }}</div>
              </div>
              <div class="card">
                <div class="card-section-title">Reflektív kérdés</div>
                <div class="t-body reflection">"{{ v.reflectionPrompt }}"</div>
              </div>
            </div>
            <div class="card warn-card">
              <div class="card-section-title warn-label">B terv</div>
              <div class="t-body">{{ v.bPlan }}</div>
            </div>
            <div class="card ok-card">
              <div class="card-section-title ok-label">Erőforrástakarékos változat</div>
              <div class="t-body">{{ v.lowResource }}</div>
            </div>
          }
        </div>

        <div class="drawer-footer">
          <ma-btn variant="ghost" (clicked)="close()">Bezárás</ma-btn>
          @if (!readOnly()) {
            <div class="row">
              @if (r.archivedAt) {
                <ma-btn variant="secondary" icon="unarchive" (clicked)="toggleArchive(r.id)">
                  Visszaállítás
                </ma-btn>
              } @else {
                <ma-btn variant="ghost" icon="archive" (clicked)="toggleArchive(r.id)">
                  Archiválás
                </ma-btn>
              }
              <ma-btn variant="primary" icon="edit" (clicked)="createNewVersion()">
                Új verzió létrehozása
              </ma-btn>
            </div>
          }
        </div>
      } @else if (store.stickerResourceLoading()) {
        <div class="drawer-body" style="display: grid; place-items: center; padding: 40px;">
          <div class="muted t-body">Betöltés…</div>
        </div>
      }
    </ma-drawer>
  `,
  styles: `
    .version-content {
      display: grid;
      gap: 14px;
      min-width: 0;
    }

    /* Compact version picker in the drawer header — keeps the body full-width. */
    .version-select {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px 2px 6px;
      border: 1px solid var(--n-300);
      border-radius: 999px;
      background: white;
      color: var(--n-700);
      font-size: 12px;
      cursor: pointer;
      line-height: 22px;
    }
    .version-select:hover { border-color: var(--primary-300, #c7bff0); color: var(--primary-700, #4c3fa3); }
    .version-select ma-icon { color: var(--n-500); }
    .version-select select {
      background: transparent;
      border: 0;
      font: inherit;
      color: inherit;
      padding: 0 2px;
      cursor: pointer;
    }
    .version-select select:focus-visible {
      outline: 2px solid var(--primary-400, #7c6ce0);
      outline-offset: 2px;
      border-radius: 4px;
    }
  `,
})
export class StickerResourceDetailDrawerComponent {
  readonly readOnly = input(false);
  readonly store = inject(AlbumStore);
  readonly resource = this.store.activeStickerResource;
  readonly open = computed(() => this.resource() !== null || this.store.stickerResourceLoading());

  readonly selectedVersionId = signal<string | null>(null);

  readonly selectedVersion = computed<StickerVersionView | null>(() => {
    const r = this.resource();
    if (!r || r.versions.length === 0) return null;
    const id = this.selectedVersionId();
    return r.versions.find(v => v.id === id) ?? r.versions[0];
  });

  readonly isLatest = computed(() => {
    const r = this.resource();
    const v = this.selectedVersion();
    if (!r || !v) return false;
    return r.versions[0]?.id === v.id;
  });

  constructor() {
    // Reset to "latest" when a new resource is opened.
    effect(() => {
      const r = this.resource();
      this.selectedVersionId.set(r?.versions[0]?.id ?? null);
    });
  }

  selectVersion(id: string): void {
    this.selectedVersionId.set(id);
  }

  close(): void {
    this.store.closeStickerResource();
  }

  comingSoon(label: string): void {
    this.store.showToast(`${label}: hamarosan elérhető.`, 'construction');
  }

  async toggleArchive(id: string): Promise<void> {
    await this.store.toggleStickerArchive(id);
  }

  createNewVersion(): void {
    const detail = this.resource();
    if (!detail) return;
    this.store.openStickerWizardForNewVersion(detail);
  }
}
