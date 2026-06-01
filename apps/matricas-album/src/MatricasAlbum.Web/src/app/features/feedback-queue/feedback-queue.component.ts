import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Evidence, TeamHelpRequest } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { TeamChipComponent } from '../../shared/ui/team-chip/team-chip.component';

@Component({
  selector: 'ma-feedback-queue',
  standalone: true,
  imports: [AiCardComponent, BtnComponent, ChipComponent, IconComponent, TeamChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <h1>Visszajelzési sor</h1>
          <div class="sub">
            {{ visibleEvidence().length }} csapat bizonyítéka vár tanári visszajelzésre.
            @if (helpRequestCount() > 0) {
              <strong>{{ helpRequestCount() }} csapat segítséget kér.</strong>
            }
          </div>
        </div>
        <div class="row">
          <button
            type="button"
            class="filter-toggle"
            [class.filter-toggle-active]="onlyHelp()"
            [disabled]="helpRequestCount() === 0 && !onlyHelp()"
            (click)="toggleOnlyHelp()"
          >
            <ma-icon name="back_hand" size="sm" />
            <span>Csak segítségkérések</span>
            @if (helpRequestCount() > 0) {
              <span class="filter-toggle-count">{{ helpRequestCount() }}</span>
            }
          </button>
          <ma-btn
            variant="secondary"
            icon="auto_awesome"
            [disabled]="store.adviceLoading()"
            (clicked)="store.requestPendingEvidenceDigest()"
          >
            @if (store.adviceLoading()) { Frissítés... } @else { Mind: AI-összegzés }
          </ma-btn>
        </div>
      </div>

      @if (store.pendingEvidenceDigest(); as digest) {
        <div style="margin-bottom: 18px;">
          <ma-ai-card label="AI digest a függőben lévő bizonyítékokról">
            {{ digest.message }}
            @if (digest.recommendation) {
              <div class="muted t-body-sm" style="margin-top: 6px;">
                <strong>Ajánlás:</strong> {{ digest.recommendation }}
              </div>
            }
          </ma-ai-card>
        </div>
      } @else {
        <div style="margin-bottom: 18px;">
          <ma-ai-card label="AI összegzés tanári ellenőrzéshez">
            A visszajelzési sor a csapatok beküldött bizonyítékait gyűjti. A „segítségkérés" jelzés a csapat saját
            kérése — érdemes ezt soron kívül kezelni. Kérj AI-összegzést a fenti gombbal, mielőtt nekivágsz.
          </ma-ai-card>
        </div>
      }

      @if (openHelpRequests().length > 0) {
        <div class="card help-section" style="margin-bottom: 18px; padding: 20px 24px;">
          <div class="row-between">
            <div>
              <div class="card-section-title">Nyitott segítségkérések</div>
              <div class="t-title-lg">Standalone csapatkérések</div>
              <div class="muted t-body-sm" style="margin-top: 4px;">
                Ezek a kérések nem evidence-hez kötődnek — a csapat azt kéri, hogy beszélj velük.
              </div>
            </div>
            <ma-chip tone="danger" icon="back_hand">{{ openHelpRequests().length }} nyitott</ma-chip>
          </div>
          <div class="help-list">
            @for (req of openHelpRequests(); track req.id) {
              <div class="help-row">
                <ma-icon name="support_agent" />
                <div class="help-row-text">
                  @if (teamNameFor(req.teamId); as teamName) {
                    <div class="muted t-body-sm">{{ teamName }}</div>
                  }
                  <div class="t-body">{{ req.question }}</div>
                  @if (stickerLabel(req.instanceStickerId); as label) {
                    <div class="muted t-body-sm" style="margin-top: 4px;">Matrica: {{ label }}</div>
                  }
                  @if (store.triageForHelpRequest(req.id); as triages) {
                    @if (triages.length > 0) {
                      <div class="help-triage">
                        <div class="card-section-title">Javasolt szókratészi kérdések</div>
                        @for (advice of triages; track advice.id) {
                          @if (advice.questions && advice.questions.length > 0) {
                            <ul style="margin: 4px 0 0; padding-left: 18px;">
                              @for (q of advice.questions; track q) {
                                <li class="t-body-sm">{{ q }}</li>
                              }
                            </ul>
                          }
                        }
                      </div>
                    }
                  }
                </div>
                <div class="row" style="gap: 6px; align-items: center;">
                  <ma-btn
                    variant="ghost"
                    icon="auto_awesome"
                    size="sm"
                    [disabled]="store.adviceLoading()"
                    (clicked)="store.requestHelpRequestTriage(req.id)"
                  >
                    AI tanács
                  </ma-btn>
                  <ma-btn variant="secondary" icon="check" size="sm" (clicked)="markResolved(req.id)">
                    Megoldva
                  </ma-btn>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="stack">
        @for (e of visibleEvidence(); track e.id) {
          @if (teamFor(e); as team) {
            <div class="card" [class.help-card]="e.helpRequested" style="padding: 26px;">
              <div class="row-between" style="align-items: flex-start; gap: 24px;">
                <div style="flex: 1; min-width: 0;">
                  <div class="row" style="margin-bottom: 10px; flex-wrap: wrap;">
                    <ma-team-chip [team]="team" />
                    <ma-chip tone="warning" icon="schedule">Visszajelzésre vár</ma-chip>
                    @if (e.helpRequested) {
                      <ma-chip tone="danger" icon="back_hand">Segítség kérve</ma-chip>
                    }
                    <span class="muted t-body-sm">Beküldve: {{ e.submittedAt }}</span>
                  </div>
                  <div class="t-title-lg" style="margin-bottom: 8px; font-size: 19px;">
                    {{ e.title }}
                  </div>
                  <div class="muted t-body" style="margin-bottom: 12px; max-width: 640px;">
                    {{ e.description }}
                  </div>
                  @if (e.helpRequest) {
                    <div class="help-callout">
                      <ma-icon name="back_hand" size="sm" />
                      <span class="t-body-sm">
                        <strong>Segítségkérés:</strong> {{ e.helpRequest }}
                      </span>
                    </div>
                  }
                </div>
                <div class="stack-sm" style="min-width: 240px;">
                  <ma-btn variant="primary" icon="rate_review" (clicked)="store.openEvidence(e.id)">
                    Visszajelzés írása
                  </ma-btn>
                  <ma-btn variant="ghost" size="sm" icon="visibility">Mellékletek</ma-btn>
                </div>
              </div>
            </div>
          }
        } @empty {
          <div class="card" style="padding: 26px; text-align: center;">
            <div class="muted t-body">
              @if (onlyHelp()) {
                Most nincs segítségkérés a sorban.
              } @else {
                Nincs visszajelzésre váró bizonyíték.
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .help-callout {
      padding: 12px 14px;
      background: #fff7ed;
      border-radius: 12px;
      margin-top: 8px;
      border-left: 3px solid #f97316;
      color: #9a3412;
      display: flex;
      align-items: center;
      gap: 8px;
      ma-icon { color: #9a3412; }
    }

    .help-card {
      border-color: #f97316;
      box-shadow: 0 0 0 1px #fed7aa inset;
    }

    .filter-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--n-300);
      background: white;
      color: var(--n-800);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 120ms, border-color 120ms, color 120ms;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: #f97316;
      }

      .filter-toggle-count {
        background: #fed7aa;
        color: #9a3412;
        font-size: 12px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 999px;
      }
    }

    .filter-toggle-active {
      background: #f97316;
      border-color: #f97316;
      color: white;

      .filter-toggle-count {
        background: white;
        color: #9a3412;
      }
    }
    .help-section {
      border-left: 4px solid #f97316;
    }
    .help-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }
    .help-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 12px 14px;
      border: 1px solid #fed7aa;
      border-radius: 12px;
      background: #fff7ed;

      ma-icon { color: #9a3412; margin-top: 2px; }
    }
    .help-row-text {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .help-triage {
      margin-top: 10px;
      padding: 10px 12px;
      border: 1px solid var(--primary-200, #d8d1ff);
      border-radius: 10px;
      background: #fdfcff;
    }
  `,
})
export class FeedbackQueueComponent implements OnInit, OnDestroy {
  readonly store = inject(AlbumStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private routeSub?: Subscription;
  private readonly evidenceUrlSyncEnabled = signal(false);

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
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const id = params.get('evidence');
      if (this.store.activeEvidenceId() !== id) this.store.openEvidence(id);
    });
    this.evidenceUrlSyncEnabled.set(true);
  }
  ngOnDestroy(): void { this.routeSub?.unsubscribe(); }
  readonly onlyHelp = signal(false);

  readonly helpRequestCount = computed(() =>
    this.store.pendingEvidence().filter(evidence => evidence.helpRequested).length,
  );

  readonly visibleEvidence = computed(() => {
    const pending = this.store.pendingEvidence();
    return this.onlyHelp() ? pending.filter(evidence => evidence.helpRequested) : pending;
  });

  toggleOnlyHelp(): void {
    this.onlyHelp.update(value => !value);
  }

  readonly openHelpRequests = computed(() =>
    this.store.helpRequests()
      .filter(request => !request.resolvedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );

  teamFor(e: Evidence) {
    return this.store.teams.find(t => t.id === e.teamId) ?? null;
  }

  teamNameFor(teamId: string): string | null {
    return this.store.teams.find(t => t.id === teamId)?.name ?? null;
  }

  stickerLabel(id: string | null | undefined): string | null {
    if (!id) return null;
    const sticker = this.store.stickers().find(s => s.id === id);
    return sticker ? `${sticker.week}. hét · ${sticker.title}` : null;
  }

  async markResolved(id: string): Promise<void> {
    await this.store.toggleHelpRequestResolved(id);
  }
}
