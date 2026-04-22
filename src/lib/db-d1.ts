import type {
	Comment,
	FunctionEntity,
	Language,
	Revision,
	VoteType,
} from "#/features/function/types";
import type { Db } from "./db";

// Minimal D1 typings — avoids needing @cloudflare/workers-types
interface D1Stmt {
	bind(...values: unknown[]): D1Stmt;
	run(): Promise<void>;
	first<T = Record<string, unknown>>(): Promise<T | null>;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
export interface D1Database {
	prepare(sql: string): D1Stmt;
}

function generateId(): string {
	return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

type FnRow = {
	id: string;
	code: string;
	language: string;
	title: string;
	description: string | null;
	tags: string;
	score: number;
	breakdown: string;
	ai_feedback: string;
	author_id: string | null;
	view_count: number;
	upvotes: number;
	downvotes: number;
	created_at: string;
};

function rowToFn(row: FnRow): FunctionEntity {
	return {
		id: row.id,
		code: row.code,
		language: row.language as Language,
		title: row.title,
		description: row.description ?? undefined,
		tags: JSON.parse(row.tags) as string[],
		score: row.score,
		breakdown: JSON.parse(row.breakdown) as FunctionEntity["breakdown"],
		aiFeedback: JSON.parse(row.ai_feedback) as FunctionEntity["aiFeedback"],
		authorId: row.author_id ?? undefined,
		viewCount: row.view_count,
		upvotes: row.upvotes,
		downvotes: row.downvotes,
		createdAt: row.created_at,
	};
}

type CommentRow = {
	id: string;
	function_id: string;
	user_id: string;
	user_name: string;
	content: string;
	created_at: string;
};

function rowToComment(row: CommentRow): Comment {
	return {
		id: row.id,
		functionId: row.function_id,
		userId: row.user_id,
		userName: row.user_name,
		content: row.content,
		createdAt: row.created_at,
	};
}

type RevisionRow = {
	id: string;
	parent_function_id: string;
	author_id: string | null;
	author_name: string | null;
	improved_code: string;
	title: string;
	score: number;
	breakdown: string;
	ai_feedback: string;
	score_delta: number;
	created_at: string;
};

function rowToRevision(row: RevisionRow): Revision {
	return {
		id: row.id,
		parentFunctionId: row.parent_function_id,
		authorId: row.author_id ?? undefined,
		authorName: row.author_name ?? undefined,
		improvedCode: row.improved_code,
		title: row.title,
		score: row.score,
		breakdown: JSON.parse(row.breakdown) as Revision["breakdown"],
		aiFeedback: JSON.parse(row.ai_feedback) as Revision["aiFeedback"],
		scoreDelta: row.score_delta,
		createdAt: row.created_at,
	};
}

export function createD1Db(d1: D1Database): Db {
	return {
		functions: {
			async create(data) {
				const id = generateId();
				const now = new Date().toISOString();
				await d1
					.prepare(
						`INSERT INTO functions
             (id, code, language, title, description, tags, score, breakdown, ai_feedback, author_id, view_count, upvotes, downvotes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
					)
					.bind(
						id,
						data.code,
						data.language,
						data.title,
						data.description ?? null,
						JSON.stringify(data.tags),
						data.score,
						JSON.stringify(data.breakdown),
						JSON.stringify(data.aiFeedback),
						data.authorId ?? null,
						now,
					)
					.run();
				return {
					...data,
					id,
					createdAt: now,
					viewCount: 0,
					upvotes: 0,
					downvotes: 0,
				};
			},

			async findById(id) {
				const row = await d1
					.prepare(
						`UPDATE functions SET view_count = view_count + 1 WHERE id = ? RETURNING *`,
					)
					.bind(id)
					.first<FnRow>();
				return row ? rowToFn(row) : undefined;
			},

			async list({ page, limit, sort }) {
				const order =
					sort === "score"
						? "score DESC"
						: sort === "views"
							? "view_count DESC"
							: "created_at DESC";
				const offset = (page - 1) * limit;
				const [{ results }, countRow] = await Promise.all([
					d1
						.prepare(
							`SELECT * FROM functions ORDER BY ${order} LIMIT ? OFFSET ?`,
						)
						.bind(limit, offset)
						.all<FnRow>(),
					d1
						.prepare("SELECT COUNT(*) as total FROM functions")
						.first<{ total: number }>(),
				]);
				return {
					items: results.map(rowToFn),
					total: countRow?.total ?? 0,
				};
			},

			async search({ query, tags, sort }) {
				const order = sort === "score" ? "score DESC" : "created_at DESC";
				const { results } = await d1
					.prepare(`SELECT * FROM functions ORDER BY ${order}`)
					.all<FnRow>();
				let fns = results.map(rowToFn);
				if (query) {
					const q = query.toLowerCase();
					fns = fns.filter(
						(fn) =>
							fn.title.toLowerCase().includes(q) ||
							fn.description?.toLowerCase().includes(q) ||
							fn.code.toLowerCase().includes(q),
					);
				}
				if (tags && tags.length > 0) {
					fns = fns.filter((fn) => tags.some((t) => fn.tags.includes(t)));
				}
				return fns;
			},
		},

		comments: {
			async create(data) {
				const id = generateId();
				const now = new Date().toISOString();
				await d1
					.prepare(
						`INSERT INTO comments (id, function_id, user_id, user_name, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
					)
					.bind(
						id,
						data.functionId,
						data.userId,
						data.userName,
						data.content,
						now,
					)
					.run();
				return { ...data, id, createdAt: now };
			},

			async findByFunctionId(functionId) {
				const { results } = await d1
					.prepare(
						"SELECT * FROM comments WHERE function_id = ? ORDER BY created_at ASC",
					)
					.bind(functionId)
					.all<CommentRow>();
				return results.map(rowToComment);
			},
		},

		revisions: {
			async create(data) {
				const id = generateId();
				const now = new Date().toISOString();
				await d1
					.prepare(
						`INSERT INTO revisions
             (id, parent_function_id, author_id, author_name, improved_code, title, score, breakdown, ai_feedback, score_delta, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					)
					.bind(
						id,
						data.parentFunctionId,
						data.authorId ?? null,
						data.authorName ?? null,
						data.improvedCode,
						data.title,
						data.score,
						JSON.stringify(data.breakdown),
						JSON.stringify(data.aiFeedback),
						data.scoreDelta,
						now,
					)
					.run();
				return { ...data, id, createdAt: now };
			},

			async findByFunctionId(functionId) {
				const { results } = await d1
					.prepare(
						"SELECT * FROM revisions WHERE parent_function_id = ? ORDER BY created_at ASC",
					)
					.bind(functionId)
					.all<RevisionRow>();
				return results.map(rowToRevision);
			},
		},

		votes: {
			async cast(functionId, userId, voteType) {
				const existing = await d1
					.prepare(
						"SELECT vote_type FROM votes WHERE function_id = ? AND user_id = ?",
					)
					.bind(functionId, userId)
					.first<{ vote_type: VoteType }>();

				if (existing) {
					if (existing.vote_type === voteType) {
						// Toggle off — remove vote
						await d1
							.prepare(
								"DELETE FROM votes WHERE function_id = ? AND user_id = ?",
							)
							.bind(functionId, userId)
							.run();
						const col = voteType === "up" ? "upvotes" : "downvotes";
						await d1
							.prepare(
								`UPDATE functions SET ${col} = MAX(0, ${col} - 1) WHERE id = ?`,
							)
							.bind(functionId)
							.run();
					} else if (voteType !== null) {
						// Switch vote direction
						await d1
							.prepare(
								"UPDATE votes SET vote_type = ? WHERE function_id = ? AND user_id = ?",
							)
							.bind(voteType, functionId, userId)
							.run();
						const addCol = voteType === "up" ? "upvotes" : "downvotes";
						const subCol = voteType === "up" ? "downvotes" : "upvotes";
						await d1
							.prepare(
								`UPDATE functions SET ${addCol} = ${addCol} + 1, ${subCol} = MAX(0, ${subCol} - 1) WHERE id = ?`,
							)
							.bind(functionId)
							.run();
					}
				} else if (voteType !== null) {
					// New vote
					await d1
						.prepare(
							"INSERT INTO votes (id, function_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)",
						)
						.bind(
							generateId(),
							functionId,
							userId,
							voteType,
							new Date().toISOString(),
						)
						.run();
					const col = voteType === "up" ? "upvotes" : "downvotes";
					await d1
						.prepare(`UPDATE functions SET ${col} = ${col} + 1 WHERE id = ?`)
						.bind(functionId)
						.run();
				}

				const row = await d1
					.prepare("SELECT upvotes, downvotes FROM functions WHERE id = ?")
					.bind(functionId)
					.first<{ upvotes: number; downvotes: number }>();
				return { upvotes: row?.upvotes ?? 0, downvotes: row?.downvotes ?? 0 };
			},

			async getUserVote(functionId, userId) {
				const row = await d1
					.prepare(
						"SELECT vote_type FROM votes WHERE function_id = ? AND user_id = ?",
					)
					.bind(functionId, userId)
					.first<{ vote_type: VoteType }>();
				return row?.vote_type ?? null;
			},
		},
	};
}
