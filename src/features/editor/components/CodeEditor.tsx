"use client";

import { useRef } from "react";
import { renderHighlightedTypeScript } from "./typescript-highlight";

type Props = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minRows?: number;
	error?: string;
};

export function CodeEditor({
	id,
	value,
	onChange,
	placeholder,
	minRows = 12,
	error,
}: Props) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const overlayRef = useRef<HTMLPreElement | null>(null);
	const lineCount = Math.max(minRows, value.split("\n").length);
	const lineNumbers = Array.from(
		{ length: lineCount },
		(_, index) => index + 1,
	);
	const hasValue = value.length > 0;

	function syncScroll() {
		if (!textareaRef.current || !overlayRef.current) return;

		overlayRef.current.scrollTop = textareaRef.current.scrollTop;
		overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== "Tab") return;

		event.preventDefault();
		const textarea = event.currentTarget;
		const { selectionStart, selectionEnd } = textarea;
		const nextValue = `${value.slice(0, selectionStart)}\t${value.slice(selectionEnd)}`;

		onChange(nextValue);

		requestAnimationFrame(() => {
			if (!textareaRef.current) return;
			textareaRef.current.selectionStart = selectionStart + 1;
			textareaRef.current.selectionEnd = selectionStart + 1;
		});
	}

	return (
		<div className="space-y-2">
			<div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120] shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)]">
				<div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2">
					<div className="flex items-center gap-2">
						<span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
						<span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
						<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
					</div>
					<div className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
						TypeScript
					</div>
					<div className="text-xs font-mono text-slate-500">{lineCount}L</div>
				</div>
				<div className="grid grid-cols-[auto_1fr]">
					<div className="select-none border-r border-slate-800 bg-slate-950/60 px-3 py-4 text-right text-xs leading-6 text-slate-500">
						{lineNumbers.map((lineNumber) => (
							<div key={lineNumber}>{lineNumber}</div>
						))}
					</div>
					<div className="relative min-w-0">
						<pre
							ref={overlayRef}
							aria-hidden="true"
							className="pointer-events-none min-h-full overflow-hidden px-4 py-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words"
						>
							<code>
								{hasValue ? (
									renderHighlightedTypeScript(value)
								) : (
									<span className="text-slate-500">
										{placeholder ?? "Paste your TypeScript function here…"}
									</span>
								)}
								{hasValue ? null : "\n"}
							</code>
						</pre>
						<textarea
							ref={textareaRef}
							id={id}
							value={value}
							onChange={(event) => onChange(event.target.value)}
							onScroll={syncScroll}
							onKeyDown={handleKeyDown}
							placeholder={
								placeholder ?? "Paste your TypeScript function here…"
							}
							rows={lineCount}
							spellCheck={false}
							autoCorrect="off"
							autoCapitalize="off"
							className={`
								absolute inset-0 w-full resize-y overflow-auto bg-transparent px-4 py-4
								font-mono text-sm leading-6 text-transparent caret-slate-100
								selection:bg-blue-500/30 focus:outline-none
								${error ? "ring-1 ring-inset ring-red-500/50" : ""}
							`}
						/>
					</div>
				</div>
			</div>
			{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
		</div>
	);
}
