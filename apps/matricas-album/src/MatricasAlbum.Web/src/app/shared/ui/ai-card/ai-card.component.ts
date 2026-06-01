import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ma-ai-card',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-card">
      <div class="ai-icon"><ma-icon [name]="icon()" /></div>
      <div style="flex: 1; min-width: 0;">
        <div class="ai-label">{{ label() }}</div>
        <div class="t-body" style="color: var(--n-800);">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrl: './ai-card.component.scss',
})
export class AiCardComponent {
  readonly label = input('AI javaslat');
  readonly icon = input('auto_awesome');
}
