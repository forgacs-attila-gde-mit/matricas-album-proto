import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumStore } from '../../core/services/album.store';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { StudentCurrentComponent } from '../student-current/student-current.component';
import { StudentEvidenceComponent } from '../student-evidence/student-evidence.component';
import { StudentFeedbackComponent } from '../student-feedback/student-feedback.component';
import { StudentHelpComponent } from '../student-help/student-help.component';
import { StudentReflectionComponent } from '../student-reflection/student-reflection.component';
import { StudentTeamComponent } from '../student-team/student-team.component';

@Component({
  selector: 'ma-student-album',
  standalone: true,
  imports: [
    ChipComponent,
    StudentCurrentComponent,
    StudentTeamComponent,
    StudentEvidenceComponent,
    StudentFeedbackComponent,
    StudentReflectionComponent,
    StudentHelpComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-album.component.html',
  styleUrl: './student-album.component.scss',
})
export class StudentAlbumComponent {
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;
}
