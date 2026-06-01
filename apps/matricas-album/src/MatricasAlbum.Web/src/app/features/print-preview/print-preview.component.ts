import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AlbumStore } from '../../core/services/album.store';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

@Component({
  selector: 'ma-print-preview',
  standalone: true,
  imports: [BtnComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-preview.component.html',
  styleUrl: './print-preview.component.scss',
})
export class PrintPreviewComponent {
  readonly store = inject(AlbumStore);
  readonly generatedDateLabel = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  close(): void { this.store.setPrintOpen(null); }

  /** Browser handles "Save as PDF" via its print dialog — same entry point for download + print. */
  printNow(): void { window.print(); }

  /** Human-readable label per scope for the toolbar. */
  readonly scopeLabel = computed(() => {
    switch (this.store.printOpen()) {
      case 'weekly': return 'Heti tanári összefoglaló';
      case 'evidence': return 'Bizonyíték-portfólió export';
      case 'quality': return 'Album minőségi riport';
      case 'closure': return 'Projektzárás összegzés';
      default: return 'Nyomtatási előnézet';
    }
  });

  /** Looks up the per-team reflection text by teamId for the closure scope. */
  reflectionFor(teamId: string): string | null {
    return this.store.teamReflections().find(r => r.teamId === teamId)?.text ?? null;
  }

  /** Human-readable team name (fallback to the ID if a team row isn't loaded — shouldn't happen in practice). */
  teamNameById(teamId: string): string {
    return this.store.teams.find(t => t.id === teamId)?.name ?? teamId;
  }

  /** Human-readable sticker title for the instance sticker (the stickerId field on Evidence is the InstanceSticker.id). */
  stickerTitleById(instanceStickerId: string): string {
    return this.store.stickers().find(s => s.id === instanceStickerId)?.title ?? instanceStickerId;
  }

  /** Human-readable evidence status label. Matches the existing UI vocabulary. */
  statusLabel(status: string): string {
    switch (status) {
      case 'beadva':    return 'Beadva';
      case 'varakozik': return 'Vár visszajelzésre';
      case 'javitas':   return 'Javítás alatt';
      case 'elkeszult': return 'Lezárt';
      default:          return status;
    }
  }

  /** Closure-scope summary stats. */
  readonly closureStats = computed(() => {
    const evidence = this.store.evidence();
    const reflectionRate = this.store.teamReflections().length;
    const checklistDone = this.store.closureChecklist().filter(item => item.done).length;
    const checklistTotal = this.store.closureChecklist().length;
    return {
      teams: this.store.teams.length,
      evidence: evidence.length,
      reflections: reflectionRate,
      checklist: `${checklistDone} / ${checklistTotal}`,
    };
  });

  readonly weeklyKpis = computed(() => {
    const evidence = this.store.evidence();
    const teamCount = this.store.teams.length;
    const teamsWithEvidence = new Set(evidence.map(item => item.teamId)).size;
    const reflections = evidence.filter(item => item.reflection?.trim()).length;
    const pending = evidence.filter(item => item.status === 'varakozik' || item.status === 'beadva').length;
    const reflectionRate = evidence.length ? Math.round((reflections / evidence.length) * 100) : 0;

    return [
      { v: String(evidence.length), l: 'Bizonyíték', s: `${teamsWithEvidence} csapattól` },
      { v: `${teamsWithEvidence} / ${teamCount}`, l: 'Csapat dolgozott', s: teamCount === teamsWithEvidence ? 'minden csapat aktív' : 'részleges aktivitás' },
      { v: `${reflectionRate}%`, l: 'Reflexió-arány', s: 'beküldött bizonyítékból' },
      { v: String(pending), l: 'Visszajelzésre vár', s: `${this.store.album.currentWeek}. heti állapot` },
    ];
  });

  readonly teamRows = computed(() =>
    this.store.teams.map(team => {
      const teamEvidence = this.store.evidence().filter(item => item.teamId === team.id);
      const pending = teamEvidence.filter(item => item.status === 'varakozik' || item.status === 'beadva').length;
      const done = teamEvidence.filter(item => item.status === 'elkeszult').length;
      const state = pending > 0 ? 'Tanári visszajelzésre vár' : done > 0 ? 'Lezárt bizonyíték' : 'Még nincs beküldés';
      return [team.name, team.focus, String(teamEvidence.length), state];
    })
  );

  readonly nextSteps = computed(() => {
    const pending = this.store.evidence().filter(item => item.status === 'varakozik' || item.status === 'beadva');
    const activeSticker = this.store.currentStickerForStudent();
    const aiSuggestion = this.store.aiNotes().find(note => note.kind === 'suggestion');
    const steps = pending.slice(0, 2).map((item, index) => ({
      n: index + 1,
      t: `${item.title} áttekintése`,
      d: item.helpRequest || item.description,
      state: 'Vár visszajelzésre',
    }));

    if (aiSuggestion) {
      steps.push({
        n: steps.length + 1,
        t: aiSuggestion.label,
        d: aiSuggestion.recommendation || aiSuggestion.message,
        state: 'AI javaslat',
      });
    }

    if (steps.length === 0 && activeSticker) {
      steps.push({
        n: 1,
        t: `${activeSticker.title} következő tanári döntése`,
        d: activeSticker.teacherSteps[0] ?? activeSticker.short,
        state: 'Tervezés',
      });
    }

    return steps;
  });

  readonly checklist = computed(() => {
    this.store.stickers();
    return this.store.qualityDims.map(dim => ({
      d: dim.label,
      s: dim.state === 'ok' ? 'Rendben' : dim.state === 'warn' ? 'Figyelmet kér' : 'Hiányzik',
      c: dim.state === 'ok' ? '#10b981' : dim.state === 'warn' ? '#d97706' : '#dc2626',
    }));
  });
}
