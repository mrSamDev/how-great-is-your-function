import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "how great is your function" },
			{
				name: "description",
				content:
					"Review a TypeScript function with deterministic scoring, AI feedback, and revision tracking.",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function Nav() {
	return (
		<header className="sticky top-0 z-50 px-3 pt-3">
			<div className="comic-panel mx-auto flex h-auto max-w-6xl items-center justify-between gap-3 bg-[#fffaf0]/95 px-4 py-3 backdrop-blur-sm">
				<Link
					to="/"
					className="comic-heading max-w-[16rem] text-[0.8rem] leading-tight text-slate-950 transition-transform hover:-rotate-1"
				>
					how great is your <span className="text-[#ff5d47]">function</span>
				</Link>
				<nav className="flex flex-wrap items-center justify-end gap-2">
					<Link
						to="/"
						className="comic-kicker rounded-full border-3 border-slate-950 bg-white px-3 py-1.5 text-[0.68rem] text-slate-700 transition-transform hover:-translate-y-0.5"
						activeProps={{
							className:
								"comic-kicker rounded-full border-3 border-slate-950 bg-[#ffd84d] px-3 py-1.5 text-[0.68rem] text-slate-950 shadow-[3px_3px_0_#101010]",
						}}
						activeOptions={{ exact: true }}
					>
						Home
					</Link>
					<Link
						to="/search"
						className="comic-kicker rounded-full border-3 border-slate-950 bg-white px-3 py-1.5 text-[0.68rem] text-slate-700 transition-transform hover:-translate-y-0.5"
						activeProps={{
							className:
								"comic-kicker rounded-full border-3 border-slate-950 bg-[#ffd84d] px-3 py-1.5 text-[0.68rem] text-slate-950 shadow-[3px_3px_0_#101010]",
						}}
					>
						Browse
					</Link>
					<Link
						to="/leaderboard"
						className="comic-kicker rounded-full border-3 border-slate-950 bg-white px-3 py-1.5 text-[0.68rem] text-slate-700 transition-transform hover:-translate-y-0.5"
						activeProps={{
							className:
								"comic-kicker rounded-full border-3 border-slate-950 bg-[#ffd84d] px-3 py-1.5 text-[0.68rem] text-slate-950 shadow-[3px_3px_0_#101010]",
						}}
					>
						Leaderboard
					</Link>
					<Link
						to="/submit"
						className="comic-button ml-1 bg-[#ff5d47] px-4 py-2 text-[0.72rem] text-white"
					>
						Review
					</Link>
				</nav>
			</div>
		</header>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="comic-app-shell antialiased">
				<Nav />
				<main className="pb-12">{children}</main>
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
