import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Eye, Tag } from "lucide-react";
import { CodeBlock } from "#/features/editor/components/CodeBlock";
import { AiFeedback } from "#/features/function/components/AiFeedback";
import { CommentThread } from "#/features/function/components/CommentThread";
import { ScoreBreakdown } from "#/features/function/components/ScoreBreakdown";
import { functionWithRevisionsQueryOptions } from "#/features/function/queries";

export const Route = createFileRoute("/function/$functionId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(
			functionWithRevisionsQueryOptions(params.functionId),
		),
	component: FunctionDetail,
});

function FunctionDetail() {
	const { functionId } = Route.useParams();
	const { data: fn } = useSuspenseQuery(
		functionWithRevisionsQueryOptions(functionId),
	);

	const submittedAt = new Date(fn.createdAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
			{/* Back */}
			<Link
				to="/"
				className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
			>
				<ArrowLeft className="w-3.5 h-3.5" />
				Back
			</Link>

			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900">{fn.title}</h1>
				{fn.description && (
					<p className="text-slate-500 mt-1">{fn.description}</p>
				)}
				<div className="flex flex-wrap items-center gap-3 mt-3">
					{fn.tags.map((tag) => (
						<Link
							key={tag}
							to="/search"
							search={{ tags: tag, q: "" }}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 transition-colors"
						>
							<Tag className="w-3 h-3" />
							{tag}
						</Link>
					))}
					<span className="flex items-center gap-1 text-xs text-slate-400">
						<Calendar className="w-3 h-3" />
						{submittedAt}
					</span>
					<span className="flex items-center gap-1 text-xs text-slate-400">
						<Eye className="w-3 h-3" />
						{fn.viewCount} views
					</span>
				</div>
			</div>

			{/* Score Breakdown */}
			<section className="rounded-xl border border-slate-200 bg-white p-6">
				<h2 className="text-sm font-semibold text-slate-700 mb-4">
					Score Breakdown
				</h2>
				<ScoreBreakdown score={fn.score} breakdown={fn.breakdown} />
			</section>

			{/* Code */}
			<CodeBlock code={fn.code} />

			{/* AI Feedback */}
			<AiFeedback feedback={fn.aiFeedback} />

			{/* Revisions */}
			{fn.revisions.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-semibold text-slate-700">
						Revisions ({fn.revisions.length})
					</h2>
					{fn.revisions.map((rev) => (
						<div
							key={rev.id}
							className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-slate-800">
									{rev.title}
								</span>
								<span
									className={`text-sm font-semibold ${rev.scoreDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}
								>
									{rev.scoreDelta >= 0 ? "+" : ""}
									{rev.scoreDelta} pts
								</span>
							</div>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span>Score: {fn.score}</span>
								<span>→</span>
								<span className="font-medium">{rev.score}</span>
							</div>
							<CodeBlock
								code={rev.improvedCode}
								className="overflow-hidden rounded-xl border border-slate-200"
								showLineNumbers={false}
							/>
						</div>
					))}
				</section>
			)}

			{/* Submit Revision CTA */}
			<section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
				<p className="text-sm text-slate-600 mb-3">
					Think you can improve this function?
				</p>
				<Link
					to="/submit"
					className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
				>
					Submit a revision
				</Link>
			</section>

			{/* Comments */}
			<section className="rounded-xl border border-slate-200 bg-white p-6">
				<CommentThread functionId={fn.id} comments={fn.comments} />
			</section>
		</div>
	);
}
