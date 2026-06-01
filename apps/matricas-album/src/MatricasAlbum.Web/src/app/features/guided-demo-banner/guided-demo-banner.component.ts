import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GuidedDemoService, GuidedDemoStep } from '../../core/services/guided-demo.service';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-guided-demo-banner',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (demo.active()) {
      <section class="guided-demo-banner" role="status" aria-live="polite">
        <div class="banner-copy">
          <div class="banner-meta">
            <span class="mode-label"><ma-icon name="auto_awesome" size="sm" /> Vezetett bemutató mód aktív</span>
            <span class="progress-label">{{ demo.currentStepIndex() }} / {{ demo.stepCount() }} lépés</span>
          </div>
          <div class="banner-title">
            @if (demo.nextStep(); as step) {
              {{ step.title }}
            } @else {
              Bemutató kész
            }
          </div>
        </div>

        <div class="banner-actions">
          @if (demo.nextStep(); as step) {
            <button
              type="button"
              class="banner-button primary"
              [disabled]="step.disabled || !!demo.busyStepId()"
              (click)="runNext(step)"
            >
              <ma-icon [name]="demo.busyStepId() === step.id ? 'hourglass_empty' : 'play_arrow'" size="sm" />
              @if (demo.busyStepId() === step.id) { Dolgozom... } @else { {{ step.actionLabel }} }
            </button>
          } @else {
            <span class="done-label"><ma-icon name="check" size="sm" /> Bemutató kész</span>
          }

          <button type="button" class="banner-button secondary" [disabled]="!!demo.busyStepId()" (click)="demo.open()">
            <ma-icon name="format_list_bulleted" size="sm" />
            Panel megnyitása
          </button>
          <button type="button" class="banner-button ghost" [disabled]="!!demo.busyStepId()" (click)="demo.stop()">
            <ma-icon name="close" size="sm" />
            Kilépés
          </button>
        </div>
      </section>
    }
  `,
  styles: `
    .guided-demo-banner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 11px 28px;
      background: #20143f;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
    }

    .banner-copy {
      min-width: 0;
      display: grid;
      gap: 3px;
    }

    .banner-meta,
    .mode-label,
    .banner-actions,
    .banner-button,
    .done-label {
      display: flex;
      align-items: center;
    }

    .banner-meta {
      gap: 10px;
      font-size: 12px;
      line-height: 16px;
      color: rgba(255, 255, 255, 0.78);
    }

    .mode-label {
      gap: 6px;
      font-weight: 800;
      color: #fff;
    }

    .progress-label {
      padding-left: 10px;
      border-left: 1px solid rgba(255, 255, 255, 0.24);
      white-space: nowrap;
    }

    .banner-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 15px;
      line-height: 21px;
      font-weight: 700;
    }

    .banner-actions {
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }

    .banner-button {
      gap: 7px;
      min-height: 34px;
      padding: 7px 12px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      font: inherit;
      font-size: 13px;
      line-height: 18px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      transition: background 120ms, border-color 120ms, color 120ms, opacity 120ms;
    }

    .banner-button:disabled {
      cursor: not-allowed;
      opacity: 0.46;
    }

    .banner-button.primary {
      background: #fff;
      color: #20143f;
      border-color: #fff;
    }

    .banner-button.primary:not(:disabled):hover {
      background: #f4efff;
    }

    .banner-button.secondary {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .banner-button.secondary:not(:disabled):hover,
    .banner-button.ghost:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.34);
    }

    .banner-button.ghost {
      background: transparent;
      color: rgba(255, 255, 255, 0.88);
    }

    .done-label {
      gap: 6px;
      min-height: 34px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.22);
      color: #dcfce7;
      font-size: 13px;
      font-weight: 800;
      white-space: nowrap;
    }

    @media (max-width: 980px) {
      .guided-demo-banner {
        grid-template-columns: 1fr;
        align-items: stretch;
        padding: 12px 16px;
      }

      .banner-actions {
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 1px;
      }
    }
  `,
})
export class GuidedDemoBannerComponent {
  readonly demo = inject(GuidedDemoService);

  runNext(step: GuidedDemoStep): void {
    if (step.disabled || this.demo.busyStepId()) return;
    void this.demo.runStep(step.id);
  }
}
