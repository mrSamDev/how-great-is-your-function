"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { queryKeys } from "../queries";
import { postComment } from "../serverFns";
import type { Comment } from "../types";

type Props = {
	functionId: string;
	comments: Comment[];
};

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

export function CommentThread({ functionId, comments }: Props) {
	const qc = useQueryClient();
	const [text, setText] = useState("");
	const [name, setName] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim()) return;
		setSubmitting(true);
		try {
			await postComment({
				data: {
					functionId,
					content: text.trim(),
					userName: name.trim() || "Anonymous",
				},
			});
			setText("");
			qc.invalidateQueries({
				queryKey: queryKeys.functionWithRevisions(functionId),
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-slate-700">
				<MessageSquare className="w-4 h-4" />
				<span className="text-sm font-semibold">
					{comments.length} {comments.length === 1 ? "Comment" : "Comments"}
				</span>
			</div>

			{comments.length > 0 && (
				<div className="space-y-3">
					{comments.map((c) => (
						<div key={c.id} className="flex gap-3">
							<div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
								{c.userName[0]?.toUpperCase() ?? "?"}
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm font-medium text-slate-800">
										{c.userName}
									</span>
									<span className="text-xs text-slate-400">
										{timeAgo(c.createdAt)}
									</span>
								</div>
								<p className="text-sm text-slate-600 leading-relaxed">
									{c.content}
								</p>
							</div>
						</div>
					))}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className="space-y-2 pt-2 border-t border-slate-100"
			>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Your name (optional)"
					className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
				/>
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Leave a comment…"
					rows={3}
					className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
				/>
				<button
					type="submit"
					disabled={!text.trim() || submitting}
					className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{submitting ? "Posting…" : "Post Comment"}
				</button>
			</form>
		</div>
	);
}
