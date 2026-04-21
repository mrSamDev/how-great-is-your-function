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
		<div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10">
			<section className="comic-bubble comic-halftone px-6 py-8 md:px-10 md:py-10">
				<div className="mb-4 inline-flex">
					<div className="comic-caption text-slate-950">
						<Zap className="w-3 h-3" />
						Static scoring, AI review, and revision tracking
					</div>
				</div>
				<div className="grid gap-8 md:grid-cols-[1.5fr_0.95fr] md:items-start">
					<div className="space-y-5">
						<h1 className="comic-heading max-w-3xl text-4xl leading-none text-slate-950 md:text-6xl">
							how great is your function
						</h1>
						<p className="max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
							Drop in a TypeScript function, get a scorecard back, then punch up
							the weak spots before they turn into production drama.
						</p>
						<div className="flex flex-wrap items-center gap-4">
							<Link
								to="/submit"
								className="comic-button comic-button-cta bg-[#ff5d47] px-5 py-3 text-[0.78rem] text-white"
							>
								Review a function
								<span className="comic-button-cta-icon">
									<ArrowRight className="w-4 h-4" />
								</span>
							</Link>
							<Link
								to="/leaderboard"
								className="comic-button bg-[#4d7cff] px-5 py-3 text-[0.78rem] text-white"
							>
								Leaderboard
							</Link>
						</div>
					</div>
					<div className="comic-panel rotate-[-2deg] bg-[#ff5d47] p-5 text-white">
						<div className="comic-kicker mb-3 text-[0.68rem] text-white/85">
							Panel Breakdown
						</div>
						<div className="grid grid-cols-2 gap-3">
							{[
								["Purity", "Spot sneaky side effects"],
								["Complexity", "Catch maze logic early"],
								["Naming", "Flag foggy identifiers"],
								["Readability", "Check flow and scan speed"],
							].map(([label, description]) => (
								<div
									key={label}
									className="rounded-2xl border-3 border-slate-950 bg-[#fff7df] p-3 text-slate-950 shadow-[3px_3px_0_#101010]"
								>
									<div className="comic-kicker text-[0.64rem]">{label}</div>
									<p className="mt-2 text-sm leading-5">{description}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="grid grid-cols-2 gap-3 md:grid-cols-5">
				{[
					{ label: "Purity", max: 30, desc: "No side effects" },
					{ label: "Complexity", max: 25, desc: "Low branching" },
					{ label: "Naming", max: 15, desc: "Clear names" },
					{ label: "Readability", max: 20, desc: "Easy to scan" },
					{ label: "Size", max: 10, desc: "Concise" },
				].map((c) => (
					<div
						key={c.label}
						className="comic-panel-soft comic-halftone p-4 text-center"
					>
						<div className="comic-heading text-2xl text-slate-950">{c.max}</div>
						<div className="comic-kicker mt-1 text-[0.68rem] text-slate-800">
							{c.label}
						</div>
						<div className="mt-2 text-xs text-slate-600">{c.desc}</div>
					</div>
				))}
			</section>

			{topData.items.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="comic-heading text-2xl text-slate-950">
							Top Scoring
						</h2>
						<Link
							to="/leaderboard"
							className="comic-kicker flex items-center gap-1 text-[0.72rem] text-[#ff5d47]"
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

			{data.items.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="comic-heading text-2xl text-slate-950">
							Recently Submitted
						</h2>
						<Link
							to="/search"
							className="comic-kicker flex items-center gap-1 text-[0.72rem] text-[#4d7cff]"
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
				<div className="comic-panel mx-auto max-w-xl px-6 py-12 text-center">
					<p className="comic-heading text-2xl text-slate-950">
						No functions yet.
					</p>
					<Link
						to="/submit"
						className="comic-kicker mt-4 inline-block text-[0.74rem] text-[#ff5d47]"
					>
						Be the first to submit one →
					</Link>
				</div>
			)}
		</div>
	);
}
