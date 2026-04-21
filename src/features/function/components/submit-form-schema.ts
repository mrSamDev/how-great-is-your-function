import { z } from "zod";

export const submitFunctionSchema = z.object({
	code: z.string().min(10, "Paste at least a few lines of code"),
	title: z.string().min(1, "Give your function a name").max(200),
	description: z.string().max(1000).optional(),
	tags: z.string(),
});

export function parseTags(rawTags: string): string[] {
	return rawTags
		.split(",")
		.map((tag) => tag.trim().toLowerCase())
		.filter((tag) => tag.length > 0)
		.slice(0, 10);
}
