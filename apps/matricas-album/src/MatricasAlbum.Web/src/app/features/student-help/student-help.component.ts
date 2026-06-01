import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-student-help',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" style="margin-top: 24px;">
      <div class="card">
        <div class="card-section-title">Segítség</div>
        <div class="t-title-lg">Tanári segítséget szeretnétek?</div>
        <div class="muted t-body" style="margin-top: 6px;">
          Itt írhattok közvetlenül a tanárnak, anélkül, hogy bizonyítékot kellene beküldenetek.
          A kérdés bekerül a tanár segítségkérés-sorába.
        </div>

        <div style="margin-top: 14px;">
          <label class="muted t-body-sm" for="help-target-sticker">
            Melyik matricához kapcsolódik (opcionális)?
          </label>
          <select
            id="help-target-sticker"
            class="help-select"
            [ngModel]="targetStickerId()"
            (ngModelChange)="targetStickerId.set($event)"
          >
            <option [ngValue]="null">— Általános kérdés —</option>
            @for (s of stickerOptions(); track s.id) {
              <option [ngValue]="s.id">{{ s.week }}. hét · {{ s.title }}</option>
            }
          </select>
        </div>

        <textarea
          class="help-input"
          rows="4"
          placeholder="Mit nem értetek, vagy hol kértek tanári segítséget?"
          [(ngModel)]="question"
        ></textarea>

        <div class="row" style="margin-top: 10px; justify-content: flex-end;">
          <ma-btn
            variant="primary"
            icon="support_agent"
            [disabled]="!canSubmit() || submitting()"
            (clicked)="submit()"
          >
            Segítségkérés küldése
          </ma-btn>
        </div>
      </div>

      @if (history().length > 0) {
        <div class="card">
          <div class="row-between">
            <div>
              <div class="card-section-title">Eddigi segítségkéréseink</div>
              <div class="t-title-lg">A csapatunk korábbi kérései</div>
            </div>
            <div class="row" style="gap: 8px; flex-wrap: wrap;">
              @if (openCount() > 0) {
                <ma-chip tone="warning" icon="schedule">{{ openCount() }} nyitott</ma-chip>
              }
              <ma-chip icon="support_agent">{{ history().length }} összesen</ma-chip>
            </div>
          </div>
          <div class="help-list">
            @for (req of history(); track req.id) {
              <div class="help-row" [class.help-row-resolved]="req.resolvedAt">
                <ma-icon [name]="req.resolvedAt ? 'check_circle' : 'schedule'" />
                <div class="help-row-text">
                  <div class="t-body">{{ req.question }}</div>
                  @if (stickerLabel(req.instanceStickerId); as label) {
                    <div class="muted t-body-sm" style="margin-top: 4px;">Matrica: {{ label }}</div>
                  }
                </div>
                <ma-chip [tone]="req.resolvedAt ? 'success' : 'warning'" [icon]="req.resolvedAt ? 'check' : 'schedule'">
                  {{ req.resolvedAt ? 'Megoldva' : 'Nyitott' }}
                </ma-chip>
              </div>
            }
          </div>
        </div>
      }

      <div class="card">
        <div class="card-section-title">Mi az a matricás album?</div>
        <ul class="vocab">
          <li><strong>Matrica:</strong> egy mini-tanulási epizód, amelyhez van diákfeladat, közös döntés, beküldhető bizonyíték és reflexió.</li>
          <li><strong>Vezérkérdés:</strong> a több héten átívelő nyílt kérdés, ami köré épül az album.</li>
          <li><strong>Bizonyíték (evidence):</strong> minden látható tanulói nyom — fotó, mérés, jegyzet, érvtérkép, prezentáció.</li>
          <li><strong>Reflexió:</strong> nem csak az számít, mi készült el, hanem hogy mi változott a csapat gondolkodásában.</li>
          <li><strong>Csapatunk haladása:</strong> minden csapat saját ütemben halad; az "Aktuális matrica" lapon látszik, mi az éppen aktuális dolgunk.</li>
        </ul>
      </div>
    </div>
  `,
  styles: `
    .help-input {
      margin-top: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      font: inherit;
      resize: vertical;
    }
    .help-select {
      display: block;
      width: 100%;
      max-width: 480px;
      margin-top: 6px;
      padding: 8px 12px;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      background: white;
      font: inherit;
    }
    .help-list {
      display: grid;
      gap: 8px;
      margin-top: 8px;
    }
    .help-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 12px 14px;
      border: 1px solid var(--n-200);
      border-radius: 12px;
      background: white;

      ma-icon { color: var(--warning, #c98612); margin-top: 2px; }
    }
    .help-row-resolved {
      opacity: 0.78;
      ma-icon { color: var(--success, #1f7a4a); }
    }
    .help-row-text {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .vocab {
      margin: 8px 0 0;
      padding-left: 22px;
      color: var(--n-800);
    }
    .vocab li {
      margin-bottom: 6px;
    }
  `,
})
export class StudentHelpComponent {
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;

  question = '';
  readonly targetStickerId = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly stickerOptions = computed(() =>
    [...this.store.stickers()].sort((a, b) => a.week - b.week),
  );

  readonly history = computed(() => {
    const team = this.team();
    return team ? this.store.helpRequestsForTeam(team.id) : [];
  });

  readonly openCount = computed(() => this.history().filter(row => !row.resolvedAt).length);

  canSubmit(): boolean {
    return Boolean(this.team()) && this.question.trim().length > 0;
  }

  stickerLabel(id: string | null | undefined): string | null {
    if (!id) return null;
    const sticker = this.store.stickers().find(s => s.id === id);
    return sticker ? `${sticker.week}. hét · ${sticker.title}` : null;
  }

  async submit(): Promise<void> {
    const text = this.question.trim();
    if (!text) return;
    this.submitting.set(true);
    try {
      await this.store.submitHelpRequest(text, this.targetStickerId());
      this.question = '';
      this.targetStickerId.set(null);
    } finally {
      this.submitting.set(false);
    }
  }
}
