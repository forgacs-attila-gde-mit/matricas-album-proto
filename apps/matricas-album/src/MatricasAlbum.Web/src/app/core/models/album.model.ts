import { PhaseId, StickerState } from '../tokens/phases';
export type { StickerState } from '../tokens/phases';

export type AiSeverity = 'igen' | 'figyelmet' | 'hianyzik' | 'info';
export type AiOwnerType = 'stickerVersion' | 'template' | 'instance';
export type AiTargetType =
  | 'stickerVersion' | 'templateSticker' | 'instanceSticker'
  | 'team' | 'evidence' | 'quality' | 'albumTemplate' | 'albumInstance'
  | 'pendingEvidenceDigest' | 'helpRequest' | 'closureSynthesis';

export interface AiNote {
  readonly id: string;
  readonly ownerType: AiOwnerType;
  readonly ownerId: string;
  readonly targetType: AiTargetType;
  readonly targetId?: string | null;
  readonly targetKey?: string | null;
  readonly kind: 'check' | 'suggestion' | 'risk' | 'info';
  readonly label: string;
  readonly severity: AiSeverity;
  readonly message: string;
  readonly recommendation?: string | null;
}

export type AiAdviceAudience = 'teacher' | 'student';
export type AiAdviceStatus = 'uj' | 'elfogadott' | 'elutasitott' | 'alkalmazott' | 'hibas';
export type AiAdviceActionType = 'createSticker' | 'draftFeedback';

export const DEFAULT_PROJECT_REFLECTION_PROMPTS = [
  'Milyen kérdéssel indultatok, és hogyan változott meg az út során?',
  'Mi az, amit másképp gondoltok most a projekt végére?',
  'Mit csinálnátok másképp, ha újrakezdenétek?',
];

export interface AiCitation {
  readonly sourceId: string;
  readonly label: string;
  readonly excerpt?: string | null;
  readonly kind?: string | null;
}

export interface AiAdviceAction {
  readonly type: AiAdviceActionType;
  readonly label: string;
  readonly payload: Record<string, unknown>;
}

export interface AiAdvice {
  readonly id: string;
  readonly runId?: string | null;
  readonly audience: AiAdviceAudience;
  readonly ownerType: AiOwnerType;
  readonly ownerId: string;
  readonly targetType: AiTargetType;
  readonly targetId?: string | null;
  readonly targetKey?: string | null;
  readonly kind: 'check' | 'suggestion' | 'risk' | 'info';
  readonly severity: AiSeverity;
  readonly status: AiAdviceStatus;
  readonly message: string;
  readonly recommendation?: string | null;
  readonly questions: string[];
  readonly citations: AiCitation[];
  readonly action?: AiAdviceAction | null;
  readonly model?: string | null;
  readonly promptVersion: string;
  readonly projectionVersion: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly appliedAt?: string | null;
}

export interface CreateStickerAdviceActionPayload {
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
  week?: number | null;
  sortOrder?: number | null;
}

export interface DraftFeedbackAdviceActionPayload {
  evidenceId: string;
  draft: string;
}

export interface StickerLibraryItem {
  id: string;
  title: string;
  latestVersionId: string;
  latestVersionNumber: number;
  phase: PhaseId;
  // Dominant Tevékenységtípus key (one of the 6 system types), or null if unclassified.
  activityTypeKey?: string | null;
  short: string;
  templateUsageCount: number;
  archivedAt?: string | null;
}

// --- Blokk (Block) — reference-composed, versioned grouping of activities (Phase 4) -------

export interface BlockListItem {
  id: string;
  name: string;
  latestVersionNumber: number;
  flowType: string;
  grouping: string;
  activityCount: number;
  hasDraft: boolean;
  // The latest published BlockVersion id (null if the block has only a draft). Topics
  // reference this when composing published blocks.
  latestPublishedVersionId?: string | null;
  archivedAt?: string | null;
}

export interface TopicListItem {
  id: string;
  name: string;
  latestVersionNumber: number;
  blockCount: number;
  hasDraft: boolean;
  archivedAt?: string | null;
}

export interface TopicBlockRef {
  id: string;
  blockVersionId: string;
  blockId: string;
  blockName: string;
  blockVersionNumber: number;
  activityCount: number;
  sortOrder: number;
}

export interface TopicVersionView {
  id: string;
  topicId: string;
  versionNumber: number;
  isDraft: boolean;
  name: string;
  blocks: TopicBlockRef[];
}

export interface TopicDetail {
  id: string;
  name: string;
  archivedAt?: string | null;
  versions: TopicVersionView[];
}

export interface BlockActivityRef {
  id: string;
  stickerVersionId: string;
  stickerResourceId: string;
  activityTitle: string;
  stickerVersionNumber: number;
  role: string;
  sortOrder: number;
}

export interface BlockVersionView {
  id: string;
  blockId: string;
  versionNumber: number;
  isDraft: boolean;
  name: string;
  flowType: string;
  grouping: string;
  activities: BlockActivityRef[];
}

export interface BlockDetail {
  id: string;
  name: string;
  archivedAt?: string | null;
  versions: BlockVersionView[];
}

export interface StickerVersionView {
  id: string;
  stickerResourceId: string;
  versionNumber: number;
  title: string;
  phase: PhaseId;
  short: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceType: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
}

export interface StickerResourceDetail {
  id: string;
  title: string;
  archivedAt?: string | null;
  versions: StickerVersionView[];
}

export type DurationType = 'het' | 'ora' | 'fazis';
export type AlbumTemplatePatternKey = 'altalanos' | 'produktiv-hibazas' | 'kutatas-bizonyitas';

export interface AlbumTemplatePatternInfo {
  readonly key: AlbumTemplatePatternKey;
  readonly name: string;
  readonly description: string;
}

export const ALBUM_TEMPLATE_PATTERNS: readonly AlbumTemplatePatternInfo[] = [
  {
    key: 'altalanos',
    name: 'Általános album',
    description: 'Semleges projektalbum-keret kérdéssel, választással, bizonyítékkal és reflexióval.',
  },
  {
    key: 'produktiv-hibazas',
    name: 'Produktív hibázás',
    description: 'Kihívó probléma, látható zsákutcák, tanári konszolidáció és újrapróba.',
  },
  {
    key: 'kutatas-bizonyitas',
    name: 'Kutatás-bizonyítás',
    description: 'Kérdésből induló kutatás állítással, bizonyítékkal és indoklással.',
  },
];

export interface AlbumTemplateListItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  durationType: DurationType;
  patternKey: AlbumTemplatePatternKey;
  patternName: string;
  patternDescription: string;
  unitCount: number;
  /** Human-readable duration derived from durationType + unitCount, e.g. "6 hét". */
  duration: string;
  drivingQ: string;
  stickerCount: number;
  instanceCount: number;
  archivedAt?: string | null;
  isDraftOnly: boolean;
}

export interface TemplateWeekPlan {
  weekNumber: number;
  title: string;
}

export interface TemplateStickerView {
  id: string;
  stickerResourceId: string;
  stickerVersionId: string;
  stickerVersionNumber: number;
  week: number;
  sortOrder: number;
  title: string;
  phase: PhaseId;
  short: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceType: string;
  reflectionPrompt: string;
  bPlan: string;
  lowResource: string;
  aiNotes?: AiNote[];
}

export type DifferentiationPathKey = 'tamogatott' | 'alap' | 'kihivas';

export interface DifferentiationPath {
  readonly phase: PhaseId;
  readonly pathKey: DifferentiationPathKey;
  readonly title: string;
  readonly description: string;
  readonly recommendedFor: string;
  readonly sortOrder: number;
}

export interface AlbumTemplateDetail {
  id: string;
  archivedAt?: string | null;
  title: string;
  subject: string;
  grade: string;
  durationType: DurationType;
  patternKey: AlbumTemplatePatternKey;
  patternName: string;
  patternDescription: string;
  /** Human-readable duration derived from durationType + weeks.length, e.g. "6 hét". */
  duration: string;
  drivingQ: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts: string[];
  differentiationPaths: DifferentiationPath[];
  dispositions: string[];
  weeks: TemplateWeekPlan[];
  stickers: TemplateStickerView[];
  versions: AlbumTemplateVersionView[];
  qualityDims: QualityDim[];
  aiNotes: AiNote[];
}

export interface AlbumTemplateVersionView {
  id: string;
  albumTemplateId: string;
  versionNumber: number;
  isDraft: boolean;
  title: string;
  subject: string;
  grade: string;
  durationType: DurationType;
  patternKey: AlbumTemplatePatternKey;
  patternName: string;
  patternDescription: string;
  /** Derived human-readable duration; not stored server-side. */
  duration: string;
  drivingQ: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts: string[];
  createdAt: string;
  differentiationPaths: DifferentiationPath[];
  dispositions: string[];
  weeks: TemplateWeekPlan[];
  stickers: TemplateStickerView[];
}

export interface AlbumInstanceListItem {
  id: string;
  templateId: string;
  templateTitle: string;
  title: string;
  className: string;
  subject: string;
  grade: string;
  durationType: DurationType;
  unitCount: number;
  /** Derived human-readable duration; not stored server-side. */
  duration: string;
  drivingQ: string;
  currentWeek: number;
  stickerCount: number;
  pendingEvidenceCount: number;
  archivedAt?: string | null;
}

export interface Sticker {
  id: string;
  stickerResourceId?: string;
  stickerVersionId?: string;
  stickerVersionNumber?: number;
  albumTemplateStickerId?: string | null;
  week: number;
  sortOrder?: number;
  title: string;
  phase: PhaseId;
  state: StickerState;
  /** True when a template-version upgrade removed this sticker but the instance kept it to preserve evidence. */
  deprecated?: boolean;
  short: string;
  studentInstruction: string;
  teacherSteps: string[];
  studentChoice: string;
  expectedProduct: string;
  evidenceType: string;
  reflection: string;
  aiNotes?: AiNote[];
  aiCheck?: { readonly label: string; readonly ok: AiSeverity }[];
  bPlan: string;
  lowResource: string;
}

export type EvidenceType = 'foto' | 'meres' | 'jegyzet' | 'prezentacio';
export type EvidenceStatus =
  | 'beadva' | 'varakozik' | 'javitas' | 'elkeszult';

export interface Evidence {
  id: string;
  stickerId: string;
  teamId: string;
  type: EvidenceType;
  title: string;
  submittedBy: string;
  submittedAt: string;
  description: string;
  helpRequest?: string | null;
  helpRequested: boolean;
  reflection?: string | null;
  status: EvidenceStatus;
  teacherFeedback?: string | null;
  seenByTeamAt?: string | null;
  archivedAt?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  focus: string;
  color: string;
}

export type TeamProgressState = 'varakozik' | 'javitas' | 'elkeszult' | 'reflektalt';

export interface TeamStickerProgress {
  instanceStickerId: string;
  teamId: string;
  state: TeamProgressState;
  latestEvidenceId?: string | null;
  reflection?: string | null;
  reflectedAt?: string | null;
  updatedAt: string;
}

export interface TeamDifferentiationPathAssignment {
  instanceStickerId: string;
  teamId: string;
  pathKey: DifferentiationPathKey;
  assignedAt: string;
}

export interface ClosureChecklistItem {
  id: string;
  sortOrder: number;
  label: string;
  done: boolean;
}

export interface TeacherEffectLog {
  workedWell: string;
  engagementSignals: string;
  adaptationNotes: string;
  reuseNextTime: string;
  updatedAt: string;
}

export interface AlbumInstanceTeamReflection {
  teamId: string;
  text: string;
  updatedAt: string;
}

export interface TeamHelpRequest {
  id: string;
  albumInstanceId: string;
  teamId: string;
  instanceStickerId?: string | null;
  question: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface AlbumMeta {
  id?: string;
  templateId?: string;
  templateTitle?: string;
  /** Set when the source template was archived after this instance was created. */
  templateArchivedAt?: string | null;
  /** Set when the instance itself is archived (soft delete). */
  archivedAt?: string | null;
  title: string;
  className?: string;
  subject: string;
  grade: string;
  durationType: DurationType;
  /** Derived human-readable duration based on durationType + weekTitles.length. */
  duration: string;
  drivingQ: string;
  finalProduct: string;
  audience: string;
  projectReflectionPrompts: string[];
  differentiationPaths: DifferentiationPath[];
  dispositions: string[];
  weekTitles: string[];
  currentWeek: number;
}

export interface QualityDim {
  id: string;
  label: string;
  score: number;
  state: 'ok' | 'warn' | 'miss';
  reason?: string | null;
}

export interface Toast {
  msg: string;
  icon: string;
}
