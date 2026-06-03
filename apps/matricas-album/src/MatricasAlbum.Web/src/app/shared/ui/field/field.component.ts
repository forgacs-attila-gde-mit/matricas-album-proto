import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input } from '@angular/core';

/**
 * REFACTOR-003 Task 1.2 — shared form field.
 * Label-over-control with required marker (visible `*` + sr-only „(kötelező)"
 * + `aria-required` on the projected control), optional help and error lines.
 * The control (input/select/textarea or a custom widget) is content-projected
 * inside a wrapping <label>, so the association stays implicit — the same
 * idiom the per-screen `.field` CSS used, now centralized.
 *
 *   <ma-field label="Cím" [required]="true" help="Pl. …" [error]="…">
 *     <input class="input" name="title" [(ngModel)]="title" />
 *   </ma-field>
 */
@Component({
  selector: 'ma-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="field">
      <span class="field-label">
        {{ label() }}
        @if (required()) {
          <span class="req" aria-hidden="true">*</span><span class="sr-only">(kötelező)</span>
        }
      </span>
      <ng-content />
      @if (help()) {
        <span class="help">{{ help() }}</span>
      }
      @if (error()) {
        <span class="field-error" role="alert">{{ error() }}</span>
      }
    </label>
  `,
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly help = input('');
  readonly error = input('');

  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Mirror the required flag onto the projected native control for AT.
    effect(() => {
      const required = this.required();
      const control = this.host.nativeElement.querySelector('input, select, textarea');
      if (!control) return;
      if (required) control.setAttribute('aria-required', 'true');
      else control.removeAttribute('aria-required');
    });
  }
}
