"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { queryKeys, userVoteQueryOptions } from "../queries";
import { voteFunction } from "../serverFns";

type Props = {
	functionId: string;
	upvotes: number;
	downvotes: number;
};

export function VoteButtons({ functionId, upvotes, downvotes }: Props) {
	const { data: session } = authClient.useSession();
	const qc = useQueryClient();
	const [counts, setCounts] = useState({ upvotes, downvotes });
	const [pending, setPending] = useState(false);

	const { data: voteData } = useQuery(userVoteQueryOptions(functionId));
	const userVote = voteData?.userVote ?? null;

	async function handleVote(type: "up" | "down") {
		if (!session?.user) {
			void authClient.signIn.social({
				provider: "github",
				callbackURL: window.location.pathname,
			});
			return;
		}
		if (pending) return;
		setPending(true);
		try {
			// Same type = toggle off (null), different = switch
			const nextType = userVote === type ? null : type;
			const result = await voteFunction({
				data: { functionId, voteType: nextType },
			});
			setCounts(result);
			qc.invalidateQueries({ queryKey: queryKeys.userVote(functionId) });
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={() => void handleVote("up")}
				disabled={pending}
				title={session?.user ? "Helpful" : "Sign in to vote"}
				className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
					userVote === "up"
						? "bg-emerald-50 border-emerald-300 text-emerald-700"
						: "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
				}`}
			>
				<ThumbsUp className="w-3.5 h-3.5" />
				<span>{counts.upvotes}</span>
			</button>
			<button
				type="button"
				onClick={() => void handleVote("down")}
				disabled={pending}
				title={session?.user ? "Needs work" : "Sign in to vote"}
				className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
					userVote === "down"
						? "bg-red-50 border-red-300 text-red-600"
						: "bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600"
				}`}
			>
				<ThumbsDown className="w-3.5 h-3.5" />
				<span>{counts.downvotes}</span>
			</button>
		</div>
	);
}
