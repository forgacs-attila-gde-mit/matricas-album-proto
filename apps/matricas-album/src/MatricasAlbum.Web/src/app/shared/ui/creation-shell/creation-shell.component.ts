import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

/** A creation entry-mode offered on the chooser step (e.g. üres / AI / adaptálás / könyvtár / kontextus). */
export interface CreationMode {
  key: string;
  label: string;
  description?: string;
  icon?: string;
}

/**
 * REFACTOR-001 Task 1.2 — reusable creation shell.
 * Renders a calm mode-chooser step first; once a mode is chosen (or `initialMode`
 * is supplied) it shows a collapsible 3-pane layout. Purely presentational: the
 * left/center/right content is projected by the host; no domain logic here.
 *
 *   <ma-creation-shell [modes]="..." (modeSelected)="...">
 *     <div shellLeft>…</div><div shellCenter>…</div><div shellRight>…</div>
 *   </ma-creation-shell>
 */
@Component({
  selector: 'ma-creation-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showChooser()) {
      <div class="cs-chooser">
        @if (title()) {
          <h2 class="cs-title">{{ title() }}</h2>
        }
        <div class="cs-modes" role="list">
          @for (m of modes(); track m.key) {
            <button
              type="button"
              class="cs-mode"
              role="listitem"
              [attr.data-mode-key]="m.key"
              (click)="selectMode(m.key)"
            >
              <span class="cs-mode-label">{{ m.label }}</span>
              @if (m.description) {
                <span class="cs-mode-desc">{{ m.description }}</span>
              }
            </button>
          }
        </div>
      </div>
    } @else {
      <div
        class="cs-panes"
        [class.cs-left-collapsed]="!leftOpen()"
        [class.cs-right-collapsed]="!rightOpen()"
      >
        <button
          type="button"
          class="cs-toggle cs-toggle--left"
          data-toggle="left"
          [attr.aria-pressed]="!leftOpen()"
          [attr.aria-label]="leftOpen() ? 'Bal panel összecsukása' : 'Bal panel kinyitása'"
          (click)="toggleLeft()"
        >{{ leftOpen() ? '‹' : '›' }}</button>

        @if (leftOpen()) {
          <aside class="cs-left"><ng-content select="[shellLeft]"></ng-content></aside>
        }

        <section class="cs-center"><ng-content select="[shellCenter]"></ng-content></section>

        @if (rightOpen()) {
          <aside class="cs-right"><ng-content select="[shellRight]"></ng-content></aside>
        }

        <button
          type="button"
          class="cs-toggle cs-toggle--right"
          data-toggle="right"
          [attr.aria-pressed]="!rightOpen()"
          [attr.aria-label]="rightOpen() ? 'Jobb panel összecsukása' : 'Jobb panel kinyitása'"
          (click)="toggleRight()"
        >{{ rightOpen() ? '›' : '‹' }}</button>
      </div>
    }
  `,
  styleUrl: './creation-shell.component.scss',
})
export class CreationShellComponent {
  /** Entry modes shown on the chooser step. Empty array = no chooser buttons. */
  readonly modes = input<CreationMode[]>([]);
  /** Optional heading shown above the chooser. */
  readonly title = input<string>('');
  /** When set, the chooser is skipped and the panes show immediately (e.g. editing an existing item). */
  readonly initialMode = input<string | null>(null);
  /** Emits the chosen mode key. */
  readonly modeSelected = output<string>();

  private readonly _selected = signal<string | null>(null);
  readonly selectedMode = computed<string | null>(() => this._selected() ?? this.initialMode());
  readonly showChooser = computed<boolean>(() => this.selectedMode() == null);
  readonly leftOpen = signal(true);
  readonly rightOpen = signal(true);

  selectMode(key: string): void {
    this._selected.set(key);
    this.modeSelected.emit(key);
  }

  toggleLeft(): void {
    this.leftOpen.update((v) => !v);
  }

  toggleRight(): void {
    this.rightOpen.update((v) => !v);
  }
}
