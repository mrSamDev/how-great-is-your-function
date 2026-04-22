import type {
	Comment,
	FunctionEntity,
	Revision,
	VoteType,
} from "#/features/function/types";
import { createD1Db, type D1Database } from "./db-d1";
import { seedDatabase } from "./db-seed";

export type Db = {
	functions: {
		create(
			data: Omit<
				FunctionEntity,
				"id" | "createdAt" | "viewCount" | "upvotes" | "downvotes"
			>,
		): Promise<FunctionEntity>;
		findById(id: string): Promise<FunctionEntity | undefined>;
		list(opts: {
			page: number;
			limit: number;
			sort: "score" | "recent" | "views";
		}): Promise<{ items: FunctionEntity[]; total: number }>;
		search(opts: {
			query?: string;
			tags?: string[];
			sort: "score" | "recent";
		}): Promise<FunctionEntity[]>;
	};
	comments: {
		create(data: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
		findByFunctionId(functionId: string): Promise<Comment[]>;
	};
	revisions: {
		create(data: Omit<Revision, "id" | "createdAt">): Promise<Revision>;
		findByFunctionId(functionId: string): Promise<Revision[]>;
	};
	votes: {
		cast(
			functionId: string,
			userId: string,
			voteType: VoteType | null,
		): Promise<{ upvotes: number; downvotes: number }>;
		getUserVote(functionId: string, userId: string): Promise<VoteType | null>;
	};
};

// ─── In-memory implementation (dev fallback) ─────────────────────────────────

function generateId(): string {
	return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

const fns = new Map<string, FunctionEntity>();
const commentsStore = new Map<string, Comment[]>();
const revisionsStore = new Map<string, Revision[]>();
// functionId -> userId -> voteType
const votesStore = new Map<string, Map<string, VoteType>>();

function getVoteMap(functionId: string): Map<string, VoteType> {
	let map = votesStore.get(functionId);
	if (!map) {
		map = new Map();
		votesStore.set(functionId, map);
	}
	return map;
}

const memoryDb: Db = {
	functions: {
		async create(data) {
			const fn: FunctionEntity = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
				viewCount: 0,
				upvotes: 0,
				downvotes: 0,
			};
			fns.set(fn.id, fn);
			return fn;
		},

		async findById(id) {
			const fn = fns.get(id);
			if (fn) {
				fn.viewCount++;
				fns.set(id, fn);
			}
			return fn;
		},

		async list({ page, limit, sort }) {
			const all = Array.from(fns.values());
			const sorted = [...all].sort((a, b) => {
				if (sort === "score") return b.score - a.score;
				if (sort === "views") return b.viewCount - a.viewCount;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});
			const start = (page - 1) * limit;
			return { items: sorted.slice(start, start + limit), total: all.length };
		},

		async search({ query, tags, sort }) {
			let all = Array.from(fns.values());
			if (query) {
				const q = query.toLowerCase();
				all = all.filter(
					(fn) =>
						fn.title.toLowerCase().includes(q) ||
						fn.description?.toLowerCase().includes(q) ||
						fn.code.toLowerCase().includes(q),
				);
			}
			if (tags && tags.length > 0) {
				all = all.filter((fn) => tags.some((t) => fn.tags.includes(t)));
			}
			return all.sort((a, b) =>
				sort === "score"
					? b.score - a.score
					: new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		},
	},

	comments: {
		async create(data) {
			const comment: Comment = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
			};
			const existing = commentsStore.get(data.functionId) ?? [];
			commentsStore.set(data.functionId, [...existing, comment]);
			return comment;
		},

		async findByFunctionId(functionId) {
			return commentsStore.get(functionId) ?? [];
		},
	},

	revisions: {
		async create(data) {
			const revision: Revision = {
				...data,
				id: generateId(),
				createdAt: new Date().toISOString(),
			};
			const existing = revisionsStore.get(data.parentFunctionId) ?? [];
			revisionsStore.set(data.parentFunctionId, [...existing, revision]);
			return revision;
		},

		async findByFunctionId(functionId) {
			return revisionsStore.get(functionId) ?? [];
		},
	},

	votes: {
		async cast(functionId, userId, voteType) {
			const fn = fns.get(functionId);
			if (!fn) return { upvotes: 0, downvotes: 0 };

			const voteMap = getVoteMap(functionId);
			const existing = voteMap.get(userId) ?? null;

			if (existing === voteType) {
				// Toggle off
				voteMap.delete(userId);
				if (existing === "up") fn.upvotes = Math.max(0, fn.upvotes - 1);
				else fn.downvotes = Math.max(0, fn.downvotes - 1);
			} else {
				if (existing) {
					// Remove old vote
					if (existing === "up") fn.upvotes = Math.max(0, fn.upvotes - 1);
					else fn.downvotes = Math.max(0, fn.downvotes - 1);
				}
				if (voteType !== null) {
					voteMap.set(userId, voteType);
					if (voteType === "up") fn.upvotes++;
					else fn.downvotes++;
				}
			}
			fns.set(functionId, fn);
			return { upvotes: fn.upvotes, downvotes: fn.downvotes };
		},

		async getUserVote(functionId, userId) {
			return getVoteMap(functionId).get(userId) ?? null;
		},
	},
};

// ─── DB selector ─────────────────────────────────────────────────────────────

// Resolved once per request in Cloudflare context; falls back to in-memory
export function getDb(): Db {
	try {
		// cloudflare:workers is a virtual module available in CF Workers runtime
		// and @cloudflare/vite-plugin's dev emulation
		// biome-ignore lint/suspicious/noExplicitAny: runtime module
		const cfEnv = (globalThis as any).__cf_env__ as
			| { DB?: D1Database }
			| undefined;
		if (cfEnv?.DB) return createD1Db(cfEnv.DB);
	} catch {
		// Not in Cloudflare context — use in-memory store
	}
	return memoryDb;
}

// Seed in-memory store on first load
if (fns.size === 0) {
	seedDatabase((seedFn) => {
		void memoryDb.functions.create(seedFn);
	});
}
