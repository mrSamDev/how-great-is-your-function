import type { AiFeedback } from "#/features/function/types";

// Simple hash for cache key — avoids re-running AI on the same code
function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return hash.toString(36);
}

// In-memory response cache: same code input → same output, skip re-run
const cache = new Map<string, AiFeedback>();

const FALLBACK: AiFeedback = {
	summary:
		"AI critique unavailable — set ANTHROPIC_API_KEY to enable. Deterministic scores are shown above.",
	suggestions: [
		"Check that ANTHROPIC_API_KEY is set in your environment",
		"For Cloudflare: run `wrangler secret put ANTHROPIC_API_KEY`",
		"For local dev: add ANTHROPIC_API_KEY=sk-... to your .env file",
	],
};

const SYSTEM_PROMPT = `You are a senior software engineer reviewing a TypeScript function for quality. Be concise and direct.`;

function buildPrompt(code: string): string {
	return `Review this TypeScript function:

\`\`\`typescript
${code}
\`\`\`

Evaluate:
- Single responsibility
- Side effects (are there hidden dependencies?)
- Naming clarity (function name, variable names)
- Testability (easy to test in isolation?)
- Readability (can another engineer understand it immediately?)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "<one paragraph critique, max 80 words>",
  "suggestions": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}

Be direct. Point out real issues. If the function is excellent, say so briefly and note edge cases.`;
}

export async function getAICritique(code: string): Promise<AiFeedback> {
	const cacheKey = hashCode(code);
	const cached = cache.get(cacheKey);
	if (cached) return cached;

	const apiKey =
		typeof process !== "undefined" ? process.env.ANTHROPIC_API_KEY : undefined;

	if (!apiKey) return FALLBACK;

	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				model: "claude-sonnet-4-6",
				max_tokens: 512,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content: buildPrompt(code) }],
			}),
		});

		if (!response.ok) {
			console.error(
				"Anthropic API error:",
				response.status,
				response.statusText,
			);
			return FALLBACK;
		}

		const data = (await response.json()) as {
			content: Array<{ type: string; text: string }>;
		};

		const text = data.content.find((c) => c.type === "text")?.text ?? "";
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) return FALLBACK;

		const parsed = JSON.parse(jsonMatch[0]) as AiFeedback;

		if (
			typeof parsed.summary !== "string" ||
			!Array.isArray(parsed.suggestions) ||
			parsed.suggestions.length === 0
		) {
			return FALLBACK;
		}

		cache.set(cacheKey, parsed);
		return parsed;
	} catch {
		return FALLBACK;
	}
}
