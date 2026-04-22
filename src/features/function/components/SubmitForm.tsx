"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CodeEditor } from "#/features/editor/components/CodeEditor";
import { authClient } from "#/lib/auth-client";
import { analyzeFunction } from "../serverFns";
import { parseTags, submitFunctionSchema } from "./submit-form-schema";

export function SubmitForm() {
	const { data: session, isPending } = authClient.useSession();
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { code: "", title: "", description: "", tags: "" },
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				const result = await analyzeFunction({
					data: {
						code: value.code,
						language: "typescript",
						title: value.title,
						description: value.description || undefined,
						tags: parseTags(value.tags),
					},
				});
				router.navigate({
					to: "/function/$functionId",
					params: { functionId: result.id },
				});
			} catch (e) {
				setServerError(e instanceof Error ? e.message : "Something went wrong");
			}
		},
	});

	if (isPending) {
		return <div className="comic-panel h-48 bg-[#fffaf0] animate-pulse" />;
	}

	if (!session?.user) {
		return (
			<div className="comic-panel flex flex-col items-center gap-5 bg-[#fffaf0] px-8 py-12 text-center">
				<p className="comic-heading text-xl text-slate-900">
					Sign in to review a function
				</p>
				<p className="text-sm text-slate-500">
					GitHub sign-in takes one click. No form. No password.
				</p>
				<button
					type="button"
					onClick={() =>
						void authClient.signIn.social({
							provider: "github",
							callbackURL: "/submit",
						})
					}
					className="comic-button flex items-center gap-2 bg-slate-900 px-6 py-3 text-[0.78rem] text-white"
				>
					<GitHubIcon />
					Sign in with GitHub
				</button>
			</div>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="comic-panel space-y-7 bg-[#fffaf0] p-6 md:p-8"
		>
			<form.Field
				name="code"
				validators={{
					onChange: ({ value }) =>
						submitFunctionSchema.shape.code.safeParse(value).error?.issues[0]
							?.message,
				}}
			>
				{(field) => (
					<div>
						<label htmlFor="code-editor" className="comic-form-label">
							Function Code <span className="text-[#ff5d47]">*</span>
						</label>
						<CodeEditor
							id="code-editor"
							value={field.state.value}
							onChange={field.handleChange}
							error={field.state.meta.errors[0]}
							minRows={14}
						/>
					</div>
				)}
			</form.Field>

			<form.Field
				name="title"
				validators={{
					onChange: ({ value }) =>
						submitFunctionSchema.shape.title.safeParse(value).error?.issues[0]
							?.message,
				}}
			>
				{(field) => (
					<div>
						<label htmlFor="title" className="comic-form-label">
							Title <span className="text-[#ff5d47]">*</span>
						</label>
						<input
							id="title"
							type="text"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. Calculate Discount Price"
							className={`comic-input ${field.state.meta.errors[0] ? "comic-input-error" : ""}`}
						/>
						{field.state.meta.errors[0] && (
							<p className="comic-error-text">{field.state.meta.errors[0]}</p>
						)}
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div>
						<label htmlFor="description" className="comic-form-label">
							Description <span className="comic-form-note">(optional)</span>
						</label>
						<textarea
							id="description"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="What does this function do? Why does it exist?"
							rows={3}
							className="comic-textarea"
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="tags">
				{(field) => (
					<div>
						<label htmlFor="tags" className="comic-form-label">
							Tags <span className="comic-form-note">(comma-separated)</span>
						</label>
						<input
							id="tags"
							type="text"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. array, recursion, auth, performance"
							className="comic-input"
						/>
						{field.state.value && (
							<div className="mt-3 flex flex-wrap gap-2">
								{parseTags(field.state.value).map((tag) => (
									<span
										key={tag}
										className="comic-tag-chip px-3 py-1 text-slate-950"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				)}
			</form.Field>

			{serverError && (
				<p className="comic-error-panel px-4 py-3 text-sm text-[#a22816]">
					{serverError}
				</p>
			)}

			<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
				{([canSubmit, isSubmitting]) => (
					<button
						type="submit"
						disabled={!canSubmit || isSubmitting}
						className="comic-button flex w-full items-center justify-center gap-2 bg-[#ff5d47] px-6 py-3 text-[0.78rem] text-white disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[4px_4px_0_#101010]"
					>
						{isSubmitting ? (
							<>
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Analyzing…
							</>
						) : (
							"Review Function"
						)}
					</button>
				)}
			</form.Subscribe>
		</form>
	);
}

function GitHubIcon() {
	return (
		<svg
			viewBox="0 0 16 16"
			className="h-4 w-4 fill-current"
			aria-hidden="true"
		>
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
		</svg>
	);
}
