import type { ScoreBreakdown } from "#/features/function/types";

export type ScoringResult = {
	score: number;
	breakdown: ScoreBreakdown;
	details: ScoringDetails;
};

export type ScoringDetails = {
	purity: {
		hasSideEffects: boolean;
		sideEffectPatterns: string[];
		score: number;
	};
	complexity: {
		cyclomatic: number;
		maxNestingDepth: number;
		score: number;
	};
	size: {
		lineCount: number;
		score: number;
	};
	naming: {
		singleLetterVars: string[];
		shortName: boolean;
		score: number;
	};
	readability: {
		maxLineLength: number;
		hasEarlyReturns: boolean;
		score: number;
	};
};
