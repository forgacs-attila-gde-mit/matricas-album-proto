import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Side drawer container. Renders a backdrop + sliding panel from the right.
 * Open state is driven by input — emit close when the backdrop or close button
 * is clicked.
 *
 * Focus management is delegated to CDK a11y (REFACTOR-003 Task 1.5):
 * `cdkTrapFocus` keeps Tab inside the panel and `cdkTrapFocusAutoCapture`
 * moves focus in on open and restores the previously focused element on
 * close. Escape still closes.
 */
@Component({
  selector: 'ma-drawer',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="drawer-backdrop" (click)="close.emit()"></div>
      <div
        class="drawer"
        [style.width]="width()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel()"
        tabindex="-1"
        cdkTrapFocus
        cdkTrapFocusAutoCapture
        (keydown.escape)="onEscape($event)"
      >
        <ng-content />
      </div>
    }
  `,
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  readonly open = input(false);
  readonly width = input('min(720px, 100%)');
  readonly ariaLabel = input('Oldalsó panel');
  readonly close = output<void>();

  onEscape(event: Event): void {
    event.preventDefault();
    this.close.emit();
  }
}
