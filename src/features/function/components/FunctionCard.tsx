import { Link } from "@tanstack/react-router";
import { Eye, MessageSquare } from "lucide-react";
import { CodeBlock } from "#/features/editor/components/CodeBlock";
import { getScoreColor, getScoreLabel } from "#/lib/ast";
import type { FunctionEntity } from "../types";

type Props = {
	fn: FunctionEntity;
	commentCount?: number;
};

const scoreColorMap: Record<string, string> = {
	emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
	yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
	orange: "bg-orange-100 text-orange-700 border-orange-200",
	red: "bg-red-100 text-red-700 border-red-200",
};

export function FunctionCard({ fn, commentCount = 0 }: Props) {
	const color = getScoreColor(fn.score);
	const scoreCls = scoreColorMap[color] ?? scoreColorMap.red;
	const previewLines = fn.code.split("\n").slice(0, 4).join("\n");

	return (
		<Link
			to="/function/$functionId"
			params={{ functionId: fn.id }}
			className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
						{fn.title}
					</h3>
					{fn.description && (
						<p className="text-sm text-slate-500 mt-0.5 truncate">
							{fn.description}
						</p>
					)}
				</div>
				<div
					className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg border text-sm font-bold ${scoreCls}`}
				>
					<span className="text-lg leading-none">{fn.score}</span>
					<span className="text-xs font-normal opacity-75">
						{getScoreLabel(fn.score)}
					</span>
				</div>
			</div>

			<CodeBlock
				code={previewLines}
				showLineNumbers={false}
				showHeader={false}
				className="overflow-hidden rounded-lg border border-slate-800 bg-[#0b1120]"
			/>

			<div className="flex items-center gap-4 mt-3">
				{fn.tags.length > 0 && (
					<div className="flex gap-1.5 flex-wrap flex-1">
						{fn.tags.slice(0, 4).map((tag) => (
							<span
								key={tag}
								className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
							>
								{tag}
							</span>
						))}
					</div>
				)}
				<div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
					<span className="flex items-center gap-1">
						<Eye className="w-3 h-3" />
						{fn.viewCount}
					</span>
					{commentCount > 0 && (
						<span className="flex items-center gap-1">
							<MessageSquare className="w-3 h-3" />
							{commentCount}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}
