import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { FunctionCard } from "#/features/function/components/FunctionCard";
import { leaderboardQueryOptions } from "#/features/function/queries";

export const Route = createFileRoute("/leaderboard")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(leaderboardQueryOptions()),
	component: LeaderboardPage,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
	const { data } = useSuspenseQuery(leaderboardQueryOptions());

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
			<div className="flex items-center gap-2">
				<Trophy className="w-5 h-5 text-yellow-500" />
				<h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
			</div>
			<p className="text-slate-500 text-sm">
				Top-scoring functions, ranked by quality score.
			</p>

			{data.items.length === 0 ? (
				<div className="text-center py-16 text-slate-400">
					<p>Nothing here yet.</p>
					<Link
						to="/submit"
						className="text-blue-600 hover:underline text-sm mt-2 inline-block"
					>
						Submit a function →
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{data.items.map((fn, i) => (
						<div key={fn.id} className="flex items-start gap-3">
							<div className="w-8 text-center pt-4 flex-shrink-0">
								{i < 3 ? (
									<span className="text-xl">{MEDALS[i]}</span>
								) : (
									<span className="text-sm font-mono text-slate-400">
										#{i + 1}
									</span>
								)}
							</div>
							<div className="flex-1">
								<FunctionCard fn={fn} />
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
