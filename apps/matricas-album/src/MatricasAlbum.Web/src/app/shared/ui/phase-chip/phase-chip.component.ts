import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { phaseInfo, PhaseId } from '../../../core/tokens/phases';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'ma-phase-chip',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip" [class]="'chip-phase-' + info().color">
      <ma-icon [name]="info().icon" size="sm" />
      {{ info().label }}
    </span>
  `,
  styleUrl: './phase-chip.component.scss',
})
export class PhaseChipComponent {
  readonly phase = input.required<PhaseId | string | null | undefined>();
  readonly info = computed(() => phaseInfo(this.phase()));
}
