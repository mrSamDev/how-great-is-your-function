import { getScoreColor, getScoreLabel } from "#/lib/ast";
import type { ScoreBreakdown as TScoreBreakdown } from "../types";

type Props = {
	score: number;
	breakdown: TScoreBreakdown;
};

type Category = {
	key: keyof TScoreBreakdown;
	label: string;
	max: number;
	description: string;
};

const CATEGORIES: Category[] = [
	{
		key: "purity",
		label: "Purity",
		max: 30,
		description: "No side effects, no hidden dependencies",
	},
	{
		key: "complexity",
		label: "Complexity",
		max: 25,
		description: "Cyclomatic complexity & nesting depth",
	},
	{
		key: "naming",
		label: "Naming",
		max: 15,
		description: "Clear, descriptive names",
	},
	{
		key: "readability",
		label: "Readability",
		max: 20,
		description: "Structure, line length, early returns",
	},
	{ key: "size", label: "Size", max: 10, description: "Function length" },
];

function BarColor({ pct }: { pct: number }) {
	if (pct >= 0.8) return "bg-emerald-500";
	if (pct >= 0.6) return "bg-yellow-400";
	if (pct >= 0.4) return "bg-orange-400";
	return "bg-red-500";
}

function ScoreRing({ score }: { score: number }) {
	const color = getScoreColor(score);
	const colorMap: Record<string, string> = {
		emerald: "text-emerald-500 border-emerald-500",
		yellow: "text-yellow-400 border-yellow-400",
		orange: "text-orange-400 border-orange-400",
		red: "text-red-500 border-red-500",
	};
	const cls = colorMap[color] ?? colorMap.red;

	return (
		<div
			className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${cls}`}
		>
			<span className={`text-4xl font-bold tabular-nums ${cls.split(" ")[0]}`}>
				{score}
			</span>
			<span className="text-xs text-slate-500 mt-0.5">
				{getScoreLabel(score)}
			</span>
		</div>
	);
}

export function ScoreBreakdown({ score, breakdown }: Props) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-6">
				<ScoreRing score={score} />
				<div className="flex-1 space-y-2.5">
					{CATEGORIES.map(({ key, label, max, description }) => {
						const value = breakdown[key];
						const pct = value / max;
						return (
							<div key={key}>
								<div className="flex items-center justify-between mb-0.5">
									<span className="text-sm font-medium text-slate-700">
										{label}
									</span>
									<span className="text-sm tabular-nums text-slate-500">
										{value}
										<span className="text-slate-400">/{max}</span>
									</span>
								</div>
								<div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full transition-all ${BarColor({ pct })}`}
										style={{ width: `${pct * 100}%` }}
									/>
								</div>
								<p className="text-xs text-slate-400 mt-0.5">{description}</p>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
