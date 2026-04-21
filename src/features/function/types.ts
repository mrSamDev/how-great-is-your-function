export type Language = "typescript";

export type ScoreBreakdown = {
	purity: number; // 0-30
	complexity: number; // 0-25
	size: number; // 0-10
	naming: number; // 0-15
	readability: number; // 0-20
};

export type AiFeedback = {
	summary: string;
	suggestions: string[];
};

export type FunctionEntity = {
	id: string;
	code: string;
	language: Language;
	title: string;
	description?: string;
	tags: string[];
	score: number;
	breakdown: ScoreBreakdown;
	aiFeedback: AiFeedback;
	createdAt: string;
	authorId?: string;
	viewCount: number;
};

export type User = {
	id: string;
	name: string;
	email: string;
	reputation: number;
	createdAt: string;
};

export type Comment = {
	id: string;
	functionId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: string;
};

export type Revision = {
	id: string;
	parentFunctionId: string;
	authorId?: string;
	authorName?: string;
	improvedCode: string;
	title: string;
	score: number;
	breakdown: ScoreBreakdown;
	aiFeedback: AiFeedback;
	scoreDelta: number;
	createdAt: string;
};

export type FunctionWithRevisions = FunctionEntity & {
	revisions: Revision[];
	comments: Comment[];
};

export type SubmitFunctionInput = {
	code: string;
	language: Language;
	title: string;
	description?: string;
	tags: string[];
};

export type SortOrder = "score" | "recent" | "views";
