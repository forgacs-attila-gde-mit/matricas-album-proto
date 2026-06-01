import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Sticker, Team, TeamProgressState } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { ChipComponent, ChipTone } from '../../shared/ui/chip/chip.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';

interface ProgressRow {
  readonly sticker: Sticker;
  readonly state: TeamProgressState | null;
  readonly stateLabel: string;
  readonly stateTone: ChipTone;
  readonly stateIcon: string;
  readonly description: string;
}

interface WeekGroup {
  readonly week: number;
  readonly title: string;
  readonly rows: ProgressRow[];
}

interface ProgressStat {
  readonly label: string;
  readonly value: number;
  readonly tone: ChipTone;
  readonly icon: string;
}

const STATE_PRESENTATION: Record<TeamProgressState | 'nincs' | 'tervezett', { label: string; tone: ChipTone; icon: string }> = {
  nincs:      { label: 'Még nem indult', tone: 'neutral', icon: 'play_arrow' },
  varakozik:  { label: 'Beküldve',       tone: 'warning', icon: 'schedule' },
  javitas:    { label: 'Javítás kérve',  tone: 'warning', icon: 'redo' },
  elkeszult:  { label: 'Lezárt',         tone: 'success', icon: 'check' },
  reflektalt: { label: 'Reflektálva',    tone: 'success', icon: 'task_alt' },
  tervezett:  { label: 'A tanár nyitja meg', tone: 'neutral', icon: 'lock' },
};

@Component({
  selector: 'ma-student-team',
  standalone: true,
  imports: [ChipComponent, PhaseChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" style="margin-top: 24px;">
      @if (team(); as t) {
        <div class="card">
          <div class="row-between">
            <div>
              <div class="card-section-title">Csapatunk</div>
              <div class="t-title-lg">{{ t.name }}</div>
              <div class="muted t-body-sm" style="margin-top: 4px;">
                Fókusz: <strong>{{ t.focus }}</strong>
              </div>
            </div>
            <ma-chip icon="groups">{{ t.members.length }} fő</ma-chip>
          </div>
          @if (t.members.length > 0) {
            <div class="muted t-body-sm" style="margin-top: 10px;">
              Tagok: {{ memberNames(t) }}
            </div>
          }
        </div>
      }

      <div class="card">
        <div class="card-section-title">Haladásunk</div>
        <div class="t-title-lg" style="margin-bottom: 12px;">Az album minden matricája</div>
        <div class="progress-stats">
          @for (stat of stats(); track stat.label) {
            <ma-chip [tone]="stat.tone" [icon]="stat.icon">{{ stat.value }} · {{ stat.label }}</ma-chip>
          }
        </div>
      </div>

      @for (group of weekGroups(); track group.week) {
        <div class="card progress-week">
          <div class="row-between">
            <div>
              <div class="card-section-title">{{ group.week }}. hét</div>
              <div class="t-title-lg">{{ group.title }}</div>
            </div>
            <ma-chip icon="bookmark">{{ group.rows.length }} matrica</ma-chip>
          </div>
          <div class="progress-list">
            @for (row of group.rows; track row.sticker.id) {
              <button type="button" class="progress-row" (click)="store.openSticker(row.sticker.id)">
                <ma-phase-chip [phase]="row.sticker.phase" />
                <div class="progress-row-text">
                  <div class="t-title">{{ row.sticker.title }}</div>
                  <div class="muted t-body-sm">{{ row.description }}</div>
                </div>
                <ma-chip [tone]="row.stateTone" [icon]="row.stateIcon">{{ row.stateLabel }}</ma-chip>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .progress-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .progress-week {
      display: grid;
      gap: 14px;
    }
    .progress-list {
      display: grid;
      gap: 8px;
    }
    .progress-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--n-200);
      border-radius: 12px;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease;

      &:hover {
        border-color: var(--primary-300);
        box-shadow: var(--shadow-md);
      }
    }
    .progress-row-text {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .progress-row-text .t-body-sm {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
    }
  `,
})
export class StudentTeamComponent {
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;

  memberNames(team: Team): string {
    return team.members.map(m => m.name).join(', ');
  }

  private readonly rows = computed<ProgressRow[]>(() => {
    const teamId = this.team()?.id;
    return this.store.stickers().map(sticker => {
      const progress = teamId ? this.store.progressFor(sticker.id, teamId) : null;
      const stateKey: TeamProgressState | 'nincs' | 'tervezett' =
        sticker.state === 'tervezett' ? 'tervezett' :
        progress?.state ?? 'nincs';
      const presentation = STATE_PRESENTATION[stateKey];
      return {
        sticker,
        state: progress?.state ?? null,
        stateLabel: presentation.label,
        stateTone: presentation.tone,
        stateIcon: presentation.icon,
        description: sticker.state === 'tervezett' ? 'A tanár nyitja meg a megfelelő időben.' : sticker.short,
      };
    });
  });

  readonly weekGroups = computed<WeekGroup[]>(() => {
    const titles = this.store.album.weekTitles ?? [];
    const groups = new Map<number, ProgressRow[]>();
    for (const row of this.rows()) {
      const list = groups.get(row.sticker.week) ?? [];
      list.push(row);
      groups.set(row.sticker.week, list);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, rows]) => ({
        week,
        title: titles[week - 1] ?? `${week}. hét`,
        rows: rows.sort((a, b) => (a.sticker.sortOrder ?? 0) - (b.sticker.sortOrder ?? 0)),
      }));
  });

  readonly stats = computed<ProgressStat[]>(() => {
    const rows = this.rows();
    const total = rows.length;
    const closed = rows.filter(row => row.state === 'elkeszult' || row.state === 'reflektalt').length;
    const inProgress = rows.filter(row => row.state === 'varakozik' || row.state === 'javitas').length;
    const upcoming = rows.filter(row => row.sticker.state === 'tervezett').length;
    const notStarted = total - closed - inProgress - upcoming;
    return [
      { label: 'matrica összesen', value: total, tone: 'neutral', icon: 'bookmark' },
      { label: 'lezárt',           value: closed, tone: 'success', icon: 'check' },
      { label: 'folyamatban',      value: inProgress, tone: 'warning', icon: 'schedule' },
      { label: 'még nem indult',   value: notStarted, tone: 'neutral', icon: 'play_arrow' },
      { label: 'tanár nyitja meg', value: upcoming, tone: 'neutral', icon: 'lock' },
    ];
  });
}
