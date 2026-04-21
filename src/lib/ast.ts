import type { ScoreBreakdown } from "#/features/function/types";

// Heuristic-based scorer — no AST parser needed, works in Cloudflare Workers.
// Regex patterns detect structural signals without needing Node.js-specific tooling.

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

// ─── Side-Effect Patterns ─────────────────────────────────────────────────────

const SIDE_EFFECT_PATTERNS: Array<{
	pattern: RegExp;
	label: string;
	penalty: number;
}> = [
	{
		pattern: /console\.(log|warn|error|info|debug)\(/,
		label: "console call",
		penalty: 5,
	},
	{ pattern: /\bfetch\(/, label: "fetch call", penalty: 8 },
	{ pattern: /\blocalStorage\b/, label: "localStorage access", penalty: 6 },
	{ pattern: /\bsessionStorage\b/, label: "sessionStorage access", penalty: 6 },
	{ pattern: /\bdocument\b/, label: "DOM access", penalty: 6 },
	{ pattern: /\bwindow\b/, label: "window access", penalty: 4 },
	{ pattern: /\bprocess\.env\b/, label: "process.env access", penalty: 3 },
	{
		pattern: /setState\(|dispatch\(/,
		label: "state mutation call",
		penalty: 5,
	},
	{ pattern: /\bthis\.[a-zA-Z]+\s*=/, label: "this mutation", penalty: 6 },
	{ pattern: /\bawait\s/, label: "async side effect", penalty: 2 },
	{ pattern: /throw\s+new\s+Error/, label: "throws error", penalty: 1 },
];

// ─── Complexity Keywords ──────────────────────────────────────────────────────

const COMPLEXITY_KEYWORDS =
	/\b(if|else if|for|while|do\s*\{|switch|catch|\?\s*[^:]+:)/g;

// ─── Scoring Functions ────────────────────────────────────────────────────────

function scorePurity(code: string): ScoringDetails["purity"] {
	const detectedPatterns: string[] = [];
	let penalty = 0;

	for (const { pattern, label, penalty: p } of SIDE_EFFECT_PATTERNS) {
		if (pattern.test(code)) {
			detectedPatterns.push(label);
			penalty += p;
		}
	}

	// Penalize `var` usage — implies mutability intent
	const varCount = (code.match(/\bvar\s+/g) ?? []).length;
	if (varCount > 0) {
		detectedPatterns.push(`${varCount} var declaration(s)`);
		penalty += varCount * 2;
	}

	return {
		hasSideEffects: detectedPatterns.length > 0,
		sideEffectPatterns: detectedPatterns,
		score: Math.max(0, 30 - penalty),
	};
}

function scoreComplexity(code: string): ScoringDetails["complexity"] {
	const matches = code.match(COMPLEXITY_KEYWORDS) ?? [];
	const cyclomatic = 1 + matches.length;

	// Measure max nesting depth by tracking { } pairs
	let depth = 0;
	let maxDepth = 0;
	for (const char of code) {
		if (char === "{") {
			depth++;
			if (depth > maxDepth) maxDepth = depth;
		} else if (char === "}") {
			depth--;
		}
	}

	// Score: start at 25, subtract 3 per complexity unit beyond 2, 2 per extra nesting level beyond 2
	const complexityPenalty = Math.max(0, cyclomatic - 2) * 3;
	const nestingPenalty = Math.max(0, maxDepth - 2) * 2;
	const score = Math.max(0, 25 - complexityPenalty - nestingPenalty);

	return { cyclomatic, maxNestingDepth: maxDepth, score };
}

function scoreSize(code: string): ScoringDetails["size"] {
	const lines = code
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	const lineCount = lines.length;

	let score: number;
	if (lineCount <= 5) score = 10;
	else if (lineCount <= 10) score = 9;
	else if (lineCount <= 15) score = 8;
	else if (lineCount <= 20) score = 7;
	else if (lineCount <= 30) score = 5;
	else if (lineCount <= 50) score = 3;
	else score = 1;

	return { lineCount, score };
}

function scoreNaming(code: string): ScoringDetails["naming"] {
	// Extract variable/param names from common patterns
	const nameMatches = code.match(
		/(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:\(|,\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*[:,)])/g,
	);

	const singleLetterVars: string[] = [];
	if (nameMatches) {
		for (const match of nameMatches) {
			const varName = match.replace(/(?:const|let|var|function)\s+/, "").trim();
			// Single letter names (except common loop vars i, j, k, e, x, y)
			if (
				/^[a-zA-Z]$/.test(varName) &&
				!["i", "j", "k", "e", "x", "y", "n"].includes(varName)
			) {
				singleLetterVars.push(varName);
			}
		}
	}

	// Extract function name from definition
	const funcNameMatch = code.match(
		/(?:function\s+|const\s+|let\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)/,
	);
	const funcName = funcNameMatch?.[1] ?? "";
	const shortName = funcName.length > 0 && funcName.length < 3;

	// Check for good naming patterns (camelCase, descriptive)
	const hasCamelCase = /[a-z][A-Z]/.test(code);

	let score = 15;
	score -= singleLetterVars.length * 2;
	if (shortName) score -= 5;
	if (!hasCamelCase && code.length > 50) score -= 2;
	score = Math.max(0, score);

	return { singleLetterVars, shortName, score };
}

function scoreReadability(code: string): ScoringDetails["readability"] {
	const lines = code.split("\n");
	const maxLineLength = Math.max(...lines.map((l) => l.length));

	const returnCount = (code.match(/\breturn\b/g) ?? []).length;
	const hasEarlyReturns = returnCount > 1;

	// Count ternary chains (deeply nested ternaries hurt readability)
	const ternaryCount = (code.match(/\?[^:]+:/g) ?? []).length;

	let score = 20;
	if (maxLineLength > 120) score -= 4;
	else if (maxLineLength > 100) score -= 2;
	if (ternaryCount > 2) score -= (ternaryCount - 2) * 2;
	if (hasEarlyReturns) score += 2; // reward early returns (up to max)
	score = Math.min(20, Math.max(0, score));

	return { maxLineLength, hasEarlyReturns, score };
}

// ─── Main Entry ──────────────────────────────────────────────────────────────

export function scoreFunction(code: string): ScoringResult {
	const purity = scorePurity(code);
	const complexity = scoreComplexity(code);
	const size = scoreSize(code);
	const naming = scoreNaming(code);
	const readability = scoreReadability(code);

	const breakdown: ScoreBreakdown = {
		purity: purity.score,
		complexity: complexity.score,
		size: size.score,
		naming: naming.score,
		readability: readability.score,
	};

	const score =
		breakdown.purity +
		breakdown.complexity +
		breakdown.size +
		breakdown.naming +
		breakdown.readability;

	return {
		score,
		breakdown,
		details: { purity, complexity, size, naming, readability },
	};
}

export function getScoreColor(score: number): string {
	if (score >= 80) return "emerald";
	if (score >= 60) return "yellow";
	if (score >= 40) return "orange";
	return "red";
}

export function getScoreLabel(score: number): string {
	if (score >= 90) return "Excellent";
	if (score >= 80) return "Great";
	if (score >= 70) return "Good";
	if (score >= 60) return "Fair";
	if (score >= 40) return "Needs Work";
	return "Poor";
}
