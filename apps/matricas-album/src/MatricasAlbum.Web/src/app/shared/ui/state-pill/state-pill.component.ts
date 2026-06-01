import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATES, StickerState } from '../../../core/tokens/phases';

@Component({
  selector: 'ma-state-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="state-pill" [class]="info().cls">{{ info().label }}</span>`,
  styleUrl: './state-pill.component.scss',
})
export class StatePillComponent {
  readonly state = input.required<StickerState>();
  readonly info = computed(() => STATES[this.state()]);
}
