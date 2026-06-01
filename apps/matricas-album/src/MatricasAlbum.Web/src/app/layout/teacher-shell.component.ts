import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter, startWith } from 'rxjs';
import { AlbumStore, TeacherPage } from '../core/services/album.store';
import { TopbarComponent, Crumb } from './topbar.component';
import { TeacherSidebarComponent } from './teacher-sidebar.component';
import { BtnComponent } from '../shared/ui/btn/btn.component';
import { IconComponent } from '../shared/ui/icon/icon.component';
import { GuidedDemoBannerComponent } from '../features/guided-demo-banner/guided-demo-banner.component';

/**
 * Shell for everything under /teacher. Owns the topbar + sidebar layout and the
 * router-outlet that renders the active teacher feature. Also flips the role
 * signal so the rest of the app (e.g. role-aware drawers) stays in sync with the URL.
 */
@Component({
  selector: 'ma-teacher-shell',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, TeacherSidebarComponent, BtnComponent, IconComponent, GuidedDemoBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <ma-teacher-sidebar />
      <div class="main">
        <ma-topbar [crumbs]="crumbs()" />
        <ma-guided-demo-banner />
        @if (store.loadError(); as loadError) {
          <div class="degraded-banner" role="status" aria-live="polite">
            <div class="row" style="min-width: 0;">
              <ma-icon name="cloud_off" />
              <div class="t-body-sm">{{ loadError }}</div>
            </div>
            <ma-btn variant="secondary" size="sm" icon="refresh" [disabled]="store.loading()" (clicked)="store.loadWorkspace()">
              Újrapróbálás
            </ma-btn>
          </div>
        }
        <div class="content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: `
    .app { display: flex; min-height: 100vh; }
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .content { flex: 1; overflow: auto; padding: 24px 32px; }
    .degraded-banner {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 10px 16px; background: #fff5e8; border-bottom: 1px solid #f3d9b3; color: #784a08;
    }
  `,
})
export class TeacherShellComponent implements OnInit, OnDestroy {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  private sub?: Subscription;

  constructor() {
    // The URL is the source of truth — entering /teacher/* implies teacher role.
    effect(() => { this.store.setRole('teacher'); }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Mirror the URL into the store's page signal so legacy consumers (breadcrumb,
    // some components that still read store.page()) keep working without touching them.
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => this.syncPageFromUrl());
    this.syncPageFromUrl();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private syncPageFromUrl(): void {
    const url = this.router.url; // includes hash
    const path = url.replace(/^#/, '').split('?')[0];
    const map: Array<[RegExp, TeacherPage]> = [
      [/^\/teacher\/sticker-library/, 'stickerLibrary'],
      [/^\/teacher\/templates\/[^/]+/, 'templateDetail'],
      [/^\/teacher\/templates/, 'templates'],
      [/^\/teacher\/instances\/[^/]+\/plan/, 'plan'],
      [/^\/teacher\/instances\/[^/]+\/stickers/, 'stickers'],
      [/^\/teacher\/instances\/[^/]+\/teams/, 'teams'],
      [/^\/teacher\/instances\/[^/]+\/evidence/, 'evidence'],
      [/^\/teacher\/instances\/[^/]+\/feedback/, 'feedback'],
      [/^\/teacher\/instances\/[^/]+\/quality/, 'quality'],
      [/^\/teacher\/instances\/[^/]+\/differentiation/, 'diff'],
      [/^\/teacher\/instances\/[^/]+\/closure/, 'closure'],
      [/^\/teacher\/instances/, 'instances'],
      [/^\/teacher\/settings/, 'settings'],
      [/^\/teacher\/help/, 'help'],
      [/^\/teacher/, 'home'],
    ];
    for (const [pattern, page] of map) {
      if (pattern.test(path)) {
        if (this.store.page() !== page) this.store.setPage(page);
        return;
      }
    }
  }

  readonly crumbs = computed<Crumb[]>(() => {
    const activeTitle = this.store.album.title;
    const page = this.store.page();
    const activeTemplateTitle = this.store.activeAlbumTemplate()?.title ?? 'Albumterv';
    const labels: Record<string, Crumb[]> = {
      home:     [{ label: 'Műhely', strong: true }],
      stickerLibrary: [{ label: 'Műhely' }, { label: 'Matricatár', strong: true }],
      templates: [{ label: 'Műhely' }, { label: 'Albumtervek', strong: true }],
      templateDetail: [{ label: 'Műhely' }, { label: 'Albumtervek' }, { label: activeTemplateTitle, strong: true }],
      instances: [{ label: 'Műhely' }, { label: 'Futó albumok', strong: true }],
      plan:     [{ label: 'Futó albumok' }, { label: activeTitle, strong: true }],
      stickers: [{ label: activeTitle }, { label: 'Futó matricák', strong: true }],
      teams:    [{ label: activeTitle }, { label: 'Csapatok', strong: true }],
      evidence: [{ label: activeTitle }, { label: 'Bizonyíték-portfólió', strong: true }],
      feedback: [{ label: activeTitle }, { label: 'Visszajelzési sor', strong: true }],
      quality:  [{ label: activeTitle }, { label: 'Album minőségellenőrző', strong: true }],
      diff:     [{ label: activeTitle }, { label: 'Differenciálás', strong: true }],
      closure:  [{ label: activeTitle }, { label: 'Projektzárás', strong: true }],
      settings: [{ label: 'Műhely' }, { label: 'Beállítások', strong: true }],
      help:     [{ label: 'Műhely' }, { label: 'Pedagógiai súgó', strong: true }],
    };
    return labels[page] ?? labels['home'];
  });
}
