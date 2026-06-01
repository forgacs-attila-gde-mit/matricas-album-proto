import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Evidence } from '../../core/models/album.model';
import { ArgumentMapComponent } from './argument-map.component';
import { MeasurementTableComponent } from './measurement-table.component';
import { PhotoAttachmentComponent } from './photo-attachment.component';

/**
 * Picks the right attachment artifact for a piece of evidence by id.
 * Replaces the React `<EvidenceAttachment>` switch.
 */
@Component({
  selector: 'ma-evidence-attachment',
  standalone: true,
  imports: [ArgumentMapComponent, MeasurementTableComponent, PhotoAttachmentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (evidence().id) {
      @case ('e1') { <ma-photo-attachment /> }
      @case ('e2') { <ma-argument-map /> }
      @case ('e3') { <ma-measurement-table /> }
      @case ('e4') { <ma-measurement-table /> }
      @case ('e5') { <ma-measurement-table /> }
    }
  `,
})
export class EvidenceAttachmentComponent {
  readonly evidence = input.required<Evidence>();
}
