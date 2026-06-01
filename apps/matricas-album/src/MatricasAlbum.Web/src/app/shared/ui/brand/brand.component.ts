import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Lecke butterfly mark + wordmark + product tag. */
@Component({
  selector: 'ma-brand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="brand">
      <img src="assets/butterfly-mark.svg" class="mark" alt="lecke" />
      <div style="display: flex; flex-direction: column; line-height: 1;">
        <span class="wordmark">lecke</span>
        <span class="dot">MATRICÁS ALBUM</span>
      </div>
    </div>
  `,
  styleUrl: './brand.component.scss',
})
export class BrandComponent {}
