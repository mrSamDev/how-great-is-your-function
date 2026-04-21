import type {
	Comment,
	FunctionEntity,
	Revision,
} from "#/features/function/types";

// In-memory store for MVP.
// TODO Phase 2: replace with Cloudflare D1 (`wrangler d1 create how-great-is-your-function`)
const functions = new Map<string, FunctionEntity>();
const comments = new Map<string, Comment[]>();
const revisions = new Map<string, Revision[]>();

function generateId(): string {
	return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Functions ───────────────────────────────────────────────────────────────

export const db = {
	functions: {
		create(
			data: Omit<FunctionEntity, "id" | "createdAt" | "viewCount">,
		): FunctionEntity {
			const fn: FunctionEntity = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
				viewCount: 0,
			};
			functions.set(fn.id, fn);
			return fn;
		},

		findById(id: string): FunctionEntity | undefined {
			const fn = functions.get(id);
			if (fn) {
				fn.viewCount++;
				functions.set(id, fn);
			}
			return fn;
		},

		list(opts: {
			page: number;
			limit: number;
			sort: "score" | "recent" | "views";
		}): {
			items: FunctionEntity[];
			total: number;
		} {
			const all = Array.from(functions.values());
			const sorted = [...all].sort((a, b) => {
				if (opts.sort === "score") return b.score - a.score;
				if (opts.sort === "views") return b.viewCount - a.viewCount;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});
			const start = (opts.page - 1) * opts.limit;
			return {
				items: sorted.slice(start, start + opts.limit),
				total: all.length,
			};
		},

		search(opts: {
			query?: string;
			tags?: string[];
			sort: "score" | "recent";
		}): FunctionEntity[] {
			let all = Array.from(functions.values());
			if (opts.query) {
				const q = opts.query.toLowerCase();
				all = all.filter(
					(fn) =>
						fn.title.toLowerCase().includes(q) ||
						fn.description?.toLowerCase().includes(q) ||
						fn.code.toLowerCase().includes(q),
				);
			}
			const filterTags = opts.tags;
			if (filterTags && filterTags.length > 0) {
				all = all.filter((fn) =>
					filterTags.some((tag) => fn.tags.includes(tag)),
				);
			}
			return all.sort((a, b) =>
				opts.sort === "score"
					? b.score - a.score
					: new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		},
	},

	comments: {
		create(data: Omit<Comment, "id" | "createdAt">): Comment {
			const comment: Comment = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
			};
			const existing = comments.get(data.functionId) ?? [];
			comments.set(data.functionId, [...existing, comment]);
			return comment;
		},

		findByFunctionId(functionId: string): Comment[] {
			return comments.get(functionId) ?? [];
		},
	},

	revisions: {
		create(data: Omit<Revision, "id" | "createdAt">): Revision {
			const revision: Revision = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
			};
			const existing = revisions.get(data.parentFunctionId) ?? [];
			revisions.set(data.parentFunctionId, [...existing, revision]);
			return revision;
		},

		findByFunctionId(functionId: string): Revision[] {
			return revisions.get(functionId) ?? [];
		},
	},
};

// ─── Seed Data ───────────────────────────────────────────────────────────────

import { scoreFunction } from "./ast";

function seed() {
	if (functions.size > 0) return;

	const seedFunctions: Array<
		Omit<FunctionEntity, "id" | "createdAt" | "viewCount">
	> = [
		{
			code: `function add(a: number, b: number): number {
  return a + b
}`,
			language: "typescript",
			title: "Simple Add",
			description: "Adds two numbers together",
			tags: ["math", "pure"],
			score: 0,
			breakdown: {
				purity: 30,
				complexity: 25,
				size: 10,
				naming: 15,
				readability: 20,
			},
			aiFeedback: {
				summary:
					"A perfectly pure, simple function. Ideal example of single responsibility and clarity.",
				suggestions: [
					"Consider adding JSDoc for public API documentation",
					"Could generalize to accept any numeric type",
					"No improvements needed for the core logic",
				],
			},
		},
		{
			code: `function processUserData(users: any[], config: any) {
  let result = []
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
      if (users[i].age > 18) {
        if (config.includeEmail) {
          result.push({ name: users[i].name, email: users[i].email, age: users[i].age })
        } else {
          result.push({ name: users[i].name, age: users[i].age })
        }
      }
    }
  }
  console.log('Processed', result.length, 'users')
  return result
}`,
			language: "typescript",
			title: "Process User Data",
			description: "Filters and shapes user records",
			tags: ["data", "array", "users"],
			score: 0,
			breakdown: {
				purity: 20,
				complexity: 10,
				size: 7,
				naming: 10,
				readability: 8,
			},
			aiFeedback: {
				summary:
					"Deep nesting and the console.log side effect hurt this function. Use of `any` loses type safety.",
				suggestions: [
					"Replace nested ifs with early guard clauses or Array.filter().map()",
					"Remove console.log — it's a side effect; let the caller decide whether to log",
					"Replace `any` with proper TypeScript interfaces",
				],
			},
		},
		{
			code: `const calculateTotal = (items: { price: number; qty: number }[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0)`,
			language: "typescript",
			title: "Calculate Total",
			description: "Computes total price of a shopping cart",
			tags: ["math", "array", "pure", "functional"],
			score: 0,
			breakdown: {
				purity: 30,
				complexity: 24,
				size: 10,
				naming: 14,
				readability: 18,
			},
			aiFeedback: {
				summary:
					"Excellent functional style. Pure, concise, and uses reduce idiomatically. Minor: rounding for currency.",
				suggestions: [
					"Add rounding: `Math.round(sum * 100) / 100` to avoid floating-point drift",
					"Consider returning a Money type instead of raw number for monetary values",
					"Add JSDoc example usage for discoverability",
				],
			},
		},
	];

	for (const fn of seedFunctions) {
		const scored = scoreFunction(fn.code);
		db.functions.create({
			...fn,
			score: scored.score,
			breakdown: scored.breakdown,
		});
	}
}

seed();
