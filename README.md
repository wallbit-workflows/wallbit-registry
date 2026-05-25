# wallbit-registry

Public registry for [wallbit-cli](https://github.com/wallbit-workflows/wallbit-cli) workflow YAML files. Browse and download workflows without signing in; publish immutable semver versions with a registry API key or via the web app (Clerk).

| Layer | Stack | Hosting |
|-------|--------|---------|
| API | Go 1.25, `net/http`, pgx, sqlc, Goose | [Railway](https://railway.app) |
| Database | PostgreSQL | [Neon](https://neon.tech) |
| Web | Next.js 16, Clerk, Cursor Cloud Agents | [Vercel](https://vercel.com) |

**Live app (example):** configure your own deployment — web on Vercel, API on Railway, `NEXT_PUBLIC_REGISTRY_URL` pointing at the API.

## Features

- **Public reads** — list workflows, metadata, and raw YAML downloads.
- **Authenticated writes** — `POST /workflows` with Bearer token (registry API key `wb_reg_…` or Clerk session JWT from the web).
- **Immutable versions** — republishing the same `(author, slug, semver)` returns `409 Conflict`.
- **Account** — registry username for URLs `/{username}/{slug}`, API key create/list/revoke.
- **Web UI** — home catalog, workflow detail with install command, publish dialog, Workflow Studio (AI YAML via Cursor + [wallbit-workflow-builder](https://github.com/jeremyjsx/skills) skill rules).

CLI commands expected by the UI (implemented in **wallbit-cli**, separate repo):

```bash
wallbit workflow publish ./my-workflow.yaml
wallbit workflow pull author/slug@1.0.0 -o my-workflow.yaml
```

## Repository layout

Monorepo with two deployable apps. Large projects use the same pattern: **one root README** (product + API + ops) and **package READMEs** only for what differs locally.

```
wallbit-registry/
├── cmd/api/              # Registry HTTP API entrypoint
├── internal/             # Go packages (auth, workflows, account, store, …)
├── db/queries/           # sqlc SQL
├── migrations/           # Goose migrations
├── web/                  # Next.js frontend → see [web/README.md](./web/README.md)
├── Makefile              # migrate-up / migrate-down
└── sqlc.yaml
```

## Quick start (local)

### Prerequisites

- Go 1.25+
- [Goose](https://github.com/pressly/goose) (`go install github.com/pressly/goose/v3/cmd/goose@latest`)
- PostgreSQL (Neon connection string or local Postgres)
- [Bun](https://bun.sh) or Node 20+ for `web/`

### 1. Database and API

```bash
cp .env.example .env
# Edit DATABASE_URL (Neon pooled URL, sslmode=require) and CLERK_SECRET_KEY

make migrate-up   # requires DATABASE_URL in the environment

go run ./cmd/api
# Listens on :8080 — GET http://localhost:8080/health
```

### 2. Web

```bash
cd web
cp .env.example .env.local
# Set NEXT_PUBLIC_REGISTRY_URL=http://localhost:8080 and Clerk keys

bun install
bun run dev
# http://localhost:3000
```

Sign in → **Account** → set registry username → create API key (for CLI) → publish from **Studio** or upload YAML.

## Environment variables

### API (`.env` at repo root)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `8080`) |
| `DATABASE_URL` | Yes | Postgres connection string (use Neon **pooled** URL) |
| `CLERK_SECRET_KEY` | Yes* | Verifies Clerk JWTs on protected routes |

\*Required for web-originated JWT auth; registry API keys work without Clerk if you only use the CLI.

### Web (`web/.env.local`)

See [web/README.md](./web/README.md) and `web/.env.example` for Clerk, `NEXT_PUBLIC_REGISTRY_URL`, `CURSOR_API_KEY`, and optional Upstash rate limits for Workflow Studio.

## HTTP API

Base URL: your Railway host or `http://localhost:8080`. No `/v1` prefix.

### Health

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/health` | No |
| `GET` | `/ready` | No (DB ping) |

### Workflows (public read)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/workflows?limit=&offset=` | List published workflows (`limit` max 50) |
| `GET` | `/workflows/{username}/{slug}` | Metadata + latest version |
| `GET` | `/workflows/{username}/{slug}/download` | Latest YAML (`Content-Type: application/x-yaml`) |
| `GET` | `/workflows/{username}/{slug}/versions/{version}/download` | Specific version YAML |

### Workflows (publish)

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/workflows` | Bearer | `{ "slug", "version", "content", "description?" }` |

- User must have a **registry username** set (`PATCH /me`) before publish succeeds.
- YAML max size: **256 KiB**.
- YAML must pass the same checks as [`wallbit workflow validate`](https://github.com/wallbit-workflows/wallbit-cli) (schema, supported `run` ids, step `with` inputs).
- Publish `version` must be semver (e.g. `1.0.0`).
- Duplicate semver for the same workflow → **409**.

**Example (registry API key):**

```bash
export REGISTRY_URL=https://your-api.railway.app
export WB_REG_KEY=wb_reg_xxxxxxxx

curl -sS -X POST "$REGISTRY_URL/workflows" \
  -H "Authorization: Bearer $WB_REG_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "usd-eur-rate",
    "version": "1.0.0",
    "content": "version: 1\nname: usd_eur_rate\nsteps:\n  - id: get_rate\n    run: rates.get\n    with:\n      pair: USD/EUR\n"
  }'
```

### Account (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Current user profile |
| `PATCH` | `/me` | `{ "username": "myname" }` |
| `GET` | `/api-keys` | List keys (prefix only) |
| `POST` | `/api-keys` | Create key; response includes one-time `token` |
| `DELETE` | `/api-keys/{id}` | Revoke key |

### Authentication

`Authorization: Bearer <token>` where `<token>` is either:

1. **Registry API key** — prefix `wb_reg_`, stored hashed server-side. Use from **wallbit-cli** and scripts.
2. **Clerk session JWT** — used by the Next.js BFF routes (`/api/registry/*`, publish proxy). The API creates/links a `users` row on first authenticated request.

Wallbit product API keys are planned for a later release (same Bearer header, remote validation).

## Database

- Migrations: `migrations/` (Goose).
- Queries: `db/queries/` → generated Go in `internal/store/` via sqlc.

```bash
export DATABASE_URL='postgres://...'
make migrate-up
make migrate-status

sqlc generate   # after changing db/queries or db/schema.sql
```

## Deployment

| Service | What to deploy | Notes |
|---------|----------------|-------|
| **Railway** | `go run ./cmd/api` or built binary from `cmd/api` | Set `DATABASE_URL`, `CLERK_SECRET_KEY`, `PORT`. Run migrations on release. |
| **Vercel** | Root directory `web/` | Set env from `web/.env.example`. `NEXT_PUBLIC_REGISTRY_URL` must be the Railway API URL. |
| **Neon** | Postgres | Use pooled connection string in `DATABASE_URL`. |

**Clerk (production):** add your Vercel URL under **Paths**; set **Username** to Optional (registry username is chosen in `/account`). Avoid duplicating sign-in URL env vars that nest `redirect_url` loops — the app uses modal sign-in plus `/sign-in` for OAuth callback only.

**Workflow Studio:** set `CURSOR_API_KEY` on Vercel; optional **Upstash Redis** so rate limits apply across serverless instances (`STUDIO_RATE_LIMIT_*`).

## Development

```bash
go test ./...          # from repo root (may include unrelated module paths under web/node_modules if present)
go run ./cmd/api

cd web && bun run lint
```

## Related

- **wallbit-cli** — `workflow validate`, `workflow run`, and (target) `workflow publish` / `workflow pull` against this API.
- **wallbit-workflow-builder** skill — YAML shape for Studio and authoring (`version: 1`, `steps`, `run` ids).
