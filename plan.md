# Function Review Platform

## Vision

Build a platform that gives developers **fast, structured feedback on functions** using:
- Deterministic code analysis
- AI-powered critique
- Community-driven improvements

> "A lightweight, interactive code review tool for function quality."
> "Lint + Code Review + Playground in one."

---

## Core Principles

1. **Clarity over magic** — Every score must be explainable
2. **Signal over noise** — Avoid Reddit-style voting without structure
3. **Learning over validation** — Feedback should teach, not just judge
4. **Consistency matters** — Same input → same output (cache + deterministic rules)

---

## MVP Scope

### Input
- Paste a single function
- Select language (start with TypeScript)
- Add a **title** (short, human-readable name for the function)
- Add a **description** (optional context — what it does, why it exists)
- Add **tags** (e.g. `array`, `recursion`, `auth`, `performance`) — free-form, comma-separated

### Output
- Structured score with breakdown
- AI-generated critique
- Suggested improvements

### Interaction
- Comment on functions
- Submit improved versions

---

## Authentication

**Provider:** Better Auth with GitHub OAuth

GitHub is the primary sign-in method. Developers already have GitHub accounts, and GitHub identity gives us profile images and usernames without any extra friction.

### Setup

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Create an OAuth App at github.com/settings/developers. Set the callback URL to `http://localhost:3000/api/auth/callback/github` (dev) and your production domain for prod.

### Implementation

| File | Responsibility |
|---|---|
| `src/lib/auth.ts` | Better Auth config — GitHub social provider + email/password |
| `src/lib/auth-client.ts` | Client-side auth hooks |
| `src/integrations/better-auth/header-user.tsx` | Sign in / signed-in state UI |

### Auth Flow

- Unauthenticated users see **Sign in with GitHub** button in the header
- OAuth callback redirects to `/` on success
- Session exposed via `authClient.useSession()` across all routes
- Signed-in users see their GitHub avatar + sign-out button

### What Requires Auth (Phase 2+)

| Action | Auth required |
|---|---|
| View functions | No |
| Submit function | Yes |
| Comment | Yes |
| Submit revision | Yes |
| View leaderboard | No |

---

## Tech Stack

> This project is intentionally built to deeply learn and understand TanStack Start. No external API server. No Express. No separate backend process. Everything runs through TanStack Start's server functions and RSC primitives.

### Full-Stack Framework — TanStack Start

- **TanStack Start** — full-stack framework, owns routing, SSR, server functions, and RSC
- **TanStack Router** — file-based routing, type-safe params, route loaders with colocated data
- **TanStack Query** — server state, caching, mutations (wired directly to server functions)
- **TanStack Form** — form state + validation for submit, revision, and search
- **TanStack Table** — function listings, leaderboard (Phase 4+)
- **TanStack Virtual** — long feeds (optional, later)
- **TanStack RSC** — server components for static/read-heavy views
- Code editor: Monaco or CodeMirror

### Server Functions (the entire "API")

All data operations are TanStack Start `createServerFn()` calls — typed, colocated, no HTTP boilerplate.

```ts
// No REST endpoint. Just a typed function that runs on the server.
const analyzeFunction = createServerFn()
  .input(z.object({
    code: z.string(),
    language: z.string(),
    title: z.string(),
    tags: z.array(z.string()),
    description: z.string().optional(),
  }))
  .handler(async ({ input }) => {
    const score = runASTAnalysis(input.code)
    const ai = await runAICritique(input.code)
    await db.function.create({ data: { ...input, score, ai } })
    return { score, ai }
  })
```

**Server functions in this project:**

| Function | Responsibility |
|---|---|
| `analyzeFunction` | Run AST scoring + AI critique, persist result |
| `getFunction` | Fetch function by id |
| `listFunctions` | Paginated listing, sort by score |
| `searchFunctions` | Filter by tag/query, sort by score |
| `submitRevision` | Save improved code, compute score delta |
| `postComment` | Attach comment to a function |
| `getFunctionWithRevisions` | Fetch function + full revision history |
| `voteFunction` | Cast/toggle up or down vote (session-validated) |
| `getUserVote` | Return the current user's vote for a function |

### RSC Usage (TanStack RSC)

Server components own the read-heavy, non-interactive shell. Client components handle interaction.

| RSC (server) | Client Component |
|---|---|
| Function detail — score, breakdown, AI feedback | Code editor |
| Leaderboard | Submit form (TanStack Form) |
| Tag browse / search results | Comment thread |
| User profile stats | Diff viewer |

### Storage
- **Cloudflare D1** (SQLite at the edge) — schema in `migrations/0001_initial.sql`
- `src/lib/db.ts` exports `getDb()`: uses D1 adapter in Cloudflare context, in-memory fallback for local dev without wrangler
- In-memory cache for AI responses — same input always returns same output, no re-runs

---

## Architecture

### Routing Structure

```
/
├── /submit
├── /function/$functionId
├── /function/$functionId/revisions
├── /search?q=&tags=
├── /leaderboard
└── /profile/$userId
```

Route loaders call server functions directly. Data and UI are fully colocated.

### Data Flow

**Submit flow:**
```
User fills form (TanStack Form)
→ calls analyzeFunction() server function
→ server: AST analysis + AI critique + DB write
→ TanStack Query caches result
→ UI updates instantly via optimistic state
```

**State separation (critical — don't mix these):**

| Layer | Tool | What lives here |
|---|---|---|
| Server state | TanStack Query | Functions, scores, AI feedback, comments |
| Client state | Local state | Editor content, UI toggles, draft edits |

### Query Key Strategy

```ts
queryKeys = {
  function: (id: string) => ['function', id],
  revisions: (id: string) => ['function', id, 'revisions'],
  list: (page: number) => ['functions', page],
  leaderboard: () => ['leaderboard'],
  search: (query: string, tags: string[]) => ['search', query, tags],
}
```

---

## Core Data Model

### FunctionEntity (core abstraction)

```ts
type FunctionEntity = {
  id: string
  code: string
  language: 'ts'
  title: string           // user-provided, required
  description?: string    // user-provided, optional
  tags: string[]          // e.g. ['recursion', 'auth', 'performance']
  score: number
  breakdown: {
    purity: number       // 0–30
    complexity: number   // 0–25
    size: number         // 0–10
    naming: number       // 0–15
    readability: number  // 0–20
  }
  aiFeedback: {
    summary: string
    suggestions: string[]
  }
  createdAt: string
}
```

Everything revolves around this type.

### Supporting Models

**User** — `id`, `name`, `reputation`

**Comment** — `id`, `functionId`, `userId`, `content`

**Revision** — `id`, `parentFunctionId`, `improvedCode`, `scoreDelta`

---

## Scoring System (Total: 100)

### 1. Purity (0–30)
- No external mutation
- No hidden side effects
- Deterministic output

### 2. Complexity (0–25)
- Cyclomatic complexity
- Nesting depth
- Branching

### 3. Size (0–10)
- Lines of code
- Function length

### 4. Naming (0–15)
- Function name clarity
- Variable naming

### 5. Readability (0–20)
- Structure
- Consistency
- Simplicity

---

## Deterministic Analysis Engine

**Implemented via AST parsing (TypeScript compiler or Babel). Runs inside server functions — no separate service.**

Rules:
- Count parameters
- Detect mutation patterns
- Measure nesting depth
- Identify loops / branches
- Line count

---

## AI Layer

### Responsibilities
- Evaluate naming clarity, abstraction level, single responsibility, readability
- Produce a short critique + actionable suggestions
- Optional score adjustment

### Prompt Template

```
You are a senior engineer reviewing a function.

Evaluate:
- Single responsibility
- Side effects
- Naming clarity
- Testability
- Readability

Return:
1. Short critique (max 100 words)
2. 3 specific improvements
3. Score out of 100 with justification
```

### Constraints
- Runs inside `analyzeFunction` server function — no external API route needed
- Cache responses in-memory (same code input → same output, skip re-run)
- Keep responses concise
- Avoid hallucination

---

## Key Feature Flows

### View Function
- Route loader calls `getFunction()` server function
- TanStack Query caches result
- RSC renders static shell (score, breakdown, feedback)
- Client components hydrate for interaction (comments, revisions)

### Submit Function
- TanStack Form handles input + validation client-side
- On submit: calls `analyzeFunction()` server function
- Server runs AST + AI, writes to DB, returns result
- TanStack Query invalidates list cache

### Submit Revision
- Calls `submitRevision()` server function
- Optimistic UI shows improved version immediately
- Re-fetches score, displays delta

### Refactor Comparison (killer feature)
```
Original  |  Improved
Score: 62 → 84
```
- Separate query keys: `function(id)` vs `function-revisions(id)`
- Diff viewer (Phase 3)

---

## Folder Structure

```
/src
  /routes
    index.tsx
    submit.tsx
    function.$functionId.tsx
    function.$functionId.revisions.tsx
    search.tsx
    leaderboard.tsx
    profile.$userId.tsx
  /features
    /function
      - serverFns.ts      ← all createServerFn() calls live here
      - queries.ts        ← TanStack Query wrappers
      - components/
      - utils/
    /editor
    /review
  /lib
    - db.ts
    - queryClient.ts
    - ast.ts
    - ai.ts
```

Server functions live colocated with the feature, not in a separate backend folder. This is the TanStack Start way.

---

## Feature Roadmap

### Phase 1 — MVP ✅
- Paste function + select language
- Add title, description, tags on submit
- Deterministic scoring via server function
- AI critique via server function
- Score breakdown UI

### Phase 2 — Interaction ✅
- Comments (server function + client component)
- Structured upvote/downvote — toggle behavior, session-validated, separate up/down counts
- Versioning (improved function submissions)
- Basic search — filter by tag, sort by score, 300ms debounce, sort state in URL

### Phase 3 — Refactor Engine
- "Improve this function" (AI rewrite via server function)
- Diff viewer
- Score delta display
- `/function/$functionId/revisions` route

### Phase 4 — Reputation System
- User profiles (`/profile/$userId`)
- Contribution score
- Badges ("Refactor Expert", etc.)

### Phase 5 — Expansion
- Multi-language support
- GitHub integration
- Team / private reviews
- VS Code extension
- CI integration ("fail if function quality < threshold")
- Company-level dashboards
- Full-text search (Postgres `tsvector` or Meilisearch)

---

## Execution — Next Steps

1. Scaffold TanStack Start project
2. Build `analyzeFunction` server function (AST + AI wired together)
3. Implement AST scoring rules
4. Wire AI critique call inside server function
5. Design submit form with TanStack Form (code + title + description + tags)
6. Build score breakdown UI as RSC
7. Define query keys + TanStack Query wrappers
8. Add `searchFunctions` server function + tag filtering UI
9. Add `submitRevision` server function + diff view

---

## Key Risks

| Risk | Mitigation |
|---|---|
| Inconsistent AI output | In-memory cache + strict prompts |
| Low trust in scores | Transparent breakdown |
| Low engagement | Refactor + improvement loop |
| Too subjective | Strong deterministic base |
| TanStack Start immaturity | Pin versions, read changelogs — this is intentional learning territory |

---

## Success Metrics

- % of users who submit improved versions
- Avg. time spent per function
- Repeat usage rate
- Functions shared externally

---


## Differentiation

This is **not**:
- A code playground
- A generic AI tool
- A voting-based community

This **is**:
> A fast, structured, explainable code review system for functions — built entirely on TanStack Start server functions and RSC, with zero external API layer.

---

## Final Thought

This only works if:
- Scores are **consistent**
- Feedback is **useful**
- Improvements are **visible**

And the architecture works if:
- Server functions stay **colocated** with features
- RSC and client components have **clear boundaries**
- Query keys are **defined once** and never duplicated

If it feels like a toy, it dies. If it feels like a tool, it sticks.