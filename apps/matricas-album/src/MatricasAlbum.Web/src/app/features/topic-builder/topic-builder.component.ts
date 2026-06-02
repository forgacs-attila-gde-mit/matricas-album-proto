import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AlbumApi } from '../../core/services/album-api.service';
import { BlockListItem, TopicBlockRef, TopicDetail, TopicListItem, TopicVersionView } from '../../core/models/album.model';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { CreationShellComponent } from '../../shared/ui/creation-shell/creation-shell.component';

/**
 * REFACTOR-001 Task 5.2 — 3-pane Témakör (Topic) organizer.
 *   left   = published-block library, searchable, add-by-reference
 *   center = the topic draft's block references, drag-&-drop reorder + remove
 *   right  = live progression preview (ordered blocks + activity counts)
 * Composes CreationShellComponent. Edits the topic's draft; publishing freezes it. Behind the
 * hierarchyTopic feature flag (no nav entry when off). Topic → Block directly.
 */
@Component({
  selector: 'ma-topic-builder',
  standalone: true,
  imports: [FormsModule, DragDropModule, CreationShellComponent, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="category">Témakörök</ma-chip>
          <h1 style="margin-top: 14px;">Témakör (Témakör)</h1>
          <div class="sub">Blokkok sorrendezett, újrafelhasználható csoportja — hivatkozással, nem másolással.</div>
        </div>
      </div>

      <div class="block-bar">
        <label class="field">
          <span>Témakör</span>
          <select [ngModel]="selectedTopicId()" (ngModelChange)="selectTopic($event)">
            <option [ngValue]="null">— válassz —</option>
            @for (t of activeTopics(); track t.id) {
              <option [ngValue]="t.id">{{ t.name }} (v{{ t.latestVersionNumber }})</option>
            }
          </select>
        </label>
        <label class="field">
          <span>Új témakör neve</span>
          <input [(ngModel)]="newTopicName" placeholder="pl. Mozgás és mérés" />
        </label>
        <ma-btn variant="primary" icon="add" [disabled]="busy() || !newTopicName.trim()" (clicked)="createTopic()">Létrehozás</ma-btn>
      </div>

      @if (selectedTopic(); as topic) {
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
            <div class="pane-title">Blokk-könyvtár</div>
            <input class="search" [(ngModel)]="search" placeholder="Keresés a blokkokban…" />
            <div class="lib-list">
              @for (b of filteredLibrary(); track b.id) {
                <div class="lib-item">
                  <div class="lib-item-title">{{ b.name }} <span class="muted">v{{ b.latestVersionNumber }} · {{ b.activityCount }} tev.</span></div>
                  <button type="button" class="lib-add" data-add [disabled]="!draft() || busy()" (click)="addBlock(b)">+ Hozzáad</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Nincs publikált blokk. Előbb publikálj egyet a Blokkműhelyben.</div>
              }
            </div>
          </div>

          <div shellCenter class="pane">
            <div class="pane-title">Felépítés ({{ blocks().length }} blokk)</div>
            @if (!draft()) {
              <div class="muted t-body-sm">A szerkesztéshez nyiss egy vázlatot a „Szerkesztés” gombbal.</div>
            }
            <div cdkDropList class="flow-list" [cdkDropListDisabled]="!draft()" (cdkDropListDropped)="drop($event)">
              @for (b of blocks(); track b.id) {
                <div class="flow-card" cdkDrag>
                  <span class="flow-handle" cdkDragHandle>⋮⋮</span>
                  <span class="flow-order">{{ b.sortOrder }}</span>
                  <span class="flow-title">{{ b.blockName }} <span class="muted">v{{ b.blockVersionNumber }} · {{ b.activityCount }} tev.</span></span>
                  <button type="button" class="flow-remove" data-remove [disabled]="busy()" (click)="removeBlock(b.id)">✕</button>
                </div>
              } @empty {
                <div class="muted t-body-sm">Még nincs blokk — adj hozzá a bal oldali könyvtárból.</div>
              }
            </div>
          </div>

          <div shellRight class="pane">
            <div class="pane-title">Haladási előnézet</div>
            <ol class="preview-list" data-preview>
              @for (b of blocks(); track b.id) {
                <li>
                  <span class="preview-title">{{ b.blockName }}</span>
                  <ma-chip tone="neutral">{{ b.activityCount }} tev.</ma-chip>
                </li>
              } @empty {
                <li class="muted t-body-sm">Üres témakör.</li>
              }
            </ol>
          </div>
        </ma-creation-shell>
      } @else {
        <div class="empty-state">
          <ma-icon name="category" size="xl" />
          <div>
            <div class="t-title">Válassz vagy hozz létre egy témakört</div>
            <div class="muted t-body-sm">A témakör blokkok sorrendezett, újrafelhasználható csoportja.</div>
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
export class TopicBuilderComponent implements OnInit {
  private readonly api = inject(AlbumApi);

  readonly topics = signal<TopicListItem[]>([]);
  readonly library = signal<BlockListItem[]>([]);
  readonly selectedTopic = signal<TopicDetail | null>(null);
  readonly busy = signal(false);
  search = '';
  newTopicName = '';

  readonly activeTopics = computed(() => this.topics().filter(topic => !topic.archivedAt));
  readonly selectedTopicId = computed(() => this.selectedTopic()?.id ?? null);
  readonly draft = computed<TopicVersionView | null>(() => this.selectedTopic()?.versions.find(v => v.isDraft) ?? null);
  readonly latestVersion = computed<TopicVersionView | null>(() => {
    const versions = this.selectedTopic()?.versions ?? [];
    return versions.length ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] : null;
  });
  readonly activeVersion = computed<TopicVersionView | null>(() => this.draft() ?? this.latestVersion());
  readonly blocks = computed<TopicBlockRef[]>(() =>
    [...(this.activeVersion()?.blocks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder));

  // Only published blocks can be referenced by a topic.
  readonly filteredLibrary = computed(() => {
    const q = this.search.trim().toLocaleLowerCase('hu-HU');
    return this.library()
      .filter(block => !block.archivedAt && !!block.latestPublishedVersionId)
      .filter(block => !q || block.name.toLocaleLowerCase('hu-HU').includes(q));
  });

  ngOnInit(): void {
    this.api.getTopics().subscribe(topics => this.topics.set(topics));
    this.api.getBlocks().subscribe(items => this.library.set(items));
  }

  selectTopic(id: string | null): void {
    if (!id) { this.selectedTopic.set(null); return; }
    this.api.getTopic(id).subscribe(detail => this.selectedTopic.set(detail));
  }

  createTopic(): void {
    const name = this.newTopicName.trim();
    if (!name) return;
    this.run(this.api.createTopic({ name }), detail => {
      this.newTopicName = '';
      this.selectedTopic.set(detail);
      this.refreshTopics();
    });
  }

  ensureDraft(): void {
    const topic = this.selectedTopic();
    if (!topic || this.draft()) return;
    this.run(this.api.createTopicDraft(topic.id), detail => this.selectedTopic.set(detail));
  }

  publish(): void {
    const topic = this.selectedTopic();
    if (!topic || !this.draft()) return;
    this.run(this.api.publishTopicDraft(topic.id), detail => { this.selectedTopic.set(detail); this.refreshTopics(); });
  }

  addBlock(block: BlockListItem): void {
    const topic = this.selectedTopic();
    if (!topic || !this.draft() || !block.latestPublishedVersionId) return;
    this.run(this.api.addTopicBlock(topic.id, { blockVersionId: block.latestPublishedVersionId }), detail => this.selectedTopic.set(detail));
  }

  removeBlock(relationId: string): void {
    const topic = this.selectedTopic();
    if (!topic) return;
    this.run(this.api.removeTopicBlock(topic.id, relationId), detail => this.selectedTopic.set(detail));
  }

  drop(event: CdkDragDrop<TopicBlockRef[]>): void {
    const topic = this.selectedTopic();
    if (!topic || !this.draft() || event.previousIndex === event.currentIndex) return;
    const ordered = this.blocks();
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    const items = ordered.map((block, index) => ({ id: block.id, sortOrder: index + 1 }));
    this.run(this.api.reorderTopicBlocks(topic.id, items), detail => this.selectedTopic.set(detail));
  }

  private refreshTopics(): void {
    this.api.getTopics().subscribe(topics => this.topics.set(topics));
  }

  private run<T>(obs: { subscribe: (cb: (value: T) => void) => unknown }, onNext: (value: T) => void): void {
    this.busy.set(true);
    obs.subscribe((value: T) => { onNext(value); this.busy.set(false); });
  }
}
