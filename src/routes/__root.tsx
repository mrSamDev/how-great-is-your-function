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
		<header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
			<div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
				<Link
					to="/"
					className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm"
				>
					how great is your <span className="text-blue-600">function</span>
				</Link>
				<nav className="flex items-center gap-1">
					<Link
						to="/"
						className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
						activeProps={{
							className: "bg-slate-100 text-slate-900 font-medium",
						}}
						activeOptions={{ exact: true }}
					>
						Home
					</Link>
					<Link
						to="/search"
						className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
						activeProps={{
							className: "bg-slate-100 text-slate-900 font-medium",
						}}
					>
						Browse
					</Link>
					<Link
						to="/leaderboard"
						className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
						activeProps={{
							className: "bg-slate-100 text-slate-900 font-medium",
						}}
					>
						Leaderboard
					</Link>
					<Link
						to="/submit"
						className="ml-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
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
			<body className="bg-slate-50 text-slate-900 antialiased">
				<Nav />
				<main>{children}</main>
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
