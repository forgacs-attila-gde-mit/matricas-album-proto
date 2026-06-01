import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumStore } from '../../core/services/album.store';
import { PHASES } from '../../core/tokens/phases';
import { EvidenceCardComponent } from '../../shared/ui/evidence-card/evidence-card.component';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { DrawerComponent } from '../../shared/ui/drawer/drawer.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { PhaseChipComponent } from '../../shared/ui/phase-chip/phase-chip.component';
import { StatePillComponent } from '../../shared/ui/state-pill/state-pill.component';
import { StickerStampComponent } from '../../shared/ui/sticker-stamp/sticker-stamp.component';

type Tab = 'pedagogy' | 'evidence' | 'ai' | 'diff';

interface DiffPath {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly desc: string;
}

@Component({
  selector: 'ma-sticker-detail-drawer',
  standalone: true,
  imports: [
    AiCardComponent, BtnComponent, ChipComponent, DrawerComponent, EvidenceCardComponent,
    IconComponent, PhaseChipComponent, StatePillComponent, StickerStampComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sticker-detail-drawer.component.html',
  styleUrl: './sticker-detail-drawer.component.scss',
})
export class StickerDetailDrawerComponent {
  readonly store = inject(AlbumStore);
  private readonly router = inject(Router);

  readonly phases = PHASES;
  readonly tab = signal<Tab>('pedagogy');
  readonly sticker = this.store.activeSticker;
  readonly open = computed(() => this.sticker() !== null);
  readonly isStudent = computed(() => this.store.role() === 'student');

  readonly stickerEvidence = computed(() => {
    const s = this.sticker();
    if (!s) return [];
    return this.store.evidence().filter(e => e.stickerId === s.id);
  });

  readonly teamProgress = computed(() => {
    const s = this.sticker();
    const teamId = this.store.studentTeamId();
    if (!s || !teamId) return null;
    return this.store.progressFor(s.id, teamId);
  });

  readonly teamLatestEvidence = computed(() => {
    const progress = this.teamProgress();
    if (!progress?.latestEvidenceId) return null;
    return this.store.evidence().find(evidence => evidence.id === progress.latestEvidenceId) ?? null;
  });

  readonly teamStatusLabel = computed(() => {
    const state = this.teamProgress()?.state ?? null;
    switch (state) {
      case 'varakozik':  return 'Beküldve, tanári visszajelzésre vár';
      case 'javitas':    return 'Tanári javítás kérve';
      case 'elkeszult':  return 'Lezárt';
      case 'reflektalt': return 'Lezárt és reflektálva';
      default:           return 'Még nem indult el a csapat';
    }
  });

  readonly diffPaths: DiffPath[] = [
    { id: 'sup',  title: 'Támogatott út', icon: 'support',        desc: 'A tanár előkészített megfigyelési ellenőrzőlistát ad. A csapat csak válaszol a kérdésekre.' },
    { id: 'base', title: 'Alap út',       icon: 'route',          desc: 'A csapat választ két helyszínt és önállóan ír egy hipotézist.' },
    { id: 'chal', title: 'Kihívás út',    icon: 'rocket_launch',  desc: 'A csapat három helyszínt hasonlít össze és mérési protokollt javasol.' },
  ];

  constructor() {
    // Reset tab whenever a different sticker is opened
    effect(() => {
      this.sticker();
      this.tab.set('pedagogy');
    });
  }

  close(): void { this.store.openSticker(null); }
  setTab(t: Tab): void { this.tab.set(t); }

  openTeamLatestEvidence(): void {
    const evidence = this.teamLatestEvidence();
    if (!evidence) return;
    this.store.openSticker(null);
    this.store.openEvidence(evidence.id);
  }

  publish(): void {
    const s = this.sticker();
    if (!s) return;
    this.store.setStickerState(s.id, 'aktiv');
    this.store.showToast('Matrica publikálva a diákoknak.');
  }

  duplicate(): void {
    const s = this.sticker();
    if (!s) return;
    void this.store.duplicateInstanceSticker(s.id);
  }

  editInstanceOnly(): void {
    const s = this.sticker();
    if (!s) return;
    this.store.openInstanceStickerEdit(s);
  }

  closeAndReview(): void {
    const id = this.store.activeInstanceId();
    if (id) void this.router.navigate(['/teacher/instances', id, 'feedback']);
    this.close();
  }

  acceptComplete(): void {
    const s = this.sticker();
    if (!s) return;
    this.store.setStickerState(s.id, 'elkeszult');
    this.store.showToast('Matrica lezárva: elkészült.');
  }

  closeReflection(): void {
    const s = this.sticker();
    if (!s) return;
    this.store.setStickerState(s.id, 'reflektalt');
    this.store.showToast('Reflexió lezárva.');
  }
}
