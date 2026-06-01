import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QualityDim } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';

type QualityState = QualityDim['state'];

interface QualityDraft {
  readonly score: number;
  readonly state: QualityState;
  readonly reason: string;
}

@Component({
  selector: 'ma-quality-panel',
  standalone: true,
  imports: [FormsModule, AiCardComponent, BtnComponent, ChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <ma-chip tone="primary" icon="verified">Módszertani ellenőrző</ma-chip>
          <h1 style="margin-top: 14px;">Album minőségellenőrző</h1>
          <div class="sub">
            A panel arra figyel, hogy a matricás album valódi tanulási bizonyítékokat, döntéseket
            és revíziós pontokat hozzon létre.
          </div>
        </div>
        <ma-btn variant="secondary" icon="picture_as_pdf" (clicked)="store.setPrintOpen('quality')">Riport PDF</ma-btn>
      </div>

      <div class="grid-auto-2" style="align-items: flex-start;">
        <div class="card">
          <div class="t-title-lg" style="margin-bottom: 22px;">Album minőségi dimenziók</div>
          @for (d of qualityRows(); track d.id) {
            <div class="quality-row editable-quality-row">
              <div class="quality-main">
                <div class="t-body">{{ d.label }}</div>
                <div class="quality-bar">
                  <div [style.width.%]="draftFor(d).score" [class]="'bar-' + draftFor(d).state"></div>
                </div>
                @if (d.reason) {
                  <div class="t-body-sm muted quality-reason">{{ d.reason }}</div>
                }
              </div>

              <div class="quality-controls">
                <input
                  class="score-input"
                  type="number"
                  min="0"
                  max="100"
                  [ngModel]="draftFor(d).score"
                  (ngModelChange)="updateDraft(d, { score: +$event })"
                  [attr.aria-label]="d.label + ' pontszám'"
                />
                <select
                  class="state-select"
                  [ngModel]="draftFor(d).state"
                  (ngModelChange)="updateDraft(d, { state: $event })"
                  [attr.aria-label]="d.label + ' állapot'"
                >
                  <option value="ok">Rendben</option>
                  <option value="warn">Figyelmet kér</option>
                  <option value="miss">Hiányzik</option>
                </select>
                <input
                  class="reason-input"
                  [ngModel]="draftFor(d).reason"
                  (ngModelChange)="updateDraft(d, { reason: $event })"
                  placeholder="Tanári indoklás"
                />
                <ma-btn
                  variant="secondary"
                  icon="save"
                  (clicked)="save(d)"
                  [disabled]="!hasDraft(d) || savingId() === d.id"
                >
                  Mentés
                </ma-btn>
              </div>
            </div>
          }
        </div>

        <div class="stack">
          @if (strengths().length > 0) {
            <div class="card success-callout">
              <div class="row" style="gap: 10px;">
                <span class="material-symbols-rounded" style="color: #047857;">check_circle</span>
                <div class="t-title" style="color: #065f46;">Erősségek</div>
              </div>
              <ul style="margin: 10px 0 0; padding-left: 22px; color: #065f46;">
                @for (d of strengths(); track d.id) {
                  <li class="t-body">{{ d.label }} — {{ d.reason || 'stabil dimenzió' }}</li>
                }
              </ul>
            </div>
          }

          @if (attentionNeeded().length > 0) {
            <div class="card warn-callout">
              <div class="row" style="gap: 10px;">
                <span class="material-symbols-rounded" style="color: var(--warning);">warning</span>
                <div class="t-title" style="color: #7c2d12;">Figyelmet kér</div>
              </div>
              <ul style="margin: 10px 0 0; padding-left: 22px; color: #7c2d12;">
                @for (d of attentionNeeded(); track d.id) {
                  <li class="t-body">{{ d.label }} — {{ d.reason || stateLabel(d.state) }}</li>
                }
              </ul>
            </div>
          }

          @if (strengths().length === 0 && attentionNeeded().length === 0) {
            <ma-ai-card label="Nincs külön kiemelt minőségi jelzés">
              A dimenziók még nem adnak elég erős mintázatot külön narratívához.
            </ma-ai-card>
          }

          <ma-ai-card label="Pedagógiai elv emlékeztető">
            A matrica nem jutalom, hanem egy lezárt tanulási epizód bizonyítékkal és reflexióval.
            Nem az a cél, hogy minden csapat ugyanarra jusson, hanem hogy az érvelésük látható legyen.
          </ma-ai-card>
        </div>
      </div>
    </div>
  `,
  styleUrl: './quality-panel.component.scss',
})
export class QualityPanelComponent {
  readonly store = inject(AlbumStore);
  readonly savingId = signal<string | null>(null);
  private readonly refreshTick = signal(0);
  private readonly drafts = signal<Record<string, QualityDraft>>({});

  readonly qualityRows = computed(() => {
    this.refreshTick();
    return this.store.qualityDims;
  });
  readonly strengths = computed(() => this.qualityRows().filter(dimension => dimension.state === 'ok'));
  readonly attentionNeeded = computed(() => this.qualityRows().filter(dimension => dimension.state !== 'ok'));

  draftFor(dimension: QualityDim): QualityDraft {
    return this.drafts()[dimension.id] ?? {
      score: dimension.score,
      state: dimension.state,
      reason: dimension.reason ?? '',
    };
  }

  updateDraft(dimension: QualityDim, patch: Partial<QualityDraft>): void {
    const current = this.draftFor(dimension);
    const next = {
      ...current,
      ...patch,
      score: Math.max(0, Math.min(100, Number(patch.score ?? current.score) || 0)),
    };
    this.drafts.update(rows => ({ ...rows, [dimension.id]: next }));
  }

  hasDraft(dimension: QualityDim): boolean {
    const draft = this.drafts()[dimension.id];
    if (!draft) return false;
    return draft.score !== dimension.score
      || draft.state !== dimension.state
      || draft.reason.trim() !== (dimension.reason ?? '').trim();
  }

  async save(dimension: QualityDim): Promise<void> {
    const draft = this.draftFor(dimension);
    this.savingId.set(dimension.id);
    const ok = await this.store.updateQualityDimension(dimension.id, {
      score: draft.score,
      state: draft.state,
      reason: draft.reason,
    });
    this.savingId.set(null);
    if (!ok) return;
    this.drafts.update(rows => {
      const next = { ...rows };
      delete next[dimension.id];
      return next;
    });
    this.refreshTick.update(value => value + 1);
    this.store.showToast('Minőségi dimenzió frissítve.', 'verified');
  }

  stateLabel(state: QualityState): string {
    switch (state) {
      case 'ok': return 'rendben';
      case 'warn': return 'figyelmet kér';
      case 'miss': return 'hiányzik';
    }
  }
}
