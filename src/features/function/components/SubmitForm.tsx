"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { CodeEditor } from "#/features/editor/components/CodeEditor";
import { analyzeFunction } from "../serverFns";
import { parseTags, submitFunctionSchema } from "./submit-form-schema";

export function SubmitForm() {
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
