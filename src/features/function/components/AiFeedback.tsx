import { Sparkles } from "lucide-react";
import type { AiFeedback as TAiFeedback } from "../types";

type Props = {
	feedback: TAiFeedback;
};

export function AiFeedback({ feedback }: Props) {
	return (
		<div className="rounded-xl border border-violet-200 bg-violet-50 p-5 space-y-3">
			<div className="flex items-center gap-2 text-violet-700">
				<Sparkles className="w-4 h-4" />
				<span className="text-sm font-semibold">AI Critique</span>
			</div>
			<p className="text-sm text-slate-700 leading-relaxed">
				{feedback.summary}
			</p>
			<div className="space-y-1.5">
				{feedback.suggestions.map((s, i) => (
					<div key={s} className="flex items-start gap-2">
						<span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-violet-200 text-violet-700 text-xs flex items-center justify-center font-medium">
							{i + 1}
						</span>
						<p className="text-sm text-slate-600">{s}</p>
					</div>
				))}
			</div>
		</div>
	);
}
