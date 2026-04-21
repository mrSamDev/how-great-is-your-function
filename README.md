# how great is your function

how great is your function is a TanStack Start app for reviewing TypeScript functions. It combines deterministic heuristics with AI feedback so you can submit a function, inspect its score, and compare revisions.

## What It Does

- Scores functions across purity, complexity, naming, readability, and size
- Generates AI feedback with concrete suggestions
- Stores submissions, revisions, comments, and leaderboard views in an in-memory MVP data layer
- Supports browsing, search, and per-function detail pages

## Tech Stack

- TanStack Start
- TanStack Router
- TanStack Query
- React 19
- Tailwind CSS
- Biome
- Vitest
- Better Auth

## Local Development

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm format
pnpm check
```

## Environment

Environment parsing lives in [src/env.ts](/Users/samdev/Desktop/apps/self/projects/how-great-is-your-function/src/env.ts:1).

Expected variables:

- `SERVER_URL`
- `GROQ_API_KEY`
- `ANTHROPIC_API_KEY`
- `BETTER_AUTH_SECRET`

Create a `.env.local` file for local development.

## Project Structure

- `src/routes`: route files and page shells
- `src/features/function`: function scoring UI, queries, and server functions
- `src/lib`: scoring, AI, auth, and in-memory storage
- `src/integrations`: TanStack Query and Better Auth integration points

## Notes

- The current persistence layer is in-memory. Restarting the app clears submitted data.
- AI critique uses Groq first when `GROQ_API_KEY` is present, then falls back to Anthropic.
- `pnpm test` may fail in restricted sandboxes because the Cloudflare toolchain attempts to bind a local inspector port.
