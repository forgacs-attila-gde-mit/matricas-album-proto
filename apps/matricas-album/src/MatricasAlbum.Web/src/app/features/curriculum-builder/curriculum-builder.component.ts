import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AlbumApi } from '../../core/services/album-api.service';
import { CurriculumDetail, CurriculumListItem, CurriculumModuleRef, CurriculumVersionView, ModuleListItem } from '../../core/models/album.model';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CreationShellComponent } from '../../shared/ui/creation-shell/creation-shell.component';

/**
 * REFACTOR-001 Task 6.2 — 3-pane Tanterv (Curriculum) builder, the top of the hierarchy.
 *   left   = published-module library, searchable, add-by-reference
 *   center = the curriculum draft's module references, drag-&-drop reorder + remove
 *   right  = progression preview (ordered modules + topic counts)
 * Composes CreationShellComponent; edits the curriculum's draft; publishing freezes it.
 * Behind the hierarchyCurriculum feature flag. Curriculum → Module by reference.
 */
@Component({
  selector: 'ma-curriculum-builder',
  standalone: true,
  imports: [FormsModule, DragDropModule, CreationShellComponent, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="school">Tantervek</ma-chip>
          <h1 style="margin-top: 14px;">Tanterv (Tanterv)</h1>
          <div class="sub">Modulok sorrendezett, újrafelhasználható csoportja — a hierarchia teteje, hivatkozással.</div>
        </div>
      </div>

      <div class="block-bar">
        <label class="field">
          <span>Tanterv</span>
          <select [ngModel]="selectedCurriculumId()" (ngModelChange)="selectCurriculum($event)">
            <option [ngValue]="null">— válassz —</option>
            @for (c of activeCurricula(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }} (v{{ c.latestVersionNumber }})</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Új tanterv neve</span>
          <input [(ngModel)]="newCurriculumName" placeholder="pl. 7-8. évfolyam természettudomány" />
        </label>
        <ma-btn variant="primary" icon="add" [disabled]="busy() || !newCurriculumName.trim()" (clicked)="createCurriculum()">Létrehozás</ma-btn>
      </div>

      @if (selectedCurriculum(); as curriculum) {
        <div class="builder-head">
          <ma-chip [tone]="draft() ? 'primary' : 'neutral'" [icon]="draft() ? 'edit' : 'lock'">
            {{ draft() ? 'Vázlat szerkesztése' : 'Publikált' }}
          </ma-chip>
          <div class="row" style="gap: 8px;">
            @if (draft()) {
              <ma-btn variant="primary" icon="publish" [disabled]="busy()" (clicked)="publish()">Publikálás</ma-btn>
            } @else {
              <ma-btn variant="secondary" icon="edit" [disabled]="busy()" (clicked)="ensureDraft()">Szerkesztés</ma-btn>
            }
          </div>
        </div>

        <ma-creation-shell [initialMode]="'build'">
          <div shellLeft class="pane">
            <div class="pane-title">Modul-könyvtár</div>
            <input class="search" [(ngModel)]="search" placeholder="Keresés a modulokban…" />
            <div class="lib-list">
              @for (m of filteredLibrary(); track m.id) {
                <div class="lib-item">
                  <div class="lib-item-title">{{ m.name }} <span class="muted">v{{ m.latestVersionNumber }} · {{ m.topicCount }} témakör</span></div>
                  <button type="button" class="lib-add" data-add [disabled]="!draft() || busy()" (click)="addModule(m)">+ Hozzáad</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Nincs publikált modul. Előbb publikálj egyet a Modulokban.</div>
              }
            </div>
          </div>

          <div shellCenter class="pane">
            <div class="pane-title">Felépítés ({{ modules().length }} modul)</div>
            @if (!draft()) {
              <div class="muted t-body-sm">A szerkesztéshez nyiss egy vázlatot a „Szerkesztés” gombbal.</div>
            }
            <div cdkDropList class="flow-list" [cdkDropListDisabled]="!draft()" (cdkDropListDropped)="drop($event)">
              @for (m of modules(); track m.id) {
                <div class="flow-card" cdkDrag>
                  <span class="flow-handle" cdkDragHandle>⋮⋮</span>
                  <span class="flow-order">{{ m.sortOrder }}</span>
                  <span class="flow-title">{{ m.moduleName }} <span class="muted">v{{ m.moduleVersionNumber }} · {{ m.topicCount }} témakör</span></span>
                  <button type="button" class="flow-remove" data-remove [disabled]="busy()" (click)="removeModule(m.id)">✕</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Még nincs modul — adj hozzá a bal oldali könyvtárból.</div>
              }
            </div>
          </div>

          <div shellRight class="pane">
            <div class="pane-title">Tanterv-előnézet</div>
            <ol class="preview-list" data-preview>
              @for (m of modules(); track m.id) {
                <li>
                  <span class="preview-title">{{ m.moduleName }}</span>
                  <ma-chip tone="neutral">{{ m.topicCount }} témakör</ma-chip>
                </li>
              } @empty {
                <li class="muted t-body-sm">Üres tanterv.</li>
              }
            </ol>
          </div>
        </ma-creation-shell>
      } @else {
        <div class="empty-state">
          <ma-icon name="school" size="xl" />
          <div>
            <div class="t-title">Válassz vagy hozz létre egy tantervet</div>
            <div class="muted t-body-sm">A tanterv modulok sorrendezett csoportja — a Tanterv → Modul → Témakör → Blokk → Tevékenység lánc teteje.</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .block-bar { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 18px; }
    .field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--n-700); }
    .field select, .field input, .search { padding: 8px 10px; border: 1px solid var(--n-300); border-radius: 10px; font: inherit; }
    .builder-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .pane { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .pane-title { font-weight: 600; color: var(--n-800); }
    .search { width: 100%; }
    .muted { color: var(--n-500); font-weight: 400; }
    .lib-list { display: flex; flex-direction: column; gap: 8px; max-height: 60vh; overflow: auto; }
    .lib-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border: 1px solid var(--n-200); border-radius: 10px; background: white; }
    .lib-item-title { font-size: 13px; min-width: 0; }
    .lib-add { border: 1px solid var(--primary-300, #b9aef0); background: white; color: var(--primary-600, #5a49c8); border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .lib-add:disabled { opacity: .5; cursor: not-allowed; }
    .flow-list { display: flex; flex-direction: column; gap: 8px; min-height: 60px; }
    .flow-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--n-200); border-radius: 12px; background: white; }
    .flow-handle { cursor: grab; color: var(--n-400); user-select: none; }
    .flow-order { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; background: var(--n-100); font-size: 12px; }
    .flow-title { flex: 1; min-width: 0; font-size: 14px; }
    .flow-remove { border: none; background: transparent; color: var(--n-500); cursor: pointer; font-size: 15px; }
    .cdk-drag-preview { box-shadow: var(--shadow-md); border-radius: 12px; }
    .preview-list { display: flex; flex-direction: column; gap: 6px; padding-left: 18px; margin: 0; }
    .preview-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .preview-title { font-size: 13px; min-width: 0; }
    .empty-state { display: flex; gap: 14px; padding: 22px; border: 1px dashed var(--n-300); border-radius: 16px; background: var(--n-50); color: var(--n-700); }
  `,
})
export class CurriculumBuilderComponent implements OnInit {
  private readonly api = inject(AlbumApi);

  readonly curricula = signal<CurriculumListItem[]>([]);
  readonly library = signal<ModuleListItem[]>([]);
  readonly selectedCurriculum = signal<CurriculumDetail | null>(null);
  readonly busy = signal(false);
  search = '';
  newCurriculumName = '';

  readonly activeCurricula = computed(() => this.curricula().filter(curriculum => !curriculum.archivedAt));
  readonly selectedCurriculumId = computed(() => this.selectedCurriculum()?.id ?? null);
  readonly draft = computed<CurriculumVersionView | null>(() => this.selectedCurriculum()?.versions.find(v => v.isDraft) ?? null);
  readonly latestVersion = computed<CurriculumVersionView | null>(() => {
    const versions = this.selectedCurriculum()?.versions ?? [];
    return versions.length ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] : null;
  });
  readonly activeVersion = computed<CurriculumVersionView | null>(() => this.draft() ?? this.latestVersion());
  readonly modules = computed<CurriculumModuleRef[]>(() =>
    [...(this.activeVersion()?.modules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder));

  readonly filteredLibrary = computed(() => {
    const q = this.search.trim().toLocaleLowerCase('hu-HU');
    return this.library()
      .filter(module => !module.archivedAt && !!module.latestPublishedVersionId)
      .filter(module => !q || module.name.toLocaleLowerCase('hu-HU').includes(q));
  });

  ngOnInit(): void {
    this.api.getCurricula().subscribe(curricula => this.curricula.set(curricula));
    this.api.getModules().subscribe(items => this.library.set(items));
  }

  selectCurriculum(id: string | null): void {
    if (!id) { this.selectedCurriculum.set(null); return; }
    this.api.getCurriculum(id).subscribe(detail => this.selectedCurriculum.set(detail));
  }

  createCurriculum(): void {
    const name = this.newCurriculumName.trim();
    if (!name) return;
    this.run(this.api.createCurriculum({ name }), detail => {
      this.newCurriculumName = '';
      this.selectedCurriculum.set(detail);
      this.refreshCurricula();
    });
  }

  ensureDraft(): void {
    const curriculum = this.selectedCurriculum();
    if (!curriculum || this.draft()) return;
    this.run(this.api.createCurriculumDraft(curriculum.id), detail => this.selectedCurriculum.set(detail));
  }

  publish(): void {
    const curriculum = this.selectedCurriculum();
    if (!curriculum || !this.draft()) return;
    this.run(this.api.publishCurriculumDraft(curriculum.id), detail => { this.selectedCurriculum.set(detail); this.refreshCurricula(); });
  }

  addModule(module: ModuleListItem): void {
    const curriculum = this.selectedCurriculum();
    if (!curriculum || !this.draft() || !module.latestPublishedVersionId) return;
    this.run(this.api.addCurriculumModule(curriculum.id, { moduleVersionId: module.latestPublishedVersionId }), detail => this.selectedCurriculum.set(detail));
  }

  removeModule(relationId: string): void {
    const curriculum = this.selectedCurriculum();
    if (!curriculum) return;
    this.run(this.api.removeCurriculumModule(curriculum.id, relationId), detail => this.selectedCurriculum.set(detail));
  }

  drop(event: CdkDragDrop<CurriculumModuleRef[]>): void {
    const curriculum = this.selectedCurriculum();
    if (!curriculum || !this.draft() || event.previousIndex === event.currentIndex) return;
    const ordered = this.modules();
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    const items = ordered.map((module, index) => ({ id: module.id, sortOrder: index + 1 }));
    this.run(this.api.reorderCurriculumModules(curriculum.id, items), detail => this.selectedCurriculum.set(detail));
  }

  private refreshCurricula(): void {
    this.api.getCurricula().subscribe(curricula => this.curricula.set(curricula));
  }

  private run<T>(obs: { subscribe: (cb: (value: T) => void) => unknown }, onNext: (value: T) => void): void {
    this.busy.set(true);
    obs.subscribe((value: T) => { onNext(value); this.busy.set(false); });
  }
}
