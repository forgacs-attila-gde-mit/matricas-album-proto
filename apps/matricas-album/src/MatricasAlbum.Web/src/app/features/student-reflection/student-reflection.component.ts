import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_PROJECT_REFLECTION_PROMPTS, Sticker, TeamStickerProgress } from '../../core/models/album.model';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';

interface StickerReflectionRow {
  readonly sticker: Sticker;
  readonly progress: TeamStickerProgress;
  readonly reflected: boolean;
}

@Component({
  selector: 'ma-student-reflection',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, IconComponent, PhaseChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" style="margin-top: 24px;">
      <div class="card">
        <div class="row-between">
          <div>
            <div class="card-section-title">Reflexió</div>
            <div class="t-title-lg">Mi változott a gondolkodásotokban?</div>
            <div class="muted t-body-sm" style="margin-top: 6px; max-width: 640px;">
              A reflexió a matricás album lényege: nem csak az számít, mi készült el, hanem az is,
              hogyan változott a csapat tudása, döntései, érvelései. Lezárt matricákhoz írhattok
              rövid reflexiót; a projekt végén pedig egy közös, projektzáró reflexiót.
            </div>
          </div>
          <ma-chip [tone]="reflectedCount() === rows().length && rows().length > 0 ? 'success' : 'neutral'" icon="self_improvement">
            {{ reflectedCount() }} / {{ rows().length }} matrica reflektálva
          </ma-chip>
        </div>
      </div>

      @if (rows().length === 0) {
        <div class="card" style="text-align: center; padding: 32px;">
          <ma-icon name="hourglass_empty" size="xl" />
          <div class="t-title-lg" style="margin-top: 8px;">Még nincs lezárt matricátok</div>
          <div class="muted t-body-sm" style="margin-top: 6px;">
            Ahogy a tanár lezár egy matricát, itt jelenik meg, és írhattok hozzá rövid reflexiót.
          </div>
        </div>
      } @else {
        @for (row of rows(); track row.sticker.id) {
          <div class="card reflection-card" [class.reflection-done]="row.reflected">
            <div class="row-between">
              <div class="row" style="gap: 10px; flex-wrap: wrap;">
                <ma-phase-chip [phase]="row.sticker.phase" />
                <div>
                  <div class="card-section-title">{{ row.sticker.week }}. hét</div>
                  <div class="t-title-lg">{{ row.sticker.title }}</div>
                </div>
              </div>
              @if (row.reflected) {
                <ma-chip tone="success" icon="task_alt">Reflektálva</ma-chip>
              }
            </div>

            <div class="muted t-body" style="margin-top: 10px;">
              <strong>Reflektív kérdés:</strong> {{ row.sticker.reflection }}
            </div>

            @if (row.reflected && !isEditing(row.sticker.id)) {
              <div class="reflection-body">{{ row.progress.reflection }}</div>
              <div class="row" style="margin-top: 10px; justify-content: flex-end;">
                <ma-btn variant="ghost" icon="edit" size="sm" (clicked)="startEdit(row.sticker.id, row.progress.reflection ?? '')">
                  Szerkesztés
                </ma-btn>
              </div>
            } @else {
              <textarea
                class="reflection-input"
                rows="4"
                [placeholder]="row.sticker.reflection"
                [(ngModel)]="drafts[row.sticker.id]"
                (ngModelChange)="setDraft(row.sticker.id, $event)"
              ></textarea>
              <div class="row" style="margin-top: 10px; justify-content: flex-end; gap: 8px;">
                @if (isEditing(row.sticker.id)) {
                  <ma-btn variant="ghost" size="sm" (clicked)="cancelEdit(row.sticker.id, row.progress.reflection ?? '')">
                    Mégse
                  </ma-btn>
                }
                <ma-btn
                  variant="secondary"
                  icon="check"
                  size="sm"
                  [disabled]="!draftIsValid(row.sticker.id)"
                  (clicked)="saveSticker(row.sticker.id)"
                >
                  Reflexió mentése
                </ma-btn>
              </div>
            }
          </div>
        }
      }

      <div class="card project-reflection-card">
        <div class="row-between">
          <div>
            <div class="card-section-title">Projektzáró reflexió</div>
            <div class="t-title-lg">A csapatotok közös reflexiója</div>
          </div>
          @if (projectReflection(); as existing) {
            <ma-chip tone="success" icon="flag">Mentve</ma-chip>
          }
        </div>
        <div class="muted t-body-sm" style="margin-top: 6px;">
          Projektzáró vezérkérdések:
        </div>
        <ol class="project-prompts">
          @for (prompt of projectReflectionPrompts(); track $index) {
            <li>{{ prompt }}</li>
          }
        </ol>

        @if (projectReflection(); as existing) {
          @if (!editingProject()) {
            <div class="reflection-body">{{ existing.text }}</div>
            <div class="row" style="margin-top: 10px; justify-content: flex-end;">
              <ma-btn variant="ghost" icon="edit" size="sm" (clicked)="startEditProject(existing.text)">
                Szerkesztés
              </ma-btn>
            </div>
          } @else {
            <textarea
              class="reflection-input"
              rows="6"
              placeholder="Írjátok le közösen, mit visztek tovább a projektből..."
              [(ngModel)]="projectDraft"
            ></textarea>
            <div class="row" style="margin-top: 10px; justify-content: flex-end; gap: 8px;">
              <ma-btn variant="ghost" size="sm" (clicked)="cancelEditProject(existing.text)">Mégse</ma-btn>
              <ma-btn
                variant="primary"
                icon="check"
                size="sm"
                [disabled]="projectDraft.trim().length === 0"
                (clicked)="saveProject()"
              >
                Projektzáró reflexió mentése
              </ma-btn>
            </div>
          }
        } @else {
          <textarea
            class="reflection-input"
            rows="6"
            placeholder="Írjátok le közösen, mit visztek tovább a projektből..."
            [(ngModel)]="projectDraft"
          ></textarea>
          <div class="row" style="margin-top: 10px; justify-content: flex-end;">
            <ma-btn
              variant="primary"
              icon="check"
              size="sm"
              [disabled]="projectDraft.trim().length === 0"
              (clicked)="saveProject()"
            >
              Projektzáró reflexió mentése
            </ma-btn>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .reflection-card {
      display: grid;
      gap: 8px;
    }
    .reflection-done {
      border-color: var(--success-bg, #c7eccd);
    }
    .reflection-body {
      margin-top: 8px;
      padding: 12px 14px;
      background: #faf8f5;
      border-radius: 10px;
      color: var(--n-800);
      white-space: pre-wrap;
    }
    .reflection-input {
      margin-top: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--n-200);
      border-radius: 10px;
      font: inherit;
      resize: vertical;
    }
    .project-reflection-card {
      border-color: var(--primary-300, #c7bff0);
    }
    .project-prompts {
      margin: 8px 0 0;
      padding-left: 22px;
      color: var(--n-700);
    }
    .project-prompts li {
      margin-bottom: 4px;
    }
  `,
})
export class StudentReflectionComponent {
  readonly store = inject(AlbumStore);
  readonly team = this.store.selectedStudentTeam;

  readonly drafts: Record<string, string> = {};
  readonly editingSticker = signal<Set<string>>(new Set());
  projectDraft = '';
  readonly editingProject = signal(false);

  readonly rows = computed<StickerReflectionRow[]>(() => {
    const teamId = this.team()?.id;
    if (!teamId) return [];
    return this.store.stickers()
      .map(sticker => {
        const progress = this.store.progressFor(sticker.id, teamId);
        return progress && (progress.state === 'elkeszult' || progress.state === 'reflektalt')
          ? {
              sticker,
              progress,
              reflected: progress.state === 'reflektalt' && (progress.reflection ?? '').trim().length > 0,
            }
          : null;
      })
      .filter((row): row is StickerReflectionRow => row !== null)
      .sort((a, b) => a.sticker.week - b.sticker.week);
  });

  readonly reflectedCount = computed(() => this.rows().filter(row => row.reflected).length);

  readonly projectReflectionPrompts = computed(() => {
    const prompts = this.store.album.projectReflectionPrompts ?? [];
    const normalized = prompts.map(prompt => prompt.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : DEFAULT_PROJECT_REFLECTION_PROMPTS;
  });

  readonly projectReflection = computed(() => {
    const team = this.team();
    return team ? this.store.projectReflectionForTeam(team.id) : null;
  });

  isEditing(stickerId: string): boolean {
    return this.editingSticker().has(stickerId);
  }

  setDraft(stickerId: string, value: string): void {
    this.drafts[stickerId] = value;
  }

  draftIsValid(stickerId: string): boolean {
    return (this.drafts[stickerId] ?? '').trim().length > 0;
  }

  startEdit(stickerId: string, current: string): void {
    this.drafts[stickerId] = current;
    this.editingSticker.update(set => new Set(set).add(stickerId));
  }

  cancelEdit(stickerId: string, original: string): void {
    this.drafts[stickerId] = original;
    this.editingSticker.update(set => {
      const next = new Set(set);
      next.delete(stickerId);
      return next;
    });
  }

  async saveSticker(stickerId: string): Promise<void> {
    const text = (this.drafts[stickerId] ?? '').trim();
    if (!text) return;
    await this.store.saveStickerReflection(stickerId, text);
    this.editingSticker.update(set => {
      const next = new Set(set);
      next.delete(stickerId);
      return next;
    });
  }

  startEditProject(current: string): void {
    this.projectDraft = current;
    this.editingProject.set(true);
  }

  cancelEditProject(original: string): void {
    this.projectDraft = original;
    this.editingProject.set(false);
  }

  async saveProject(): Promise<void> {
    const text = this.projectDraft.trim();
    if (!text) return;
    await this.store.saveProjectReflection(text);
    this.editingProject.set(false);
  }
}
