import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumStore, Role } from '../../../core/services/album.store';
import { IconComponent } from '../icon/icon.component';

interface RoleItem {
  readonly id: Role;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'ma-role-switcher',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="roleswitch">
      @for (it of items; track it.id) {
        <button
          type="button"
          [class.active]="store.role() === it.id"
          (click)="switchRole(it.id)"
        >
          <ma-icon [name]="it.icon" size="sm" />
          {{ it.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './role-switcher.component.scss',
})
export class RoleSwitcherComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  readonly items: RoleItem[] = [
    { id: 'teacher', label: 'Tanári nézet',     icon: 'school'   },
    { id: 'student', label: 'Diák nézet',       icon: 'backpack' },
    { id: 'closure', label: 'Projektzáró nézet', icon: 'flag'    },
  ];

  /**
   * Navigate to the role's URL home. Each shell sets the role signal on entry
   * via an effect, so a direct setRole call here would only race with the URL.
   */
  switchRole(role: Role): void {
    const instanceId = this.store.activeInstanceId();
    this.store.closeRoleSensitiveOverlays();
    if (role === 'teacher') {
      const path = instanceId ? ['/teacher/instances', instanceId, 'plan'] : ['/teacher'];
      void this.router.navigate(path);
    } else if (role === 'student') {
      const path = instanceId ? ['/student/instances', instanceId, 'current'] : ['/student/home'];
      void this.router.navigate(path);
    } else {
      void this.router.navigate(['/closure']);
    }
  }
}
