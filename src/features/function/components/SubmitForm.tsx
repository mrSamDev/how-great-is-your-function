"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CodeEditor } from "#/features/editor/components/CodeEditor";
import { analyzeFunction } from "../serverFns";

const schema = z.object({
	code: z.string().min(10, "Paste at least a few lines of code"),
	title: z.string().min(1, "Give your function a name").max(200),
	description: z.string().max(1000).optional(),
	tags: z.string(),
});

function parseTags(raw: string): string[] {
	return raw
		.split(",")
		.map((t) => t.trim().toLowerCase())
		.filter((t) => t.length > 0)
		.slice(0, 10);
}

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
			className="space-y-6"
		>
			{/* Code */}
			<form.Field
				name="code"
				validators={{
					onChange: ({ value }) =>
						schema.shape.code.safeParse(value).error?.issues[0]?.message,
				}}
			>
				{(field) => (
					<div>
						<label
							htmlFor="code-editor"
							className="block text-sm font-medium text-slate-700 mb-1.5"
						>
							Function Code <span className="text-red-400">*</span>
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

			{/* Title */}
			<form.Field
				name="title"
				validators={{
					onChange: ({ value }) =>
						schema.shape.title.safeParse(value).error?.issues[0]?.message,
				}}
			>
				{(field) => (
					<div>
						<label
							htmlFor="title"
							className="block text-sm font-medium text-slate-700 mb-1.5"
						>
							Title <span className="text-red-400">*</span>
						</label>
						<input
							id="title"
							type="text"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. Calculate Discount Price"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
						/>
						{field.state.meta.errors[0] && (
							<p className="mt-1 text-xs text-red-500">
								{field.state.meta.errors[0]}
							</p>
						)}
					</div>
				)}
			</form.Field>

			{/* Description */}
			<form.Field name="description">
				{(field) => (
					<div>
						<label
							htmlFor="description"
							className="block text-sm font-medium text-slate-700 mb-1.5"
						>
							Description{" "}
							<span className="text-slate-400 font-normal">(optional)</span>
						</label>
						<textarea
							id="description"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="What does this function do? Why does it exist?"
							rows={3}
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
						/>
					</div>
				)}
			</form.Field>

			{/* Tags */}
			<form.Field name="tags">
				{(field) => (
					<div>
						<label
							htmlFor="tags"
							className="block text-sm font-medium text-slate-700 mb-1.5"
						>
							Tags{" "}
							<span className="text-slate-400 font-normal">
								(comma-separated)
							</span>
						</label>
						<input
							id="tags"
							type="text"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="e.g. array, recursion, auth, performance"
							className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
						/>
						{field.state.value && (
							<div className="flex gap-1.5 flex-wrap mt-2">
								{parseTags(field.state.value).map((tag) => (
									<span
										key={tag}
										className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs"
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
				<p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
					{serverError}
				</p>
			)}

			<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
				{([canSubmit, isSubmitting]) => (
					<button
						type="submit"
						disabled={!canSubmit || isSubmitting}
						className="w-full py-3 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
					>
						{isSubmitting ? (
							<>
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Analyzing…
							</>
						) : (
							"Analyze Function"
						)}
					</button>
				)}
			</form.Subscribe>
		</form>
	);
}
