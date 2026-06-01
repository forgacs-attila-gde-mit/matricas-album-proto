import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DifferentiationPath, DifferentiationPathKey, Team } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { StickerStampComponent } from '../../shared/ui/sticker-stamp/sticker-stamp.component';

interface PathPresentation {
  readonly icon: string;
  readonly tone: string;
}

@Component({
  selector: 'ma-differentiation',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, IconComponent, StickerStampComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <h1>Differenciálás</h1>
          <div class="sub">A különbség ne több munka legyen, hanem más típusú támasz.</div>
        </div>
      </div>

      <div class="card selector-card">
        <div class="row-between">
          <div class="t-title">Melyik matricához differenciálsz?</div>
          <div class="tabs">
            @for (s of store.stickers(); track s.id) {
              <button
                type="button"
                [class.active]="activeStickerId() === s.id"
                (click)="selectedId.set(s.id)"
              >
                {{ s.week }}. {{ store.albumUnitLabel }}
              </button>
            } @empty {
              <span class="muted t-body-sm">Nincs választható futó matrica.</span>
            }
          </div>
        </div>
      </div>

      @if (selectedSticker(); as s) {
        <div class="card selected-sticker-card">
          <div class="row" style="gap: 14px;">
            <ma-sticker-stamp [phase]="s.phase" [size]="64" />
            <div>
              <div class="t-title-lg">{{ s.title }}</div>
              <div class="muted t-body-sm" style="margin-top: 4px;">{{ s.short }}</div>
              <button type="button" class="link-btn" (click)="store.openSticker(s.id)">
                <ma-icon name="open_in_new" size="sm" /> Matrica részletek
              </button>
            </div>
          </div>
        </div>
      }

      <div class="grid-3">
        @for (p of paths(); track p.pathKey) {
          <div class="card path-card" [style.border-top-color]="presentation(p.pathKey).tone">
            @if (editingKey() === p.pathKey) {
              <label class="path-field">
                <span>Út neve</span>
                <input [ngModel]="editTitle()" (ngModelChange)="editTitle.set($event)" />
              </label>
              <label class="path-field">
                <span>Tanulói támasz</span>
                <textarea rows="5" [ngModel]="editDescription()" (ngModelChange)="editDescription.set($event)"></textarea>
              </label>
              <label class="path-field">
                <span>Kinek ajánljuk</span>
                <textarea rows="3" [ngModel]="editRecommendedFor()" (ngModelChange)="editRecommendedFor.set($event)"></textarea>
              </label>
              <div class="path-actions">
                <ma-btn size="sm" variant="ghost" icon="close" (clicked)="cancelEdit()">Mégse</ma-btn>
                <ma-btn size="sm" variant="primary" icon="save" (clicked)="savePath(p)">Mentés</ma-btn>
              </div>
            } @else {
              <div class="row-between path-head">
                <div class="row" style="gap: 8px;">
                  <ma-icon [name]="presentation(p.pathKey).icon" [style.color]="presentation(p.pathKey).tone" />
                  <div class="t-title-lg" style="color: var(--n-900);">{{ p.title }}</div>
                </div>
                <ma-btn size="sm" variant="ghost" icon="edit" (clicked)="startEdit(p)">Testreszabás</ma-btn>
              </div>
              <div class="t-body">{{ p.description }}</div>
              <div class="divider"></div>
              <div class="card-section-title">Kinek ajánljuk</div>
              <div class="t-body-sm muted-strong">{{ p.recommendedFor }}</div>
              <div class="assigned-strip">
                @for (team of teamsForPath(p.pathKey); track team.id) {
                  <span class="assigned-pill" [style.border-color]="team.color">
                    <span class="team-dot" [style.background]="team.color"></span>
                    {{ team.name }}
                  </span>
                } @empty {
                  <span class="muted t-body-sm">Nincs csapat erre az útra kiosztva.</span>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="card path-card">
            <div class="row" style="margin-bottom: 10px;">
              <ma-icon name="tune" />
              <div class="t-title-lg" style="color: var(--n-900);">Nincs differenciálási út</div>
            </div>
            <div class="t-body">Válassz futó matricát, hogy megjelenjenek a differenciálási opciók.</div>
          </div>
        }
      </div>

      @if (selectedSticker(); as sticker) {
        <div class="card team-assignment-card">
          <div class="row-between" style="gap: 12px; flex-wrap: wrap;">
            <div>
              <div class="card-section-title">Csapatút kiosztása</div>
              <div class="t-title-lg">Melyik csapat milyen támaszt kap ennél a matricánál?</div>
            </div>
            <ma-chip icon="shield">Nem rangsor</ma-chip>
          </div>
          <div class="assignment-list">
            @for (team of store.teams; track team.id) {
              <div class="assignment-row">
                <div class="team-name">
                  <span class="team-dot" [style.background]="team.color"></span>
                  <div>
                    <div class="t-title">{{ team.name }}</div>
                    <div class="muted t-body-sm">{{ team.focus }}</div>
                  </div>
                </div>
                <div class="path-selectors">
                  @for (p of paths(); track p.pathKey) {
                    <button
                      type="button"
                      class="path-selector"
                      [class.active]="assignmentFor(sticker.id, team.id) === p.pathKey"
                      [style.--path-color]="presentation(p.pathKey).tone"
                      (click)="toggleTeamPath(sticker.id, team.id, p.pathKey)"
                    >
                      {{ shortLabel(p.pathKey) }}
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="muted t-body-sm">Nincs csapat ehhez a futtatáshoz.</div>
            }
          </div>
        </div>
      }

      <div class="card history-card">
        <div class="row-between" style="gap: 12px; flex-wrap: wrap;">
          <div>
            <div class="card-section-title">Tanári adaptációs nyom</div>
            <div class="t-title-lg">Melyik úton haladtak a csapatok?</div>
          </div>
          <ma-chip icon="visibility">Tanári tanulás</ma-chip>
        </div>
        <div class="history-list">
          @for (item of assignmentHistory(); track item.key) {
            <div class="history-row">
              <div>
                <div class="t-title">{{ item.stickerTitle }}</div>
                <div class="muted t-body-sm">{{ item.unitLabel }} • {{ item.teamName }}</div>
              </div>
              <ma-chip icon="route">{{ labelFor(item.pathKey) }}</ma-chip>
            </div>
          } @empty {
            <div class="muted t-body-sm">Még nincs csapatút-kiosztás ebben a futtatásban.</div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './differentiation.component.scss',
})
export class DifferentiationComponent {
  readonly store = inject(AlbumStore);
  readonly selectedId = signal<string | null>(null);
  readonly editingKey = signal<DifferentiationPathKey | null>(null);
  readonly editTitle = signal('');
  readonly editDescription = signal('');
  readonly editRecommendedFor = signal('');

  readonly selectedSticker = computed(() =>
    this.store.stickers().find(sticker => sticker.id === this.selectedId()) ?? this.store.stickers()[0] ?? null
  );

  readonly activeStickerId = computed(() => this.selectedSticker()?.id ?? null);

  readonly paths = computed(() => {
    const sticker = this.selectedSticker();
    return sticker ? this.store.differentiationPathsForPhase(sticker.phase) : [];
  });

  readonly assignmentHistory = computed(() => {
    return this.store.teamDifferentiationPaths()
      .map(assignment => {
        const sticker = this.store.stickers().find(item => item.id === assignment.instanceStickerId);
        const team = this.store.teams.find(item => item.id === assignment.teamId);
        if (!sticker || !team) return null;
        return {
          key: `${assignment.instanceStickerId}-${assignment.teamId}`,
          stickerTitle: sticker.title,
          teamName: team.name,
          pathKey: assignment.pathKey,
          unitLabel: `${sticker.week}. ${this.store.albumUnitLabel}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.unitLabel.localeCompare(b.unitLabel, 'hu-HU') || a.teamName.localeCompare(b.teamName, 'hu-HU'));
  });

  presentation(pathKey: DifferentiationPathKey): PathPresentation {
    return PATH_PRESENTATION[pathKey];
  }

  shortLabel(pathKey: DifferentiationPathKey): string {
    return pathKey === 'tamogatott' ? 'Támasz' : pathKey === 'kihivas' ? 'Kihívás' : 'Alap';
  }

  labelFor(pathKey: DifferentiationPathKey): string {
    return pathKey === 'tamogatott' ? 'Támogatott út' : pathKey === 'kihivas' ? 'Kihívás út' : 'Alap út';
  }

  assignmentFor(stickerId: string, teamId: string): DifferentiationPathKey | null {
    return this.store.differentiationAssignmentFor(stickerId, teamId)?.pathKey ?? null;
  }

  teamsForPath(pathKey: DifferentiationPathKey): Team[] {
    const sticker = this.selectedSticker();
    if (!sticker) return [];
    return this.store.teams.filter(team => this.assignmentFor(sticker.id, team.id) === pathKey);
  }

  startEdit(path: DifferentiationPath): void {
    this.editingKey.set(path.pathKey);
    this.editTitle.set(path.title);
    this.editDescription.set(path.description);
    this.editRecommendedFor.set(path.recommendedFor);
  }

  cancelEdit(): void {
    this.editingKey.set(null);
  }

  async savePath(path: DifferentiationPath): Promise<void> {
    const saved = await this.store.saveDifferentiationPath({
      ...path,
      title: this.editTitle().trim(),
      description: this.editDescription().trim(),
      recommendedFor: this.editRecommendedFor().trim(),
    });
    if (saved) this.editingKey.set(null);
  }

  async toggleTeamPath(stickerId: string, teamId: string, pathKey: DifferentiationPathKey): Promise<void> {
    const next = this.assignmentFor(stickerId, teamId) === pathKey ? null : pathKey;
    await this.store.assignTeamDifferentiationPath(stickerId, teamId, next);
  }
}

const PATH_PRESENTATION: Record<DifferentiationPathKey, PathPresentation> = {
  tamogatott: { icon: 'support', tone: '#0f6b5e' },
  alap: { icon: 'route', tone: '#6821a8' },
  kihivas: { icon: 'rocket_launch', tone: '#b1391a' },
};
