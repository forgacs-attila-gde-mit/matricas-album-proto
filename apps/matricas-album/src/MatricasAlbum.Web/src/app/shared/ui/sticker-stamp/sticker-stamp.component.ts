import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { phaseInfo, PhaseId } from '../../../core/tokens/phases';
import { IconComponent } from '../icon/icon.component';

/** Decorative stamp used in the album poster and sticker detail header. */
@Component({
  selector: 'ma-sticker-stamp',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="sticker-stamp"
      [class]="'stamp-' + info().color"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      <ma-icon [name]="info().icon" />
    </div>
  `,
  styleUrl: './sticker-stamp.component.scss',
})
export class StickerStampComponent {
  readonly phase = input.required<PhaseId | string | null | undefined>();
  readonly size = input(96);
  readonly info = computed(() => phaseInfo(this.phase()));
}
