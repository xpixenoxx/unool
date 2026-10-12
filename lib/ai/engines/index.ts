// ─── Engine exports ────────────────────────────────────────────────────────────
// Central barrel for all ported instagram-agent-skill engines.
// Import from here to use any engine in routes or components.

export { HookScorer, HOOK_FORMULAS, PLATFORM_HOOK_WINDOWS, UNIVERSAL_DEALBREAKERS, SLOP_WORDS } from './HookScorer';
export type { HookFormula, HookScoreResult, HookScoreBreakdown } from './HookScorer';

export { FoldLinter, PLATFORM_FOLD_SPECS } from './FoldLinter';
export type { FoldLintResult, LintCheck, LintStatus, PlatformFoldSpec } from './FoldLinter';

export { ContentHumanizer } from './ContentHumanizer';
export type { HumanizeResult, HumanizePanelCheck } from './ContentHumanizer';

export { BeatSheetGenerator, PLATFORM_VIDEO_SPECS } from './BeatSheetGenerator';
export type { BeatSheetResult, Beat, BeatFlag, PlatformVideoSpec } from './BeatSheetGenerator';
