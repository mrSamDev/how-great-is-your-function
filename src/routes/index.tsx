import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Zap } from "lucide-react";
import { FunctionCard } from "#/features/function/components/FunctionCard";
import { listFunctionsQueryOptions } from "#/features/function/queries";

export const Route = createFileRoute("/")({
	loader: ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(listFunctionsQueryOptions(1, "recent")),
			queryClient.ensureQueryData(listFunctionsQueryOptions(1, "score")),
		]),
	component: Home,
});

function Home() {
	const { data } = useSuspenseQuery(listFunctionsQueryOptions(1, "recent"));
	const { data: topData } = useSuspenseQuery(
		listFunctionsQueryOptions(1, "score"),
	);

	return (
		<div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
			{/* Hero */}
			<section className="text-center space-y-4">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-2">
					<Zap className="w-3 h-3" />
					Static scoring, AI review, and revision tracking
				</div>
				<h1 className="text-4xl font-bold text-slate-900 tracking-tight">
					how great is your function
				</h1>
				<p className="text-lg text-slate-500 max-w-xl mx-auto">
					Submit a TypeScript function and get a clear score, AI feedback, and
					practical improvements.
				</p>
				<div className="flex items-center justify-center gap-3">
					<Link
						to="/submit"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
					>
						Review a function
						<ArrowRight className="w-4 h-4" />
					</Link>
					<Link
						to="/leaderboard"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
					>
						Leaderboard
					</Link>
				</div>
			</section>

			{/* Score system explainer */}
			<section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
				{[
					{ label: "Purity", max: 30, desc: "No side effects" },
					{ label: "Complexity", max: 25, desc: "Low branching" },
					{ label: "Naming", max: 15, desc: "Clear names" },
					{ label: "Readability", max: 20, desc: "Easy to scan" },
					{ label: "Size", max: 10, desc: "Concise" },
				].map((c) => (
					<div
						key={c.label}
						className="rounded-xl border border-slate-100 bg-white p-3 text-center"
					>
						<div className="text-lg font-bold text-slate-800">{c.max}</div>
						<div className="text-xs font-semibold text-slate-700">
							{c.label}
						</div>
						<div className="text-xs text-slate-400">{c.desc}</div>
					</div>
				))}
			</section>

			{/* Top Scoring */}
			{topData.items.length > 0 && (
				<section>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-slate-800">
							Top Scoring
						</h2>
						<Link
							to="/leaderboard"
							className="text-sm text-blue-600 hover:underline flex items-center gap-1"
						>
							View all <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="grid gap-3">
						{topData.items.slice(0, 3).map((fn) => (
							<FunctionCard key={fn.id} fn={fn} />
						))}
					</div>
				</section>
			)}

			{/* Recent */}
			{data.items.length > 0 && (
				<section>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-slate-800">
							Recently Submitted
						</h2>
						<Link
							to="/search"
							className="text-sm text-blue-600 hover:underline flex items-center gap-1"
						>
							Browse all <ArrowRight className="w-3 h-3" />
						</Link>
					</div>
					<div className="grid gap-3">
						{data.items.map((fn) => (
							<FunctionCard key={fn.id} fn={fn} />
						))}
					</div>
				</section>
			)}

			{data.items.length === 0 && (
				<div className="text-center py-16 text-slate-400">
					<p className="text-lg">No functions yet.</p>
					<Link
						to="/submit"
						className="text-blue-600 hover:underline text-sm mt-2 inline-block"
					>
						Be the first to submit one →
					</Link>
				</div>
			)}
		</div>
	);
}
