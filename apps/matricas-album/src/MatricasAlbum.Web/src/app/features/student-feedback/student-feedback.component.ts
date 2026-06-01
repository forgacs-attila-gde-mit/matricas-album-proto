import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Evidence, Sticker, TeamStickerProgress } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface FeedbackRow {
  readonly evidence: Evidence;
  readonly sticker: Sticker | null;
  readonly progress: TeamStickerProgress | null;
  readonly unread: boolean;
}

@Component({
  selector: 'ma-student-feedback',
  standalone: true,
  imports: [BtnComponent, ChipComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" style="margin-top: 24px;">
      @if (entries().length === 0) {
        <div class="card" style="text-align: center; padding: 32px;">
          <ma-icon name="rate_review" size="xl" />
          <div class="t-title-lg" style="margin-top: 8px;">Még nincs tanári visszajelzés</div>
          <div class="muted t-body-sm" style="margin-top: 6px;">
            Amint a tanár visszajelzést ír egy bizonyítékotokra, itt jelenik meg.
          </div>
        </div>
      } @else {
        <div class="card">
          <div class="row-between">
            <div>
              <div class="card-section-title">Tanári visszajelzések</div>
              <div class="t-title-lg">Mit írt a tanár a csapatunknak</div>
            </div>
            <div class="row" style="gap: 8px; flex-wrap: wrap;">
              @if (unreadCount() > 0) {
                <ma-chip tone="primary" icon="mark_email_unread">{{ unreadCount() }} új</ma-chip>
              }
              <ma-chip icon="rate_review">{{ entries().length }} visszajelzés</ma-chip>
            </div>
          </div>
        </div>

        <div class="feedback-list">
          @for (row of entries(); track row.evidence.id) {
            <div class="feedback-row" [class.feedback-row-unread]="row.unread">
              <button type="button" class="feedback-main" (click)="openEvidence(row)">
                <ma-icon name="rate_review" />
                <div class="feedback-text">
                  <div class="row" style="gap: 8px; flex-wrap: wrap; align-items: center;">
                    <div class="t-title">{{ row.evidence.title }}</div>
                    @if (row.unread) {
                      <ma-chip tone="primary" icon="fiber_new">Új</ma-chip>
                    }
                  </div>
                  @if (row.sticker; as st) {
                    <div class="muted t-body-sm">Matrica: {{ st.title }}</div>
                  }
                  <div class="t-body feedback-body">{{ row.evidence.teacherFeedback }}</div>
                </div>
                @if (row.progress?.state === 'javitas') {
                  <ma-chip tone="warning" icon="redo">Javítás kérve</ma-chip>
                } @else if (row.progress?.state === 'elkeszult' || row.progress?.state === 'reflektalt') {
                  <ma-chip tone="success" icon="check">Lezárt</ma-chip>
                }
              </button>
              @if (row.progress?.state === 'javitas') {
                <div class="feedback-action">
                  <ma-btn variant="secondary" icon="upload" (clicked)="goToRevision()">
                    Új beküldés ehhez a matricához
                  </ma-btn>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .feedback-list {
      display: grid;
      gap: 12px;
    }
    .feedback-row {
      border: 1px solid var(--n-200);
      border-radius: 12px;
      background: white;
      overflow: hidden;
      transition: border-color 120ms, box-shadow 120ms;

      &:hover {
        border-color: var(--primary-300);
        box-shadow: var(--shadow-md);
      }
    }
    .feedback-row-unread {
      border-color: var(--primary-400, #7c6ce0);
      box-shadow: 0 0 0 1px var(--primary-100, #efeaff) inset;
    }
    .feedback-main {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      padding: 14px 16px;
      width: 100%;
      background: transparent;
      text-align: left;
      cursor: pointer;
      border: 0;

      ma-icon { color: var(--n-500); margin-top: 2px; }
    }
    .feedback-text {
      min-width: 0;
      display: grid;
      gap: 4px;
    }
    .feedback-body {
      margin-top: 4px;
      color: var(--n-700);
    }
    .feedback-action {
      padding: 0 16px 12px;
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class StudentFeedbackComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);
  readonly team = this.store.selectedStudentTeam;

  readonly entries = computed<FeedbackRow[]>(() => {
    const team = this.team();
    if (!team) return [];
    return this.store.evidence()
      .filter(evidence =>
        evidence.teamId === team.id &&
        evidence.teacherFeedback !== null &&
        evidence.teacherFeedback !== undefined &&
        evidence.teacherFeedback.trim().length > 0,
      )
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map(evidence => ({
        evidence,
        sticker: this.store.stickers().find(sticker => sticker.id === evidence.stickerId) ?? null,
        progress: this.store.progressFor(evidence.stickerId, team.id),
        unread: !evidence.seenByTeamAt,
      }));
  });

  readonly unreadCount = computed(() => this.entries().filter(row => row.unread).length);

  openEvidence(row: FeedbackRow): void {
    if (row.unread) {
      void this.store.markEvidenceSeen(row.evidence.id);
    }
    this.store.openEvidence(row.evidence.id);
  }

  goToRevision(): void {
    const id = this.store.activeInstanceId();
    if (id) void this.router.navigate(['/student/instances', id, 'current']);
  }
}
