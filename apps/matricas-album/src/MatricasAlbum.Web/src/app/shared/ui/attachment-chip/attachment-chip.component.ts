import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ma-attachment-chip',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="attachment-chip" (click)="openClick($event)">
      <div class="attachment-chip-icon" [style.background]="iconBg()" [style.color]="iconColor()">
        <ma-icon [name]="icon()" size="sm" />
      </div>
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div class="t-label" style="color: var(--n-800);">{{ title() }}</div>
        <div class="muted" style="font-size: 11.5px;">{{ sub() }}</div>
      </div>
      <span class="attachment-chip-cta">
        <span class="t-body-sm" style="font-weight: 500; color: var(--primary-700);">Megnyitás</span>
        <ma-icon name="chevron_right" size="sm" />
      </span>
    </button>
  `,
  styleUrl: './attachment-chip.component.scss',
})
export class AttachmentChipComponent {
  readonly icon = input.required<string>();
  readonly iconBg = input('var(--primary-100)');
  readonly iconColor = input('var(--primary-700)');
  readonly title = input.required<string>();
  readonly sub = input('');
  readonly open = output<MouseEvent>();

  openClick(ev: MouseEvent): void {
    ev.stopPropagation();
    this.open.emit(ev);
  }
}
