import type { ReactNode } from "react";

type TokenType =
	| "plain"
	| "keyword"
	| "string"
	| "number"
	| "comment"
	| "function"
	| "type"
	| "operator";

type Token = {
	type: TokenType;
	value: string;
};

const tokenClassNames: Record<TokenType, string> = {
	plain: "text-slate-200",
	keyword: "text-sky-300",
	string: "text-emerald-300",
	number: "text-amber-300",
	comment: "text-slate-500",
	function: "text-cyan-300",
	type: "text-fuchsia-300",
	operator: "text-rose-300",
};

const patterns: Array<{ type: Exclude<TokenType, "plain">; regex: RegExp }> = [
	{ type: "comment", regex: /^\/\/.*/ },
	{ type: "comment", regex: /^\/\*[\s\S]*?\*\// },
	{ type: "string", regex: /^`(?:\\.|[^`])*`/ },
	{ type: "string", regex: /^"(?:\\.|[^"])*"/ },
	{ type: "string", regex: /^'(?:\\.|[^'])*'/ },
	{
		type: "keyword",
		regex:
			/^(?:async|await|break|case|catch|class|const|continue|default|else|export|extends|finally|for|function|if|import|interface|let|new|return|switch|throw|try|type|var|while)\b/,
	},
	{ type: "number", regex: /^(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)/ },
	{
		type: "operator",
		regex: /^(?:=>|===|!==|==|!=|<=|>=|\+\+|--|&&|\|\||[=+\-*/%<>!?:|&])/,
	},
	{
		type: "type",
		regex: /^(?:Array|boolean|number|Promise|Record|string|unknown|void)\b/,
	},
	{ type: "function", regex: /^(?:[A-Za-z_$][\w$]*)(?=\s*\()/ },
];

function tokenizeTypeScript(code: string): Token[] {
	const tokens: Token[] = [];
	let remaining = code;

	while (remaining.length > 0) {
		let matched = false;

		for (const pattern of patterns) {
			const match = remaining.match(pattern.regex);
			if (!match) continue;

			tokens.push({ type: pattern.type, value: match[0] });
			remaining = remaining.slice(match[0].length);
			matched = true;
			break;
		}

		if (matched) continue;

		tokens.push({ type: "plain", value: remaining[0] });
		remaining = remaining.slice(1);
	}

	return tokens;
}

export function renderHighlightedTypeScript(code: string): ReactNode[] {
	let offset = 0;

	return tokenizeTypeScript(code).map((token) => {
		const key = `${token.type}-${offset}`;
		offset += token.value.length;

		return (
			<span key={key} className={tokenClassNames[token.type]}>
				{token.value}
			</span>
		);
	});
}
