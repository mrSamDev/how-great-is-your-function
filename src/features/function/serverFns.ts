import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAICritique } from "#/lib/ai";
import { scoreFunction } from "#/lib/ast";
import { auth } from "#/lib/auth";
import { getDb } from "#/lib/db";

// ─── analyzeFunction ──────────────────────────────────────────────────────────

export const analyzeFunction = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			code: z.string().min(1).max(10000),
			language: z.literal("typescript"),
			title: z.string().min(1).max(200),
			description: z.string().max(1000).optional(),
			tags: z.array(z.string().max(30)).max(10),
		}),
	)
	.handler(async ({ data }) => {
		const { score, breakdown } = scoreFunction(data.code);
		const aiFeedback = await getAICritique(data.code);

		return getDb().functions.create({
			code: data.code,
			language: data.language,
			title: data.title,
			description: data.description,
			tags: data.tags,
			score,
			breakdown,
			aiFeedback,
		});
	});

// ─── getFunction ──────────────────────────────────────────────────────────────

export const getFunction = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const fn = await getDb().functions.findById(data.id);
		if (!fn) throw new Error(`Function not found: ${data.id}`);
		return fn;
	});

// ─── listFunctions ────────────────────────────────────────────────────────────

export const listFunctions = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			page: z.number().int().min(1).default(1),
			limit: z.number().int().min(1).max(50).default(10),
			sort: z.enum(["score", "recent", "views"]).default("recent"),
		}),
	)
	.handler(async ({ data }) => {
		return getDb().functions.list(data);
	});

// ─── searchFunctions ──────────────────────────────────────────────────────────

export const searchFunctions = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			query: z.string().optional(),
			tags: z.array(z.string()).optional(),
			sort: z.enum(["score", "recent"]).default("score"),
		}),
	)
	.handler(async ({ data }) => {
		return getDb().functions.search(data);
	});

// ─── submitRevision ───────────────────────────────────────────────────────────

export const submitRevision = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			parentFunctionId: z.string(),
			improvedCode: z.string().min(1).max(10000),
			title: z.string().min(1).max(200),
		}),
	)
	.handler(async ({ data }) => {
		const db = getDb();
		const parent = await db.functions.findById(data.parentFunctionId);
		if (!parent)
			throw new Error(`Parent function not found: ${data.parentFunctionId}`);

		const { score, breakdown } = scoreFunction(data.improvedCode);
		const aiFeedback = await getAICritique(data.improvedCode);

		return db.revisions.create({
			parentFunctionId: data.parentFunctionId,
			improvedCode: data.improvedCode,
			title: data.title,
			score,
			breakdown,
			aiFeedback,
			scoreDelta: score - parent.score,
		});
	});

// ─── postComment ──────────────────────────────────────────────────────────────

export const postComment = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			functionId: z.string(),
			content: z.string().min(1).max(2000),
			userName: z.string().min(1).max(100).default("Anonymous"),
		}),
	)
	.handler(async ({ data }) => {
		const db = getDb();
		const fn = await db.functions.findById(data.functionId);
		if (!fn) throw new Error(`Function not found: ${data.functionId}`);

		return db.comments.create({
			functionId: data.functionId,
			userId: "anonymous",
			userName: data.userName,
			content: data.content,
		});
	});

// ─── getFunctionWithRevisions ─────────────────────────────────────────────────

export const getFunctionWithRevisions = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const db = getDb();
		const fn = await db.functions.findById(data.id);
		if (!fn) throw new Error(`Function not found: ${data.id}`);

		const [revisions, comments] = await Promise.all([
			db.revisions.findByFunctionId(data.id),
			db.comments.findByFunctionId(data.id),
		]);

		return { ...fn, revisions, comments };
	});

// ─── voteFunction ─────────────────────────────────────────────────────────────

export const voteFunction = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			functionId: z.string(),
			voteType: z.enum(["up", "down"]).nullable(),
		}),
	)
	.handler(async ({ data }) => {
		const request = getWebRequest();
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) throw new Error("Must be signed in to vote");

		return getDb().votes.cast(data.functionId, session.user.id, data.voteType);
	});

// ─── getUserVote ──────────────────────────────────────────────────────────────

export const getUserVote = createServerFn({ method: "GET" })
	.inputValidator(z.object({ functionId: z.string() }))
	.handler(async ({ data }) => {
		const request = getWebRequest();
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) return { userVote: null as "up" | "down" | null };

		const userVote = await getDb().votes.getUserVote(
			data.functionId,
			session.user.id,
		);
		return { userVote };
	});
