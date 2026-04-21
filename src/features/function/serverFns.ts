import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAICritique } from "#/lib/ai";
import { scoreFunction } from "#/lib/ast";
import { db } from "#/lib/db";

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

		const fn = db.functions.create({
			code: data.code,
			language: data.language,
			title: data.title,
			description: data.description,
			tags: data.tags,
			score,
			breakdown,
			aiFeedback,
		});

		return fn;
	});

// ─── getFunction ──────────────────────────────────────────────────────────────

export const getFunction = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const fn = db.functions.findById(data.id);
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
		return db.functions.list(data);
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
		return db.functions.search(data);
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
		const parent = db.functions.findById(data.parentFunctionId);
		if (!parent)
			throw new Error(`Parent function not found: ${data.parentFunctionId}`);

		const { score, breakdown } = scoreFunction(data.improvedCode);
		const aiFeedback = await getAICritique(data.improvedCode);

		const revision = db.revisions.create({
			parentFunctionId: data.parentFunctionId,
			improvedCode: data.improvedCode,
			title: data.title,
			score,
			breakdown,
			aiFeedback,
			scoreDelta: score - parent.score,
		});

		return revision;
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
		const fn = db.functions.findById(data.functionId);
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
		const fn = db.functions.findById(data.id);
		if (!fn) throw new Error(`Function not found: ${data.id}`);

		const revisions = db.revisions.findByFunctionId(data.id);
		const comments = db.comments.findByFunctionId(data.id);

		return { ...fn, revisions, comments };
	});
