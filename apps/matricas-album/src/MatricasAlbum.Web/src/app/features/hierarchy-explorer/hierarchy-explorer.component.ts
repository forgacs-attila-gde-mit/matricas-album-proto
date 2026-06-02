import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlbumApi } from '../../core/services/album-api.service';
import {
  BlockActivityRef, BlockDetail, CurriculumDetail, CurriculumListItem, CurriculumModuleRef,
  ModuleDetail, ModuleTopicRef, TopicBlockRef, TopicDetail,
} from '../../core/models/album.model';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

/**
 * REFACTOR-001 Task 6.3 — read-only drill-down navigator over the full gold-standard chain:
 * Tanterv → Modul → Témakör → Blokk → Tevékenység. Each level lazy-loads the referenced
 * child's detail on expand and resolves the exact referenced version (not just the latest),
 * so the tree shows what the parent actually composed. Behind the hierarchyCurriculum flag.
 * AI structure suggestions (suggest-only) are deferred — this is the navigation surface.
 */
@Component({
  selector: 'ma-hierarchy-explorer',
  standalone: true,
  imports: [FormsModule, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="lan">Hierarchia</ma-chip>
          <h1 style="margin-top: 14px;">Felépítés böngésző</h1>
          <div class="sub">Tanterv → Modul → Témakör → Blokk → Tevékenység — hivatkozással összerakott, lebontható nézet.</div>
        </div>
      </div>

      <label class="field">
        <span>Tanterv</span>
        <select [ngModel]="selectedCurriculumId()" (ngModelChange)="selectCurriculum($event)">
          <option [ngValue]="null">— válassz —</option>
          @for (c of curricula(); track c.id) {
            <option [ngValue]="c.id">{{ c.name }} (v{{ c.latestVersionNumber }})</option>
          }
        </select>
      </label>

      @if (selectedCurriculum(); as curriculum) {
        <div class="crumb">Tanterv: <strong>{{ curriculum.name }}</strong></div>
        <div class="tree">
          @for (m of curriculumModules(); track m.id) {
            <div class="node l1">
              <button type="button" class="row-btn" data-module (click)="toggle(m.id, 'module', m.moduleId)">
                <ma-icon [name]="isOpen(m.id) ? 'expand_more' : 'chevron_right'" size="sm" />
                <span class="node-label">{{ m.moduleName }}</span>
                <ma-chip tone="neutral">Modul · {{ m.topicCount }} témakör</ma-chip>
              </button>
              @if (isOpen(m.id)) {
                @for (t of moduleTopics(m); track t.id) {
                  <div class="node l2">
                    <button type="button" class="row-btn" data-topic (click)="toggle(t.id, 'topic', t.topicId)">
                      <ma-icon [name]="isOpen(t.id) ? 'expand_more' : 'chevron_right'" size="sm" />
                      <span class="node-label">{{ t.topicName }}</span>
                      <ma-chip tone="neutral">Témakör · {{ t.blockCount }} blokk</ma-chip>
                    </button>
                    @if (isOpen(t.id)) {
                      @for (b of topicBlocks(t); track b.id) {
                        <div class="node l3">
                          <button type="button" class="row-btn" data-block (click)="toggle(b.id, 'block', b.blockId)">
                            <ma-icon [name]="isOpen(b.id) ? 'expand_more' : 'chevron_right'" size="sm" />
                            <span class="node-label">{{ b.blockName }}</span>
                            <ma-chip tone="neutral">Blokk · {{ b.activityCount }} tev.</ma-chip>
                          </button>
                          @if (isOpen(b.id)) {
                            @for (a of blockActivities(b); track a.id) {
                              <div class="node l4 leaf">
                                <ma-icon name="bookmark" size="sm" />
                                <span class="node-label">{{ a.activityTitle }}</span>
                                <ma-chip tone="primary">{{ a.role }}</ma-chip>
                              </div>
                            } @empty {
                              <div class="node l4 muted t-body-sm">Nincs tevékenység ebben a blokkban.</div>
                            }
                          }
                        </div>
                      } @empty {
                        <div class="node l3 muted t-body-sm">Nincs blokk ebben a témakörben.</div>
                      }
                    }
                  </div>
                } @empty {
                  <div class="node l2 muted t-body-sm">Nincs témakör ebben a modulban.</div>
                }
              }
            </div>
          } @empty {
            <div class="muted t-body-sm">Ez a tanterv még nem tartalmaz modult.</div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <ma-icon name="lan" size="xl" />
          <div>
            <div class="t-title">Válassz egy tantervet a böngészéshez</div>
            <div class="muted t-body-sm">A lebontás a hivatkozott verziókat mutatja, lépésről lépésre.</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--n-700); max-width: 420px; margin-bottom: 16px; }
    .field select { padding: 8px 10px; border: 1px solid var(--n-300); border-radius: 10px; font: inherit; }
    .crumb { font-size: 13px; color: var(--n-600); margin-bottom: 10px; }
    .tree { display: flex; flex-direction: column; gap: 4px; }
    .node { display: flex; flex-direction: column; gap: 4px; }
    .l2 { margin-left: 22px; } .l3 { margin-left: 44px; } .l4 { margin-left: 66px; }
    .row-btn { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 7px 10px; border: 1px solid var(--n-200); border-radius: 10px; background: white; font: inherit; cursor: pointer; }
    .row-btn:hover { border-color: var(--primary-300, #b9aef0); }
    .leaf { align-items: center; gap: 8px; padding: 6px 10px; border: 1px dashed var(--n-200); border-radius: 10px; background: var(--n-50); }
    .node-label { flex: 1; min-width: 0; font-size: 13px; }
    .muted { color: var(--n-500); }
    .empty-state { display: flex; gap: 14px; padding: 22px; border: 1px dashed var(--n-300); border-radius: 16px; background: var(--n-50); color: var(--n-700); }
  `,
})
export class HierarchyExplorerComponent implements OnInit {
  private readonly api = inject(AlbumApi);

  readonly curricula = signal<CurriculumListItem[]>([]);
  readonly selectedCurriculum = signal<CurriculumDetail | null>(null);
  readonly selectedCurriculumId = computed(() => this.selectedCurriculum()?.id ?? null);

  // Lazy-loaded child detail caches keyed by entity id, and the set of expanded node ids.
  readonly moduleById = signal<Record<string, ModuleDetail>>({});
  readonly topicById = signal<Record<string, TopicDetail>>({});
  readonly blockById = signal<Record<string, BlockDetail>>({});
  readonly expanded = signal<ReadonlySet<string>>(new Set());

  readonly curriculumModules = computed<CurriculumModuleRef[]>(() => {
    const versions = this.selectedCurriculum()?.versions ?? [];
    const active = versions.length ? [...versions].sort((a, b) => b.versionNumber - a.versionNumber)[0] : null;
    return [...(active?.modules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  ngOnInit(): void {
    this.api.getCurricula().subscribe(curricula => this.curricula.set(curricula));
  }

  selectCurriculum(id: string | null): void {
    this.expanded.set(new Set());
    if (!id) { this.selectedCurriculum.set(null); return; }
    this.api.getCurriculum(id).subscribe(detail => this.selectedCurriculum.set(detail));
  }

  isOpen(nodeId: string): boolean {
    return this.expanded().has(nodeId);
  }

  // nodeId = the relation row id (unique); entityId = the resource id to fetch on first open.
  toggle(nodeId: string, level: 'module' | 'topic' | 'block', entityId: string): void {
    const open = new Set(this.expanded());
    if (open.has(nodeId)) {
      open.delete(nodeId);
      this.expanded.set(open);
      return;
    }
    open.add(nodeId);
    this.expanded.set(open);

    if (level === 'module' && !this.moduleById()[entityId]) {
      this.api.getModule(entityId).subscribe(detail => this.moduleById.update(map => ({ ...map, [entityId]: detail })));
    } else if (level === 'topic' && !this.topicById()[entityId]) {
      this.api.getTopic(entityId).subscribe(detail => this.topicById.update(map => ({ ...map, [entityId]: detail })));
    } else if (level === 'block' && !this.blockById()[entityId]) {
      this.api.getBlock(entityId).subscribe(detail => this.blockById.update(map => ({ ...map, [entityId]: detail })));
    }
  }

  // Resolve the exact referenced version's children from the cached detail.
  moduleTopics(ref: CurriculumModuleRef): ModuleTopicRef[] {
    const version = this.moduleById()[ref.moduleId]?.versions.find(v => v.id === ref.moduleVersionId);
    return [...(version?.topics ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  topicBlocks(ref: ModuleTopicRef): TopicBlockRef[] {
    const version = this.topicById()[ref.topicId]?.versions.find(v => v.id === ref.topicVersionId);
    return [...(version?.blocks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  blockActivities(ref: TopicBlockRef): BlockActivityRef[] {
    const version = this.blockById()[ref.blockId]?.versions.find(v => v.id === ref.blockVersionId);
    return [...(version?.activities ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
