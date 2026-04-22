import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useDebugValue, useEffect, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { FunctionCard } from "#/features/function/components/FunctionCard";
import { searchFunctionsQueryOptions } from "#/features/function/queries";

const searchSchema = z.object({
	q: z.string().default(""),
	tags: z.string().default(""),
	sort: z.enum(["score", "recent"]).default("score"),
});

export const Route = createFileRoute("/search")({
	validateSearch: searchSchema,
	component: SearchPage,
});

const POPULAR_TAGS = [
	"pure",
	"array",
	"recursion",
	"async",
	"auth",
	"performance",
	"math",
	"string",
	"functional",
];

function useSearchState() {
	const { q, tags: tagsParam, sort } = Route.useSearch();
	const activeTags = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

	useDebugValue({ q, activeTags, sort });

	return { q, activeTags, sort };
}

function SearchPage() {
	const { q, activeTags, sort } = useSearchState();
	const navigate = useNavigate({ from: "/search" });
	const [inputValue, setInputValue] = useState(q);
	const [isPending, startTransition] = useTransition();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const { data: results, isFetching } = useQuery({
		...searchFunctionsQueryOptions(q, activeTags, sort),
		placeholderData: (prev) => prev,
	});

	useEffect(() => {
		setInputValue(q);
	}, [q]);

	function updateSearch(
		newQ: string,
		newTags: string[],
		newSort: "score" | "recent",
	) {
		startTransition(() => {
			navigate({
				search: { q: newQ, tags: newTags.join(","), sort: newSort },
				replace: true,
			});
		});
	}

	function handleQueryChange(value: string) {
		setInputValue(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			updateSearch(value, activeTags, sort);
		}, 300);
	}

	function toggleTag(tag: string) {
		const next = activeTags.includes(tag)
			? activeTags.filter((t) => t !== tag)
			: [...activeTags, tag];
		updateSearch(q, next, sort);
	}

	function setSort(newSort: "score" | "recent") {
		updateSearch(q, activeTags, newSort);
	}

	function clearAll() {
		setInputValue("");
		if (debounceRef.current) clearTimeout(debounceRef.current);
		startTransition(() => {
			navigate({ search: { q: "", tags: "", sort: "score" }, replace: true });
		});
	}

	const isLoading = isPending || isFetching;

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
			<h1 className="text-2xl font-bold text-slate-900">Search Functions</h1>

			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
				<input
					type="text"
					value={inputValue}
					onChange={(e) => handleQueryChange(e.target.value)}
					placeholder="Search by title, description, or code…"
					className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
				/>
				{(inputValue || activeTags.length > 0) && (
					<button
						type="button"
						onClick={clearAll}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			<div className="space-y-2">
				<p className="text-xs font-medium text-slate-500">Filter by tag</p>
				<div className="flex flex-wrap gap-2">
					{POPULAR_TAGS.map((tag) => (
						<button
							type="button"
							key={tag}
							onClick={() => toggleTag(tag)}
							className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
								activeTags.includes(tag)
									? "bg-blue-600 text-white border-blue-600"
									: "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
							}`}
						>
							{tag}
						</button>
					))}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-xs text-slate-500">Sort by</span>
				{(["score", "recent"] as const).map((s) => (
					<button
						type="button"
						key={s}
						onClick={() => setSort(s)}
						className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
							sort === s
								? "bg-slate-900 text-white border-slate-900"
								: "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
						}`}
					>
						{s === "score" ? "Highest Score" : "Most Recent"}
					</button>
				))}
			</div>

			<div>
				{isLoading && !results && (
					<div className="text-center py-12 text-slate-400 text-sm">
						Searching…
					</div>
				)}
				{results && results.length === 0 && (
					<div className="text-center py-12 text-slate-400">
						<p>No functions found.</p>
						<p className="text-sm mt-1">
							Try different tags or a broader query.
						</p>
					</div>
				)}
				{results && results.length > 0 && (
					<div className={`space-y-3 transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}>
						<p className="text-xs text-slate-400">
							{results.length} result{results.length !== 1 ? "s" : ""}
						</p>
						{results.map((fn) => (
							<FunctionCard key={fn.id} fn={fn} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
