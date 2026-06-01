import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Team, TeamMember } from '../../../core/models/album.model';

@Component({
  selector: 'ma-team-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="team-chip">
      @if (team(); as currentTeam) {
        <span class="avatars">
          @for (m of currentTeam.members.slice(0, 4); track m.id) {
            <span [style.background]="currentTeam.color">{{ memberInitial(m) }}</span>
          }
        </span>
        {{ currentTeam.name }}
      } @else {
        <span class="avatars">
          <span>N</span>
        </span>
        Nincs csapat
      }
    </span>
  `,
  styleUrl: './team-chip.component.scss',
})
export class TeamChipComponent {
  readonly team = input<Team | null | undefined>(null);

  memberInitial(member: TeamMember): string {
    return member.name.trim().charAt(0) || '?';
  }
}
