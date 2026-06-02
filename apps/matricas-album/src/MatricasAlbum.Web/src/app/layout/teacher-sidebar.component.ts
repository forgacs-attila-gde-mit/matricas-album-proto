import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AlbumStore } from '../core/services/album.store';
import { FEATURES } from '../core/tokens/features';
import { BrandComponent } from '../shared/ui/brand/brand.component';
import { IconComponent } from '../shared/ui/icon/icon.component';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  /** Route segments below `/teacher`. Empty array = the bare /teacher home. */
  readonly path: string[];
  readonly exact?: boolean;
  readonly section?: string;
  readonly needsInstance?: boolean;
  readonly pill?: () => number | null;
}

@Component({
  selector: 'ma-teacher-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BrandComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <ma-brand />

      @for (it of resolvedItems(); track it.label) {
        @if (it.section) { <div class="nav-section">{{ it.section }}</div> }
        <a
          class="nav-item"
          [routerLink]="it.routerLink"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: !!it.exact }"
        >
          <ma-icon [name]="it.icon" />
          {{ it.label }}
          @if (it.pill && it.pill(); as p) { <span class="pill">{{ p }}</span> }
        </a>
      }

      <div style="flex: 1;"></div>
      <div class="divider"></div>
      <a class="nav-item" routerLink="/teacher/help" routerLinkActive="active">
        <ma-icon name="help" /> Pedagógiai súgó
      </a>
      <a class="nav-item" routerLink="/teacher/settings" routerLinkActive="active">
        <ma-icon name="settings" /> Beállítások
      </a>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class TeacherSidebarComponent {
  readonly store = inject(AlbumStore);

  private readonly baseItems: NavItem[] = [
    { label: 'Műhely',                     icon: 'hub',             path: [],                  exact: true, section: 'Műhely' },
    { label: 'Matricatár',                 icon: 'local_library',   path: ['sticker-library'], section: 'Kezelés' },
    ...(FEATURES.hierarchyBlock ? [{ label: 'Blokkműhely', icon: 'dashboard', path: ['blocks'] } as NavItem] : []),
    ...(FEATURES.hierarchyTopic ? [{ label: 'Témakörök', icon: 'category', path: ['topics'] } as NavItem] : []),
    ...(FEATURES.hierarchyModule ? [{ label: 'Modulok', icon: 'account_tree', path: ['modules'] } as NavItem] : []),
    ...(FEATURES.hierarchyCurriculum ? [{ label: 'Tantervek', icon: 'school', path: ['curricula'] } as NavItem] : []),
    { label: 'Albumtervek',                icon: 'edit_note',       path: ['templates'] },
    { label: 'Futó albumok',               icon: 'groups',          path: ['instances'] },
    { label: 'Futó album',                 icon: 'auto_stories',    path: ['instances', '__id__', 'plan'], section: 'Aktív futó album', needsInstance: true },
    { label: 'Futó matricák',              icon: 'bookmark_added',  path: ['instances', '__id__', 'stickers'], needsInstance: true },
    { label: 'Csapatok',                   icon: 'groups',          path: ['instances', '__id__', 'teams'], needsInstance: true },
    { label: 'Bizonyíték-portfólió',       icon: 'photo_library',   path: ['instances', '__id__', 'evidence'], needsInstance: true },
    { label: 'Visszajelzési sor',          icon: 'rate_review',     path: ['instances', '__id__', 'feedback'], section: 'Pedagógia', needsInstance: true,
      pill: () => this.store.pendingEvidence().length || null },
    { label: 'Album minőségellenőrző',     icon: 'verified',        path: ['instances', '__id__', 'quality'], needsInstance: true },
    { label: 'Differenciálás',             icon: 'tune',            path: ['instances', '__id__', 'differentiation'], needsInstance: true },
    { label: 'Projektzárás',               icon: 'flag',            path: ['instances', '__id__', 'closure'], needsInstance: true },
  ];

  /** Resolve `__id__` placeholders against the current active instance; drop instance-scoped items when none is active. */
  readonly resolvedItems = computed(() => {
    const instanceId = this.store.activeInstanceId();
    return this.baseItems
      .filter(item => !item.needsInstance || !!instanceId)
      .map(item => {
        const resolvedPath = item.path.map(segment => segment === '__id__' ? instanceId! : segment);
        return { ...item, routerLink: ['/teacher', ...resolvedPath] };
      });
  });
}
