import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AttachmentFrameComponent } from './attachment-frame.component';

/** Photo + handwritten-style observation note for evidence e1. */
@Component({
  selector: 'ma-photo-attachment',
  standalone: true,
  imports: [AttachmentFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ma-attachment-frame title="Hely-fotó és megfigyelési jegyzet" type="Fotó + jegyzet">
      <div class="row">
        <div class="photo">
          <svg viewBox="0 0 200 150">
            <circle cx="160" cy="30" r="18" fill="#fef9c3" opacity="0.9" />
            <rect x="0" y="105" width="200" height="45" fill="#854d0e" opacity="0.6" />
            <rect x="0" y="100" width="200" height="10" fill="#92400e" opacity="0.8" />
            <g stroke="#262626" stroke-width="1.5" fill="none" opacity="0.5">
              <line x1="20" y1="60" x2="20" y2="105" />
              <line x1="50" y1="60" x2="50" y2="105" />
              <line x1="80" y1="60" x2="80" y2="105" />
              <line x1="110" y1="60" x2="110" y2="105" />
              <line x1="140" y1="60" x2="140" y2="105" />
              <line x1="170" y1="60" x2="170" y2="105" />
              <line x1="15" y1="68" x2="175" y2="68" />
              <line x1="15" y1="95" x2="175" y2="95" />
            </g>
          </svg>
          <div class="caption">Műfüves pálya déli oldala • 12:30</div>
        </div>
        <div class="note">
          <div class="note-label">Megfigyelési jegyzet</div>
          „A déli oldalon álló műfüves felületnél a járda is forró volt.
          A fűz fa körüli rész lényegesen hűvösebbnek tűnt.
          <br /><br />
          <strong>Hipotézis:</strong> az árnyék és a sötét burkolat együtt változtatja meg, mennyire melegszik fel a környezet."
        </div>
      </div>
    </ma-attachment-frame>
  `,
  styleUrl: './photo-attachment.component.scss',
})
export class PhotoAttachmentComponent {}
