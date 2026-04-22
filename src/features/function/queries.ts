import { queryOptions } from "@tanstack/react-query";
import {
	getFunction,
	getFunctionWithRevisions,
	getUserVote,
	listFunctions,
	searchFunctions,
} from "./serverFns";

// Single source of truth for all query keys
export const queryKeys = {
	function: (id: string) => ["function", id] as const,
	functionWithRevisions: (id: string) => ["function", id, "revisions"] as const,
	list: (page: number, sort: "score" | "recent" | "views") =>
		["functions", page, sort] as const,
	search: (query: string, tags: string[], sort: "score" | "recent") =>
		["search", query, tags, sort] as const,
	leaderboard: () => ["leaderboard"] as const,
	userVote: (functionId: string) => ["vote", functionId] as const,
} as const;

// ─── Query Options ────────────────────────────────────────────────────────────

export function functionQueryOptions(id: string) {
	return queryOptions({
		queryKey: queryKeys.function(id),
		queryFn: () => getFunction({ data: { id } }),
		staleTime: 60_000,
	});
}

export function functionWithRevisionsQueryOptions(id: string) {
	return queryOptions({
		queryKey: queryKeys.functionWithRevisions(id),
		queryFn: () => getFunctionWithRevisions({ data: { id } }),
		staleTime: 30_000,
	});
}

export function listFunctionsQueryOptions(
	page = 1,
	sort: "score" | "recent" | "views" = "recent",
) {
	return queryOptions({
		queryKey: queryKeys.list(page, sort),
		queryFn: () => listFunctions({ data: { page, limit: 10, sort } }),
		staleTime: 30_000,
	});
}

export function searchFunctionsQueryOptions(
	query: string,
	tags: string[],
	sort: "score" | "recent" = "score",
) {
	return queryOptions({
		queryKey: queryKeys.search(query, tags, sort),
		queryFn: () =>
			searchFunctions({ data: { query: query || undefined, tags, sort } }),
		staleTime: 15_000,
	});
}

export function leaderboardQueryOptions() {
	return queryOptions({
		queryKey: queryKeys.leaderboard(),
		queryFn: () =>
			listFunctions({ data: { page: 1, limit: 20, sort: "score" } }),
		staleTime: 60_000,
	});
}

export function userVoteQueryOptions(functionId: string) {
	return queryOptions({
		queryKey: queryKeys.userVote(functionId),
		queryFn: () => getUserVote({ data: { functionId } }),
		staleTime: 30_000,
	});
}
