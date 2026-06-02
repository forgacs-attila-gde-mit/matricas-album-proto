// Web feature flags for the gold-standard hierarchy rollout (REFACTOR-001). These ship
// dark: flip a flag to surface the corresponding UI. The API side is gated separately by
// `Features:Hierarchy:Block` (on in the Development stack). Kept as a simple constant for the
// prototype; would be wired to an Angular environment/runtime config for real prod gating.
export const FEATURES = {
  hierarchyBlock: true,
  hierarchyTopic: true,
  hierarchyModule: true,
  hierarchyCurriculum: true,
} as const;
