import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { EvidenceCardComponent } from '../../shared/ui/evidence-card/evidence-card.component';

type Filter = 'all' | 'varakozik' | 'javitas' | 'elkeszult';

@Component({
  selector: 'ma-evidence-portfolio',
  standalone: true,
  imports: [BtnComponent, EvidenceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <h1>Bizonyíték-portfólió</h1>
          <div class="sub">
            A projekt során keletkezett bizonyítékok — fotó, jegyzet, mérési táblázat, reflexió.
          </div>
        </div>
        <div class="row">
          <ma-btn variant="secondary" icon="download" (clicked)="store.setPrintOpen('evidence')">Export</ma-btn>
          <ma-btn variant="secondary" icon="print" (clicked)="store.setPrintOpen('evidence')">Nyomtatható összegzés</ma-btn>
        </div>
      </div>

      <div class="tabs">
        @for (t of tabs; track t.id) {
          <button
            type="button"
            [class.active]="filter() === t.id"
            (click)="filter.set(t.id)"
          >
            {{ t.label }}
          </button>
        }
      </div>

      <div class="grid-2">
        @for (e of filtered(); track e.id) {
          <ma-evidence-card [evidence]="e" />
        }
      </div>
    </div>
  `,
  styles: `
    .tabs {
      display: inline-flex;
      background: white;
      border: 1px solid var(--n-200);
      border-radius: 999px;
      padding: 3px;
      margin-bottom: 24px;

      button {
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 500;
        color: var(--n-600);
        background: none;
        border: none;
        &.active { background: var(--n-900); color: white; }
      }
    }
  `,
})
export class EvidencePortfolioComponent implements OnInit, OnDestroy {
  readonly store = inject(AlbumStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private routeSub?: Subscription;
  private readonly evidenceUrlSyncEnabled = signal(false);
  readonly filter = signal<Filter>('all');

  private readonly evidenceUrlSync = effect(() => {
    if (!this.evidenceUrlSyncEnabled()) return;

    const id = this.store.activeEvidenceId();
    const current = this.route.snapshot.queryParamMap.get('evidence');
    if (id === current) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { evidence: id || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  ngOnInit(): void {
    // Reload-resilient ?evidence=:id deep link, plus drawer -> URL sync.
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const id = params.get('evidence');
      if (this.store.activeEvidenceId() !== id) this.store.openEvidence(id);
    });
    this.evidenceUrlSyncEnabled.set(true);
  }
  ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

  readonly tabs: ReadonlyArray<{ id: Filter; label: string }> = [
    { id: 'all',        label: 'Összes' },
    { id: 'varakozik',  label: 'Vár visszajelzésre' },
    { id: 'javitas',    label: 'Javítás alatt' },
    { id: 'elkeszult',  label: 'Elkészült' },
  ];

  readonly filtered = computed(() => {
    const f = this.filter();
    const all = this.store.evidence();
    return f === 'all' ? all : all.filter(e => e.status === f);
  });
}
