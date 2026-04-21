import type { AiFeedback } from "#/features/function/types";

function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return hash.toString(36);
}

const cache = new Map<string, AiFeedback>();

const FALLBACK: AiFeedback = {
	summary:
		"AI critique unavailable. Set GROQ_API_KEY or ANTHROPIC_API_KEY to enable it. Deterministic scores are shown above.",
	suggestions: [
		"Set GROQ_API_KEY for the default provider, or ANTHROPIC_API_KEY as a fallback",
		"For Cloudflare: run `wrangler secret put GROQ_API_KEY`",
		"For local dev: add GROQ_API_KEY=gsk_... to your .env.local file",
	],
};

const SYSTEM_PROMPT = `You are a senior software engineer reviewing a TypeScript function for quality. Be concise and direct.`;
const GROQ_MODEL = "openai/gpt-oss-20b";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

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

function getServerEnv(name: string): string | undefined {
	return typeof process !== "undefined" ? process.env[name] : undefined;
}

async function callGroq(
	code: string,
	apiKey: string,
): Promise<AiFeedback | null> {
	try {
		const response = await fetch(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					authorization: `Bearer ${apiKey}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: GROQ_MODEL,
					temperature: 0.2,
					max_tokens: 512,
					messages: [
						{ role: "system", content: SYSTEM_PROMPT },
						{ role: "user", content: buildPrompt(code) },
					],
				}),
			},
		);

		if (!response.ok) {
			console.error("Groq API error:", response.status, response.statusText);
			return null;
		}

		const data = (await response.json()) as {
			choices?: Array<{
				message?: {
					content?: string;
				};
			}>;
		};

		const text = data.choices?.[0]?.message?.content ?? "";
		return parseAiFeedback(text);
	} catch {
		return null;
	}
}

async function callAnthropic(
	code: string,
	apiKey: string,
): Promise<AiFeedback | null> {
	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				model: ANTHROPIC_MODEL,
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
		return parseAiFeedback(text);
	} catch {
		return null;
	}
}

function parseAiFeedback(text: string): AiFeedback | null {
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) return null;

	const parsed = JSON.parse(jsonMatch[0]) as AiFeedback;

	if (
		typeof parsed.summary !== "string" ||
		!Array.isArray(parsed.suggestions) ||
		parsed.suggestions.length === 0
	) {
		return null;
	}

	return parsed;
}

export async function getAICritique(code: string): Promise<AiFeedback> {
	const cacheKey = hashCode(code);
	const cached = cache.get(cacheKey);
	if (cached) return cached;

	const groqApiKey = getServerEnv("GROQ_API_KEY");
	const anthropicApiKey = getServerEnv("ANTHROPIC_API_KEY");

	const critique =
		(groqApiKey ? await callGroq(code, groqApiKey) : null) ??
		(anthropicApiKey ? await callAnthropic(code, anthropicApiKey) : null) ??
		FALLBACK;

	cache.set(cacheKey, critique);
	return critique;
}
