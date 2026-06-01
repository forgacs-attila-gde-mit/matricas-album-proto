import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter, startWith } from 'rxjs';
import { AlbumStore, StudentPage } from '../core/services/album.store';
import { TopbarComponent, Crumb } from './topbar.component';
import { StudentSidebarComponent } from './student-sidebar.component';
import { GuidedDemoBannerComponent } from '../features/guided-demo-banner/guided-demo-banner.component';

/**
 * Outer shell for /student/*. Owns the topbar + student sidebar and the
 * router-outlet. The route-driven instance binding happens in StudentAlbumShell.
 * If the route lands on bare /student/home and the store already has an active
 * instance, redirect into it.
 */
@Component({
  selector: 'ma-student-shell',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, StudentSidebarComponent, GuidedDemoBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <ma-student-sidebar />
      <div class="main">
        <ma-topbar [crumbs]="crumbs()" />
        <ma-guided-demo-banner />
        <div style="flex: 1; overflow: auto;">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: `
    .app { display: flex; min-height: 100vh; }
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  `,
})
export class StudentShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly store = inject(AlbumStore);
  private sub?: Subscription;

  constructor() {
    effect(() => { this.store.setRole('student'); }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.maybeRedirectHome();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), startWith(null))
      .subscribe(() => {
        this.maybeRedirectHome();
        this.syncStudentPageFromUrl();
      });
    this.syncStudentPageFromUrl();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private maybeRedirectHome(): void {
    const url = this.router.url;
    if (url === '/student' || url === '/student/home') {
      const id = this.store.activeInstanceId();
      if (id) void this.router.navigate(['/student/instances', id, 'current']);
    }
  }

  private syncStudentPageFromUrl(): void {
    const path = this.router.url.replace(/^#/, '').split('?')[0];
    const map: Array<[RegExp, StudentPage]> = [
      [/\/current$/, 'current'],
      [/\/team$/, 'team'],
      [/\/evidence$/, 'evidence'],
      [/\/feedback$/, 'feedback'],
      [/\/reflection$/, 'reflection'],
      [/\/help$/, 'help'],
    ];
    for (const [pattern, page] of map) {
      if (pattern.test(path)) {
        if (this.store.studentPage() !== page) this.store.setStudentPage(page);
        return;
      }
    }
  }

  readonly crumbs = computed<Crumb[]>(() => {
    const activeTitle = this.store.album.title;
    const studentLabels: Record<string, string> = {
      current: 'Aktuális matrica',
      team: 'Csapatunk',
      evidence: 'Bizonyítékaink',
      feedback: 'Visszajelzések',
      reflection: 'Reflexió',
      help: 'Segítség',
    };
    const page = this.store.studentPage();
    return [
      { label: 'Diák nézet' },
      { label: activeTitle },
      { label: studentLabels[page] ?? 'Aktuális matrica', strong: true },
    ];
  });
}
