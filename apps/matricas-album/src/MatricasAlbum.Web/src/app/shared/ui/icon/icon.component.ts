import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ma-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="material-symbols-rounded" [class]="sizeCls()">{{ name() }}</span>`,
  styles: `:host { display: inline-flex; align-items: center; justify-content: center; }`,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  sizeCls() {
    const s = this.size();
    return s === 'sm' ? 'ic-sm' : s === 'lg' ? 'ic-lg' : s === 'xl' ? 'ic-xl' : '';
  }
}
