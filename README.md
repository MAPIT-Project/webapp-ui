> Documentation status: current | Owner: MAP-IT frontend team | Scope: canonical onboarding and developer entry point | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# MAP-IT webapp-ui

SvelteKit frontend for MAP-IT: Supabase authentication and collaboration, Postgres access through Drizzle, and same-origin proxies to the MAP-IT FastAPI AI backend.

This README is the canonical starting point. Use the linked documents only for deeper architecture, Supabase, and production detail.

## Quick start from a clean clone

### Prerequisites

- Node.js `24.17.0` and npm `11.17.0` (`.nvmrc` and `package.json` are authoritative).
- Docker with a running daemon.
- Supabase CLI and PostgreSQL `psql` client.
- The MAP-IT backend repository available as sibling directory `../MAP-IT_SA`.

### 1. Install the exact frontend dependencies

```bash
nvm install
nvm use
node --version  # v24.17.0
npm --version   # 11.17.0
npm ci
```

### 2. Create the local environment

```bash
cp .env.example .env
```

Do not commit `.env`. Both database names are intentional: `PRIVATE_DATABASE_URL` is used by the running app; `DATABASE_URL` is used by Drizzle CLI. For local development they point to the same database.

### 3. Start local Supabase

```bash
cd supabase_cli
supabase start
cd ..
```

Copy the printed anon key and service-role key into `.env`. Keep the service-role key server-only.

| Service | Local address |
| --- | --- |
| Supabase API/Auth/Realtime | `http://127.0.0.1:54321` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Inbucket | `http://127.0.0.1:54324` |

### 4. Configure the shared backend secret

Generate one secret and set the same value as `JWT_SECRET_KEY` in this repo's `.env` and the backend environment:

```bash
openssl rand -hex 32
```

Set `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and the two optional `VITE_SUPABASE_*` test aliases from `supabase start`. Never place the service-role key in a `PUBLIC_` or `VITE_` variable.

Validate the full app and database scopes without printing values:

```bash
npm run env:check -- dev
npm run env:check -- db
```

### 5. Initialize the frontend schema and Realtime

The only leading frontend schema is `src/lib/server/db/schema.ts`. From the repository root:

```bash
npm run db:push
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase_cli/enable_realtime.sql
```

`supabase_cli/schema.sql` is a legacy full-platform snapshot and must not be applied during normal onboarding. See [local Supabase setup](supabase_cli/how_to_run.md) for reset, RLS, and verification details.

### 6. Start and verify the MAP-IT backend

```bash
cd ../MAP-IT_SA
make docker-up
curl --fail http://127.0.0.1:18000/api/health
cd ../webapp-ui
```

If the backend checkout uses another directory name, return to this repository before continuing. Its `JWT_SECRET_KEY` must match step 4.

### 7. Start the frontend

```bash
npm run dev
```

Open `http://localhost:5173`. Supabase Auth redirects allow both `localhost:5173` and `127.0.0.1:5173`. Local auth cookies are non-secure and host-only; production cookies become secure from the HTTPS request origin.

### 8. Health checks

```bash
curl --fail http://127.0.0.1:54321/auth/v1/health
curl --fail http://127.0.0.1:18000/api/health
curl --fail http://localhost:5173/api/backend-status
```

Then register or log in at `http://localhost:5173/login`, open a conversation, and confirm streamed output. Collaboration updates use Supabase Realtime; `/api/chat/websocket` is an HTTP POST route despite its historical name.

## Environment contract

`.env.example` and `.env.production` document every variable with required/optional status and public/server plus build/runtime scope. The mandatory groups are:

| Concern | Variables |
| --- | --- |
| Browser Supabase | `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` |
| Runtime database | `PRIVATE_DATABASE_URL` |
| Drizzle commands | `DATABASE_URL` |
| Backend proxy/JWT | `BACKEND_URL`, `JWT_SECRET_KEY` |
| Collaboration admin | `SUPABASE_SERVICE_ROLE_KEY` |
| Adapter-node production | `HOST`, `PORT`, `ORIGIN` |

Run `npm run env:check -- dev`, `db`, or `production`. The validator reports names and status only, never values. `check-env.sh` is a compatibility wrapper for the production scope.

## Common commands

```bash
npm run dev              # Vite dev server on 5173
npm run check            # Svelte/TypeScript diagnostics
npm run build:prod       # Vite production build; loads .env.production
npm run start:prod       # adapter-node with .env.production
npm run db:push          # apply canonical Drizzle schema to configured DB
npm run db:generate      # generate a reviewed migration after schema changes
npm run db:migrate       # apply committed Drizzle migrations when present
npm run db:studio        # Drizzle Studio
```

## Documentation map

- [Architecture and API/backend matrix](docs/ARCHITECTURE.md)
- [Local Supabase and database setup](supabase_cli/how_to_run.md)
- [Hosted/production Supabase](docs/SUPABASE_PRODUCTION.md)
- [Production deployment runbook](DEPLOYMENT_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Proposal V4 backend contract](docs/api/V4_PROPOSAL_API_CONTRACT.md)
- [Rate limiting](docs/RATE_LIMITING.md)
- [Documentation remediation log](REMEDIATION_LOG.md)

Historical plans, AI-session output, superseded setup guides, and the original React-focused V4 handoff live under `docs/archive/` and are not operational instructions.

## Known quality baseline

`npm run check` is not clean. The verified pre-remediation baseline on 18-08-2026 is **64 errors and 76 warnings in 34 files**. Documentation remediation must not increase it. There is no separate Vitest/Jest/Playwright runner; `npm test` is currently an alias for `npm run check`.

## Stack

SvelteKit 2, Svelte 5, TypeScript, adapter-node, Tailwind/DaisyUI, Supabase Auth/Postgres/Realtime, Drizzle ORM, and a FastAPI backend reached through server-side proxies.
