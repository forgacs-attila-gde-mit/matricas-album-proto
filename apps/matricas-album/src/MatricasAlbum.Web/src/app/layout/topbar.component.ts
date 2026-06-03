import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BtnComponent } from '../shared/ui/btn/btn.component';
import { IconComponent } from '../shared/ui/icon/icon.component';
import { RoleSwitcherComponent } from '../shared/ui/role-switcher/role-switcher.component';

export interface Crumb {
  readonly label: string;
  readonly strong?: boolean;
}

@Component({
  selector: 'ma-topbar',
  standalone: true,
  imports: [BtnComponent, IconComponent, RoleSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="crumbs">
        @for (c of crumbs(); track $index; let i = $index) {
          @if (i > 0) { <ma-icon name="chevron_right" size="sm" /> }
          @if (c.strong) { <strong>{{ c.label }}</strong> }
          @else { <span>{{ c.label }}</span> }
        }
      </div>
      <div class="spacer"></div>
      <ma-role-switcher />
      <ma-btn variant="ghost" [iconOnly]="true" icon="help" ariaLabel="Súgó" />
      <ma-btn variant="ghost" [iconOnly]="true" icon="notifications" ariaLabel="Értesítések" />
      <div class="avatar">NA</div>
    </header>
  `,
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly crumbs = input<Crumb[]>([]);
}
