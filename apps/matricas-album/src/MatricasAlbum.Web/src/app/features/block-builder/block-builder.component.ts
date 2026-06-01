import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AlbumApi } from '../../core/services/album-api.service';
import { BlockActivityRef, BlockDetail, BlockListItem, BlockVersionView, StickerLibraryItem } from '../../core/models/album.model';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CreationShellComponent } from '../../shared/ui/creation-shell/creation-shell.component';

interface RoleOption { readonly key: string; readonly label: string; }

// Hungarian UI labels over the closed BlockActivityRoles keys (server-validated).
const ROLES: readonly RoleOption[] = [
  { key: 'primary', label: 'Fő tevékenység' },
  { key: 'supporting', label: 'Támogató' },
  { key: 'optional', label: 'Választható' },
  { key: 'transition', label: 'Átvezető' },
  { key: 'assessment', label: 'Értékelő' },
];

const FLOW_TYPES: readonly RoleOption[] = [
  { key: 'linear', label: 'Lineáris' },
  { key: 'cyclical', label: 'Ciklikus' },
  { key: 'exploratory', label: 'Felfedező' },
  { key: 'project_based', label: 'Projektalapú' },
  { key: 'mixed', label: 'Vegyes' },
];

const GROUPINGS: readonly RoleOption[] = [
  { key: 'individual', label: 'Egyéni' },
  { key: 'pair', label: 'Páros' },
  { key: 'group', label: 'Csoport' },
  { key: 'whole_class', label: 'Egész osztály' },
  { key: 'dynamic', label: 'Dinamikus' },
];

/**
 * REFACTOR-001 Task 4.3 — 3-pane Blokk (Block) builder.
 *   left   = activity library (Matricatár), searchable, add-by-reference with a role
 *   center = the block draft's activity references, drag-&-drop reorder + role + remove
 *   right  = live preview of the flow (ordered, with role chips)
 * Composes the reusable CreationShellComponent. Edits the block's draft version; publishing
 * freezes it. Ships behind the hierarchyBlock feature flag (no nav entry when off).
 */
@Component({
  selector: 'ma-block-builder',
  standalone: true,
  imports: [FormsModule, DragDropModule, CreationShellComponent, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="dashboard">Blokkműhely</ma-chip>
          <h1 style="margin-top: 14px;">Blokkok (Blokk)</h1>
          <div class="sub">Tevékenységek újrafelhasználható, sorrendezett csoportja — hivatkozással, nem másolással.</div>
        </div>
      </div>

      <div class="block-bar">
        <label class="field">
          <span>Blokk</span>
          <select [ngModel]="selectedBlockId()" (ngModelChange)="selectBlock($event)">
            <option [ngValue]="null">— válassz —</option>
            @for (b of activeBlocks(); track b.id) {
              <option [ngValue]="b.id">{{ b.name }} (v{{ b.latestVersionNumber }})</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Új blokk neve</span>
          <input [(ngModel)]="newBlockName" placeholder="pl. Mérési protokoll blokk" />
        </label>
        <ma-btn variant="primary" icon="add" [disabled]="busy() || !newBlockName.trim()" (clicked)="createBlock()">Létrehozás</ma-btn>
      </div>

      @if (selectedBlock(); as block) {
        <div class="builder-head">
          <div class="row wrap" style="gap: 10px;">
            <ma-chip [tone]="draft() ? 'primary' : 'neutral'" [icon]="draft() ? 'edit' : 'lock'">
              {{ draft() ? 'Vázlat szerkesztése' : 'Publikált' }}
            </ma-chip>
            @if (draft()) {
              <label class="inline-field"><span>Folyamat</span>
                <select [ngModel]="draft()!.flowType" (ngModelChange)="setFlowType($event)">
                  @for (f of flowTypes; track f.key) { <option [ngValue]="f.key">{{ f.label }}</option> }
                </select>
              </label>
              <label class="inline-field"><span>Munkaforma</span>
                <select [ngModel]="draft()!.grouping" (ngModelChange)="setGrouping($event)">
                  @for (g of groupings; track g.key) { <option [ngValue]="g.key">{{ g.label }}</option> }
                </select>
              </label>
            }
          </div>
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
            <div class="pane-title">Tevékenységtár</div>
            <input class="search" [(ngModel)]="search" placeholder="Keresés a matricákban…" />
            <label class="inline-field" style="margin: 8px 0;"><span>Szerep hozzáadáskor</span>
              <select [(ngModel)]="addRole">
                @for (r of roles; track r.key) { <option [ngValue]="r.key">{{ r.label }}</option> }
              </select>
            </label>
            <div class="lib-list">
              @for (item of filteredLibrary(); track item.id) {
                <div class="lib-item">
                  <div class="lib-item-title">{{ item.title }}</div>
                  <button type="button" class="lib-add" data-add [disabled]="!draft() || busy()"
                    (click)="addActivity(item.latestVersionId)">+ Hozzáad</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Nincs találat.</div>
              }
            </div>
          </div>

          <div shellCenter class="pane">
            <div class="pane-title">Folyamat ({{ activities().length }} tevékenység)</div>
            @if (!draft()) {
              <div class="muted t-body-sm">A szerkesztéshez nyiss egy vázlatot a „Szerkesztés” gombbal.</div>
            }
            <div cdkDropList class="flow-list" [cdkDropListDisabled]="!draft()" (cdkDropListDropped)="drop($event)">
              @for (a of activities(); track a.id) {
                <div class="flow-card" cdkDrag>
                  <span class="flow-handle" cdkDragHandle>⋮⋮</span>
                  <span class="flow-order">{{ a.sortOrder }}</span>
                  <span class="flow-title">{{ a.activityTitle }}</span>
                  <select class="flow-role" [ngModel]="a.role" (ngModelChange)="setRole(a.id, $event)" [disabled]="busy()">
                    @for (r of roles; track r.key) { <option [ngValue]="r.key">{{ r.label }}</option> }
                  </select>
                  <button type="button" class="flow-remove" data-remove [disabled]="busy()" (click)="removeActivity(a.id)">✕</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Még nincs tevékenység — adj hozzá a bal oldali tárból.</div>
              }
            </div>
          </div>

          <div shellRight class="pane">
            <div class="pane-title">Előnézet</div>
            <div class="preview-meta">{{ flowLabel() }} · {{ groupingLabel() }}</div>
            <ol class="preview-list" data-preview>
              @for (a of activities(); track a.id) {
                <li>
                  <span class="preview-title">{{ a.activityTitle }}</span>
                  <ma-chip tone="neutral">{{ roleLabel(a.role) }}</ma-chip>
                </li>
              } @empty {
                <li class="muted t-body-sm">Üres folyamat.</li>
              }
            </ol>
          </div>
        </ma-creation-shell>
      } @else {
        <div class="empty-state">
          <ma-icon name="dashboard" size="xl" />
          <div>
            <div class="t-title">Válassz vagy hozz létre egy blokkot</div>
            <div class="muted t-body-sm">A blokk tevékenységek sorrendezett, újrafelhasználható csoportja.</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .block-bar { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 18px; }
    .field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--n-700); }
    .field select, .field input, .search, .inline-field select { padding: 8px 10px; border: 1px solid var(--n-300); border-radius: 10px; font: inherit; }
    .inline-field { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--n-700); }
    .builder-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .pane { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .pane-title { font-weight: 600; color: var(--n-800); }
    .search { width: 100%; }
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
    .flow-role { padding: 5px 8px; border: 1px solid var(--n-300); border-radius: 8px; font: inherit; font-size: 12px; }
    .flow-remove { border: none; background: transparent; color: var(--n-500); cursor: pointer; font-size: 15px; }
    .cdk-drag-preview { box-shadow: var(--shadow-md); border-radius: 12px; }
    .preview-meta { font-size: 12px; color: var(--n-600); }
    .preview-list { display: flex; flex-direction: column; gap: 6px; padding-left: 18px; margin: 0; }
    .preview-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .preview-title { font-size: 13px; min-width: 0; }
    .empty-state { display: flex; gap: 14px; padding: 22px; border: 1px dashed var(--n-300); border-radius: 16px; background: var(--n-50); color: var(--n-700); }
  `,
})
export class BlockBuilderComponent implements OnInit {
  private readonly api = inject(AlbumApi);

  readonly roles = ROLES;
  readonly flowTypes = FLOW_TYPES;
  readonly groupings = GROUPINGS;

  readonly blocks = signal<BlockListItem[]>([]);
  readonly library = signal<StickerLibraryItem[]>([]);
  readonly selectedBlock = signal<BlockDetail | null>(null);
  readonly busy = signal(false);
  search = '';
  newBlockName = '';
  addRole = 'primary';

  readonly activeBlocks = computed(() => this.blocks().filter(block => !block.archivedAt));
  readonly selectedBlockId = computed(() => this.selectedBlock()?.id ?? null);
  readonly draft = computed<BlockVersionView | null>(() => this.selectedBlock()?.versions.find(v => v.isDraft) ?? null);
  readonly latestVersion = computed<BlockVersionView | null>(() => {
    const versions = this.selectedBlock()?.versions ?? [];
    return versions.length ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] : null;
  });
  // The pane the builder renders: the draft if editing, else the latest published version.
  readonly activeVersion = computed<BlockVersionView | null>(() => this.draft() ?? this.latestVersion());
  readonly activities = computed<BlockActivityRef[]>(() =>
    [...(this.activeVersion()?.activities ?? [])].sort((a, b) => a.sortOrder - b.sortOrder));

  readonly filteredLibrary = computed(() => {
    const q = this.search.trim().toLocaleLowerCase('hu-HU');
    return this.library()
      .filter(item => !item.archivedAt)
      .filter(item => !q || item.title.toLocaleLowerCase('hu-HU').includes(q));
  });

  ngOnInit(): void {
    this.api.getBlocks().subscribe(blocks => this.blocks.set(blocks));
    this.api.getStickerLibrary().subscribe(items => this.library.set(items));
  }

  selectBlock(id: string | null): void {
    if (!id) { this.selectedBlock.set(null); return; }
    this.api.getBlock(id).subscribe(detail => this.selectedBlock.set(detail));
  }

  createBlock(): void {
    const name = this.newBlockName.trim();
    if (!name) return;
    this.run(this.api.createBlock({ name }), detail => {
      this.newBlockName = '';
      this.selectedBlock.set(detail);
      this.refreshBlocks();
    });
  }

  ensureDraft(): void {
    const block = this.selectedBlock();
    if (!block || this.draft()) return;
    this.run(this.api.createBlockDraft(block.id), detail => this.selectedBlock.set(detail));
  }

  publish(): void {
    const block = this.selectedBlock();
    if (!block || !this.draft()) return;
    this.run(this.api.publishBlockDraft(block.id), detail => { this.selectedBlock.set(detail); this.refreshBlocks(); });
  }

  setFlowType(flowType: string): void {
    const version = this.draft();
    if (!version) return;
    this.run(this.api.updateBlockVersion(version.id, { flowType }), detail => this.selectedBlock.set(detail));
  }

  setGrouping(grouping: string): void {
    const version = this.draft();
    if (!version) return;
    this.run(this.api.updateBlockVersion(version.id, { grouping }), detail => this.selectedBlock.set(detail));
  }

  addActivity(stickerVersionId: string): void {
    const block = this.selectedBlock();
    if (!block || !this.draft()) return;
    this.run(this.api.addBlockActivity(block.id, { stickerVersionId, role: this.addRole }), detail => this.selectedBlock.set(detail));
  }

  setRole(relationId: string, role: string): void {
    const block = this.selectedBlock();
    if (!block) return;
    this.run(this.api.updateBlockActivityRole(block.id, relationId, role), detail => this.selectedBlock.set(detail));
  }

  removeActivity(relationId: string): void {
    const block = this.selectedBlock();
    if (!block) return;
    this.run(this.api.removeBlockActivity(block.id, relationId), detail => this.selectedBlock.set(detail));
  }

  drop(event: CdkDragDrop<BlockActivityRef[]>): void {
    const block = this.selectedBlock();
    if (!block || !this.draft() || event.previousIndex === event.currentIndex) return;
    const ordered = this.activities();
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    const items = ordered.map((activity, index) => ({ id: activity.id, sortOrder: index + 1 }));
    this.run(this.api.reorderBlockActivities(block.id, items), detail => this.selectedBlock.set(detail));
  }

  roleLabel(key: string): string { return ROLES.find(r => r.key === key)?.label ?? key; }
  flowLabel(): string { return FLOW_TYPES.find(f => f.key === this.activeVersion()?.flowType)?.label ?? ''; }
  groupingLabel(): string { return GROUPINGS.find(g => g.key === this.activeVersion()?.grouping)?.label ?? ''; }

  private refreshBlocks(): void {
    this.api.getBlocks().subscribe(blocks => this.blocks.set(blocks));
  }

  private run<T>(obs: { subscribe: (cb: (value: T) => void) => unknown }, onNext: (value: T) => void): void {
    this.busy.set(true);
    obs.subscribe((value: T) => { onNext(value); this.busy.set(false); });
  }
}
