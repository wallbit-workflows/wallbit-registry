# wallbit-registry — web

Next.js frontend for the [wallbit-registry](../README.md) monorepo: browse workflows, view YAML, publish from the browser, and use **Workflow Studio** (Cursor-backed YAML generation).

For API endpoints, database setup, Railway deploy, and CLI integration, use the **[root README](../README.md)**. This file only covers the `web/` package.

## Scripts

```bash
bun install
bun run dev      # http://localhost:3000
bun run build
bun run start
bun run lint
```

Requires the registry API running locally (or a deployed URL) and env vars below.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_REGISTRY_URL` | Yes | Registry API base URL (no trailing slash), e.g. `http://localhost:8080` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret (server routes + middleware) |
| `CURSOR_API_KEY` | Studio | Cursor Cloud Agents API key (server-only) |
| `CURSOR_WORKFLOW_USE_API` | No | Set `1` to force REST API locally (Vercel uses it automatically) |
| `STUDIO_RATE_LIMIT_MAX` | No | Default `3` |
| `STUDIO_RATE_LIMIT_WINDOW` | No | Default `1 h` |
| `UPSTASH_REDIS_REST_URL` | Prod Studio | Rate limit across Vercel instances |
| `UPSTASH_REDIS_REST_TOKEN` | Prod Studio | Pair with Upstash URL |

**Clerk dashboard:** enable Email and OAuth providers you need; add `http://localhost:3000` and production origin under **Paths**. Registry username is **not** the Clerk username — users set it once under `/account`.

Do **not** set `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` to nested redirect chains; the app uses modal sign-in and dedicated `/sign-in` routes for OAuth completion.

## App routes

| Route | Description |
|-------|-------------|
| `/` | Workflow catalog (SSR, cached list from API) |
| `/workflows/[username]/[slug]` | Detail, YAML preview, `wallbit workflow pull …` command |
| `/studio` | AI workflow editor (sign-in + rate limit) |
| `/account` | Registry username, API keys for CLI |
| `/sign-in`, `/sign-up` | Clerk hosted UI + SSO callbacks |

## API routes

These proxy to the Go API with the user’s Clerk session (not public).

| Route | Purpose |
|-------|---------|
| `POST /api/workflows/publish` | Publish YAML (may `PATCH /me` for username first) |
| `GET/PATCH /api/registry/me` | Profile |
| `GET/POST /api/registry/api-keys` | API keys |
| `DELETE /api/registry/api-keys/[id]` | Revoke key |
| `POST /api/workflow-studio` | Streaming Studio (Cursor agent) |

Public pages call the registry API directly from server components via `lib/api.ts` (`NEXT_PUBLIC_REGISTRY_URL`).

## Project structure (high level)

```
web/
├── app/                 # App Router pages and route handlers
├── components/          # UI (catalog, detail, studio, publish, account)
├── lib/                 # API client, Clerk helpers, Cursor agent, skill prompt
└── middleware.ts        # Clerk; most routes public, studio publish paths open
```

## Deploy on Vercel

1. Import repo with **Root Directory** = `web`.
2. Set environment variables from `.env.example`.
3. Point `NEXT_PUBLIC_REGISTRY_URL` at the Railway API.
4. Add `CURSOR_API_KEY` and Upstash for production Studio limits.

Build command: `bun run build` (or default Next.js build if using npm).

## Local full stack

Terminal 1 (repo root): `make migrate-up && go run ./cmd/api`  
Terminal 2 (`web/`): `bun run dev`

Then open `/account` after sign-in, set username, and publish or open `/studio`.
