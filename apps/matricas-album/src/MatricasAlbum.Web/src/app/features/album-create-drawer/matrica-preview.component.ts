import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PhaseId } from '../../core/tokens/phases';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';
import { StickerStampComponent } from '../../shared/ui/sticker-stamp/sticker-stamp.component';

/**
 * REFACTOR-001 Task 1.4 — read-only, student-facing preview of the matrica being
 * created. Bound live to the create-drawer's draft fields so a teacher sees what
 * the activity will look like as they type. Presentational; no store dependency.
 */
@Component({
  selector: 'ma-matrica-preview',
  standalone: true,
  imports: [PhaseChipComponent, StickerStampComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="matrica-preview" aria-label="Matrica előnézet">
      <header class="mp-head">
        <ma-sticker-stamp [phase]="phase()" [size]="56" />
        <div class="mp-head-text">
          <ma-phase-chip [phase]="phase()" />
          <h3 class="mp-title">{{ titleText() }}</h3>
        </div>
      </header>

      @if (shortText()) {
        <p class="mp-short">{{ shortText() }}</p>
      }

      <div class="mp-section">
        <div class="mp-label">Diák instrukció</div>
        @if (instructionText()) {
          <p class="mp-instruction">{{ instructionText() }}</p>
        } @else {
          <p class="mp-placeholder">Az instrukció itt jelenik meg, ahogy gépeled.</p>
        }
      </div>

      <div class="mp-evidence">
        <span class="mp-label">Bizonyíték</span>
        <span class="mp-evidence-value">{{ evidenceText() || 'Nincs megadva' }}</span>
      </div>
    </article>
  `,
  styleUrl: './matrica-preview.component.scss',
})
export class MatricaPreviewComponent {
  readonly title = input<string>('');
  readonly phase = input<PhaseId | string | null | undefined>('kerdezes');
  readonly short = input<string>('');
  readonly instruction = input<string>('');
  readonly evidence = input<string>('');

  readonly titleText = computed(() => this.title().trim() || 'Tevékenység címe');
  readonly shortText = computed(() => this.short().trim());
  readonly instructionText = computed(() => this.instruction().trim());
  readonly evidenceText = computed(() => this.evidence().trim());
}
