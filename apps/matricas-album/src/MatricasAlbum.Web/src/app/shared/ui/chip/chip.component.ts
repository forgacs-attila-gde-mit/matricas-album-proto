import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type ChipTone =
  | 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

@Component({
  selector: 'ma-chip',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip" [class]="'chip-' + tone()">
      @if (icon()) { <ma-icon [name]="icon()!" size="sm" /> }
      <ng-content />
    </span>
  `,
  styleUrl: './chip.component.scss',
})
export class ChipComponent {
  readonly tone = input<ChipTone>('neutral');
  readonly icon = input<string | null>(null);
}
