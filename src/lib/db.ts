import type {
	Comment,
	FunctionEntity,
	Revision,
} from "#/features/function/types";
import { seedDatabase } from "./db-seed";

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

function seed() {
	if (functions.size > 0) return;

	seedDatabase((seedFunction) => {
		db.functions.create(seedFunction);
	});
}

seed();
