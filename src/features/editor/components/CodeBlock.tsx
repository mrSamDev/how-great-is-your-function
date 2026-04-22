"use client";

import { renderHighlightedTypeScript } from "./typescript-highlight";

type Props = {
	code: string;
	languageLabel?: string;
	className?: string;
	showLineNumbers?: boolean;
	showHeader?: boolean;
};

export function CodeBlock({
	code,
	languageLabel = "TypeScript",
	className,
	showLineNumbers = true,
	showHeader = true,
}: Props) {
	const lines = code.split("\n");
	let lineOffset = 0;

	return (
		<section
			className={
				className ??
				"overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120]"
			}
		>
			{showHeader && (
				<div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2.5">
					<span className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
						{languageLabel}
					</span>
					<span className="text-xs font-mono text-slate-500">
						{lines.length}L
					</span>
				</div>
			)}
			<div className="grid grid-cols-[auto_1fr]">
				{showLineNumbers ? (
					<div className="select-none border-r border-slate-800 bg-slate-950/60 px-3 py-4 text-right text-xs leading-6 text-slate-500">
						{lines.map((line, index) => {
							const key = `${lineOffset}-${line.length}`;
							lineOffset += line.length + 1;

							return <div key={key}>{index + 1}</div>;
						})}
					</div>
				) : null}
				<pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-6 whitespace-pre">
					<code>{renderHighlightedTypeScript(code)}</code>
				</pre>
			</div>
		</section>
	);
}
