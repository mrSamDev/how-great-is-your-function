"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
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
	const { data: session } = authClient.useSession();
	const qc = useQueryClient();
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!text.trim() || !session?.user) return;
		setSubmitting(true);
		try {
			await postComment({
				data: {
					functionId,
					content: text.trim(),
					userName: session.user.name ?? session.user.email ?? "Anonymous",
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
							<div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
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

			{session?.user ? (
				<form
					onSubmit={handleSubmit}
					className="space-y-2 pt-2 border-t border-slate-100"
				>
					<div className="flex items-center gap-2 text-sm text-slate-500">
						{session.user.image ? (
							<img
								src={session.user.image}
								alt=""
								className="w-6 h-6 rounded-full"
							/>
						) : (
							<div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
								{session.user.name?.charAt(0).toUpperCase() ?? "U"}
							</div>
						)}
						<span>Commenting as {session.user.name ?? session.user.email}</span>
					</div>
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
			) : (
				<div className="pt-2 border-t border-slate-100">
					<button
						type="button"
						onClick={() =>
							void authClient.signIn.social({
								provider: "github",
								callbackURL: window.location.pathname,
							})
						}
						className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
					>
						Sign in with GitHub to leave a comment →
					</button>
				</div>
			)}
		</div>
	);
}
