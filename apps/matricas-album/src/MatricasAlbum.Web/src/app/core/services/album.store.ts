import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AlbumApi,
  AlbumSnapshot,
  ApplyAiAdviceResult,
  CreateAlbumInstancePayload,
  CreateAlbumTemplatePayload,
  CreateInstanceStickerPayload,
  CreateEvidencePayload,
  CreateStickerPayload,
  ForkInstanceStickerPayload,
  GenerateAiAdvicePayload,
  UpgradePlanDto,
} from './album-api.service';
import { setDemoRequestRole } from './demo-auth.interceptor';
import {
  AiAdvice,
  AiNote,
  AlbumInstanceListItem,
  AlbumMeta,
  AlbumTemplateDetail,
  AlbumTemplateListItem,
  AlbumTemplateVersionView,
  CreateStickerAdviceActionPayload,
  DEFAULT_PROJECT_REFLECTION_PROMPTS,
  DifferentiationPath,
  DifferentiationPathKey,
  DraftFeedbackAdviceActionPayload,
  Evidence,
  EvidenceStatus,
  QualityDim,
  AlbumInstanceTeamReflection,
  ClosureChecklistItem,
  Sticker,
  StickerLibraryItem,
  StickerResourceDetail,
  StickerState,
  Team,
  TeacherEffectLog,
  TeamDifferentiationPathAssignment,
  TeamHelpRequest,
  TeamProgressState,
  TeamStickerProgress,
  Toast,
} from '../models/album.model';
import {
  ALBUM_META,
  INITIAL_EVIDENCE,
  INITIAL_STICKERS,
  QUALITY_DIMS,
  TEAMS,
} from '../tokens/mock-data';

export type Role = 'teacher' | 'student' | 'closure';
export type TeacherPage =
  | 'home' | 'stickerLibrary' | 'templates' | 'instances'
  | 'templateDetail' | 'plan' | 'stickers' | 'teams' | 'evidence'
  | 'feedback' | 'quality' | 'diff' | 'closure' | 'settings' | 'help';
export type StudentPage =
  | 'current' | 'team' | 'evidence' | 'feedback' | 'reflection' | 'help';
export type PrintScope = 'weekly' | 'evidence' | 'quality' | 'closure' | null;
export type TemplateEntryContext = 'album' | 'lesson' | 'curriculum';
export type StickerEntryContext = 'blank' | 'idea';
export type WorkspaceCreateMode =
  | 'sticker' | 'newVersion' | 'template' | 'newTemplateVersion' | 'instance'
  | 'instanceSticker' | 'instanceStickerEdit';

export interface NewVersionPrefill {
  readonly parentResourceId: string;
  readonly parentResourceTitle: string;
  readonly latestVersion: import('../models/album.model').StickerVersionView;
}

export interface NewTemplateVersionPrefill {
  readonly templateId: string;
  readonly latestVersion: AlbumTemplateVersionView;
}

export interface InstanceStickerPrefill {
  readonly mode: 'new' | 'edit';
  readonly source?: Sticker;
}

@Injectable({ providedIn: 'root' })
export class AlbumStore {
  private readonly api = inject(AlbumApi);
  private readonly router = inject(Router);

  readonly role = signal<Role>('teacher');
  readonly page = signal<TeacherPage>('home');
  readonly studentPage = signal<StudentPage>('current');
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly stickerLibrary = signal<StickerLibraryItem[]>([]);
  readonly templates = signal<AlbumTemplateListItem[]>([]);
  readonly instances = signal<AlbumInstanceListItem[]>([]);
  readonly activeTemplateId = signal<string | null>(null);
  readonly activeAlbumTemplate = signal<AlbumTemplateDetail | null>(null);
  readonly albumTemplateLoading = signal(false);
  readonly activeInstanceId = signal<string | null>(null);
  readonly activeAlbumId = this.activeInstanceId;

  readonly stickers = signal<Sticker[]>(structuredClone(INITIAL_STICKERS));
  readonly evidence = signal<Evidence[]>(structuredClone(INITIAL_EVIDENCE));
  readonly teamProgress = signal<TeamStickerProgress[]>([]);
  readonly teamDifferentiationPaths = signal<TeamDifferentiationPathAssignment[]>([]);
  readonly teamReflections = signal<AlbumInstanceTeamReflection[]>([]);
  readonly helpRequests = signal<TeamHelpRequest[]>([]);
  readonly teacherEffectLog = signal<TeacherEffectLog | null>(null);
  readonly closureChecklist = signal<ClosureChecklistItem[]>([]);
  readonly aiNotes = signal<AiNote[]>([]);
  readonly teacherAdvices = signal<AiAdvice[]>([]);
  readonly studentAdvices = signal<AiAdvice[]>([]);
  readonly adviceLoading = signal(false);
  readonly maintenanceLoading = signal(false);
  readonly adviceDrawerOpen = signal(false);
  readonly activeAdviceId = signal<string | null>(null);
  readonly feedbackDraft = signal<string | null>(null);

  readonly activeStickerId = signal<string | null>(null);
  readonly activeStickerResource = signal<StickerResourceDetail | null>(null);
  readonly stickerResourceLoading = signal(false);
  readonly stickerResourceReadOnly = signal(false);
  readonly activeEvidenceId = signal<string | null>(null);
  readonly wizardOpen = signal(false);
  readonly wizardMode = signal<WorkspaceCreateMode>('template');
  readonly templateEntryContext = signal<TemplateEntryContext>('album');
  readonly stickerEntryContext = signal<StickerEntryContext>('blank');
  readonly newVersionPrefill = signal<NewVersionPrefill | null>(null);
  readonly newTemplateVersionPrefill = signal<NewTemplateVersionPrefill | null>(null);
  readonly instanceStickerPrefill = signal<InstanceStickerPrefill | null>(null);
  readonly evidenceFlowOpen = signal(false);
  readonly printOpen = signal<PrintScope>(null);

  readonly microStickerProposed = signal(true);
  readonly microStickerAccepted = signal(false);

  readonly toast = signal<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly adviceRequestSeq: Record<'teacher' | 'student', number> = { teacher: 0, student: 0 };
  private activeAdviceRequestCount = 0;

  readonly studentTeamId = signal<string | null>(TEAMS[0]?.id ?? null);
  teams: Team[] = structuredClone(TEAMS);

  readonly selectedStudentTeam = computed(() => {
    const id = this.studentTeamId();
    return id ? this.teams.find(team => team.id === id) ?? null : null;
  });
  album: AlbumMeta = structuredClone(ALBUM_META);
  qualityDims: QualityDim[] = structuredClone(QUALITY_DIMS);

  /** Singular label for the current running album's time unit ("hét" / "óra" / "fázis"). */
  get albumUnitLabel(): string {
    const type = this.album.durationType;
    return type === 'het' ? 'hét' : type === 'ora' ? 'óra' : 'fázis';
  }

  readonly activeSticker = computed(() =>
    this.stickers().find(sticker => sticker.id === this.activeStickerId()) ?? null
  );

  readonly activeEvidence = computed(() =>
    this.evidence().find(evidence => evidence.id === this.activeEvidenceId()) ?? null
  );

  readonly activeAdvice = computed(() => {
    const id = this.activeAdviceId();
    if (!id) return null;
    return [...this.teacherAdvices(), ...this.studentAdvices()].find(advice => advice.id === id) ?? null;
  });

  readonly pendingEvidence = computed(() =>
    this.evidence().filter(evidence => evidence.status === 'varakozik')
  );

  readonly activeInstanceSummary = computed(() =>
    this.instances().find(instance => instance.id === this.activeInstanceId()) ?? null
  );

  readonly activeTemplateSummary = computed(() =>
    this.templates().find(template => template.id === this.activeTemplateId()) ?? this.templates()[0] ?? null
  );

  readonly activeAlbumSummary = this.activeInstanceSummary;

  readonly dashboardAiNotes = computed(() =>
    this.aiNotes()
      .filter(note => note.targetType !== 'instanceSticker')
      .slice(0, 4)
  );

  progressFor(instanceStickerId: string, teamId: string): TeamStickerProgress | null {
    return (
      this.teamProgress().find(
        progress => progress.instanceStickerId === instanceStickerId && progress.teamId === teamId,
      ) ?? null
    );
  }

  differentiationPathsForPhase(phase: string): DifferentiationPath[] {
    return this.album.differentiationPaths
      .filter(path => path.phase === phase)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  differentiationAssignmentFor(instanceStickerId: string, teamId: string): TeamDifferentiationPathAssignment | null {
    return this.teamDifferentiationPaths().find(
      assignment => assignment.instanceStickerId === instanceStickerId && assignment.teamId === teamId,
    ) ?? null;
  }

  readonly currentStickerForStudent = computed(() => {
    const teamId = this.studentTeamId();
    // Deprecated stickers (removed from the source template version on a later upgrade)
    // stay readable as evidence carriers but never become the "active" sticker.
    const all = this.stickers().filter(sticker => !sticker.deprecated);

    if (teamId) {
      // For the selected team, prefer the active sticker the team is still working on.
      const inProgress = all.find(sticker => {
        if (sticker.state !== 'aktiv') return false;
        const progress = this.progressFor(sticker.id, teamId);
        return progress === null || progress.state === 'varakozik' || progress.state === 'javitas';
      });
      if (inProgress) return inProgress;

      const lastDone = [...all]
        .reverse()
        .find(sticker => {
          const progress = this.progressFor(sticker.id, teamId);
          return progress?.state === 'elkeszult' || progress?.state === 'reflektalt';
        });
      if (lastDone) return lastDone;
    }

    return all.find(sticker => sticker.state === 'aktiv') ?? all[0];
  });

  readonly currentStudentProgress = computed(() => {
    const teamId = this.studentTeamId();
    const sticker = this.currentStickerForStudent();
    if (!teamId || !sticker) return null;
    return this.progressFor(sticker.id, teamId);
  });

  constructor() {
    void this.loadWorkspace();
  }

  setRole(role: Role) {
    this.role.set(role);
    setDemoRequestRole(role);
  }
  setPage(page: TeacherPage) { this.page.set(page); }
  setStudentPage(page: StudentPage) { this.studentPage.set(page); }
  closeRoleSensitiveOverlays(): void {
    this.activeEvidenceId.set(null);
    this.activeStickerId.set(null);
    this.activeStickerResource.set(null);
    this.stickerResourceReadOnly.set(false);
    this.closeAdvice();
    this.wizardOpen.set(false);
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set(null);
    this.evidenceFlowOpen.set(false);
    this.printOpen.set(null);
  }
  async requestTeacherAdvice(): Promise<void> {
    this.role.set('teacher');
    const id = this.activeInstanceId();
    if (id) await this.router.navigate(['/teacher/instances', id, 'plan']);
    await this.refreshTeacherAdvice();
  }

  openSticker(id: string | null) { this.activeStickerId.set(id); }
  openEvidence(id: string | null) { this.activeEvidenceId.set(id); }

  async openStickerResource(id: string): Promise<void> {
    this.stickerResourceReadOnly.set(false);
    await this.loadStickerResource(id);
  }

  async openStickerResourceReadOnly(id: string): Promise<void> {
    this.stickerResourceReadOnly.set(true);
    await this.loadStickerResource(id);
  }

  private async loadStickerResource(id: string): Promise<void> {
    this.activeStickerResource.set(null);
    this.stickerResourceLoading.set(true);
    try {
      const detail = await firstValueFrom(this.api.getStickerResource(id));
      this.activeStickerResource.set(detail);
    } catch {
      this.showToast('A matrica részletei nem tölthetők be.', 'error');
    } finally {
      this.stickerResourceLoading.set(false);
    }
  }

  closeStickerResource(): void {
    this.activeStickerResource.set(null);
    this.stickerResourceReadOnly.set(false);
  }

  async openAlbumTemplate(id: string): Promise<boolean> {
    this.activeAlbumTemplate.set(null);
    this.albumTemplateLoading.set(true);
    try {
      const detail = await firstValueFrom(this.api.getAlbumTemplate(id));
      this.activeAlbumTemplate.set(detail);
      return true;
    } catch {
      this.showToast('Az albumterv részletei nem tölthetők be.', 'error');
      return false;
    } finally {
      this.albumTemplateLoading.set(false);
    }
  }

  closeAlbumTemplate(): void {
    this.activeAlbumTemplate.set(null);
  }

  async toggleStickerArchive(id: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.toggleStickerArchive(id));
      this.activeStickerResource.set(detail);
      // Mirror the archived flag in the cached library list (no full refetch).
      this.stickerLibrary.update(items => items.map(item =>
        item.id === id ? { ...item, archivedAt: detail.archivedAt ?? null } : item,
      ));
      this.showToast(
        detail.archivedAt ? 'Matrica archiválva.' : 'Matrica visszaállítva.',
        detail.archivedAt ? 'archive' : 'unarchive',
      );
    } catch {
      this.showToast('A művelet nem sikerült.', 'error');
    }
  }

  async toggleTemplateArchive(id: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.toggleTemplateArchive(id));
      this.activeAlbumTemplate.set(detail);
      this.templates.update(items => items.map(item =>
        item.id === id ? { ...item, archivedAt: detail.archivedAt ?? null } : item,
      ));
      this.showToast(
        detail.archivedAt ? 'Albumterv archiválva.' : 'Albumterv visszaállítva.',
        detail.archivedAt ? 'archive' : 'unarchive',
      );
    } catch {
      this.showToast('A művelet nem sikerült.', 'error');
    }
  }

  /** Returns the current template detail's draft version, or null if none. */
  currentTemplateDraft(): AlbumTemplateVersionView | null {
    return this.activeAlbumTemplate()?.versions.find(v => v.isDraft) ?? null;
  }

  /** Idempotent: creates a draft if none exists, returns it either way. */
  async ensureTemplateDraft(templateId: string): Promise<AlbumTemplateVersionView | null> {
    const existing = this.currentTemplateDraft();
    if (existing) return existing;
    try {
      const detail = await firstValueFrom(this.api.createTemplateDraft(templateId));
      this.activeAlbumTemplate.set(detail);
      return detail.versions.find(v => v.isDraft) ?? null;
    } catch {
      this.showToast('A vázlat létrehozása nem sikerült.', 'error');
      return null;
    }
  }

  async publishTemplateDraft(templateId: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.publishTemplateDraft(templateId));
      this.activeAlbumTemplate.set(detail);
      this.editingTemplate.set(false);
      await this.refreshWorkspaceLists();
      this.showToast('Új verzió publikálva a vázlatból.', 'history');
    } catch {
      this.showToast('A vázlat publikálása nem sikerült.', 'error');
    }
  }

  /**
   * Opens the template-pattern picker. The actual template is created from the drawer
   * so teachers can choose an album-minta before v1 is seeded.
   */
  async startNewTemplate(): Promise<boolean> {
    this.openTemplateWizard();
    return true;
  }

  /**
   * Discards a brand-new draft-only template entirely (DELETE).
   * For published templates use archive instead.
   */
  async discardFreshTemplate(templateId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.deleteTemplate(templateId));
      this.editingTemplate.set(false);
      this.activeAlbumTemplate.set(null);
      this.activeTemplateId.set(null);
      await this.refreshWorkspaceLists();
      await this.router.navigate(['/teacher/templates']);
      this.showToast('Az új albumterv elvetve.', 'delete');
      return true;
    } catch {
      this.showToast('Az albumterv elvetése nem sikerült.', 'error');
      return false;
    }
  }

  async discardTemplateDraft(templateId: string): Promise<void> {
    try {
      const detail = await firstValueFrom(this.api.discardTemplateDraft(templateId));
      this.activeAlbumTemplate.set(detail);
      this.editingTemplate.set(false);
      this.showToast('A vázlat elvetve.', 'delete');
    } catch {
      this.showToast('A vázlat elvetése nem sikerült.', 'error');
    }
  }

  async addStickerToTemplateDraft(
    templateId: string,
    stickerVersionId: string,
    week: number,
    sortOrder: number,
  ): Promise<void> {
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    try {
      const detail = await firstValueFrom(
        this.api.addStickerToTemplateVersion(draft.id, stickerVersionId, week, sortOrder),
      );
      this.activeAlbumTemplate.set(detail);
    } catch {
      this.showToast('A matrica hozzáadása nem sikerült.', 'error');
    }
  }

  async removeStickerFromTemplateDraft(templateId: string, templateStickerId: string): Promise<void> {
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    try {
      const detail = await firstValueFrom(this.api.removeTemplateVersionSticker(draft.id, templateStickerId));
      this.activeAlbumTemplate.set(detail);
    } catch {
      this.showToast('A matrica eltávolítása nem sikerült.', 'error');
    }
  }

  // Debounced per-row auto-save for week / sortOrder edits. Keyed by templateStickerId
  // so simultaneous edits on different rows don't cancel each other.
  private readonly _stickerPatchTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly _stickerPatchPending = new Map<string, { week?: number; sortOrder?: number }>();

  scheduleTemplateStickerPatch(
    templateId: string,
    templateStickerId: string,
    patch: { week?: number; sortOrder?: number },
  ): void {
    const merged = { ...(this._stickerPatchPending.get(templateStickerId) ?? {}), ...patch };
    this._stickerPatchPending.set(templateStickerId, merged);

    const existingTimer = this._stickerPatchTimers.get(templateStickerId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this._stickerPatchTimers.delete(templateStickerId);
      const payload = this._stickerPatchPending.get(templateStickerId) ?? {};
      this._stickerPatchPending.delete(templateStickerId);
      void this.flushTemplateStickerPatch(templateId, templateStickerId, payload);
    }, 400);
    this._stickerPatchTimers.set(templateStickerId, timer);
  }

  /**
   * Bulk reorder/move via the server-side two-pass endpoint. Use this when more than one
   * sticker moves at once (swap, drag-drop) — single-row PATCHes would collide with the
   * unique (versionId, Week, SortOrder) index mid-swap.
   */
  async reorderTemplateStickers(
    templateId: string,
    items: Array<{ id: string; week: number; sortOrder: number }>,
  ): Promise<void> {
    if (items.length === 0) return;
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    try {
      const detail = await firstValueFrom(this.api.reorderTemplateVersionStickers(draft.id, items));
      this.activeAlbumTemplate.set(detail);
    } catch {
      this.showToast('A matricák átrendezése nem sikerült.', 'error');
    }
  }

  private async flushTemplateStickerPatch(
    templateId: string,
    templateStickerId: string,
    patch: { week?: number; sortOrder?: number },
  ): Promise<void> {
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    try {
      const detail = await firstValueFrom(
        this.api.updateTemplateVersionSticker(draft.id, templateStickerId, patch),
      );
      this.activeAlbumTemplate.set(detail);
    } catch {
      this.showToast('A matrica sorrendezése nem sikerült.', 'error');
    }
  }

  // --- Inline metadata edit -------------------------------------------------------------

  /** True when the detail page is showing metadata as editable inputs. */
  readonly editingTemplate = signal(false);

  /**
   * Switch the detail page into edit mode. Ensures a draft exists first so the inline
   * fields have a target to write into.
   */
  async enterTemplateEdit(templateId: string): Promise<void> {
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    this.editingTemplate.set(true);
  }

  /** Exit edit mode without touching the draft. Banner stays for publish/discard. */
  exitTemplateEdit(): void {
    this.editingTemplate.set(false);
  }

  // Debounced per-field auto-save for template metadata. The whole metadata block is
  // versioned together so we coalesce all fields into one PATCH payload.
  private _metadataPatchTimer: ReturnType<typeof setTimeout> | null = null;
  private _metadataPatchPending: Record<string, unknown> = {};

  /**
   * Schedule a draft-metadata update. Multiple field changes within 400ms collapse into
   * a single PATCH against the draft version.
   */
  scheduleTemplateMetadataPatch(templateId: string, patch: Record<string, unknown>): void {
    Object.assign(this._metadataPatchPending, patch);
    if (this._metadataPatchTimer) clearTimeout(this._metadataPatchTimer);
    this._metadataPatchTimer = setTimeout(() => {
      this._metadataPatchTimer = null;
      const payload = { ...this._metadataPatchPending };
      this._metadataPatchPending = {};
      void this.flushTemplateMetadataPatch(templateId, payload);
    }, 400);
  }

  private async flushTemplateMetadataPatch(templateId: string, patch: Record<string, unknown>): Promise<void> {
    const draft = await this.ensureTemplateDraft(templateId);
    if (!draft) return;
    try {
      const detail = await firstValueFrom(this.api.updateTemplateVersionMetadata(draft.id, patch));
      this.activeAlbumTemplate.set(detail);
    } catch {
      this.showToast('A vázlat mentése nem sikerült.', 'error');
    }
  }

  openAdvice(id: string | null) {
    this.activeAdviceId.set(id);
    this.adviceDrawerOpen.set(id !== null);
  }
  closeAdvice() {
    this.activeAdviceId.set(null);
    this.adviceDrawerOpen.set(false);
  }
  setFeedbackDraft(value: string | null) { this.feedbackDraft.set(value); }

  setWizardOpen(open: boolean) {
    this.wizardOpen.set(open);
    if (open) this.wizardMode.set('template');
  }
  openTemplateWizard(context: TemplateEntryContext = 'album'): void {
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set(null);
    this.templateEntryContext.set(context);
    this.wizardMode.set('template');
    this.wizardOpen.set(true);
  }
  openStickerWizard(context: StickerEntryContext = 'blank') {
    this.wizardMode.set('sticker');
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set(null);
    this.stickerEntryContext.set(context);
    this.wizardOpen.set(true);
  }

  openStickerWizardForNewVersion(detail: StickerResourceDetail): void {
    const latest = detail.versions[0];
    if (!latest) return;
    this.newVersionPrefill.set({
      parentResourceId: detail.id,
      parentResourceTitle: detail.title,
      latestVersion: latest,
    });
    this.instanceStickerPrefill.set(null);
    this.wizardMode.set('newVersion');
    this.wizardOpen.set(true);
    // Close the detail drawer so the wizard has the user's full attention; we'll reopen it on success.
    this.activeStickerResource.set(null);
  }
  openTemplateVersionWizard(detail: AlbumTemplateDetail): void {
    const latest = detail.versions[0];
    if (!latest) return;
    this.newTemplateVersionPrefill.set({
      templateId: detail.id,
      latestVersion: latest,
    });
    this.newVersionPrefill.set(null);
    this.instanceStickerPrefill.set(null);
    this.wizardMode.set('newTemplateVersion');
    this.wizardOpen.set(true);
  }
  openInstanceWizard(templateId?: string) {
    if (templateId) this.activeTemplateId.set(templateId);
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set(null);
    this.wizardMode.set('instance');
    this.wizardOpen.set(true);
  }
  openInstanceStickerWizard(): void {
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set({ mode: 'new' });
    this.wizardMode.set('instanceSticker');
    this.wizardOpen.set(true);
  }
  openInstanceStickerEdit(sticker: Sticker): void {
    this.newVersionPrefill.set(null);
    this.newTemplateVersionPrefill.set(null);
    this.instanceStickerPrefill.set({ mode: 'edit', source: sticker });
    this.wizardMode.set('instanceStickerEdit');
    this.wizardOpen.set(true);
    this.openSticker(null);
  }
  setEvidenceFlowOpen(open: boolean) { this.evidenceFlowOpen.set(open); }
  setPrintOpen(scope: PrintScope) { this.printOpen.set(scope); }

  async loadWorkspace(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const snapshot = await this.withStartupRetry(async () => {
        await this.refreshWorkspaceLists();
        const firstInstance = this.instances()[0];
        if (!firstInstance) {
          this.clearActiveWorkspace();
          return null;
        }

        this.activeTemplateId.set(firstInstance.templateId);
        return firstValueFrom(this.api.getInstance(firstInstance.id));
      });
      if (snapshot) {
        this.applySnapshot(snapshot);
      }
    } catch (error) {
      this.applyMockWorkspace();
      this.loadError.set('Az API nem elérhető, a prototípus mintaadatait mutatom.');
      this.showToast('Az API nem elérhető, mintaadatokkal indult az album.', 'cloud_off');
    } finally {
      this.loading.set(false);
    }
  }

  async selectInstance(id: string): Promise<void> {
    if (id === this.activeInstanceId()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    try {
      const snapshot = await firstValueFrom(this.api.getInstance(id));
      this.applySnapshot(snapshot);
      this.showToast('Futó album kiválasztva.', 'auto_stories');
    } catch {
      this.loadError.set('A futó album betöltése nem sikerült.');
      this.showToast('A futó album betöltése nem sikerült.', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async selectAlbum(id: string): Promise<void> {
    await this.selectInstance(id);
  }

  /** Patch instance metadata. Subject / Grade / DurationType belong to the template version and aren't editable here. */
  async updateInstance(id: string, patch: { title?: string; className?: string; currentWeek?: number }): Promise<boolean> {
    try {
      const snapshot = await firstValueFrom(this.api.updateInstance(id, patch));
      this.applySnapshot(snapshot);
      await this.refreshWorkspaceLists();
      return true;
    } catch {
      this.showToast('A futó album frissítése nem sikerült.', 'error');
      return false;
    }
  }

  /** Increment / decrement the current unit cursor; clamped server-side. */
  async stepCurrentUnit(delta: 1 | -1): Promise<void> {
    const id = this.activeInstanceId();
    if (!id) return;
    const target = this.album.currentWeek + delta;
    await this.updateInstance(id, { currentWeek: target });
  }

  // --- Team CRUD ----------------------------------------------------------------

  async createTeam(payload: { name: string; focus: string; color: string; members: string[] }): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.createTeam(instanceId, payload));
      this.applySnapshot(snapshot);
      this.showToast('Csapat létrejött.', 'group_add');
      return true;
    } catch {
      this.showToast('A csapat létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async updateTeam(teamId: string, patch: { name?: string; focus?: string; color?: string }): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.updateTeam(instanceId, teamId, patch));
      this.applySnapshot(snapshot);
      return true;
    } catch {
      this.showToast('A csapat frissítése nem sikerült.', 'error');
      return false;
    }
  }

  async deleteTeam(teamId: string): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.deleteTeam(instanceId, teamId));
      this.applySnapshot(snapshot);
      this.showToast('Csapat törölve.', 'delete');
      return true;
    } catch {
      this.showToast('A csapat csak akkor törölhető, ha még nincs hozzá kapcsolódó adat.', 'error');
      return false;
    }
  }

  async addTeamMember(teamId: string, name: string): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.addTeamMember(instanceId, teamId, name));
      this.applySnapshot(snapshot);
      return true;
    } catch {
      this.showToast('A tag hozzáadása nem sikerült.', 'error');
      return false;
    }
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.removeTeamMember(instanceId, teamId, memberId));
      this.applySnapshot(snapshot);
      return true;
    } catch {
      this.showToast('A tag eltávolítása nem sikerült.', 'error');
      return false;
    }
  }

  /** Replace all unit-title overrides for the active instance. Pass empty array to clear all. */
  async replaceUnitTitles(items: Array<{ weekNumber: number; title: string }>): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.replaceInstanceUnits(instanceId, items));
      this.applySnapshot(snapshot);
      return true;
    } catch {
      this.showToast('Az egységnevek mentése nem sikerült.', 'error');
      return false;
    }
  }

  /** Toggle a closure checklist item's done state for the active instance. */
  async toggleClosureChecklistItem(itemId: string, done: boolean): Promise<void> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return;
    try {
      const snapshot = await firstValueFrom(this.api.toggleClosureChecklistItem(instanceId, itemId, done));
      this.applySnapshot(snapshot);
    } catch {
      this.showToast('A jelölés mentése nem sikerült.', 'error');
    }
  }

  async saveTeacherEffectLog(payload: Pick<TeacherEffectLog, 'workedWell' | 'engagementSignals' | 'adaptationNotes' | 'reuseNextTime'>): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.saveTeacherEffectLog(instanceId, payload));
      this.applySnapshot(snapshot);
      const hasAnyText = Object.values(payload).some(value => value.trim().length > 0);
      this.showToast(hasAnyText ? 'Tanári hatásnapló mentve.' : 'Tanári hatásnapló törölve.', 'flag');
      return true;
    } catch {
      this.showToast('A tanári hatásnapló mentése nem sikerült.', 'error');
      return false;
    }
  }

  async saveDifferentiationPath(path: DifferentiationPath): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    const replaced = this.album.differentiationPaths.some(
      item => item.phase === path.phase && item.pathKey === path.pathKey,
    );
    const paths = replaced
      ? this.album.differentiationPaths.map(item =>
          item.phase === path.phase && item.pathKey === path.pathKey ? path : item,
        )
      : [...this.album.differentiationPaths, path];
    try {
      const snapshot = await firstValueFrom(this.api.replaceDifferentiationPaths(instanceId, paths));
      this.applySnapshot(snapshot);
      this.showToast('Differenciálási út mentve.', 'tune');
      return true;
    } catch {
      this.showToast('A differenciálási út mentése nem sikerült.', 'error');
      return false;
    }
  }

  async assignTeamDifferentiationPath(
    stickerId: string,
    teamId: string,
    pathKey: DifferentiationPathKey | null,
  ): Promise<void> {
    try {
      const snapshot = await firstValueFrom(this.api.setTeamDifferentiationPath(stickerId, teamId, pathKey));
      this.applySnapshot(snapshot);
      this.showToast(pathKey ? 'Csapatút kiosztva.' : 'Csapatút törölve.', pathKey ? 'route' : 'remove_circle');
    } catch {
      this.showToast('A csapatút mentése nem sikerült.', 'error');
    }
  }

  /** Fetch the planned diff between the instance's bound template version and the latest published. */
  async fetchUpgradePlan(): Promise<UpgradePlanDto | null> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return null;
    try {
      return await firstValueFrom(this.api.getUpgradePreview(instanceId));
    } catch {
      return null;
    }
  }

  /** Commit the planned upgrade — rebinds the instance to the latest published version atomically. */
  async commitInstanceUpgrade(): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.commitInstanceUpgrade(instanceId));
      this.applySnapshot(snapshot);
      await this.refreshWorkspaceLists();
      this.showToast('A futó album az új sablonverzióra váltott.', 'upgrade');
      return true;
    } catch {
      this.showToast('A sablonverzió átvétele nem sikerült.', 'error');
      return false;
    }
  }

  /** Soft-toggle the instance archive flag. Archived instances hide from default lists. */
  async toggleInstanceArchive(): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId) return false;
    try {
      const snapshot = await firstValueFrom(this.api.toggleInstanceArchive(instanceId));
      this.applySnapshot(snapshot);
      await this.refreshWorkspaceLists();
      const isArchived = !!snapshot.album.archivedAt;
      this.showToast(isArchived ? 'Futó album archiválva.' : 'Futó album visszaállítva.', isArchived ? 'archive' : 'unarchive');
      return true;
    } catch {
      this.showToast('Az archiválás nem sikerült.', 'error');
      return false;
    }
  }

  selectTemplate(id: string): void {
    this.activeTemplateId.set(id);
    this.showToast('Albumterv kijelölve.', 'edit_note');
  }

  async createSticker(payload: CreateStickerPayload): Promise<boolean> {
    try {
      await firstValueFrom(this.api.createSticker(payload));
      await this.refreshWorkspaceLists();
      this.setWizardOpen(false);
      this.showToast('Új matrica létrejött a matricatárban.', 'bookmark_added');
      return true;
    } catch {
      this.showToast('A matrica létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async createStickerVersion(parentResourceId: string, payload: CreateStickerPayload): Promise<boolean> {
    try {
      const detail = await firstValueFrom(this.api.createStickerVersion(parentResourceId, payload));
      await this.refreshWorkspaceLists();
      this.setWizardOpen(false);
      this.newVersionPrefill.set(null);
      // Reopen the detail drawer on the just-created version (now top of the list).
      this.activeStickerResource.set(detail);
      this.showToast('Új verzió létrejött.', 'history');
      return true;
    } catch {
      this.showToast('Az új verzió létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async createInstanceSticker(payload: CreateStickerPayload, week?: number): Promise<boolean> {
    const instanceId = this.activeInstanceId();
    if (!instanceId || instanceId === 'mock-instance') {
      this.showToast('Mintaadatok mellett futó matricát nem lehet menteni.', 'cloud_off');
      return false;
    }

    const targetWeek = Math.max(1, week ?? (this.album.currentWeek || 1));
    const request: CreateInstanceStickerPayload = {
      sticker: payload,
      week: targetWeek,
      state: 'tervezett',
    };
    try {
      const sticker = await firstValueFrom(this.api.createInstanceSticker(instanceId, request));
      this.upsertSticker(sticker);
      await this.refreshWorkspaceLists();
      this.setWizardOpen(false);
      this.instanceStickerPrefill.set(null);
      this.openSticker(sticker.id);
      this.showToast('Új matrica hozzáadva ehhez a futó albumhoz.', 'add');
      return true;
    } catch {
      this.showToast('A futó matrica létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async duplicateInstanceSticker(stickerId: string): Promise<void> {
    try {
      const sticker = await firstValueFrom(this.api.duplicateInstanceSticker(stickerId));
      this.upsertSticker(sticker);
      await this.refreshWorkspaceLists();
      this.openSticker(sticker.id);
      this.showToast('Matrica duplikálva ebben a futó albumban.', 'content_copy');
    } catch {
      this.showToast('A matrica duplikálása nem sikerült.', 'error');
    }
  }

  async forkInstanceSticker(stickerId: string, payload: CreateStickerPayload, week?: number): Promise<boolean> {
    const request: ForkInstanceStickerPayload = { sticker: payload, week: week ?? null };
    try {
      const sticker = await firstValueFrom(this.api.forkInstanceSticker(stickerId, request));
      this.upsertSticker(sticker);
      await this.refreshWorkspaceLists();
      this.setWizardOpen(false);
      this.instanceStickerPrefill.set(null);
      this.openSticker(sticker.id);
      this.showToast('Matrica szerkesztve csak ebben a futó albumban.', 'edit');
      return true;
    } catch {
      this.showToast('A futó matrica szerkesztése nem sikerült.', 'error');
      return false;
    }
  }

  async createTemplate(payload: CreateAlbumTemplatePayload, stickerVersionIds: string[] = []): Promise<boolean> {
    try {
      const templateId = await firstValueFrom(this.api.createTemplate(payload));
      for (const [index, versionId] of stickerVersionIds.entries()) {
        await firstValueFrom(this.api.assignStickerToTemplate(templateId, versionId, (index % 4) + 1, Math.floor(index / 4) + 1));
      }
      await this.refreshWorkspaceLists();
      await this.openAlbumTemplate(templateId);
      this.activeTemplateId.set(templateId);
      this.setWizardOpen(false);
      this.editingTemplate.set(true);
      await this.router.navigate(['/teacher/templates', templateId]);
      this.showToast('Új albumterv vázlat létrejött. Szerkesztheted.', 'add_circle');
      return true;
    } catch {
      this.showToast('Az albumterv létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async createTemplateVersion(templateId: string, payload: CreateAlbumTemplatePayload): Promise<boolean> {
    try {
      const detail = await firstValueFrom(this.api.createTemplateVersion(templateId, payload));
      await this.refreshWorkspaceLists();
      this.activeAlbumTemplate.set(detail);
      this.activeTemplateId.set(templateId);
      this.setWizardOpen(false);
      this.newTemplateVersionPrefill.set(null);
      this.page.set('templateDetail');
      this.showToast('Új albumterv-verzió létrejött.', 'history');
      return true;
    } catch {
      this.showToast('Az új albumterv-verzió létrehozása nem sikerült.', 'error');
      return false;
    }
  }

  async createAlbum(payload: CreateAlbumTemplatePayload): Promise<boolean> {
    return this.createTemplate(payload);
  }

  async createInstance(templateId: string, payload: CreateAlbumInstancePayload): Promise<boolean> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const snapshot = await firstValueFrom(this.api.createInstance(templateId, payload));
      this.applySnapshot(snapshot);
      await this.refreshWorkspaceLists();
      this.page.set('plan');
      this.setWizardOpen(false);
      this.showToast('Futó album elindítva az osztállyal.', 'groups');
      return true;
    } catch {
      this.loadError.set('A futó album elindítása nem sikerült.');
      this.showToast('A futó album elindítása nem sikerült.', 'error');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async refreshAlbum(): Promise<void> {
    const id = this.activeInstanceId();
    if (!id || id === 'mock-instance') {
      await this.loadWorkspace();
      return;
    }

    await this.refreshWorkspaceLists();
    const snapshot = await firstValueFrom(this.api.getInstance(id));
    this.applySnapshot(snapshot);
  }

  async loadAdvice(audience: 'teacher' | 'student'): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') return;

    try {
      const advices = await firstValueFrom(this.api.getAiAdvice('instance', ownerId, audience));
      if (audience === 'teacher') this.teacherAdvices.set(advices);
      else this.studentAdvices.set(advices);
    } catch {
      this.showToast('Az AI tanácsok betöltése nem sikerült.', 'error');
    }
  }

  async refreshTeacherAdvice(): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }

    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'teacher',
      targetType: 'albumInstance',
      targetId: ownerId,
    });
  }

  /** Computed: the most recent "Mind: AI-összegzés" digest for the active instance. */
  readonly pendingEvidenceDigest = computed(() =>
    this.teacherAdvices().find(a => a.targetType === 'pendingEvidenceDigest') ?? null
  );

  readonly closureSynthesis = computed(() =>
    this.teacherAdvices().find(a => a.targetType === 'closureSynthesis') ?? null
  );

  /** Generates / refreshes the cross-team digest over pending evidence. */
  async requestPendingEvidenceDigest(): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }
    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'teacher',
      targetType: 'pendingEvidenceDigest',
    });
  }

  /** Generates a project-level closure synthesis from evidence, feedback, reflections, and the effect log. */
  async requestClosureSynthesis(): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }
    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'teacher',
      targetType: 'closureSynthesis',
      targetId: ownerId,
    });
  }

  /** Lookup helper for the Socratic advice attached to a specific help request. */
  triageForHelpRequest(helpRequestId: string): AiAdvice[] {
    return this.teacherAdvices().filter(a => a.targetType === 'helpRequest' && a.targetId === helpRequestId);
  }

  /** Generates Socratic question suggestions for the teacher's reply to a help request. */
  async requestHelpRequestTriage(helpRequestId: string): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }
    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'teacher',
      targetType: 'helpRequest',
      targetId: helpRequestId,
    });
  }

  /** Generates an editable, evidence-specific teacher feedback draft. */
  async requestEvidenceFeedbackDraft(evidenceId: string): Promise<void> {
    const ownerId = this.activeInstanceId();
    if (!ownerId || ownerId === 'mock-instance') {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }
    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'teacher',
      targetType: 'evidence',
      targetId: evidenceId,
    });
  }

  setStudentTeam(teamId: string): void {
    if (!this.teams.some(team => team.id === teamId)) return;
    if (this.studentTeamId() === teamId) return;
    this.studentTeamId.set(teamId);
    // Student Socratic advice is generated per-team; clear when switching so the
    // user sees the default placeholder until they explicitly hit "Kérdések frissítése".
    this.clearStudentAdvice();
  }

  clearStudentAdvice(): void {
    this.studentAdvices.set([]);
  }

  async refreshStudentAdvice(): Promise<void> {
    const ownerId = this.activeInstanceId();
    const sticker = this.currentStickerForStudent();
    const team = this.selectedStudentTeam();
    if (!ownerId || ownerId === 'mock-instance' || !sticker || !team) {
      this.showToast('Mintaadatok mellett az AI tanácsadó nem hívható.', 'cloud_off');
      return;
    }

    await this.generateAdvice({
      ownerType: 'instance',
      ownerId,
      audience: 'student',
      targetType: 'instanceSticker',
      targetId: sticker.id,
      teamId: team.id,
      instanceStickerId: sticker.id,
    });
  }

  async setAdviceStatus(id: string, status: AiAdvice['status']): Promise<void> {
    this.replaceAdvice({ id, status } as Partial<AiAdvice> & { id: string });
    try {
      const advice = await firstValueFrom(this.api.setAiAdviceStatus(id, status));
      this.upsertAdvice(advice);
    } catch {
      this.showToast('A tanács állapotának mentése nem sikerült.', 'error');
    }
  }

  async applyAdvice(id: string, payload?: CreateStickerAdviceActionPayload | DraftFeedbackAdviceActionPayload | Record<string, unknown>): Promise<ApplyAiAdviceResult | null> {
    try {
      const result = await firstValueFrom(this.api.applyAiAdvice(id, payload));
      this.upsertAdvice(result.advice);
      if (result.instanceSticker) {
        this.upsertSticker(result.instanceSticker);
        await this.refreshWorkspaceLists();
      }
      if (result.evidenceId && result.draftFeedback) {
        this.setFeedbackDraft(result.draftFeedback);
        this.openEvidence(result.evidenceId);
      }
      this.closeAdvice();
      this.showToast(result.instanceSticker ? 'AI javaslatból új matrica jött létre.' : 'AI draft betöltve szerkesztésre.', 'auto_awesome');
      return result;
    } catch {
      this.showToast('Az AI javaslat alkalmazása nem sikerült.', 'error');
      return null;
    }
  }

  async clearAiAdvices(): Promise<void> {
    this.maintenanceLoading.set(true);
    this.cancelAdviceRequests();

    try {
      await firstValueFrom(this.api.clearAiAdvices());
      this.clearLocalAdviceState();
      this.showToast('AI tanácsok törölve.', 'delete_sweep');
    } catch {
      this.showToast('Az AI tanácsok törlése nem sikerült.', 'error');
    } finally {
      this.maintenanceLoading.set(false);
    }
  }

  async resetDemoData(): Promise<void> {
    this.maintenanceLoading.set(true);
    this.loading.set(true);
    this.loadError.set(null);
    this.cancelAdviceRequests();

    try {
      const snapshot = await firstValueFrom(this.api.resetDemoData());
      await this.refreshWorkspaceLists();
      this.clearLocalAdviceState();
      this.activeStickerId.set(null);
      this.activeEvidenceId.set(null);
      this.feedbackDraft.set(null);
      this.applySnapshot(snapshot);
      this.page.set('plan');
      this.showToast('Demo visszaállítva, tiszta kezdőállapot kész.', 'restart_alt');
    } catch {
      this.loadError.set('A demo adatbázis visszaállítása nem sikerült.');
      this.showToast('A demo adatbázis visszaállítása nem sikerült.', 'error');
    } finally {
      this.loading.set(false);
      this.maintenanceLoading.set(false);
    }
  }

  async resetGuidedDemoData(): Promise<void> {
    this.maintenanceLoading.set(true);
    this.loading.set(true);
    this.loadError.set(null);
    this.cancelAdviceRequests();

    try {
      const workspace = await firstValueFrom(this.api.resetGuidedDemoData());
      this.stickerLibrary.set(workspace.stickers);
      this.templates.set(workspace.templates);
      this.instances.set(workspace.instances);
      this.clearActiveWorkspace();
      await this.router.navigate(['/teacher']);
      this.showToast('Bemutató munkaterület előkészítve.', 'auto_awesome');
    } catch {
      this.loadError.set('A bemutató munkaterület előkészítése nem sikerült.');
      this.showToast('A bemutató munkaterület előkészítése nem sikerült.', 'error');
    } finally {
      this.loading.set(false);
      this.maintenanceLoading.set(false);
    }
  }

  updateSticker(id: string, patch: Partial<Sticker>): void {
    this.stickers.update(list => list.map(sticker => sticker.id === id ? { ...sticker, ...patch } : sticker));
  }

  updateEvidence(id: string, patch: Partial<Evidence>): void {
    this.evidence.update(list => list.map(evidence => evidence.id === id ? { ...evidence, ...patch } : evidence));
  }

  addOrReplaceEvidence(next: Evidence): void {
    this.evidence.update(list => {
      const idx = list.findIndex(evidence => evidence.id === next.id);
      if (idx >= 0) {
        const copy = list.slice();
        copy[idx] = next;
        return copy;
      }
      return [next, ...list];
    });
  }

  async acceptMicroSticker(): Promise<void> {
    const instanceId = this.activeInstanceId();
    if (!instanceId || instanceId === 'mock-instance') {
      this.microStickerAccepted.set(true);
      this.showToast('"Mérési gyorstalpaló" beillesztve a 2. hét végére.', 'auto_awesome');
      return;
    }

    try {
      const sticker = await firstValueFrom(this.api.acceptMeasurementBasics(instanceId));
      this.upsertSticker(sticker);
      this.microStickerAccepted.set(true);
      await this.refreshAlbum();
      this.showToast('"Mérési gyorstalpaló" beillesztve a 2. hét végére.', 'auto_awesome');
    } catch {
      this.showToast('A mikromatrica mentése nem sikerült.', 'error');
    }
  }

  rejectMicroSticker(): void {
    this.microStickerProposed.set(false);
    this.showToast('Javaslat elutasítva, a futó album nem változott.');
  }

  async setStickerState(id: string, state: StickerState): Promise<void> {
    this.updateSticker(id, { state });
    try {
      const sticker = await firstValueFrom(this.api.setStickerState(id, state));
      this.upsertSticker(sticker);
    } catch {
      this.showToast('Az állapot mentése nem sikerült.', 'error');
    }
  }

  setEvidenceStatus(id: string, status: EvidenceStatus): void {
    this.updateEvidence(id, { status });
  }

  async submitFeedback(id: string, teacherFeedback: string, status: EvidenceStatus): Promise<void> {
    this.updateEvidence(id, { teacherFeedback, status });

    try {
      const result = await firstValueFrom(this.api.submitFeedback(id, teacherFeedback, status));
      this.addOrReplaceEvidence(result.evidence);
      this.upsertTeamProgress(result.progress);
      this.showToast('Visszajelzés mentve és bekerült a bizonyíték-portfólióba.', 'mark_email_read');
    } catch {
      this.showToast('A visszajelzés mentése nem sikerült.', 'error');
    }
  }

  async archiveEvidence(id: string): Promise<boolean> {
    try {
      const snapshot = await firstValueFrom(this.api.archiveEvidence(id));
      this.applySnapshot(snapshot);
      this.openEvidence(null);
      this.showToast('Bizonyíték archiválva. A tanári alapnézetből eltűnt.', 'archive');
      return true;
    } catch {
      this.showToast('A bizonyíték csak visszajelzés előtt archiválható.', 'error');
      return false;
    }
  }

  async updateQualityDimension(id: string, patch: { score?: number; state?: QualityDim['state']; reason?: string | null }): Promise<boolean> {
    const previous = this.qualityDims;
    try {
      const updated = await firstValueFrom(this.api.updateQualityDimension(id, patch));
      this.qualityDims = this.qualityDims.map(dimension => dimension.id === id ? updated : dimension);
      return true;
    } catch {
      this.qualityDims = previous;
      this.showToast('A minőségi dimenzió mentése nem sikerült.', 'error');
      return false;
    }
  }

  async submitEvidence(payload: CreateEvidencePayload): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.submitEvidence(payload));
      this.addOrReplaceEvidence(result.evidence);
      this.upsertTeamProgress(result.progress);
      this.setEvidenceFlowOpen(false);
      this.showToast('Bizonyíték beküldve a tanári visszajelzési sorba.', 'upload');
    } catch {
      this.showToast('A bizonyíték beküldése nem sikerült.', 'error');
    }
  }

  projectReflectionForTeam(teamId: string): AlbumInstanceTeamReflection | null {
    return this.teamReflections().find(reflection => reflection.teamId === teamId) ?? null;
  }

  helpRequestsForTeam(teamId: string): TeamHelpRequest[] {
    return this.helpRequests()
      .filter(request => request.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async submitHelpRequest(question: string, instanceStickerId?: string | null): Promise<void> {
    const team = this.selectedStudentTeam();
    const instanceId = this.activeInstanceId();
    if (!team || !instanceId || instanceId === 'mock-instance') {
      this.showToast('Mintaadatok mellett a segítségkérés nem küldhető.', 'cloud_off');
      return;
    }
    try {
      const saved = await firstValueFrom(this.api.createHelpRequest({
        albumInstanceId: instanceId,
        teamId: team.id,
        instanceStickerId: instanceStickerId ?? null,
        question,
      }));
      this.helpRequests.update(rows => [saved, ...rows]);
      this.showToast('Segítségkérés elküldve a tanárnak.', 'support_agent');
    } catch {
      this.showToast('A segítségkérés küldése nem sikerült.', 'error');
    }
  }

  async toggleHelpRequestResolved(id: string): Promise<void> {
    try {
      const updated = await firstValueFrom(this.api.toggleHelpRequestResolved(id));
      this.helpRequests.update(rows => rows.map(row => row.id === id ? updated : row));
      this.showToast(updated.resolvedAt ? 'Segítségkérés megoldva.' : 'Segítségkérés újra nyitva.', 'check_circle');
    } catch {
      this.showToast('A segítségkérés állapotának módosítása nem sikerült.', 'error');
    }
  }

  async saveStickerReflection(stickerId: string, text: string): Promise<void> {
    const team = this.selectedStudentTeam();
    if (!team) return;
    try {
      const progress = await firstValueFrom(this.api.saveStickerReflection(stickerId, team.id, text));
      this.upsertTeamProgress(progress);
      this.showToast('Reflexió mentve. A matrica reflektált.', 'self_improvement');
    } catch {
      this.showToast('A reflexió mentése nem sikerült.', 'error');
    }
  }

  async saveProjectReflection(text: string): Promise<void> {
    const team = this.selectedStudentTeam();
    const instanceId = this.activeInstanceId();
    if (!team || !instanceId || instanceId === 'mock-instance') return;
    try {
      const saved = await firstValueFrom(this.api.saveProjectReflection(instanceId, team.id, text));
      this.teamReflections.update(rows => {
        const filtered = rows.filter(row => row.teamId !== saved.teamId);
        return [...filtered, saved];
      });
      this.showToast('Projektzáró reflexió mentve.', 'flag');
    } catch {
      this.showToast('A projektzáró reflexió mentése nem sikerült.', 'error');
    }
  }

  async markEvidenceSeen(evidenceId: string): Promise<void> {
    const evidence = this.evidence().find(item => item.id === evidenceId);
    if (!evidence || evidence.seenByTeamAt) return;

    // Optimistic local update so the unread badge clears immediately.
    this.updateEvidence(evidenceId, { seenByTeamAt: new Date().toISOString() });
    try {
      const updated = await firstValueFrom(this.api.markEvidenceSeen(evidenceId));
      this.addOrReplaceEvidence(updated);
    } catch {
      // Roll back the optimistic flip if the server didn't accept it.
      this.updateEvidence(evidenceId, { seenByTeamAt: null });
    }
  }

  private upsertTeamProgress(progress: TeamStickerProgress): void {
    this.teamProgress.update(current => {
      const filtered = current.filter(
        item => !(item.instanceStickerId === progress.instanceStickerId && item.teamId === progress.teamId),
      );
      return [...filtered, progress];
    });
  }

  showToast(msg: string, icon = 'check_circle'): void {
    this.toast.set({ msg, icon });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2800);
  }

  private async refreshWorkspaceLists(): Promise<void> {
    const [stickers, templates, instances] = await Promise.all([
      firstValueFrom(this.api.getStickerLibrary()),
      firstValueFrom(this.api.getTemplates()),
      firstValueFrom(this.api.getInstances()),
    ]);

    this.stickerLibrary.set(stickers);
    this.templates.set(templates);
    this.instances.set(instances);
  }

  private async withStartupRetry<T>(operation: () => Promise<T>): Promise<T> {
    const delays = [350, 700, 1200, 2000, 3000];
    let lastError: unknown;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === delays.length) break;
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }

    throw lastError;
  }

  private async generateAdvice(payload: GenerateAiAdvicePayload): Promise<void> {
    const requestId = ++this.adviceRequestSeq[payload.audience];
    this.activeAdviceRequestCount += 1;
    this.adviceLoading.set(true);

    try {
      const advices = await firstValueFrom(this.api.generateAiAdvice(payload));
      if (requestId !== this.adviceRequestSeq[payload.audience]) {
        return;
      }
      if (payload.audience === 'teacher') {
        this.teacherAdvices.set(this.mergeAdvices(this.teacherAdvices(), advices));
      } else {
        this.studentAdvices.set(this.mergeAdvices(this.studentAdvices(), advices));
      }
      this.showToast('AI tanácsok frissítve.', 'auto_awesome');
    } catch {
      if (requestId === this.adviceRequestSeq[payload.audience]) {
        this.showToast('Az AI tanácsadó most nem elérhető.', 'error');
      }
    } finally {
      this.activeAdviceRequestCount = Math.max(0, this.activeAdviceRequestCount - 1);
      this.adviceLoading.set(this.activeAdviceRequestCount > 0);
    }
  }

  private applySnapshot(snapshot: AlbumSnapshot): void {
    this.activeInstanceId.set(snapshot.id);
    this.activeTemplateId.set(snapshot.album.templateId ?? null);
    this.album = snapshot.album;
    this.teams = snapshot.teams;
    const currentId = this.studentTeamId();
    if (!currentId || !snapshot.teams.some(team => team.id === currentId)) {
      this.studentTeamId.set(snapshot.teams[0]?.id ?? null);
    }
    this.stickers.set(snapshot.stickers);
    this.evidence.set(snapshot.evidence);
    this.teamProgress.set(snapshot.teamProgress);
    this.teamDifferentiationPaths.set(snapshot.teamDifferentiationPaths);
    this.teamReflections.set(snapshot.teamReflections);
    this.helpRequests.set(snapshot.helpRequests);
    this.teacherEffectLog.set(snapshot.teacherEffectLog);
    this.closureChecklist.set(snapshot.closureChecklist);
    this.qualityDims = snapshot.qualityDims;
    this.aiNotes.set(snapshot.aiNotes);
    void this.loadAdvice('teacher');
    void this.loadAdvice('student');

    const hasMeasurementBasics = snapshot.stickers.some(sticker => sticker.title === 'Mérési gyorstalpaló');
    const hasMeasurementSuggestion = snapshot.aiNotes.some(note =>
      note.targetType === 'quality' && note.targetKey === 'bizonyit' && note.kind === 'suggestion'
    );
    this.microStickerAccepted.set(hasMeasurementBasics);
    this.microStickerProposed.set(hasMeasurementSuggestion && !hasMeasurementBasics);
  }

  private clearActiveWorkspace(): void {
    this.activeInstanceId.set(null);
    this.activeTemplateId.set(this.templates()[0]?.id ?? null);
    this.activeAlbumTemplate.set(null);
    this.activeStickerId.set(null);
    this.activeEvidenceId.set(null);
    this.activeStickerResource.set(null);
    this.feedbackDraft.set(null);
    this.instanceStickerPrefill.set(null);
    this.stickers.set([]);
    this.evidence.set([]);
    this.teamProgress.set([]);
    this.teamDifferentiationPaths.set([]);
    this.teamReflections.set([]);
    this.helpRequests.set([]);
    this.teacherEffectLog.set(null);
    this.closureChecklist.set([]);
    this.aiNotes.set([]);
    this.teams = [];
    this.album = this.emptyAlbumMeta();
    this.qualityDims = [];
    this.clearLocalAdviceState();
    this.microStickerAccepted.set(false);
    this.microStickerProposed.set(false);
  }

  private emptyAlbumMeta(): AlbumMeta {
    return {
      title: 'Nincs futó album',
      subject: '',
      grade: '',
      durationType: 'het',
      duration: '0 hét',
      drivingQ: '',
      finalProduct: '',
      audience: '',
      projectReflectionPrompts: [...DEFAULT_PROJECT_REFLECTION_PROMPTS],
      differentiationPaths: [],
      dispositions: [],
      weekTitles: [],
      currentWeek: 0,
    };
  }

  private applyMockWorkspace(): void {
    this.activeInstanceId.set('mock-instance');
    this.activeTemplateId.set('mock-template');
    this.stickerLibrary.set(this.stickers().map(sticker => ({
      id: `library-${sticker.id}`,
      title: sticker.title,
      latestVersionId: sticker.stickerVersionId ?? sticker.id,
      latestVersionNumber: 1,
      phase: sticker.phase,
      short: sticker.short,
      templateUsageCount: 1,
    })));
    this.templates.set([{
      id: 'mock-template',
      title: this.album.title,
      subject: this.album.subject,
      grade: this.album.grade,
      durationType: this.album.durationType,
      patternKey: 'altalanos',
      patternName: 'Általános album',
      patternDescription: 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.',
      unitCount: this.album.weekTitles.length,
      duration: this.album.duration,
      drivingQ: this.album.drivingQ,
      stickerCount: this.stickers().length,
      instanceCount: 1,
      isDraftOnly: false,
    }]);
    this.instances.set([{
      id: 'mock-instance',
      templateId: 'mock-template',
      templateTitle: this.album.title,
      title: `${this.album.grade} futó album`,
      className: this.album.grade,
      subject: this.album.subject,
      grade: this.album.grade,
      durationType: this.album.durationType,
      unitCount: this.album.weekTitles.length,
      duration: this.album.duration,
      drivingQ: this.album.drivingQ,
      currentWeek: this.album.currentWeek,
      stickerCount: this.stickers().length,
      pendingEvidenceCount: this.pendingEvidence().length,
    }]);
    // Seed the mock closure checklist so the closure page renders something offline-ish.
    this.closureChecklist.set([
      { id: 'mock-c1', sortOrder: 1, label: 'Iskolavezetés meghívva', done: true },
      { id: 'mock-c2', sortOrder: 2, label: 'Próbabemutató megtartva', done: true },
      { id: 'mock-c3', sortOrder: 3, label: 'Makett kész', done: true },
      { id: 'mock-c4', sortOrder: 4, label: 'Bizonyítékokra épülő érvelés a diákban', done: true },
      { id: 'mock-c5', sortOrder: 5, label: 'Reflexiók beérkeztek minden csapattól', done: true },
      { id: 'mock-c6', sortOrder: 6, label: 'Iskolavezetés visszajelzése rögzítve', done: true },
      { id: 'mock-c7', sortOrder: 7, label: 'Hosszú távú javaslatok továbbítva', done: false },
    ]);
  }

  private upsertSticker(next: Sticker): void {
    this.stickers.update(list => {
      const idx = list.findIndex(sticker => sticker.id === next.id);
      if (idx >= 0) {
        const copy = list.slice();
        copy[idx] = next;
        return copy;
      }
      return [...list, next].sort((a, b) => a.week - b.week || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    });
  }

  private upsertAdvice(next: AiAdvice): void {
    const target = next.audience === 'teacher' ? this.teacherAdvices : this.studentAdvices;
    target.set(this.mergeAdvices(target(), [next]));
  }

  private clearLocalAdviceState(): void {
    this.cancelAdviceRequests();
    this.teacherAdvices.set([]);
    this.studentAdvices.set([]);
    this.closeAdvice();
  }

  private cancelAdviceRequests(): void {
    this.adviceRequestSeq.teacher += 1;
    this.adviceRequestSeq.student += 1;
    this.activeAdviceRequestCount = 0;
    this.adviceLoading.set(false);
  }

  private replaceAdvice(patch: Partial<AiAdvice> & { id: string }): void {
    const apply = (list: AiAdvice[]) => list.map(advice => advice.id === patch.id ? { ...advice, ...patch } : advice);
    this.teacherAdvices.update(apply);
    this.studentAdvices.update(apply);
  }

  private mergeAdvices(current: AiAdvice[], incoming: AiAdvice[]): AiAdvice[] {
    const map = new Map(current.map(advice => [advice.id, advice]));
    for (const advice of incoming) {
      map.set(advice.id, advice);
    }

    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
