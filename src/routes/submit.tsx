import { createFileRoute } from "@tanstack/react-router";
import { SubmitForm } from "#/features/function/components/SubmitForm";

export const Route = createFileRoute("/submit")({
	component: SubmitPage,
});

function SubmitPage() {
	return (
		<div className="max-w-2xl mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-slate-900">
					Analyze a Function
				</h1>
				<p className="text-slate-500 mt-1 text-sm">
					Paste a TypeScript function to get a deterministic score + AI
					critique.
				</p>
			</div>
			<SubmitForm />
		</div>
	);
}
