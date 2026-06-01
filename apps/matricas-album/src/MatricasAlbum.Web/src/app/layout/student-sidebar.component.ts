import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AlbumStore } from '../core/services/album.store';
import { BrandComponent } from '../shared/ui/brand/brand.component';
import { IconComponent } from '../shared/ui/icon/icon.component';
import { TeamChipComponent } from '../shared/ui/team-chip/team-chip.component';

interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly segment: string;
}

@Component({
  selector: 'ma-student-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BrandComponent, IconComponent, TeamChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <ma-brand />

      <div class="nav-section">Csapat</div>
      <div style="padding: 4px 8px 8px;">
        @if (store.selectedStudentTeam(); as team) {
          <ma-team-chip [team]="team" />
          <div class="muted t-body-sm" style="margin-top: 8px;">
            Választott fókusz: <strong>{{ team.focus }}</strong>
          </div>
        } @else {
          <ma-team-chip [team]="null" />
          <div class="muted t-body-sm" style="margin-top: 8px;">
            Ehhez az albumhoz még nincs csapat rendelve.
          </div>
        }
      </div>

      <div class="nav-section">Album</div>
      @for (it of resolvedItems(); track it.label) {
        <a class="nav-item" [routerLink]="it.routerLink" routerLinkActive="active">
          <ma-icon [name]="it.icon" />
          {{ it.label }}
        </a>
      }

      <div style="flex: 1;"></div>
      <div class="divider"></div>
      @if (helpLink(); as link) {
        <a class="nav-item" [routerLink]="link" routerLinkActive="active">
          <ma-icon name="help" /> Segítség
        </a>
      }
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class StudentSidebarComponent {
  readonly store = inject(AlbumStore);
  readonly items: NavItem[] = [
    { label: 'Aktuális matrica', icon: 'bookmark',          segment: 'current' },
    { label: 'Csapatunk',        icon: 'groups',            segment: 'team' },
    { label: 'Bizonyítékaink',   icon: 'photo_library',     segment: 'evidence' },
    { label: 'Visszajelzések',   icon: 'rate_review',       segment: 'feedback' },
    { label: 'Reflexió',         icon: 'self_improvement',  segment: 'reflection' },
  ];

  readonly resolvedItems = computed(() => {
    const id = this.store.activeInstanceId();
    if (!id) return [];
    return this.items.map(item => ({ ...item, routerLink: ['/student', 'instances', id, item.segment] }));
  });

  readonly helpLink = computed(() => {
    const id = this.store.activeInstanceId();
    return id ? ['/student', 'instances', id, 'help'] : null;
  });
}
