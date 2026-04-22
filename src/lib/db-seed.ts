import type { FunctionEntity } from "#/features/function/types";
import { scoreFunction } from "./ast";

type SeedFunction = Omit<FunctionEntity, "id" | "createdAt" | "viewCount" | "upvotes" | "downvotes">;

const seedFunctions: SeedFunction[] = [
	{
		code: `function add(a: number, b: number): number {
  return a + b
}`,
		language: "typescript",
		title: "Simple Add",
		description: "Adds two numbers together",
		tags: ["math", "pure"],
		score: 0,
		breakdown: {
			purity: 30,
			complexity: 25,
			size: 10,
			naming: 15,
			readability: 20,
		},
		aiFeedback: {
			summary:
				"A perfectly pure, simple function. Ideal example of single responsibility and clarity.",
			suggestions: [
				"Consider adding JSDoc for public API documentation",
				"Could generalize to accept any numeric type",
				"No improvements needed for the core logic",
			],
		},
	},
	{
		code: `function processUserData(users: any[], config: any) {
  let result = []
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
      if (users[i].age > 18) {
        if (config.includeEmail) {
          result.push({ name: users[i].name, email: users[i].email, age: users[i].age })
        } else {
          result.push({ name: users[i].name, age: users[i].age })
        }
      }
    }
  }
  console.log('Processed', result.length, 'users')
  return result
}`,
		language: "typescript",
		title: "Process User Data",
		description: "Filters and shapes user records",
		tags: ["data", "array", "users"],
		score: 0,
		breakdown: {
			purity: 20,
			complexity: 10,
			size: 7,
			naming: 10,
			readability: 8,
		},
		aiFeedback: {
			summary:
				"Deep nesting and the console.log side effect hurt this function. Use of `any` loses type safety.",
			suggestions: [
				"Replace nested ifs with early guard clauses or Array.filter().map()",
				"Remove console.log, it's a side effect. Let the caller decide whether to log",
				"Replace `any` with proper TypeScript interfaces",
			],
		},
	},
	{
		code: `const calculateTotal = (items: { price: number; qty: number }[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0)`,
		language: "typescript",
		title: "Calculate Total",
		description: "Computes total price of a shopping cart",
		tags: ["math", "array", "pure", "functional"],
		score: 0,
		breakdown: {
			purity: 30,
			complexity: 24,
			size: 10,
			naming: 14,
			readability: 18,
		},
		aiFeedback: {
			summary:
				"Excellent functional style. Pure, concise, and uses reduce idiomatically. Minor: rounding for currency.",
			suggestions: [
				"Add rounding: `Math.round(sum * 100) / 100` to avoid floating-point drift",
				"Consider returning a Money type instead of raw number for monetary values",
				"Add JSDoc example usage for discoverability",
			],
		},
	},
];

export function seedDatabase(
	createFunction: (seedFunction: SeedFunction) => void,
) {
	for (const seedFunction of seedFunctions) {
		const scoredFunction = scoreFunction(seedFunction.code);
		createFunction({
			...seedFunction,
			score: scoredFunction.score,
			breakdown: scoredFunction.breakdown,
		});
	}
}
