import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipComponent } from '../ui/chip/chip.component';

/**
 * Wrapper used by all evidence attachments — provides a paper-like frame
 * with a title and "Melléklet" badge.
 */
@Component({
  selector: 'ma-attachment-frame',
  standalone: true,
  imports: [ChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <div class="row-between" style="margin-bottom: 14px;">
        <div>
          <div class="card-section-title" style="margin-bottom: 4px;">{{ type() }}</div>
          <div class="t-title">{{ title() }}</div>
        </div>
        <ma-chip icon="attach_file">Melléklet</ma-chip>
      </div>
      <ng-content />
    </div>
  `,
  styles: `
    :host { display: block; }
    .frame {
      background: #fbfaf6;
      border: 1px solid var(--n-200);
      border-radius: 18px;
      padding: 22px;
      position: relative;
      overflow: hidden;
    }
  `,
})
export class AttachmentFrameComponent {
  readonly title = input.required<string>();
  readonly type = input.required<string>();
}
