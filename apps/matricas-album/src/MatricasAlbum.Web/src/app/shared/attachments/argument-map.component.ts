import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AttachmentFrameComponent } from './attachment-frame.component';

interface Reason {
  readonly reason: string;
  readonly example: string;
}

/**
 * Érvtérkép (argument map) attachment for the role-card evidence (e2).
 * 1 claim → 3 reasons → 3 examples, with SVG connector lines.
 */
@Component({
  selector: 'ma-argument-map',
  standalone: true,
  imports: [AttachmentFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ma-attachment-frame
      title="Érvtérkép – Alsós gyerek szerepe"
      type="Érvtérkép (Argument map)"
    >
      <div class="map">
        <div class="claim">
          <div class="card-section-title" style="color: var(--primary-700); margin-bottom: 4px; font-size: 10px;">
            Állítás
          </div>
          {{ claim }}
        </div>

        <svg width="100%" height="48" viewBox="0 0 600 48" preserveAspectRatio="none" style="max-width: 580px;">
          <path
            d="M300 0 L300 16 M100 16 L500 16 M100 16 L100 48 M300 16 L300 48 M500 16 L500 48"
            stroke="#d4d4d4" stroke-width="1.5" fill="none"
          />
        </svg>

        <div class="reasons">
          @for (r of reasons; track r.reason) {
            <div class="reason-col">
              <div class="reason">
                <div class="card-section-title" style="margin-bottom: 2px; font-size: 9px;">Indok</div>
                {{ r.reason }}
              </div>
              <svg width="20" height="24"><path d="M10 0 L10 24" stroke="#d4d4d4" stroke-width="1.5" fill="none" /></svg>
              <div class="example">
                <div class="card-section-title" style="color: var(--primary-700); margin-bottom: 2px; font-size: 9px;">Példa</div>
                „{{ r.example }}"
              </div>
            </div>
          }
        </div>

        <div class="muted t-body-sm" style="margin-top: 18px; text-align: center;">
          Készítette: <strong>Árnyékkommandó</strong> • 2. hét csütörtök • Szerep: alsós gyerek
        </div>
      </div>
    </ma-attachment-frame>
  `,
  styleUrl: './argument-map.component.scss',
})
export class ArgumentMapComponent {
  readonly claim = 'A déli szünetben nincs hová leülni az udvaron';
  readonly reasons: Reason[] = [
    { reason: 'A padok mind a napon vannak', example: 'Hétfőn a 3.a padjai annyira melegek voltak, hogy senki nem ült le.' },
    { reason: 'A fűre forró, és tűz a nap',  example: '12:30-kor a műfüves rész túl forró volt mezítláb is.' },
    { reason: 'A fa alatti rész sáros eső után', example: 'Keddi eső után a hárs alatti pad körül 2 napig sár volt.' },
  ];
}
