import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BtnSize = 'sm' | 'md';

@Component({
  selector: 'ma-btn',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="btn"
      [class]="'btn-' + variant() + ' ' + (size() === 'sm' ? 'btn-sm' : '')"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
    >
      @if (icon()) { <ma-icon [name]="icon()!" size="sm" /> }
      <ng-content />
      @if (iconRight()) { <ma-icon [name]="iconRight()!" size="sm" /> }
    </button>
  `,
  styleUrl: './btn.component.scss',
})
export class BtnComponent {
  readonly variant = input<BtnVariant>('secondary');
  readonly icon = input<string | null>(null);
  readonly iconRight = input<string | null>(null);
  readonly size = input<BtnSize>('md');
  readonly disabled = input(false);
  readonly clicked = output<MouseEvent>();
}
