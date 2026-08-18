> Documentation status: current | Owner: MAP-IT frontend team | Scope: repository architecture and integration boundaries | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Architecture

## Runtime shape

The browser talks to one SvelteKit origin. SvelteKit owns SSR/auth guards, database-backed API routes, and server-side proxies. It calls the MAP-IT FastAPI backend through server-only `BACKEND_URL`; the browser does not need that origin. The Supabase browser client separately uses public URL/anon-key values for Auth, REST, and Realtime.

```text
Browser
  ├─ pages + same-origin /api/* ──> SvelteKit adapter-node
  │                                  ├─ Drizzle ──> Supabase Postgres
  │                                  └─ BACKEND_URL ──> MAP-IT FastAPI V3/V4
  └─ PUBLIC_SUPABASE_URL ─────────> Auth / REST / Realtime WebSocket
```

## Routes and server/client boundary

- `src/routes/+page.svelte`, `/login`, and `/register` are public UI.
- `src/routes/(protected)/+layout.server.ts` checks `locals.session`; dashboard, organization, conversation, and proposal routes inherit that guard.
- `src/hooks.server.ts` creates the request-scoped Supabase server client and validates the user. Global API rate limiting is present but disabled; selected endpoints apply their own limiter.
- `src/routes/api/**/+server.ts` executes only on the server. Private env values and service-role operations must remain here or under `src/lib/server`.
- Client components and stores may import only public env values. `PUBLIC_*` values are exposed to browser bundles.

## Library structure

| Area | Responsibility |
| --- | --- |
| `src/lib/clients` | Browser-facing same-origin API clients, streaming parsers, and Supabase browser client |
| `src/lib/stores` | Svelte state for session, conversations, streaming, collaborations, and proposals |
| `src/lib/components` | Generic, proposal, tool-result, and UI components |
| `src/lib/server/db` | Canonical Drizzle schema and runtime database connection |
| `src/lib/server/supabase.ts` | Request-cookie-aware Supabase server client |
| `src/lib/server/jwt.ts` | HS256 proxy JWT generation for secured backend streaming |
| `src/routes/api` | Same-origin data routes and backend proxies |

## Supabase responsibilities

- **Auth:** login/register routes use Supabase SSR cookie handling. `hooks.server.ts` validates the current user for protected layouts.
- **Postgres/Drizzle:** `PRIVATE_DATABASE_URL` powers application runtime; `DATABASE_URL` powers Drizzle CLI. `src/lib/server/db/schema.ts` is the frontend schema source of truth.
- **Realtime:** `collaborationService.ts` subscribes to `postgres_changes` on `public.message`. `supabase_cli/enable_realtime.sql` owns the idempotent publication step. The misleading `/api/chat/websocket` name is historical: it inserts by HTTP POST; Supabase is the real WebSocket transport.
- **Administration:** invite/member routes use server-only `SUPABASE_SERVICE_ROLE_KEY`. It must never appear in public env variables.

## Backend proxy and streaming flow

JSON and SSE calls are made to relative frontend paths. Server routes expand them against `BACKEND_URL` (default `http://localhost:18000`). SSE response bodies are forwarded as streams; proxy layers must disable buffering.

Only the V3 `message/stream` proxy currently validates a Supabase session and creates an HS256 bearer token with `JWT_SECRET_KEY`. The non-streaming V3 message/context routes and transparent V4 proxy do not add that token. That asymmetry is current behavior, not a guarantee that the backend endpoints are public.

## API/backend matrix

| Frontend route | Backend/service target | Transport | Env/auth in this route |
| --- | --- | --- | --- |
| `/api/backend-status` | `${BACKEND_URL}/api/health` | JSON | `BACKEND_URL`; no route auth |
| `/api/query` | `${BACKEND_URL}/api/query` | JSON | `BACKEND_URL`; endpoint rate limit |
| `/api/query/stream` | `${BACKEND_URL}/api/query/stream` | SSE | `BACKEND_URL`; no added JWT |
| `/api/proxy/conversation/:id/message` | `${BACKEND_URL}/api/v3/conversation/:id/message` | JSON | `BACKEND_URL`; no added JWT |
| `/api/proxy/conversation/:id/message/stream` | `${BACKEND_URL}/api/v3/conversation/:id/message/stream` | SSE | Supabase session + `BACKEND_URL` + HS256 `JWT_SECRET_KEY` |
| `/api/proxy/conversation/:id/context` | V3 context GET/POST | JSON | `BACKEND_URL`; no added JWT |
| `/api/proxy/conversation/:id/reset-context` | V3 context DELETE | JSON | `BACKEND_URL`; no added JWT |
| `/api/proxy/conversation/:id/follow-ups` | No backend; local empty-list stub | JSON | none |
| `/api/v4/*` | `${BACKEND_URL}/api/v4/*` | Transparent JSON/SSE | `BACKEND_URL`; incoming headers forwarded, no generated JWT |
| `/api/proposal-document/*` | `${BACKEND_URL}/api/proposal-document/*` | REST/proxy | `BACKEND_URL`; incoming headers forwarded |
| `/api/providers` | `${BACKEND_URL}/api/providers` | JSON | `BACKEND_URL` |
| `/api/chat/websocket` | Supabase `public.message` insert | HTTP POST | public Supabase vars + authenticated Supabase user |
| Supabase browser client | `PUBLIC_SUPABASE_URL` | Auth, REST, Realtime WebSocket | public anon key + user session; RLS is the database boundary |

## Proposal document versus proposal session

Two backend contracts coexist during migration:

1. `proposalService.ts` and `proposalStore.ts` use `/api/proposal-document/*` for document metadata, sections, progress, and proposal creation.
2. `proposalSessionService.ts` and `proposalSessionStore.ts` use `/api/v4/proposal-session/*` for session state, section operations, evaluation, and SSE agent events.

The active `/dashboard/proposals/[proposal_id]/edit` route first loads legacy document metadata through `proposalStore`, then initializes `proposalSessionStore`. Its child editor/chat/document components consume the V4 session store. Treat this as an intentional hybrid boundary until metadata loading is migrated; do not implement the archived React/Redux examples.

See [V4 proposal API contract](api/V4_PROPOSAL_API_CONTRACT.md) and [proposal editor implementation](PROPOSAL_EDITOR_IMPLEMENTATION.md).
