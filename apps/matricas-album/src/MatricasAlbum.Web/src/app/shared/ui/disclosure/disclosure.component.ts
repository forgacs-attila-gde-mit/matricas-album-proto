import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

let nextDisclosureId = 0;

/**
 * REFACTOR-003 Task 1.4 — shared collapsible section.
 * Collapsed by default; the toggle is a real <button> (keyboard for free)
 * with `aria-expanded` + `aria-controls`. Hosts that already own a signal
 * (e.g. the create drawer's `advancedOpen`) bind it two-way:
 *
 *   <ma-disclosure label="Opcionális részletek" [(open)]="advancedOpen">
 *     <ma-form-section …/>
 *   </ma-disclosure>
 */
@Component({
  selector: 'ma-disclosure',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="disclosure-toggle"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="bodyId"
      (click)="toggle()"
    >
      <ma-icon [name]="open() ? 'expand_less' : 'expand_more'" size="sm" />
      <span class="disclosure-label">{{ label() }}</span>
    </button>
    @if (hint() && !open()) {
      <p class="disclosure-hint">{{ hint() }}</p>
    }
    @if (open()) {
      <div class="disclosure-body" [id]="bodyId">
        <ng-content />
      </div>
    }
  `,
  styleUrl: './disclosure.component.scss',
})
export class DisclosureComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly open = model(false);

  readonly bodyId = `ma-disclosure-${nextDisclosureId++}`;

  toggle(): void {
    this.open.update(open => !open);
  }
}
