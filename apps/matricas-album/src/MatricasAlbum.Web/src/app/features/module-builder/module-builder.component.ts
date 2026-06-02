import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AlbumApi } from '../../core/services/album-api.service';
import { ModuleDetail, ModuleListItem, ModuleTopicRef, ModuleVersionView, TopicListItem } from '../../core/models/album.model';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CreationShellComponent } from '../../shared/ui/creation-shell/creation-shell.component';

/**
 * REFACTOR-001 Task 6.1 — 3-pane Modul (Module) builder.
 *   left   = published-topic library, searchable, add-by-reference
 *   center = the module draft's topic references, drag-&-drop reorder + remove
 *   right  = progression preview (ordered topics + block counts)
 * Composes CreationShellComponent; edits the module's draft; publishing freezes it. Behind the
 * hierarchyModule feature flag. Module → Topic by reference.
 */
@Component({
  selector: 'ma-module-builder',
  standalone: true,
  imports: [FormsModule, DragDropModule, CreationShellComponent, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="account_tree">Modulok</ma-chip>
          <h1 style="margin-top: 14px;">Modul (Modul)</h1>
          <div class="sub">Témakörök sorrendezett, újrafelhasználható csoportja — hivatkozással, nem másolással.</div>
        </div>
      </div>

      <div class="block-bar">
        <label class="field">
          <span>Modul</span>
          <select [ngModel]="selectedModuleId()" (ngModelChange)="selectModule($event)">
            <option [ngValue]="null">— válassz —</option>
            @for (m of activeModules(); track m.id) {
              <option [ngValue]="m.id">{{ m.name }} (v{{ m.latestVersionNumber }})</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Új modul neve</span>
          <input [(ngModel)]="newModuleName" placeholder="pl. Erők és kölcsönhatások" />
        </label>
        <ma-btn variant="primary" icon="add" [disabled]="busy() || !newModuleName.trim()" (clicked)="createModule()">Létrehozás</ma-btn>
      </div>

      @if (selectedModule(); as module) {
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
            <div class="pane-title">Témakör-könyvtár</div>
            <input class="search" [(ngModel)]="search" placeholder="Keresés a témakörökben…" />
            <div class="lib-list">
              @for (t of filteredLibrary(); track t.id) {
                <div class="lib-item">
                  <div class="lib-item-title">{{ t.name }} <span class="muted">v{{ t.latestVersionNumber }} · {{ t.blockCount }} blokk</span></div>
                  <button type="button" class="lib-add" data-add [disabled]="!draft() || busy()" (click)="addTopic(t)">+ Hozzáad</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Nincs publikált témakör. Előbb publikálj egyet a Témakörökben.</div>
              }
            </div>
          </div>

          <div shellCenter class="pane">
            <div class="pane-title">Felépítés ({{ topics().length }} témakör)</div>
            @if (!draft()) {
              <div class="muted t-body-sm">A szerkesztéshez nyiss egy vázlatot a „Szerkesztés” gombbal.</div>
            }
            <div cdkDropList class="flow-list" [cdkDropListDisabled]="!draft()" (cdkDropListDropped)="drop($event)">
              @for (t of topics(); track t.id) {
                <div class="flow-card" cdkDrag>
                  <span class="flow-handle" cdkDragHandle>⋮⋮</span>
                  <span class="flow-order">{{ t.sortOrder }}</span>
                  <span class="flow-title">{{ t.topicName }} <span class="muted">v{{ t.topicVersionNumber }} · {{ t.blockCount }} blokk</span></span>
                  <button type="button" class="flow-remove" data-remove [disabled]="busy()" (click)="removeTopic(t.id)">✕</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Még nincs témakör — adj hozzá a bal oldali könyvtárból.</div>
              }
            </div>
          </div>

          <div shellRight class="pane">
            <div class="pane-title">Haladási előnézet</div>
            <ol class="preview-list" data-preview>
              @for (t of topics(); track t.id) {
                <li>
                  <span class="preview-title">{{ t.topicName }}</span>
                  <ma-chip tone="neutral">{{ t.blockCount }} blokk</ma-chip>
                </li>
              } @empty {
                <li class="muted t-body-sm">Üres modul.</li>
              }
            </ol>
          </div>
        </ma-creation-shell>
      } @else {
        <div class="empty-state">
          <ma-icon name="account_tree" size="xl" />
          <div>
            <div class="t-title">Válassz vagy hozz létre egy modult</div>
            <div class="muted t-body-sm">A modul témakörök sorrendezett, újrafelhasználható csoportja.</div>
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
export class ModuleBuilderComponent implements OnInit {
  private readonly api = inject(AlbumApi);

  readonly modules = signal<ModuleListItem[]>([]);
  readonly library = signal<TopicListItem[]>([]);
  readonly selectedModule = signal<ModuleDetail | null>(null);
  readonly busy = signal(false);
  search = '';
  newModuleName = '';

  readonly activeModules = computed(() => this.modules().filter(module => !module.archivedAt));
  readonly selectedModuleId = computed(() => this.selectedModule()?.id ?? null);
  readonly draft = computed<ModuleVersionView | null>(() => this.selectedModule()?.versions.find(v => v.isDraft) ?? null);
  readonly latestVersion = computed<ModuleVersionView | null>(() => {
    const versions = this.selectedModule()?.versions ?? [];
    return versions.length ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] : null;
  });
  readonly activeVersion = computed<ModuleVersionView | null>(() => this.draft() ?? this.latestVersion());
  readonly topics = computed<ModuleTopicRef[]>(() =>
    [...(this.activeVersion()?.topics ?? [])].sort((a, b) => a.sortOrder - b.sortOrder));

  readonly filteredLibrary = computed(() => {
    const q = this.search.trim().toLocaleLowerCase('hu-HU');
    return this.library()
      .filter(topic => !topic.archivedAt && !!topic.latestPublishedVersionId)
      .filter(topic => !q || topic.name.toLocaleLowerCase('hu-HU').includes(q));
  });

  ngOnInit(): void {
    this.api.getModules().subscribe(modules => this.modules.set(modules));
    this.api.getTopics().subscribe(items => this.library.set(items));
  }

  selectModule(id: string | null): void {
    if (!id) { this.selectedModule.set(null); return; }
    this.api.getModule(id).subscribe(detail => this.selectedModule.set(detail));
  }

  createModule(): void {
    const name = this.newModuleName.trim();
    if (!name) return;
    this.run(this.api.createModule({ name }), detail => {
      this.newModuleName = '';
      this.selectedModule.set(detail);
      this.refreshModules();
    });
  }

  ensureDraft(): void {
    const module = this.selectedModule();
    if (!module || this.draft()) return;
    this.run(this.api.createModuleDraft(module.id), detail => this.selectedModule.set(detail));
  }

  publish(): void {
    const module = this.selectedModule();
    if (!module || !this.draft()) return;
    this.run(this.api.publishModuleDraft(module.id), detail => { this.selectedModule.set(detail); this.refreshModules(); });
  }

  addTopic(topic: TopicListItem): void {
    const module = this.selectedModule();
    if (!module || !this.draft() || !topic.latestPublishedVersionId) return;
    this.run(this.api.addModuleTopic(module.id, { topicVersionId: topic.latestPublishedVersionId }), detail => this.selectedModule.set(detail));
  }

  removeTopic(relationId: string): void {
    const module = this.selectedModule();
    if (!module) return;
    this.run(this.api.removeModuleTopic(module.id, relationId), detail => this.selectedModule.set(detail));
  }

  drop(event: CdkDragDrop<ModuleTopicRef[]>): void {
    const module = this.selectedModule();
    if (!module || !this.draft() || event.previousIndex === event.currentIndex) return;
    const ordered = this.topics();
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    const items = ordered.map((topic, index) => ({ id: topic.id, sortOrder: index + 1 }));
    this.run(this.api.reorderModuleTopics(module.id, items), detail => this.selectedModule.set(detail));
  }

  private refreshModules(): void {
    this.api.getModules().subscribe(modules => this.modules.set(modules));
  }

  private run<T>(obs: { subscribe: (cb: (value: T) => void) => unknown }, onNext: (value: T) => void): void {
    this.busy.set(true);
    obs.subscribe((value: T) => { onNext(value); this.busy.set(false); });
  }
}
