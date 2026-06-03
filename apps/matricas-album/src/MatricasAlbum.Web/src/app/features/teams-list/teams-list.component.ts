import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlbumStore } from '../../core/services/album.store';
import { Evidence, Team } from '../../core/models/album.model';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { EvidenceCardComponent } from '../../shared/ui/evidence-card/evidence-card.component';
import { FieldComponent } from '../../shared/ui/field/field.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

interface TeamSummary {
  readonly team: Team;
  readonly evidence: ReadonlyArray<Evidence>;
  readonly pending: number;
  readonly completed: number;
  readonly hasReflection: boolean;
  readonly latest: Evidence | null;
  readonly openHelpRequests: number;
}

const PALETTE = ['#7872d4', '#ef7c5b', '#5cb6a3', '#e5b653', '#4a8fc9', '#c14d8e'];

@Component({
  selector: 'ma-teams-list',
  standalone: true,
  imports: [FormsModule, BtnComponent, ChipComponent, EvidenceCardComponent, FieldComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-narrow">
      <div class="page-head">
        <div>
          <h1>Csapatok</h1>
          <div class="sub">
            {{ store.album.className || '—' }} — {{ store.teams.length }} csapat • Heti haladás csapatonként.
          </div>
        </div>
        @if (!createOpen()) {
          <ma-btn variant="primary" icon="add" (clicked)="startCreate()">Új csapat</ma-btn>
        }
      </div>

      @if (createOpen()) {
        <div class="card edit-card">
          <div class="card-section-title">Új csapat</div>
          <div class="edit-grid">
            <ma-field label="Név" [required]="true">
              <input class="input" [(ngModel)]="newName" name="newName" placeholder="Pl. Naprendszer-felfedezők" />
            </ma-field>
            <ma-field label="Fókusz">
              <input class="input" [(ngModel)]="newFocus" name="newFocus" placeholder="Pl. mérés és elemzés" />
            </ma-field>
            <ma-field class="span-2" label="Tagok (vesszővel)">
              <input class="input" [(ngModel)]="newMembers" name="newMembers" placeholder="Anna, Bence, Cili" />
            </ma-field>
            <div role="group" aria-label="Szín">
              <span class="form-group-label">Szín</span>
              <div class="color-row">
                @for (c of palette; track c) {
                  <button type="button" class="color-dot" [class.active]="newColor === c" [style.background]="c" (click)="newColor = c" [attr.aria-label]="'Szín: ' + c"></button>
                }
              </div>
            </div>
          </div>
          <div class="row" style="gap: 8px; justify-content: flex-end; margin-top: 12px;">
            @if (!newName.trim()) {
              <span class="muted t-body-sm" aria-live="polite">A kötelező mezők még hiányoznak.</span>
            }
            <ma-btn variant="ghost" (clicked)="cancelCreate()">Mégse</ma-btn>
            <ma-btn variant="primary" icon="check" [disabled]="!newName.trim()" (clicked)="saveCreate()">Mentés</ma-btn>
          </div>
        </div>
      }

      <div class="grid-2">
        @for (t of summaries(); track t.team.id) {
          <div class="card">
            <div class="row-between" style="margin-bottom: 14px;">
              <div class="row" style="gap: 12px;">
                <div class="team-badge" [style.background]="t.team.color">
                  <ma-icon name="groups" />
                </div>
                <div style="min-width: 0;">
                  @if (editingTeamId() === t.team.id) {
                    <input class="input team-name-input" [(ngModel)]="editName" name="editName-{{t.team.id}}" />
                    <input class="input" [(ngModel)]="editFocus" name="editFocus-{{t.team.id}}" placeholder="Fókusz" style="margin-top: 6px;" />
                    <div class="color-row" style="margin-top: 8px;">
                      @for (c of palette; track c) {
                        <button type="button" class="color-dot" [class.active]="editColor === c" [style.background]="c" (click)="editColor = c"></button>
                      }
                    </div>
                  } @else {
                    <div class="t-title-lg">{{ t.team.name }}</div>
                    <div class="muted t-body-sm">{{ memberNames(t.team) }}</div>
                  }
                </div>
              </div>
              <div class="row" style="gap: 6px;">
                @if (t.openHelpRequests > 0) {
                  <ma-chip tone="warning" icon="help">{{ t.openHelpRequests }} kérdés</ma-chip>
                }
                <ma-chip tone="neutral" icon="bookmark">{{ t.team.focus }}</ma-chip>
                @if (editingTeamId() === t.team.id) {
                  <ma-btn variant="ghost" [iconOnly]="true" icon="check" ariaLabel="Mentés" (clicked)="saveEdit(t.team.id)" />
                  <ma-btn variant="ghost" [iconOnly]="true" icon="close" ariaLabel="Mégse" (clicked)="cancelEdit()" />
                } @else {
                  <ma-btn variant="ghost" [iconOnly]="true" icon="edit" ariaLabel="Szerkesztés" (clicked)="startEdit(t.team)" />
                  <ma-btn variant="danger" [iconOnly]="true" icon="delete" ariaLabel="Törlés" (clicked)="confirmDelete(t.team.id)" />
                }
              </div>
            </div>

            @if (editingTeamId() === t.team.id) {
              <div class="member-edit">
                <div class="card-section-title">Tagok</div>
                <div class="chip-row">
                  @for (m of t.team.members; track m.id) {
                    <span class="member-chip">
                      {{ m.name }}
                      <button type="button" class="member-remove" (click)="removeMember(t.team.id, m.id)" [attr.aria-label]="'Eltávolítás: ' + m.name">
                        <ma-icon name="close" size="sm" />
                      </button>
                    </span>
                  }
                </div>
                <div class="row" style="gap: 6px; margin-top: 10px;">
                  <input class="input" [(ngModel)]="newMemberName" name="newMemberName-{{t.team.id}}" placeholder="Új tag neve" (keydown.enter)="addMember(t.team.id)" />
                  <ma-btn variant="secondary" size="sm" icon="add" (clicked)="addMember(t.team.id)">Hozzáad</ma-btn>
                </div>
              </div>
            }

            <div class="kpis">
              <div class="kpi">
                <div class="kpi-icon" [class.warning]="t.pending > 0"><ma-icon name="forum" /></div>
                <div style="min-width: 0;">
                  <div class="kpi-label">Bizonyíték</div>
                  <div class="kpi-value" [class.warning]="t.pending > 0">{{ t.evidence.length }}</div>
                  <div class="kpi-sub">{{ t.pending }} vár visszajelzésre</div>
                </div>
              </div>
              <div class="kpi">
                <div class="kpi-icon"><ma-icon name="check" /></div>
                <div style="min-width: 0;">
                  <div class="kpi-label">Lezárt matrica</div>
                  <div class="kpi-value">{{ t.completed }}</div>
                  <div class="kpi-sub">összesen</div>
                </div>
              </div>
              <div class="kpi">
                <div class="kpi-icon"><ma-icon name="psychology" /></div>
                <div style="min-width: 0;">
                  <div class="kpi-label">Reflexió</div>
                  <div class="kpi-value">{{ t.hasReflection ? 'Aktív' : '—' }}</div>
                  <div class="kpi-sub">{{ t.team.members.length }} tag</div>
                </div>
              </div>
            </div>

            @if (t.latest; as latest) {
              <div style="margin-top: 14px;">
                <div class="card-section-title">Legutóbbi bizonyíték</div>
                <ma-evidence-card [evidence]="latest" [compact]="true" />
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .team-badge {
      width: 44px; height: 44px; border-radius: 14px; color: white;
      display: grid; place-items: center; flex-shrink: 0;
    }
    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px; }
    .kpi { display: flex; align-items: flex-start; gap: 12px; }
    .kpi-icon {
      width: 36px; height: 36px; border-radius: 12px; background: white;
      border: 1px solid var(--n-200); display: grid; place-items: center; color: var(--n-700); flex-shrink: 0;
    }
    .kpi-icon.warning { color: var(--warning); }
    .kpi-label { color: var(--n-500); font-size: 12px; }
    .kpi-value { font-size: 20px; font-weight: 500; margin-top: 2px; color: var(--n-900); }
    .kpi-value.warning { color: var(--warning); }
    .kpi-sub { color: var(--n-500); font-size: 11px; margin-top: 2px; }

    .edit-card { margin-bottom: 18px; padding: 18px 20px; border-color: var(--primary-200, #d8d1ff); background: #fdfcff; }
    .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); }
    .edit-grid .span-2 { grid-column: span 2; }
    .input { padding: 8px 10px; border: 1px solid var(--n-200); border-radius: 8px; font: inherit; background: white; }
    .team-name-input { font-size: 18px; font-weight: 600; padding: 6px 10px; }

    .color-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px var(--n-300); cursor: pointer; padding: 0; }
    .color-dot.active { box-shadow: 0 0 0 2px var(--primary-500, #6f5ad9); }

    .member-edit { margin: 14px 0; padding: 12px; border: 1px dashed var(--n-300); border-radius: 12px; background: #fafafa; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .member-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 4px 4px 10px; border: 1px solid var(--n-300); border-radius: 999px; font-size: 13px; background: white;
    }
    .member-remove { display: inline-grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: transparent; cursor: pointer; color: var(--n-600); }
    .member-remove:hover { background: var(--n-100); color: var(--danger, #c14444); }
  `,
})
export class TeamsListComponent {
  readonly store = inject(AlbumStore);
  readonly palette = PALETTE;

  readonly summaries = computed<ReadonlyArray<TeamSummary>>(() => {
    const evidence = this.store.evidence();
    const helps = this.store.helpRequests();
    return this.store.teams.map(team => {
      const subs = evidence.filter(e => e.teamId === team.id);
      const openHelp = helps.filter(h => h.teamId === team.id && !h.resolvedAt).length;
      return {
        team,
        evidence: subs,
        pending: subs.filter(e => e.status === 'varakozik').length,
        completed: subs.filter(e => e.status === 'elkeszult').length,
        hasReflection: subs.some(e => !!e.reflection),
        latest: subs.length > 0 ? subs[subs.length - 1] : null,
        openHelpRequests: openHelp,
      };
    });
  });

  memberNames(team: Team): string {
    return team.members.map(m => m.name).join(', ');
  }

  // --- Create flow -----
  readonly createOpen = signal(false);
  newName = '';
  newFocus = '';
  newMembers = '';
  newColor = PALETTE[0];

  startCreate(): void {
    this.newName = '';
    this.newFocus = '';
    this.newMembers = '';
    this.newColor = PALETTE[this.store.teams.length % PALETTE.length];
    this.createOpen.set(true);
  }
  cancelCreate(): void { this.createOpen.set(false); }
  async saveCreate(): Promise<void> {
    if (!this.newName.trim()) return;
    const members = this.newMembers.split(',').map(s => s.trim()).filter(Boolean);
    const ok = await this.store.createTeam({ name: this.newName.trim(), focus: this.newFocus.trim(), color: this.newColor, members });
    if (ok) this.createOpen.set(false);
  }

  // --- Edit flow -----
  readonly editingTeamId = signal<string | null>(null);
  editName = '';
  editFocus = '';
  editColor = PALETTE[0];

  startEdit(team: Team): void {
    this.editName = team.name;
    this.editFocus = team.focus;
    this.editColor = team.color;
    this.editingTeamId.set(team.id);
  }
  cancelEdit(): void { this.editingTeamId.set(null); }
  async saveEdit(teamId: string): Promise<void> {
    const ok = await this.store.updateTeam(teamId, { name: this.editName.trim(), focus: this.editFocus.trim(), color: this.editColor });
    if (ok) this.editingTeamId.set(null);
  }

  // --- Member flow -----
  newMemberName = '';

  async addMember(teamId: string): Promise<void> {
    const name = this.newMemberName.trim();
    if (!name) return;
    await this.store.addTeamMember(teamId, name);
    this.newMemberName = '';
  }

  async removeMember(teamId: string, memberId: string): Promise<void> {
    await this.store.removeTeamMember(teamId, memberId);
  }

  // --- Delete flow -----
  async confirmDelete(teamId: string): Promise<void> {
    if (!confirm('Biztos törlöd ezt a csapatot? Csak akkor megy át, ha még nincs bizonyíték, segítségkérés vagy reflexió hozzá rendelve.')) return;
    await this.store.deleteTeam(teamId);
  }
}
