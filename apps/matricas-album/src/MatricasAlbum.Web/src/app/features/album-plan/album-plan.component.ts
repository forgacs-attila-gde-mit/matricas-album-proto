import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Sticker } from '../../core/models/album.model';
import { UpgradePlanDto } from '../../core/services/album-api.service';
import { AlbumStore } from '../../core/services/album.store';
import { AiCardComponent } from '../../shared/ui/ai-card/ai-card.component';
import { BtnComponent } from '../../shared/ui/btn/btn.component';
import { ChipComponent } from '../../shared/ui/chip/chip.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { StickerCardComponent } from '../../shared/ui/sticker-card/sticker-card.component';
import { InstanceUpgradeModalComponent } from '../instance-upgrade-modal/instance-upgrade-modal.component';

interface PilotObservationDraft {
  readonly engagementSignals: string;
  readonly adaptationNotes: string;
  readonly nextStep: string;
  readonly updatedAt: string;
}

@Component({
  selector: 'ma-album-plan',
  standalone: true,
  imports: [FormsModule, AiCardComponent, BtnComponent, ChipComponent, IconComponent, StickerCardComponent, InstanceUpgradeModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './album-plan.component.html',
  styleUrl: './album-plan.component.scss',
})
export class AlbumPlanComponent implements OnInit, OnDestroy {
  readonly store = inject(AlbumStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private routeSub?: Subscription;
  private suppressUrlSync = false;

  constructor() {
    // Mirror open-sticker state into the URL so the drawer state is shareable.
    effect(() => {
      const id = this.store.activeStickerId();
      if (this.suppressUrlSync) return;
      const current = this.route.snapshot.queryParamMap.get('sticker');
      if (current === id) return;
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sticker: id || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    effect(() => {
      this.store.activeInstanceId();
      this.loadPilotObservation();
    });
  }

  ngOnInit(): void {
    this.routeSub = this.route.queryParamMap.subscribe(params => {
      const id = params.get('sticker');
      if (this.store.activeStickerId() === id) return;
      this.suppressUrlSync = true;
      this.store.openSticker(id);
      // Allow effect writes back to URL on subsequent user actions.
      queueMicrotask(() => { this.suppressUrlSync = false; });
    });
    this.loadPilotObservation();
    void this.refreshUpgradePlan();
  }

  ngOnDestroy(): void { this.routeSub?.unsubscribe(); }

  /** Unit count derived from the bound template version. */
  readonly weeks = computed(() => {
    const count = this.store.album.weekTitles.length;
    return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
  });

  readonly microStillProposed = computed(
    () => this.store.microStickerProposed() && !this.store.microStickerAccepted()
  );

  readonly editing = signal(false);
  readonly observationEngagement = signal('');
  readonly observationAdaptation = signal('');
  readonly observationNextStep = signal('');
  readonly observationSavedAt = signal<string | null>(null);
  // Local buffer so an in-flight edit isn't applied until Kész.
  editTitle = '';
  editClassName = '';
  editUnitTitles: string[] = [];

  // Template-version upgrade UX.
  readonly upgradePlan = signal<UpgradePlanDto | null>(null);
  readonly upgradeModalOpen = signal(false);
  readonly upgradeAvailable = computed(() => {
    const plan = this.upgradePlan();
    return !!plan && !plan.isNoOp;
  });

  /** Lifecycle helper used by both onInit and after an instance switch. */
  private async refreshUpgradePlan(): Promise<void> {
    this.upgradePlan.set(await this.store.fetchUpgradePlan());
  }

  async openUpgradeModal(): Promise<void> {
    // Fetch fresh so the modal reflects the current template state.
    await this.refreshUpgradePlan();
    this.upgradeModalOpen.set(true);
  }

  async onUpgradeModalClose(): Promise<void> {
    this.upgradeModalOpen.set(false);
    // After commit the plan should be a no-op; re-check.
    await this.refreshUpgradePlan();
  }

  openEditDrawer(): void {
    this.editTitle = this.store.album.title;
    this.editClassName = this.store.album.className ?? '';
    this.editUnitTitles = [...this.store.album.weekTitles];
    this.editing.set(true);
  }

  async saveEdit(): Promise<void> {
    const id = this.store.activeInstanceId();
    if (!id) return;
    // Metadata first, then unit titles. Send only non-empty overrides; absent rows fall back to template.
    const metaOk = await this.store.updateInstance(id, {
      title: this.editTitle.trim(),
      className: this.editClassName.trim(),
    });
    if (!metaOk) return;
    const items = this.editUnitTitles
      .map((title, index) => ({ weekNumber: index + 1, title: title.trim() }))
      .filter(item => item.title.length > 0);
    const unitsOk = await this.store.replaceUnitTitles(items);
    if (unitsOk) this.editing.set(false);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  stickersForWeek(week: number): Sticker[] {
    return this.store.stickers().filter(s => s.week === week && !s.deprecated);
  }

  async stepCurrentUnit(delta: 1 | -1): Promise<void> {
    await this.store.stepCurrentUnit(delta);
    this.loadPilotObservation();
  }

  savePilotObservation(): void {
    const payload: PilotObservationDraft = {
      engagementSignals: this.observationEngagement().trim(),
      adaptationNotes: this.observationAdaptation().trim(),
      nextStep: this.observationNextStep().trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (this.observationIsEmpty(payload)) {
        localStorage.removeItem(this.pilotObservationStorageKey());
        this.observationSavedAt.set(null);
        this.store.showToast('Heti pilot-megfigyelés törölve.', 'delete');
        return;
      }

      localStorage.setItem(this.pilotObservationStorageKey(), JSON.stringify(payload));
      this.observationSavedAt.set(payload.updatedAt);
      this.store.showToast('Heti pilot-megfigyelés mentve.', 'edit_note');
    } catch {
      this.store.showToast('A heti pilot-megfigyelés nem menthető ebben a böngészőben.', 'error');
    }
  }

  pilotObservationUpdatedLabel(): string | null {
    const updatedAt = this.observationSavedAt();
    if (!updatedAt) return null;
    return new Intl.DateTimeFormat('hu-HU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(updatedAt));
  }

  private loadPilotObservation(): void {
    try {
      const raw = localStorage.getItem(this.pilotObservationStorageKey());
      if (!raw) {
        this.observationEngagement.set('');
        this.observationAdaptation.set('');
        this.observationNextStep.set('');
        this.observationSavedAt.set(null);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PilotObservationDraft>;
      this.observationEngagement.set(parsed.engagementSignals ?? '');
      this.observationAdaptation.set(parsed.adaptationNotes ?? '');
      this.observationNextStep.set(parsed.nextStep ?? '');
      this.observationSavedAt.set(parsed.updatedAt ?? null);
    } catch {
      this.observationEngagement.set('');
      this.observationAdaptation.set('');
      this.observationNextStep.set('');
      this.observationSavedAt.set(null);
    }
  }

  private pilotObservationStorageKey(): string {
    const instanceId = this.store.activeInstanceId() ?? 'mock-instance';
    const unit = Math.max(1, this.store.album.currentWeek || 1);
    return `matricas-album:pilot-observation:v1:${instanceId}:${unit}`;
  }

  private observationIsEmpty(payload: PilotObservationDraft): boolean {
    return !payload.engagementSignals && !payload.adaptationNotes && !payload.nextStep;
  }
}
