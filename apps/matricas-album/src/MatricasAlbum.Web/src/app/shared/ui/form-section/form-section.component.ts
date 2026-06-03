import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * REFACTOR-003 Task 1.3 — labeled form section.
 * Groups projected `ma-field`s under a readable header with token-driven
 * spacing: fields sit `--space-lg` apart inside the grid, consecutive
 * sections sit `--space-2xl` apart (host-level margin), so groups read as
 * groups. `columns="2"` lays semantically paired controls side by side and
 * collapses under 760px; `.span-2` children stretch full width.
 *
 *   <ma-form-section title="Alapok" [columns]="2">
 *     <ma-field …/><ma-field …/>
 *   </ma-form-section>
 */
@Component({
  selector: 'ma-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">{{ title() }}</h3>
    @if (hint()) {
      <p class="section-hint">{{ hint() }}</p>
    }
    <div class="section-grid" [class.cols-2]="columns() === 2">
      <ng-content />
    </div>
  `,
  styleUrl: './form-section.component.scss',
})
export class FormSectionComponent {
  readonly title = input.required<string>();
  readonly hint = input('');
  readonly columns = input<1 | 2>(1);
}
