import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, input, output } from '@angular/core';

/**
 * Side drawer container. Renders a backdrop + sliding panel from the right.
 * Open state is driven by input — emit close when the backdrop or close button
 * is clicked.
 */
@Component({
  selector: 'ma-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="drawer-backdrop" (click)="close.emit()"></div>
      <div
        #drawerPanel
        class="drawer"
        [style.width]="width()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="ariaLabel()"
        tabindex="-1"
        (keydown)="handleKeydown($event)"
      >
        <ng-content />
      </div>
    }
  `,
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  readonly open = input(false);
  readonly width = input('min(720px, 100%)');
  readonly ariaLabel = input('Oldalsó panel');
  readonly close = output<void>();

  @ViewChild('drawerPanel') private readonly drawerPanel?: ElementRef<HTMLElement>;
  private previousFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        window.setTimeout(() => this.focusFirstElement());
      } else {
        this.restoreFocus();
      }
    });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.drawerPanel?.nativeElement.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    const first = this.focusableElements()[0] ?? this.drawerPanel?.nativeElement;
    first?.focus({ preventScroll: true });
  }

  private focusableElements(): HTMLElement[] {
    const panel = this.drawerPanel?.nativeElement;
    if (!panel) return [];
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(panel.querySelectorAll<HTMLElement>(selector))
      .filter(element => !element.hasAttribute('disabled') && element.tabIndex !== -1);
  }

  private restoreFocus(): void {
    if (!this.previousFocus) return;
    const target = this.previousFocus;
    this.previousFocus = null;
    window.setTimeout(() => target.focus({ preventScroll: true }));
  }
}
