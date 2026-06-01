import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GuidedDemoService } from '../../core/services/guided-demo.service';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-guided-demo-panel',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (demo.panelOpen()) {
      <div class="demo-scrim" (click)="demo.close()"></div>
      <aside class="demo-panel" role="dialog" aria-modal="true" aria-label="Vezetett bemutató">
        <header class="demo-head">
          <div>
            <ma-chip tone="primary" icon="auto_awesome">Vezetett bemutató</ma-chip>
            <h2>Mikroklíma demo út</h2>
            <p>
              Egy kattintásos lépések a Matricatártól a projektzárásig. A lépések valós adatokat hoznak létre,
              az AI javaslatok pedig azonnali bemutató-válaszok.
            </p>
          </div>
          <button type="button" class="icon-close" aria-label="Bemutató panel bezárása" (click)="demo.close()">
            <ma-icon name="close" />
          </button>
        </header>

        <div class="mode-strip">
          <span>Bemutató AI aktív: a javaslatok azonnal, előre rögzített válaszokkal érkeznek.</span>
          <button type="button" (click)="demo.stop()">Kikapcsolás</button>
        </div>

        <div class="step-list">
          @for (step of demo.steps(); track step.id; let i = $index) {
            <section class="demo-step" [class.done]="step.completed">
              <div class="step-index">
                @if (step.completed) { <ma-icon name="check" size="sm" /> }
                @else { {{ i + 1 }} }
              </div>
              <div class="step-copy">
                <div class="step-title">{{ step.title }}</div>
                <p>{{ step.philosophy }}</p>
                <div class="step-actions">
                  <ma-btn
                    size="sm"
                    [variant]="step.completed ? 'secondary' : 'primary'"
                    [icon]="step.completed ? 'replay' : 'play_arrow'"
                    [disabled]="step.disabled || !!demo.busyStepId()"
                    (clicked)="demo.runStep(step.id)"
                  >
                    @if (demo.busyStepId() === step.id) { Dolgozom... } @else { {{ step.actionLabel }} }
                  </ma-btn>
                  <ma-btn
                    size="sm"
                    variant="ghost"
                    icon="open_in_new"
                    [disabled]="!!demo.busyStepId()"
                    (clicked)="demo.navigateStep(step.id)"
                  >
                    {{ step.routeLabel }}
                  </ma-btn>
                </div>
              </div>
            </section>
          }
        </div>
      </aside>
    }
  `,
  styles: `
    .demo-scrim {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(15, 23, 42, 0.28);
    }

    .demo-panel {
      position: fixed;
      z-index: 71;
      top: 16px;
      right: 16px;
      bottom: 16px;
      width: min(560px, calc(100vw - 32px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--n-200);
      border-radius: 18px;
      background: white;
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
    }

    .demo-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      padding: 24px 24px 18px;
      border-bottom: 1px solid var(--n-100);
    }

    h2 {
      margin: 14px 0 8px;
      font-size: 28px;
      line-height: 1.1;
      color: var(--n-900);
    }

    p {
      margin: 0;
      color: var(--n-600);
      line-height: 1.55;
    }

    .icon-close {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid var(--n-200);
      border-radius: 8px;
      background: white;
      color: var(--n-700);
      cursor: pointer;
    }

    .step-list {
      overflow: auto;
      padding: 16px;
      display: grid;
      gap: 12px;
    }

    .mode-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      background: var(--primary-50);
      border-bottom: 1px solid var(--primary-100);
      color: var(--primary-800);
      font-size: 13px;
      line-height: 1.4;
    }

    .mode-strip button {
      border: 0;
      background: transparent;
      color: var(--primary-700);
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
    }

    .demo-step {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--n-200);
      border-radius: 8px;
      background: #fff;
    }

    .demo-step.done {
      border-color: #bbf7d0;
      background: #f8fff9;
    }

    .step-index {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: var(--n-100);
      color: var(--n-700);
      font-weight: 700;
      font-size: 13px;
    }

    .done .step-index {
      background: #dcfce7;
      color: #15803d;
    }

    .step-copy {
      min-width: 0;
      display: grid;
      gap: 8px;
    }

    .step-title {
      font-weight: 800;
      color: var(--n-900);
      line-height: 1.25;
    }

    .step-copy p {
      font-size: 14px;
    }

    .step-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    @media (max-width: 720px) {
      .demo-panel {
        inset: 8px;
        width: auto;
      }

      .demo-head {
        padding: 18px;
      }

      .demo-step {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class GuidedDemoPanelComponent {
  readonly demo = inject(GuidedDemoService);
}
