import { createFileRoute } from "@tanstack/react-router";
import { SubmitForm } from "#/features/function/components/SubmitForm";

export const Route = createFileRoute("/submit")({
	component: SubmitPage,
});

function SubmitPage() {
	return (
		<div className="mx-auto max-w-4xl px-4 py-10">
			<div className="comic-bubble mb-8 px-6 py-6 md:px-8">
				<div className="comic-caption mb-4 text-slate-950">Review Booth</div>
				<h1 className="comic-heading text-3xl text-slate-950 md:text-4xl">
					Review a Function
				</h1>
				<p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
					Paste a TypeScript function to get a deterministic score and AI
					feedback.
				</p>
			</div>
			<SubmitForm />
		</div>
	);
}
