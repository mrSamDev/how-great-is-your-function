"use client";

type Props = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minRows?: number;
	error?: string;
};

// Simple textarea-based editor for MVP.
// Upgrade path: swap for Monaco Editor (@monaco-editor/react) or CodeMirror 6 (@uiw/react-codemirror).
export function CodeEditor({
	id,
	value,
	onChange,
	placeholder,
	minRows = 12,
	error,
}: Props) {
	return (
		<div className="relative">
			<div className="absolute top-3 right-3 text-xs text-slate-400 font-mono pointer-events-none select-none">
				TypeScript
			</div>
			<textarea
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder ?? "Paste your TypeScript function here…"}
				rows={minRows}
				spellCheck={false}
				autoCorrect="off"
				autoCapitalize="off"
				className={`
          w-full resize-y rounded-xl border bg-slate-950 text-slate-100
          font-mono text-sm leading-relaxed p-4 pr-24
          placeholder:text-slate-600
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50
          transition-colors
          ${error ? "border-red-500/50" : "border-slate-700"}
        `}
			/>
			{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
			{value && (
				<div className="absolute bottom-3 right-3 text-xs text-slate-600 font-mono pointer-events-none select-none">
					{value.split("\n").length}L
				</div>
			)}
		</div>
	);
}
