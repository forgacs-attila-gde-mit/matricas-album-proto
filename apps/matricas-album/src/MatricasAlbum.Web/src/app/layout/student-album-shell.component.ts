import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlbumStore } from '../core/services/album.store';
import { ChipComponent } from '../shared/ui/chip/chip.component';

/**
 * Parent route for /student/instances/:instanceId/*. Hosts the team picker +
 * album poster (was the student-album wrapper) and a router-outlet for the
 * active student child page. Also binds the URL's instance ID to the store.
 */
@Component({
  selector: 'ma-student-album-shell',
  standalone: true,
  imports: [RouterOutlet, ChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="student-bg">
      <div class="content" style="background: transparent;">
        <div class="content-narrow">
          @if (store.teams.length > 1) {
            <div class="team-picker">
              <span class="team-picker-label">Csapat:</span>
              <div class="team-picker-options" role="radiogroup" aria-label="Csapat választása">
                @for (t of store.teams; track t.id) {
                  <button
                    type="button"
                    role="radio"
                    class="team-pill"
                    [class.team-pill-active]="team()?.id === t.id"
                    [attr.aria-checked]="team()?.id === t.id"
                    [style.--team-color]="t.color"
                    (click)="store.setStudentTeam(t.id)"
                  >
                    <span class="team-pill-dot"></span>
                    <span>{{ t.name }}</span>
                  </button>
                }
              </div>
            </div>
          }

          <div class="album-poster">
            <div class="row" style="margin-bottom: 14px;">
              <ma-chip tone="primary" icon="auto_stories">Matricás album</ma-chip>
              <ma-chip icon="calendar_month">{{ store.album.currentWeek }}. {{ store.albumUnitLabel }} • {{ store.album.duration }}</ma-chip>
              @if (team(); as currentTeam) {
                <ma-chip icon="groups">{{ currentTeam.name }}</ma-chip>
              }
            </div>
            <div class="muted t-body-sm tag-row">{{ store.album.subject }}</div>
            <div class="t-headline" style="margin-top: 6px; font-size: 28px;">{{ store.album.title }}</div>
            <div class="driving-q">"{{ store.album.drivingQ }}"</div>
            <div class="qmark">?</div>
          </div>

          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styleUrl: '../features/student-album/student-album.component.scss',
})
export class StudentAlbumShellComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('instanceId');
      if (!id) return;
      if (this.store.activeInstanceId() !== id) {
        void this.store.selectInstance(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
