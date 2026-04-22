# How Great Is Your Function — Action Tracker

## Status Legend
- ✅ Done
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked

---

## Phase 1 — MVP

### Foundation
- ✅ Project scaffolded (TanStack Start + Cloudflare + Tailwind v4 + better-auth)
- ✅ Folder structure: `src/features/function`, `src/features/editor`, `src/features/review`
- ✅ Core types: `FunctionEntity`, `Comment`, `Revision`, `User` (→ `src/features/function/types.ts`)
- ✅ In-memory store (→ `src/lib/db.ts`) — **Note: swap for Cloudflare D1 in Phase 2**
- ✅ Env vars: added `ANTHROPIC_API_KEY` to `src/env.ts`

### Analysis Engine
- ✅ AST/heuristic scoring engine (→ `src/lib/ast.ts`)
  - Purity (0–30): side effects, mutations, globals
  - Complexity (0–25): cyclomatic complexity, nesting depth
  - Size (0–10): line count
  - Naming (0–15): camelCase, descriptive names, single-letter avoidance
  - Readability (0–20): line length, early returns, structure
- ✅ AI critique layer (→ `src/lib/ai.ts`)
  - Uses Anthropic API (`claude-sonnet-4-6`)
  - In-memory response cache (same input → same output)
  - Graceful fallback if API key missing

### Server Functions
- ✅ `analyzeFunction` — run scoring + AI critique + persist
- ✅ `getFunction` — fetch by ID
- ✅ `listFunctions` — paginated listing, sort by score
- ✅ `searchFunctions` — filter by tag/query
- ✅ `submitRevision` — save improved code, compute score delta
- ✅ `postComment` — attach comment to function
- ✅ `getFunctionWithRevisions` — function + full revision history

### Routes & UI
- ✅ `/` — Homepage: recent + top functions, hero, score explainer
- ✅ `/submit` — Submit form (TanStack Form): code + title + description + tags
- ✅ `/function/$functionId` — Function detail: score breakdown, AI feedback, revisions, comments
- ✅ `/search` — Filter by tag/query, sort by score
- ✅ `/leaderboard` — Top functions with medals
- ⏳ `/function/$functionId/revisions` — Revision history + diff view (Phase 3)
- ⏳ `/profile/$userId` — User profile (Phase 4)

### Root & Nav
- ✅ Sticky nav: `fnScore` logo, Home, Browse, Leaderboard, Analyze CTA
- ✅ Page title: "How Great Is Your Function?"
- ✅ Active link highlighting

### Query Keys
- ✅ Defined once in `src/features/function/queries.ts`
- ✅ TanStack Query wrappers for all server functions

### Code Quality
- ✅ Biome lint pass — zero errors across all new files
- ✅ Import sorting auto-fixed
- ✅ Button types, label-control associations, non-null assertions all fixed

---

## Phase 2 — Interaction (Done)

- ✅ Persistent storage: migrate in-memory → Cloudflare D1
  - Schema in `migrations/0001_initial.sql`
  - D1 binding `DB` added to `wrangler.jsonc` (run `wrangler d1 create how-great-is-your-function` then paste the database_id)
  - D1 adapter in `src/lib/db-d1.ts`
  - `src/lib/db.ts` exports `getDb()` — uses D1 in CF context, in-memory fallback for local dev
- ✅ Auth flow: GitHub OAuth via better-auth
  - GitHub sign-in button in nav (`header-user.tsx`)
  - `/submit` gated — unauthenticated users see sign-in prompt
  - Comments gated — uses session identity, sign-in prompt for guests
- ✅ Structured upvote/downvote
  - `Vote` type + `upvotes`/`downvotes` on `FunctionEntity`
  - `voteFunction` + `getUserVote` server functions (session-validated)
  - `VoteButtons` component — toggle behavior, green/red active state, sign-in redirect for guests
  - Wired into `/function/$functionId` detail page
- ✅ Basic search improvements
  - 300ms debounce on search input
  - Sort state synced to URL params (shareable/bookmarkable)

---

## Phase 3 — Refactor Engine

- ⏳ "Improve this function" — AI rewrite via server function
- ⏳ Diff viewer (before/after)
- ⏳ Score delta display
- ⏳ `/function/$functionId/revisions` route

---

## Phase 4 — Reputation

- ⏳ User profiles (`/profile/$userId`)
- ⏳ Contribution score
- ⏳ Badges

---

## Phase 5 — Expansion

- ⏳ Multi-language support (Python, Go, Rust)
- ⏳ GitHub Gist integration
- ⏳ CI integration (`fail if score < threshold`)
- ⏳ VS Code extension
- ⏳ Full-text search (Postgres `tsvector` or Meilisearch)

---

## Config / Ops Notes

- **ANTHROPIC_API_KEY**: Set as env var in `.env` for dev, `wrangler secret put ANTHROPIC_API_KEY` for Cloudflare prod
- **GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET**: Required for GitHub OAuth — create an OAuth App at github.com/settings/developers, callback URL: `http://localhost:3000/api/auth/callback/github`
- **D1 Database**: Schema ready in `migrations/0001_initial.sql`. To activate:
  1. `wrangler d1 create how-great-is-your-function` → paste returned `database_id` into `wrangler.jsonc`
  2. `wrangler d1 migrations apply how-great-is-your-function --local` (dev)
  3. `wrangler d1 migrations apply how-great-is-your-function` (prod)
  - Local dev without wrangler falls back to in-memory store automatically
- **Deployment**: `pnpm run deploy` → Cloudflare Workers via wrangler

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Cloudflare D1 with in-memory fallback | D1 for prod persistence; in-memory lets `vite dev` work without wrangler |
| Heuristic scoring (no AST parser) | Cloudflare Workers compat; acorn/TS compiler don't work in Workers |
| Fetch-based Anthropic API call | No extra SDK dep; works natively in Workers |
| Textarea for code editor | Monaco not installed; upgrade path exists |
| TypeScript-only for MVP | Simplest scope; multi-lang in Phase 5 |
| Denormalized upvote/downvote counts | Faster reads; votes table tracks per-user for dedup and toggle |
