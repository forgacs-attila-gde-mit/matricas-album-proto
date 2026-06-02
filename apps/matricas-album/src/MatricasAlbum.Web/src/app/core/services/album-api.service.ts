import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, switchMap } from 'rxjs';
import {
  AiAdvice,
  AiAdviceActionType,
  AiAdviceAudience,
  AiNote,
  ALBUM_TEMPLATE_PATTERNS,
  AiOwnerType,
  AiTargetType,
  AlbumInstanceListItem,
  AlbumMeta,
  AlbumTemplateDetail,
  AlbumTemplateListItem,
  AlbumTemplatePatternKey,
  AlbumTemplateVersionView,
  BlockActivityRef,
  BlockDetail,
  BlockListItem,
  BlockVersionView,
  TopicBlockRef,
  TopicDetail,
  TopicListItem,
  TopicVersionView,
  TeacherEffectLog,
  ClosureChecklistItem,
  CreateStickerAdviceActionPayload,
  DEFAULT_PROJECT_REFLECTION_PROMPTS,
  DifferentiationPath,
  DifferentiationPathKey,
  DurationType,
  DraftFeedbackAdviceActionPayload,
  Evidence,
  EvidenceStatus,
  EvidenceType,
  QualityDim,
  AlbumInstanceTeamReflection,
  Sticker,
  StickerLibraryItem,
  StickerResourceDetail,
  StickerVersionView,
  Team,
  TeamHelpRequest,
  TeamDifferentiationPathAssignment,
  TemplateStickerView,
  TeamProgressState,
  TeamStickerProgress,
} from '../models/album.model';
import { normalizePhase, PhaseId } from '../tokens/phases';

interface StickerResourceListItemDto {
  id: string;
  title: string;
  latestVersionId: string;
  latestVersionNumber: number;
  phase: string;
  activityTypeKey?: string | null;
  shortDescription: string;
  templateUsageCount: number;
  archivedAt?: string | null;
}

interface WorkspaceListsDto {
  stickers: StickerResourceListItemDto[];
  templates: AlbumTemplateListItemDto[];
  instances: AlbumInstanceListItemDto[];
}

interface StickerVersionDto {
  id: string;
  stickerResourceId: string;
  versionNumber: number;
  title: string;
  phase: string;
  shortDescription: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceTypeLabel: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
  aiNotes: AiNoteDto[];
}

interface StickerResourceDetailDto {
  id: string;
  title: string;
  archivedAt?: string | null;
  versions: StickerVersionDto[];
}

interface BlockListItemDto {
  id: string;
  name: string;
  latestVersionNumber: number;
  flowType: string;
  grouping: string;
  activityCount: number;
  hasDraft: boolean;
  latestPublishedVersionId?: string | null;
  archivedAt?: string | null;
}

interface TopicListItemDto {
  id: string;
  name: string;
  latestVersionNumber: number;
  blockCount: number;
  hasDraft: boolean;
  archivedAt?: string | null;
}

interface TopicBlockDto {
  id: string;
  blockVersionId: string;
  blockId: string;
  blockName: string;
  blockVersionNumber: number;
  activityCount: number;
  sortOrder: number;
}

interface TopicVersionDto {
  id: string;
  topicId: string;
  versionNumber: number;
  isDraft: boolean;
  name: string;
  blocks: TopicBlockDto[];
}

interface TopicDetailDto {
  id: string;
  name: string;
  archivedAt?: string | null;
  versions: TopicVersionDto[];
}

interface BlockActivityDto {
  id: string;
  stickerVersionId: string;
  stickerResourceId: string;
  activityTitle: string;
  stickerVersionNumber: number;
  role: string;
  sortOrder: number;
}

interface BlockVersionDto {
  id: string;
  blockId: string;
  versionNumber: number;
  isDraft: boolean;
  name: string;
  flowType: string;
  grouping: string;
  activities: BlockActivityDto[];
}

interface BlockDetailDto {
  id: string;
  name: string;
  archivedAt?: string | null;
  versions: BlockVersionDto[];
}

interface AlbumTemplateListItemDto {
  id: string;
  title: string;
  subject: string;
  grade: string;
  durationType: string;
  patternKey?: string | null;
  patternName?: string | null;
  patternDescription?: string | null;
  unitCount: number;
  drivingQuestion: string;
  stickerCount: number;
  instanceCount: number;
  archivedAt?: string | null;
  isDraftOnly: boolean;
}

interface AlbumTemplateDetailDto {
  id: string;
  archivedAt?: string | null;
  title: string;
  subject: string;
  grade: string;
  durationType: string;
  patternKey?: string | null;
  patternName?: string | null;
  patternDescription?: string | null;
  drivingQuestion: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts?: string[] | null;
  differentiationPaths?: DifferentiationPathDto[] | null;
  dispositions: string[];
  weeks: WeekPlanDto[];
  stickers: TemplateStickerDto[];
  versions: AlbumTemplateVersionDto[];
  qualityDimensions: QualityDimensionDto[];
  aiNotes: AiNoteDto[];
}

interface AlbumTemplateVersionDto {
  id: string;
  albumTemplateId: string;
  versionNumber: number;
  isDraft?: boolean;
  title: string;
  subject: string;
  grade: string;
  durationType: string;
  patternKey?: string | null;
  patternName?: string | null;
  patternDescription?: string | null;
  drivingQuestion: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts?: string[] | null;
  createdAt: string;
  differentiationPaths?: DifferentiationPathDto[] | null;
  dispositions: string[];
  weeks: WeekPlanDto[];
  stickers: TemplateStickerDto[];
}

interface TemplateStickerDto {
  id: string;
  stickerResourceId: string;
  stickerVersionId: string;
  stickerVersionNumber: number;
  week: number;
  sortOrder: number;
  title: string;
  phase: string;
  shortDescription: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceTypeLabel: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
  aiNotes: AiNoteDto[];
}

interface AlbumInstanceListItemDto {
  id: string;
  albumTemplateId: string;
  templateTitle: string;
  title: string;
  className: string;
  subject: string;
  grade: string;
  durationType: string;
  unitCount: number;
  drivingQuestion: string;
  currentWeek: number;
  stickerCount: number;
  pendingEvidenceCount: number;
  archivedAt?: string | null;
}

interface AlbumInstanceDetailDto {
  id: string;
  albumTemplateId: string;
  templateTitle: string;
  templateArchivedAt?: string | null;
  archivedAt?: string | null;
  title: string;
  className: string;
  subject: string;
  grade: string;
  durationType: string;
  drivingQuestion: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts?: string[] | null;
  differentiationPaths?: DifferentiationPathDto[] | null;
  currentWeek: number;
  dispositions: string[];
  weeks: WeekPlanDto[];
  teams: TeamDto[];
  stickers: InstanceStickerDto[];
  evidence: EvidenceDto[];
  teamProgress: TeamStickerProgressDto[];
  teamDifferentiationPaths?: TeamDifferentiationPathAssignmentDto[] | null;
  teamReflections: TeamReflectionDto[];
  helpRequests: TeamHelpRequestDto[];
  teacherEffectLog?: TeacherEffectLogDto | null;
  closureChecklist: ClosureChecklistItemDto[];
  qualityDimensions: QualityDimensionDto[];
  aiNotes: AiNoteDto[];
}

interface TeacherEffectLogDto {
  workedWell: string;
  engagementSignals: string;
  adaptationNotes: string;
  reuseNextTime: string;
  updatedAt: string;
}

interface ClosureChecklistItemDto {
  id: string;
  sortOrder: number;
  label: string;
  done: boolean;
}

interface TeamHelpRequestDto {
  id: string;
  albumInstanceId: string;
  teamId: string;
  instanceStickerId?: string | null;
  question: string;
  createdAt: string;
  resolvedAt?: string | null;
}

interface TeamStickerProgressDto {
  instanceStickerId: string;
  teamId: string;
  state: string;
  latestEvidenceId?: string | null;
  reflection?: string | null;
  reflectedAt?: string | null;
  updatedAt: string;
}

interface DifferentiationPathDto {
  phase: string;
  pathKey: string;
  title: string;
  description: string;
  recommendedFor: string;
  sortOrder: number;
}

interface TeamDifferentiationPathAssignmentDto {
  instanceStickerId: string;
  teamId: string;
  pathKey: string;
  assignedAt: string;
}

interface TeamReflectionDto {
  teamId: string;
  text: string;
  updatedAt: string;
}

interface EvidenceSubmissionResponseDto {
  evidence: EvidenceDto;
  progress: TeamStickerProgressDto;
}

interface WeekPlanDto {
  weekNumber: number;
  title: string;
}

interface TeamMemberDto { id: string; name: string; }

interface TeamDto {
  id: string;
  name: string;
  members: TeamMemberDto[];
  focus: string;
  color: string;
}

interface InstanceStickerDto {
  id: string;
  stickerResourceId: string;
  stickerVersionId: string;
  stickerVersionNumber: number;
  albumTemplateStickerId?: string | null;
  week: number;
  sortOrder: number;
  state: string;
  deprecated?: boolean;
  title: string;
  phase: string;
  shortDescription: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceTypeLabel: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
  aiNotes: AiNoteDto[];
}

export interface UpgradePlanItemDto {
  instanceStickerId?: string | null;
  stickerVersionId: string;
  newStickerVersionId?: string | null;
  stickerResourceId: string;
  title: string;
  fromStickerVersionNumber: number;
  toStickerVersionNumber: number;
  fromWeek: number;
  fromSort: number;
  toWeek: number;
  toSort: number;
  evidenceCount: number;
  progressCount: number;
}

export interface UpgradePlanDto {
  targetVersionId: string;
  targetVersionNumber: number;
  currentVersionNumber: number;
  fromDurationType: string;
  toDurationType: string;
  fromUnitCount: number;
  toUnitCount: number;
  currentWeekClamp?: number | null;
  isNoOp: boolean;
  added: UpgradePlanItemDto[];
  removedNoEvidence: UpgradePlanItemDto[];
  removedKeptForEvidence: UpgradePlanItemDto[];
  moved: UpgradePlanItemDto[];
  repointed: UpgradePlanItemDto[];
  unchanged: UpgradePlanItemDto[];
}

interface AiNoteDto {
  id: string;
  ownerType: string;
  ownerId: string;
  targetType: string;
  targetId?: string | null;
  targetKey?: string | null;
  kind: string;
  label: string;
  severity: string;
  message: string;
  recommendation?: string | null;
}

interface AiCitationDto {
  sourceId: string;
  label: string;
  excerpt?: string | null;
}

interface AiAdviceActionDto {
  type: string;
  label: string;
  payload: Record<string, unknown>;
}

interface AiAdviceDto {
  id: string;
  runId?: string | null;
  audience: string;
  ownerType: string;
  ownerId: string;
  targetType: string;
  targetId?: string | null;
  targetKey?: string | null;
  kind: string;
  severity: string;
  status: string;
  message: string;
  recommendation?: string | null;
  questions: string[];
  citations: AiCitationDto[];
  action?: AiAdviceActionDto | null;
  model?: string | null;
  promptVersion: string;
  projectionVersion: string;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string | null;
}

interface ApplyAiAdviceResultDto {
  advice: AiAdviceDto;
  sticker?: unknown | null;
  instanceSticker?: InstanceStickerDto | null;
  evidenceId?: string | null;
  draftFeedback?: string | null;
}

interface ClearAiAdviceResultDto {
  deletedAdvices: number;
  deletedRuns: number;
}

interface EvidenceDto {
  id: string;
  instanceStickerId: string;
  teamId: string;
  type: string;
  status: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  description: string;
  helpRequest?: string | null;
  helpRequested?: boolean;
  reflection?: string | null;
  teacherFeedback?: string | null;
  feedbackAt?: string | null;
  seenByTeamAt?: string | null;
  archivedAt?: string | null;
}

interface QualityDimensionDto {
  id: string;
  code: string;
  label: string;
  score: number;
  state: string;
  reason?: string | null;
}

export interface AlbumSnapshot {
  id: string;
  album: AlbumMeta;
  teams: Team[];
  stickers: Sticker[];
  evidence: Evidence[];
  teamProgress: TeamStickerProgress[];
  teamDifferentiationPaths: TeamDifferentiationPathAssignment[];
  teamReflections: AlbumInstanceTeamReflection[];
  helpRequests: TeamHelpRequest[];
  teacherEffectLog: TeacherEffectLog | null;
  closureChecklist: ClosureChecklistItem[];
  qualityDims: QualityDim[];
  aiNotes: AiNote[];
}

export interface EvidenceSubmissionResult {
  evidence: Evidence;
  progress: TeamStickerProgress;
}

export interface ActivityMetadataPayload {
  subject?: string;
  gradeLevel?: string;
  estimatedMinutes?: number;
  modality?: string;
  groupSize?: string;
  contextMode?: string;
  competencies?: string[];
  natReferences?: string[];
}

export interface CreateStickerPayload {
  title: string;
  phase: PhaseId;
  shortDescription: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceTypeLabel: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
  // Dominant Tevékenységtípus key (one of the 6 system types); omitted/undefined leaves
  // the activity unclassified server-side.
  activityTypeKey?: string;
  // Structured planning metadata; the server stores it on the activity instead of the
  // old teacher-step note-lines.
  metadata?: ActivityMetadataPayload;
}

export interface CreateAlbumTemplatePayload {
  title: string;
  subject: string;
  grade: string;
  durationType: 'het' | 'ora' | 'fazis';
  patternKey?: AlbumTemplatePatternKey;
  patternName?: string;
  patternDescription?: string;
  drivingQuestion: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts?: string[] | null;
  dispositions: string[];
  weekTitles: string[];
}

export interface CreateAlbumInstancePayload {
  title: string;
  className: string;
  teams: Array<{
    name: string;
    focus: string;
    color: string;
    members: string[];
  }>;
}

export interface CreateEvidencePayload {
  stickerId: string;
  teamId: string;
  type: EvidenceType;
  title: string;
  description: string;
  helpRequest?: string | null;
  helpRequested?: boolean;
  reflection?: string | null;
}

export interface CreateInstanceStickerPayload {
  sticker: CreateStickerPayload;
  week?: number | null;
  sortOrder?: number | null;
  state?: string | null;
}

export interface ForkInstanceStickerPayload {
  sticker: CreateStickerPayload;
  week?: number | null;
  sortOrder?: number | null;
}

export interface GenerateAiAdvicePayload {
  ownerType: AiOwnerType;
  ownerId: string;
  audience: AiAdviceAudience;
  targetType?: AiTargetType | null;
  targetId?: string | null;
  targetKey?: string | null;
  teamId?: string | null;
  instanceStickerId?: string | null;
}

export interface ApplyAiAdviceResult {
  advice: AiAdvice;
  instanceSticker?: Sticker | null;
  evidenceId?: string | null;
  draftFeedback?: string | null;
}

export interface GuidedDemoWorkspace {
  stickers: StickerLibraryItem[];
  templates: AlbumTemplateListItem[];
  instances: AlbumInstanceListItem[];
}

// Defaults to 'het' so a missing or unexpected server value still renders sensibly.
function normalizeDurationType(value: string | null | undefined): DurationType {
  return value === 'ora' || value === 'fazis' ? value : 'het';
}

function normalizePatternKey(value: string | null | undefined): AlbumTemplatePatternKey {
  return value === 'produktiv-hibazas' || value === 'kutatas-bizonyitas' ? value : 'altalanos';
}

function normalizeDifferentiationPathKey(value: string | null | undefined): DifferentiationPathKey {
  if (value === 'tamogatott' || value === 'kihivas') return value;
  return 'alap';
}

function patternFallback(key: AlbumTemplatePatternKey) {
  return ALBUM_TEMPLATE_PATTERNS.find(pattern => pattern.key === key) ?? ALBUM_TEMPLATE_PATTERNS[0];
}

// Renders a duration label like "6 hét" / "4 óra" / "5 fázis"; falls back to the unit label alone when count is zero.
export function formatDuration(type: DurationType, count: number): string {
  const unit = type === 'het' ? 'hét' : type === 'ora' ? 'óra' : 'fázis';
  return count > 0 ? `${count} ${unit}` : unit;
}

function normalizeProjectReflectionPrompts(prompts: readonly string[] | null | undefined): string[] {
  const normalized = (prompts ?? [])
    .map(prompt => prompt.trim())
    .filter(Boolean)
    .slice(0, 5);
  return normalized.length > 0 ? normalized : [...DEFAULT_PROJECT_REFLECTION_PROMPTS];
}

@Injectable({ providedIn: 'root' })
export class AlbumApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';
  private guidedDemoMode = false;

  setGuidedDemoMode(enabled: boolean): void {
    this.guidedDemoMode = enabled;
  }

  getStickerLibrary() {
    return this.http
      .get<StickerResourceListItemDto[]>(`${this.baseUrl}/stickers`)
      .pipe(map(items => items.map(item => this.toStickerLibraryItem(item))));
  }

  getStickerResource(id: string) {
    return this.http
      .get<StickerResourceDetailDto>(`${this.baseUrl}/stickers/${id}`)
      .pipe(map(dto => this.toStickerResourceDetail(dto)));
  }

  toggleStickerArchive(id: string) {
    return this.http
      .patch<StickerResourceDetailDto>(`${this.baseUrl}/stickers/${id}/archive`, {})
      .pipe(map(dto => this.toStickerResourceDetail(dto)));
  }

  createSticker(payload: CreateStickerPayload) {
    return this.http.post(`${this.baseUrl}/stickers`, payload);
  }

  createStickerVersion(stickerResourceId: string, payload: CreateStickerPayload) {
    return this.http
      .post<StickerResourceDetailDto>(
        `${this.baseUrl}/stickers/${stickerResourceId}/versions`,
        payload,
      )
      .pipe(map(dto => this.toStickerResourceDetail(dto)));
  }

  // --- Blokk (Block) API (Phase 4; gated server-side by Features:Hierarchy:Block) --------

  getBlocks() {
    return this.http
      .get<BlockListItemDto[]>(`${this.baseUrl}/blocks`)
      .pipe(map(items => items.map(item => this.toBlockListItem(item))));
  }

  getBlock(id: string) {
    return this.http
      .get<BlockDetailDto>(`${this.baseUrl}/blocks/${id}`)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  createBlock(payload: { name: string; flowType?: string; grouping?: string }) {
    return this.http
      .post<BlockDetailDto>(`${this.baseUrl}/blocks`, payload)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  createBlockDraft(blockId: string) {
    return this.http
      .post<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/draft`, {})
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  publishBlockDraft(blockId: string) {
    return this.http
      .post<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/draft/publish`, {})
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  discardBlockDraft(blockId: string) {
    return this.http
      .delete<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/draft`)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  updateBlockVersion(versionId: string, patch: { name?: string; flowType?: string; grouping?: string }) {
    return this.http
      .patch<BlockDetailDto>(`${this.baseUrl}/block-versions/${versionId}`, patch)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  addBlockActivity(blockId: string, payload: { stickerVersionId: string; role?: string; sortOrder?: number }) {
    return this.http
      .post<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/activities`, payload)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  updateBlockActivityRole(blockId: string, relationId: string, role: string) {
    return this.http
      .patch<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/activities/${relationId}`, { role })
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  removeBlockActivity(blockId: string, relationId: string) {
    return this.http
      .delete<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/activities/${relationId}`)
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  reorderBlockActivities(blockId: string, items: Array<{ id: string; sortOrder: number }>) {
    return this.http
      .post<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/activities/reorder`, { items })
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  toggleBlockArchive(blockId: string) {
    return this.http
      .patch<BlockDetailDto>(`${this.baseUrl}/blocks/${blockId}/archive`, {})
      .pipe(map(dto => this.toBlockDetail(dto)));
  }

  // --- Témakör (Topic) API (Phase 5; gated server-side by Features:Hierarchy:Topic) ------

  getTopics() {
    return this.http
      .get<TopicListItemDto[]>(`${this.baseUrl}/topics`)
      .pipe(map(items => items.map(item => this.toTopicListItem(item))));
  }

  getTopic(id: string) {
    return this.http
      .get<TopicDetailDto>(`${this.baseUrl}/topics/${id}`)
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  createTopic(payload: { name: string }) {
    return this.http
      .post<TopicDetailDto>(`${this.baseUrl}/topics`, payload)
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  createTopicDraft(topicId: string) {
    return this.http
      .post<TopicDetailDto>(`${this.baseUrl}/topics/${topicId}/draft`, {})
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  publishTopicDraft(topicId: string) {
    return this.http
      .post<TopicDetailDto>(`${this.baseUrl}/topics/${topicId}/draft/publish`, {})
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  addTopicBlock(topicId: string, payload: { blockVersionId: string; sortOrder?: number }) {
    return this.http
      .post<TopicDetailDto>(`${this.baseUrl}/topics/${topicId}/blocks`, payload)
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  removeTopicBlock(topicId: string, relationId: string) {
    return this.http
      .delete<TopicDetailDto>(`${this.baseUrl}/topics/${topicId}/blocks/${relationId}`)
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  reorderTopicBlocks(topicId: string, items: Array<{ id: string; sortOrder: number }>) {
    return this.http
      .post<TopicDetailDto>(`${this.baseUrl}/topics/${topicId}/blocks/reorder`, { items })
      .pipe(map(dto => this.toTopicDetail(dto)));
  }

  getTemplates() {
    return this.http
      .get<AlbumTemplateListItemDto[]>(`${this.baseUrl}/album-templates`)
      .pipe(map(items => items.map(item => this.toTemplateListItem(item))));
  }

  getAlbumTemplate(id: string) {
    return this.http
      .get<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${id}`)
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  toggleTemplateArchive(id: string) {
    return this.http
      .patch<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${id}/archive`, {})
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  deleteTemplate(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/album-templates/${id}`);
  }

  // --- Draft lifecycle -----------------------------------------------------------------

  createTemplateDraft(templateId: string) {
    return this.http
      .post<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${templateId}/draft`, {})
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  publishTemplateDraft(templateId: string) {
    return this.http
      .post<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${templateId}/draft/publish`, {})
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  discardTemplateDraft(templateId: string) {
    return this.http
      .delete<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${templateId}/draft`)
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  updateTemplateVersionMetadata(versionId: string, patch: {
    title?: string;
    subject?: string;
    grade?: string;
    durationType?: 'het' | 'ora' | 'fazis';
    patternKey?: AlbumTemplatePatternKey;
    patternName?: string;
    patternDescription?: string;
    drivingQuestion?: string;
    finalProduct?: string;
    audience?: string;
    projectReflectionPrompts?: string[];
    differentiationPaths?: DifferentiationPath[];
    dispositions?: string[];
    weekTitles?: string[];
  }) {
    return this.http
      .patch<AlbumTemplateDetailDto>(`${this.baseUrl}/album-template-versions/${versionId}`, patch)
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  // --- Per-sticker draft mutations ----------------------------------------------------

  addStickerToTemplateVersion(versionId: string, stickerVersionId: string, week: number, sortOrder: number) {
    return this.http
      .post<AlbumTemplateDetailDto>(
        `${this.baseUrl}/album-template-versions/${versionId}/stickers`,
        { stickerVersionId, week, sortOrder },
      )
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  updateTemplateVersionSticker(versionId: string, templateStickerId: string, patch: { week?: number; sortOrder?: number }) {
    return this.http
      .patch<AlbumTemplateDetailDto>(
        `${this.baseUrl}/album-template-versions/${versionId}/stickers/${templateStickerId}`,
        patch,
      )
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  /**
   * Bulk reorder/move stickers. Sidesteps the unique-index conflict that single-row PATCHes
   * trigger when two stickers swap (server-side two-pass write under a transaction).
   */
  reorderTemplateVersionStickers(
    versionId: string,
    items: Array<{ id: string; week: number; sortOrder: number }>,
  ) {
    return this.http
      .post<AlbumTemplateDetailDto>(
        `${this.baseUrl}/album-template-versions/${versionId}/stickers/reorder`,
        { items },
      )
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  removeTemplateVersionSticker(versionId: string, templateStickerId: string) {
    return this.http
      .delete<AlbumTemplateDetailDto>(
        `${this.baseUrl}/album-template-versions/${versionId}/stickers/${templateStickerId}`,
      )
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  createTemplate(payload: CreateAlbumTemplatePayload) {
    return this.http
      .post<{ id: string }>(`${this.baseUrl}/album-templates`, payload)
      .pipe(map(dto => dto.id));
  }

  createTemplateVersion(templateId: string, payload: CreateAlbumTemplatePayload) {
    return this.http
      .post<AlbumTemplateDetailDto>(`${this.baseUrl}/album-templates/${templateId}/versions`, payload)
      .pipe(map(dto => this.toTemplateDetail(dto)));
  }

  assignStickerToTemplate(templateId: string, stickerVersionId: string, week: number, sortOrder: number) {
    return this.http.post(`${this.baseUrl}/album-templates/${templateId}/stickers`, {
      stickerVersionId,
      week,
      sortOrder,
    });
  }

  getInstances() {
    return this.http
      .get<AlbumInstanceListItemDto[]>(`${this.baseUrl}/album-instances`)
      .pipe(map(items => items.map(item => this.toInstanceListItem(item))));
  }

  createInstance(templateId: string, payload: CreateAlbumInstancePayload) {
    return this.http
      .post<AlbumInstanceDetailDto>(`${this.baseUrl}/album-templates/${templateId}/instances`, payload)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  getFirstInstance() {
    return this.getInstances().pipe(
      switchMap(instances => {
        if (!instances.length) {
          throw new Error('Nincs betölthető futó album.');
        }

        return this.getInstance(instances[0].id);
      }),
    );
  }

  getInstance(id: string) {
    return this.http
      .get<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${id}`)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  updateInstance(id: string, patch: { title?: string; className?: string; currentWeek?: number }) {
    return this.http
      .patch<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${id}`, patch)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  createInstanceSticker(instanceId: string, payload: CreateInstanceStickerPayload) {
    return this.http
      .post<InstanceStickerDto>(`${this.baseUrl}/album-instances/${instanceId}/stickers`, payload)
      .pipe(map(dto => this.toSticker(dto)));
  }

  duplicateInstanceSticker(stickerId: string, patch: { week?: number | null; sortOrder?: number | null } = {}) {
    return this.http
      .post<InstanceStickerDto>(`${this.baseUrl}/instance-stickers/${stickerId}/duplicate`, patch)
      .pipe(map(dto => this.toSticker(dto)));
  }

  forkInstanceSticker(stickerId: string, payload: ForkInstanceStickerPayload) {
    return this.http
      .post<InstanceStickerDto>(`${this.baseUrl}/instance-stickers/${stickerId}/fork`, payload)
      .pipe(map(dto => this.toSticker(dto)));
  }

  createTeam(instanceId: string, payload: { name: string; focus: string; color: string; members: string[] }) {
    return this.http
      .post<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teams`, payload)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  updateTeam(instanceId: string, teamId: string, patch: { name?: string; focus?: string; color?: string }) {
    return this.http
      .patch<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teams/${teamId}`, patch)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  deleteTeam(instanceId: string, teamId: string) {
    return this.http
      .delete<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teams/${teamId}`)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  addTeamMember(instanceId: string, teamId: string, name: string) {
    return this.http
      .post<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teams/${teamId}/members`, { name })
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  removeTeamMember(instanceId: string, teamId: string, memberId: string) {
    return this.http
      .delete<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teams/${teamId}/members/${memberId}`)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  replaceInstanceUnits(instanceId: string, items: Array<{ weekNumber: number; title: string }>) {
    return this.http
      .put<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/units`, { items })
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  toggleInstanceArchive(instanceId: string) {
    return this.http
      .patch<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/archive`, {})
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  toggleClosureChecklistItem(instanceId: string, itemId: string, done: boolean) {
    return this.http
      .patch<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/closure-checklist/${itemId}`, { done })
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  saveTeacherEffectLog(
    instanceId: string,
    payload: Pick<TeacherEffectLog, 'workedWell' | 'engagementSignals' | 'adaptationNotes' | 'reuseNextTime'>,
  ) {
    return this.http
      .put<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/teacher-effect-log`, payload)
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  replaceDifferentiationPaths(instanceId: string, paths: DifferentiationPath[]) {
    return this.http
      .put<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/differentiation-paths`, { paths })
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  setTeamDifferentiationPath(stickerId: string, teamId: string, pathKey: DifferentiationPathKey | null) {
    return this.http
      .put<AlbumInstanceDetailDto>(
        `${this.baseUrl}/instance-stickers/${stickerId}/teams/${teamId}/differentiation-path`,
        { pathKey },
      )
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  getUpgradePreview(instanceId: string) {
    return this.http.get<UpgradePlanDto>(`${this.baseUrl}/album-instances/${instanceId}/upgrade-preview`);
  }

  commitInstanceUpgrade(instanceId: string) {
    return this.http
      .post<AlbumInstanceDetailDto>(`${this.baseUrl}/album-instances/${instanceId}/upgrade`, {})
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  setStickerState(id: string, state: string) {
    return this.http
      .patch<InstanceStickerDto>(`${this.baseUrl}/instance-stickers/${id}/state`, { state })
      .pipe(map(dto => this.toSticker(dto)));
  }

  submitFeedback(id: string, teacherFeedback: string, status: EvidenceStatus) {
    return this.http
      .post<EvidenceSubmissionResponseDto>(`${this.baseUrl}/evidence/${id}/feedback`, { teacherFeedback, status })
      .pipe(map(dto => ({
        evidence: this.toEvidence(dto.evidence),
        progress: this.toTeamProgress(dto.progress),
      } satisfies EvidenceSubmissionResult)));
  }

  archiveEvidence(id: string) {
    return this.http
      .patch<AlbumInstanceDetailDto>(`${this.baseUrl}/evidence/${id}/archive`, {})
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  updateQualityDimension(id: string, patch: { score?: number; state?: QualityDim['state']; reason?: string | null }) {
    return this.http
      .patch<QualityDimensionDto>(`${this.baseUrl}/quality-dimensions/${id}`, patch)
      .pipe(map(dto => this.toQualityDimension(dto)));
  }

  createHelpRequest(payload: { albumInstanceId: string; teamId: string; instanceStickerId?: string | null; question: string }) {
    return this.http
      .post<TeamHelpRequestDto>(`${this.baseUrl}/help-requests`, payload)
      .pipe(map(dto => this.toHelpRequest(dto)));
  }

  toggleHelpRequestResolved(id: string) {
    return this.http
      .patch<TeamHelpRequestDto>(`${this.baseUrl}/help-requests/${id}/resolve`, {})
      .pipe(map(dto => this.toHelpRequest(dto)));
  }

  saveStickerReflection(stickerId: string, teamId: string, text: string) {
    return this.http
      .post<TeamStickerProgressDto>(
        `${this.baseUrl}/instance-stickers/${stickerId}/teams/${teamId}/reflection`,
        { text },
      )
      .pipe(map(dto => this.toTeamProgress(dto)));
  }

  saveProjectReflection(instanceId: string, teamId: string, text: string) {
    return this.http
      .post<TeamReflectionDto>(
        `${this.baseUrl}/album-instances/${instanceId}/teams/${teamId}/project-reflection`,
        { text },
      )
      .pipe(map(dto => this.toTeamReflection(dto)));
  }

  markEvidenceSeen(id: string) {
    return this.http
      .patch<EvidenceDto>(`${this.baseUrl}/evidence/${id}/seen`, {})
      .pipe(map(dto => this.toEvidence(dto)));
  }

  submitEvidence(payload: CreateEvidencePayload) {
    return this.http
      .post<EvidenceSubmissionResponseDto>(`${this.baseUrl}/evidence`, {
        instanceStickerId: payload.stickerId,
        teamId: payload.teamId,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        helpRequest: payload.helpRequest,
        helpRequested: payload.helpRequested ?? false,
        reflection: payload.reflection,
      })
      .pipe(map(dto => ({
        evidence: this.toEvidence(dto.evidence),
        progress: this.toTeamProgress(dto.progress),
      } satisfies EvidenceSubmissionResult)));
  }

  acceptMeasurementBasics(instanceId: string) {
    return this.http
      .post<InstanceStickerDto>(`${this.baseUrl}/album-instances/${instanceId}/micro-stickers/measurement-basics`, {})
      .pipe(map(dto => this.toSticker(dto)));
  }

  generateAiAdvice(payload: GenerateAiAdvicePayload) {
    const options = this.guidedDemoMode
      ? { headers: new HttpHeaders({ 'X-Guided-Demo': 'true' }) }
      : undefined;
    return this.http
      .post<AiAdviceDto[]>(`${this.baseUrl}/ai-advice/generate`, payload, options)
      .pipe(map(items => items.map(item => this.toAiAdvice(item))));
  }

  getAiAdvice(ownerType: AiOwnerType, ownerId: string, audience: AiAdviceAudience) {
    return this.http
      .get<AiAdviceDto[]>(`${this.baseUrl}/ai-advice`, {
        params: { ownerType, ownerId, audience },
      })
      .pipe(map(items => items.map(item => this.toAiAdvice(item))));
  }

  setAiAdviceStatus(id: string, status: AiAdvice['status']) {
    return this.http
      .patch<AiAdviceDto>(`${this.baseUrl}/ai-advice/${id}/status`, { status })
      .pipe(map(dto => this.toAiAdvice(dto)));
  }

  applyAiAdvice(id: string, actionPayload?: CreateStickerAdviceActionPayload | DraftFeedbackAdviceActionPayload | Record<string, unknown>) {
    return this.http
      .post<ApplyAiAdviceResultDto>(`${this.baseUrl}/ai-advice/${id}/apply`, {
        actionPayload: actionPayload ?? null,
      })
      .pipe(map(dto => ({
        advice: this.toAiAdvice(dto.advice),
        instanceSticker: dto.instanceSticker ? this.toSticker(dto.instanceSticker) : null,
        evidenceId: dto.evidenceId,
        draftFeedback: dto.draftFeedback,
      } satisfies ApplyAiAdviceResult)));
  }

  clearAiAdvices() {
    return this.http.delete<ClearAiAdviceResultDto>(`${this.baseUrl}/demo-maintenance/ai-advice`);
  }

  resetDemoData() {
    return this.http
      .post<AlbumInstanceDetailDto>(`${this.baseUrl}/demo-maintenance/reset`, {})
      .pipe(map(dto => this.toSnapshot(dto)));
  }

  resetGuidedDemoData() {
    return this.http
      .post<WorkspaceListsDto>(`${this.baseUrl}/demo-maintenance/guided-demo/reset`, {})
      .pipe(map(dto => ({
        stickers: (dto.stickers ?? []).map(item => this.toStickerLibraryItem(item)),
        templates: (dto.templates ?? []).map(item => this.toTemplateListItem(item)),
        instances: (dto.instances ?? []).map(item => this.toInstanceListItem(item)),
      } satisfies GuidedDemoWorkspace)));
  }

  private toSnapshot(dto: AlbumInstanceDetailDto): AlbumSnapshot {
    const durationType = normalizeDurationType(dto.durationType);
    const weekTitles = dto.weeks
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(week => week.title);
    return {
      id: dto.id,
      album: {
        id: dto.id,
        templateId: dto.albumTemplateId,
        templateTitle: dto.templateTitle,
        templateArchivedAt: dto.templateArchivedAt ?? null,
        archivedAt: dto.archivedAt ?? null,
        title: dto.title,
        className: dto.className,
        subject: dto.subject,
        grade: dto.grade,
        durationType,
        duration: formatDuration(durationType, weekTitles.length),
        drivingQ: dto.drivingQuestion,
        finalProduct: dto.finalProduct,
        audience: dto.audience,
        projectReflectionPrompts: normalizeProjectReflectionPrompts(dto.projectReflectionPrompts),
        differentiationPaths: (dto.differentiationPaths ?? []).map(path => this.toDifferentiationPath(path)),
        dispositions: dto.dispositions,
        weekTitles,
        currentWeek: dto.currentWeek,
      },
      teams: dto.teams,
      stickers: dto.stickers.map(sticker => this.toSticker(sticker)),
      evidence: dto.evidence.map(evidence => this.toEvidence(evidence)),
      teamProgress: (dto.teamProgress ?? []).map(progress => this.toTeamProgress(progress)),
      teamDifferentiationPaths: (dto.teamDifferentiationPaths ?? []).map(path => this.toTeamDifferentiationPath(path)),
      teamReflections: (dto.teamReflections ?? []).map(reflection => this.toTeamReflection(reflection)),
      helpRequests: (dto.helpRequests ?? []).map(request => this.toHelpRequest(request)),
      teacherEffectLog: dto.teacherEffectLog ? this.toTeacherEffectLog(dto.teacherEffectLog) : null,
      closureChecklist: (dto.closureChecklist ?? []).map(item => ({
        id: item.id,
        sortOrder: item.sortOrder,
        label: item.label,
        done: item.done,
      })),
      qualityDims: dto.qualityDimensions.map(dimension => this.toQualityDimension(dimension)),
      aiNotes: (dto.aiNotes ?? []).map(note => this.toAiNote(note)),
    };
  }

  private toHelpRequest(dto: TeamHelpRequestDto): TeamHelpRequest {
    return {
      id: dto.id,
      albumInstanceId: dto.albumInstanceId,
      teamId: dto.teamId,
      instanceStickerId: dto.instanceStickerId ?? null,
      question: dto.question,
      createdAt: dto.createdAt,
      resolvedAt: dto.resolvedAt ?? null,
    };
  }

  private toTeamProgress(dto: TeamStickerProgressDto): TeamStickerProgress {
    return {
      instanceStickerId: dto.instanceStickerId,
      teamId: dto.teamId,
      state: dto.state as TeamProgressState,
      latestEvidenceId: dto.latestEvidenceId ?? null,
      reflection: dto.reflection ?? null,
      reflectedAt: dto.reflectedAt ?? null,
      updatedAt: dto.updatedAt,
    };
  }

  private toDifferentiationPath(dto: DifferentiationPathDto): DifferentiationPath {
    return {
      phase: normalizePhase(dto.phase),
      pathKey: normalizeDifferentiationPathKey(dto.pathKey),
      title: dto.title,
      description: dto.description,
      recommendedFor: dto.recommendedFor,
      sortOrder: dto.sortOrder,
    };
  }

  private toTeamDifferentiationPath(dto: TeamDifferentiationPathAssignmentDto): TeamDifferentiationPathAssignment {
    return {
      instanceStickerId: dto.instanceStickerId,
      teamId: dto.teamId,
      pathKey: normalizeDifferentiationPathKey(dto.pathKey),
      assignedAt: dto.assignedAt,
    };
  }

  private toTeamReflection(dto: TeamReflectionDto): AlbumInstanceTeamReflection {
    return {
      teamId: dto.teamId,
      text: dto.text,
      updatedAt: dto.updatedAt,
    };
  }

  private toTeacherEffectLog(dto: TeacherEffectLogDto): TeacherEffectLog {
    return {
      workedWell: dto.workedWell,
      engagementSignals: dto.engagementSignals,
      adaptationNotes: dto.adaptationNotes,
      reuseNextTime: dto.reuseNextTime,
      updatedAt: dto.updatedAt,
    };
  }

  private toStickerLibraryItem(dto: StickerResourceListItemDto): StickerLibraryItem {
    return {
      id: dto.id,
      title: dto.title,
      latestVersionId: dto.latestVersionId,
      latestVersionNumber: dto.latestVersionNumber,
      phase: normalizePhase(dto.phase),
      activityTypeKey: dto.activityTypeKey ?? null,
      short: dto.shortDescription,
      templateUsageCount: dto.templateUsageCount,
      archivedAt: dto.archivedAt ?? null,
    };
  }

  private toBlockListItem(dto: BlockListItemDto): BlockListItem {
    return {
      id: dto.id,
      name: dto.name,
      latestVersionNumber: dto.latestVersionNumber,
      flowType: dto.flowType,
      grouping: dto.grouping,
      activityCount: dto.activityCount,
      hasDraft: dto.hasDraft,
      latestPublishedVersionId: dto.latestPublishedVersionId ?? null,
      archivedAt: dto.archivedAt ?? null,
    };
  }

  private toTopicListItem(dto: TopicListItemDto): TopicListItem {
    return {
      id: dto.id,
      name: dto.name,
      latestVersionNumber: dto.latestVersionNumber,
      blockCount: dto.blockCount,
      hasDraft: dto.hasDraft,
      archivedAt: dto.archivedAt ?? null,
    };
  }

  private toTopicDetail(dto: TopicDetailDto): TopicDetail {
    return {
      id: dto.id,
      name: dto.name,
      archivedAt: dto.archivedAt ?? null,
      versions: (dto.versions ?? []).map(version => this.toTopicVersion(version)),
    };
  }

  private toTopicVersion(dto: TopicVersionDto): TopicVersionView {
    return {
      id: dto.id,
      topicId: dto.topicId,
      versionNumber: dto.versionNumber,
      isDraft: dto.isDraft,
      name: dto.name,
      blocks: (dto.blocks ?? []).map(block => this.toTopicBlock(block)),
    };
  }

  private toTopicBlock(dto: TopicBlockDto): TopicBlockRef {
    return {
      id: dto.id,
      blockVersionId: dto.blockVersionId,
      blockId: dto.blockId,
      blockName: dto.blockName,
      blockVersionNumber: dto.blockVersionNumber,
      activityCount: dto.activityCount,
      sortOrder: dto.sortOrder,
    };
  }

  private toBlockDetail(dto: BlockDetailDto): BlockDetail {
    return {
      id: dto.id,
      name: dto.name,
      archivedAt: dto.archivedAt ?? null,
      versions: (dto.versions ?? []).map(version => this.toBlockVersion(version)),
    };
  }

  private toBlockVersion(dto: BlockVersionDto): BlockVersionView {
    return {
      id: dto.id,
      blockId: dto.blockId,
      versionNumber: dto.versionNumber,
      isDraft: dto.isDraft,
      name: dto.name,
      flowType: dto.flowType,
      grouping: dto.grouping,
      activities: (dto.activities ?? []).map(activity => this.toBlockActivity(activity)),
    };
  }

  private toBlockActivity(dto: BlockActivityDto): BlockActivityRef {
    return {
      id: dto.id,
      stickerVersionId: dto.stickerVersionId,
      stickerResourceId: dto.stickerResourceId,
      activityTitle: dto.activityTitle,
      stickerVersionNumber: dto.stickerVersionNumber,
      role: dto.role,
      sortOrder: dto.sortOrder,
    };
  }

  private toStickerResourceDetail(dto: StickerResourceDetailDto): StickerResourceDetail {
    return {
      id: dto.id,
      title: dto.title,
      archivedAt: dto.archivedAt ?? null,
      versions: dto.versions.map(version => this.toStickerVersionView(version)),
    };
  }

  private toStickerVersionView(dto: StickerVersionDto): StickerVersionView {
    return {
      id: dto.id,
      stickerResourceId: dto.stickerResourceId,
      versionNumber: dto.versionNumber,
      title: dto.title,
      phase: normalizePhase(dto.phase),
      short: dto.shortDescription,
      studentInstruction: dto.studentInstruction,
      teacherSteps: dto.teacherSteps,
      studentChoice: dto.studentChoice,
      expectedProduct: dto.expectedProduct,
      evidenceType: dto.evidenceTypeLabel,
      reflectionPrompt: dto.reflectionPrompt,
      bPlan: dto.bPlan,
      lowResource: dto.lowResource,
    };
  }

  private toTemplateListItem(dto: AlbumTemplateListItemDto): AlbumTemplateListItem {
    const durationType = normalizeDurationType(dto.durationType);
    const patternKey = normalizePatternKey(dto.patternKey);
    const pattern = patternFallback(patternKey);
    const unitCount = dto.unitCount ?? 0;
    return {
      id: dto.id,
      title: dto.title,
      subject: dto.subject,
      grade: dto.grade,
      durationType,
      patternKey,
      patternName: dto.patternName?.trim() || pattern.name,
      patternDescription: dto.patternDescription?.trim() || pattern.description,
      unitCount,
      duration: formatDuration(durationType, unitCount),
      drivingQ: dto.drivingQuestion,
      stickerCount: dto.stickerCount,
      instanceCount: dto.instanceCount,
      archivedAt: dto.archivedAt ?? null,
      isDraftOnly: dto.isDraftOnly ?? false,
    };
  }

  private toTemplateDetail(dto: AlbumTemplateDetailDto): AlbumTemplateDetail {
    const durationType = normalizeDurationType(dto.durationType);
    const patternKey = normalizePatternKey(dto.patternKey);
    const pattern = patternFallback(patternKey);
    const weeks = (dto.weeks ?? [])
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(week => ({ weekNumber: week.weekNumber, title: week.title }));
    return {
      id: dto.id,
      archivedAt: dto.archivedAt ?? null,
      title: dto.title,
      subject: dto.subject,
      grade: dto.grade,
      durationType,
      patternKey,
      patternName: dto.patternName?.trim() || pattern.name,
      patternDescription: dto.patternDescription?.trim() || pattern.description,
      duration: formatDuration(durationType, weeks.length),
      drivingQ: dto.drivingQuestion,
      finalProduct: dto.finalProduct,
      audience: dto.audience,
      projectReflectionPrompts: normalizeProjectReflectionPrompts(dto.projectReflectionPrompts),
      differentiationPaths: (dto.differentiationPaths ?? []).map(path => this.toDifferentiationPath(path)),
      dispositions: dto.dispositions ?? [],
      weeks,
      stickers: (dto.stickers ?? []).map(sticker => this.toTemplateSticker(sticker)),
      versions: (dto.versions ?? []).map(version => this.toTemplateVersion(version)),
      qualityDims: (dto.qualityDimensions ?? []).map(dimension => this.toQualityDimension(dimension)),
      aiNotes: (dto.aiNotes ?? []).map(note => this.toAiNote(note)),
    };
  }

  private toTemplateVersion(dto: AlbumTemplateVersionDto): AlbumTemplateVersionView {
    const durationType = normalizeDurationType(dto.durationType);
    const patternKey = normalizePatternKey(dto.patternKey);
    const pattern = patternFallback(patternKey);
    const weeks = (dto.weeks ?? [])
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(week => ({ weekNumber: week.weekNumber, title: week.title }));
    return {
      id: dto.id,
      albumTemplateId: dto.albumTemplateId,
      versionNumber: dto.versionNumber,
      isDraft: dto.isDraft ?? false,
      title: dto.title,
      subject: dto.subject,
      grade: dto.grade,
      durationType,
      patternKey,
      patternName: dto.patternName?.trim() || pattern.name,
      patternDescription: dto.patternDescription?.trim() || pattern.description,
      duration: formatDuration(durationType, weeks.length),
      drivingQ: dto.drivingQuestion,
      finalProduct: dto.finalProduct,
      audience: dto.audience,
      projectReflectionPrompts: normalizeProjectReflectionPrompts(dto.projectReflectionPrompts),
      createdAt: dto.createdAt,
      differentiationPaths: (dto.differentiationPaths ?? []).map(path => this.toDifferentiationPath(path)),
      dispositions: dto.dispositions ?? [],
      weeks,
      stickers: (dto.stickers ?? []).map(sticker => this.toTemplateSticker(sticker)),
    };
  }

  private toTemplateSticker(dto: TemplateStickerDto): TemplateStickerView {
    return {
      id: dto.id,
      stickerResourceId: dto.stickerResourceId,
      stickerVersionId: dto.stickerVersionId,
      stickerVersionNumber: dto.stickerVersionNumber,
      week: dto.week,
      sortOrder: dto.sortOrder,
      title: dto.title,
      phase: normalizePhase(dto.phase),
      short: dto.shortDescription,
      studentInstruction: dto.studentInstruction,
      teacherSteps: dto.teacherSteps ?? [],
      studentChoice: dto.studentChoice,
      expectedProduct: dto.expectedProduct,
      evidenceType: dto.evidenceTypeLabel,
      reflectionPrompt: dto.reflectionPrompt,
      bPlan: dto.bPlan,
      lowResource: dto.lowResource,
      aiNotes: (dto.aiNotes ?? []).map(note => this.toAiNote(note)),
    };
  }

  private toInstanceListItem(dto: AlbumInstanceListItemDto): AlbumInstanceListItem {
    const durationType = normalizeDurationType(dto.durationType);
    const unitCount = dto.unitCount ?? 0;
    return {
      id: dto.id,
      templateId: dto.albumTemplateId,
      templateTitle: dto.templateTitle,
      title: dto.title,
      className: dto.className,
      subject: dto.subject,
      grade: dto.grade,
      durationType,
      unitCount,
      duration: formatDuration(durationType, unitCount),
      drivingQ: dto.drivingQuestion,
      currentWeek: dto.currentWeek,
      stickerCount: dto.stickerCount,
      pendingEvidenceCount: dto.pendingEvidenceCount,
      archivedAt: dto.archivedAt ?? null,
    };
  }

  private toSticker(dto: InstanceStickerDto): Sticker {
    return {
      id: dto.id,
      stickerResourceId: dto.stickerResourceId,
      stickerVersionId: dto.stickerVersionId,
      stickerVersionNumber: dto.stickerVersionNumber,
      albumTemplateStickerId: dto.albumTemplateStickerId,
      week: dto.week,
      sortOrder: dto.sortOrder,
      title: dto.title,
      phase: normalizePhase(dto.phase),
      state: dto.state as Sticker['state'],
      deprecated: dto.deprecated ?? false,
      short: dto.shortDescription,
      studentInstruction: dto.studentInstruction,
      teacherSteps: dto.teacherSteps,
      studentChoice: dto.studentChoice,
      expectedProduct: dto.expectedProduct,
      evidenceType: dto.evidenceTypeLabel,
      reflection: dto.reflectionPrompt,
      aiNotes: (dto.aiNotes ?? []).map(note => this.toAiNote(note)),
      bPlan: dto.bPlan,
      lowResource: dto.lowResource,
    };
  }

  private toEvidence(dto: EvidenceDto): Evidence {
    return {
      id: dto.id,
      stickerId: dto.instanceStickerId,
      teamId: dto.teamId,
      type: dto.type as EvidenceType,
      title: dto.title,
      submittedBy: dto.submittedBy,
      submittedAt: this.formatSubmittedAt(dto.submittedAt),
      description: dto.description,
      helpRequest: dto.helpRequest,
      helpRequested: dto.helpRequested ?? false,
      reflection: dto.reflection,
      status: dto.status as EvidenceStatus,
      teacherFeedback: dto.teacherFeedback,
      seenByTeamAt: dto.seenByTeamAt ?? null,
      archivedAt: dto.archivedAt ?? null,
    };
  }

  private toQualityDimension(dto: QualityDimensionDto): QualityDim {
    return {
      id: dto.id,
      label: dto.label,
      score: dto.score,
      state: dto.state as QualityDim['state'],
      reason: dto.reason ?? null,
    };
  }

  private toAiNote(dto: AiNoteDto): AiNote {
    return {
      id: dto.id,
      ownerType: dto.ownerType as AiNote['ownerType'],
      ownerId: dto.ownerId,
      targetType: dto.targetType as AiNote['targetType'],
      targetId: dto.targetId,
      targetKey: dto.targetKey,
      kind: dto.kind as AiNote['kind'],
      label: dto.label,
      severity: dto.severity as AiNote['severity'],
      message: dto.message,
      recommendation: dto.recommendation,
    };
  }

  private toAiAdvice(dto: AiAdviceDto): AiAdvice {
    return {
      id: dto.id,
      runId: dto.runId,
      audience: dto.audience as AiAdvice['audience'],
      ownerType: dto.ownerType as AiAdvice['ownerType'],
      ownerId: dto.ownerId,
      targetType: dto.targetType as AiAdvice['targetType'],
      targetId: dto.targetId,
      targetKey: dto.targetKey,
      kind: dto.kind as AiAdvice['kind'],
      severity: dto.severity as AiAdvice['severity'],
      status: dto.status as AiAdvice['status'],
      message: dto.message,
      recommendation: dto.recommendation,
      questions: dto.questions ?? [],
      citations: dto.citations ?? [],
      action: dto.action ? {
        type: dto.action.type as AiAdviceActionType,
        label: dto.action.label,
        payload: dto.action.payload ?? {},
      } : null,
      model: dto.model,
      promptVersion: dto.promptVersion,
      projectionVersion: dto.projectionVersion,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      appliedAt: dto.appliedAt,
    };
  }

  private formatSubmittedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('hu-HU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
