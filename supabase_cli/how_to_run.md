> Documentation status: current | Owner: MAP-IT frontend team | Scope: canonical local Supabase/database setup | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Local Supabase and database setup

Run these commands from a clean `webapp-ui` clone. The canonical quick start is in the [README](../README.md); this chapter explains the database boundary in more detail.

## Ownership decision

`src/lib/server/db/schema.ts` is the single source of truth for frontend-owned tables. `npm run db:push` applies it locally. Backend-owned proposal, funding, embedding, and analytics tables belong to the MAP-IT backend migrations and are not recreated here.

`schema.sql` is a historical full-platform dump containing Supabase internals and backend-owned objects. It is reference-only: do not feed it to a fresh local Supabase instance. `src/lib/server/db/migrations.sql` and `migrations.ts` are legacy one-off helpers, not the onboarding route.

## Prerequisites

- Docker daemon
- Supabase CLI
- PostgreSQL `psql`
- Node/npm and dependencies installed as specified by the README

## Start services

From the repository root:

```bash
cd supabase_cli
supabase start
cd ..
```

The CLI reads `supabase_cli/supabase/config.toml`; the former duplicate root config has been archived. Expected endpoints:

| Service | Port | Address |
| --- | ---: | --- |
| API/Auth/Realtime | 54321 | `http://127.0.0.1:54321` |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | 54323 | `http://127.0.0.1:54323` |
| Inbucket | 54324 | `http://127.0.0.1:54324` |

Copy `.env.example` to `.env`, copy the anon/service-role keys from the CLI output, and keep both database URLs equal locally:

```dotenv
PRIVATE_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
```

Validate without exposing values:

```bash
npm run env:check -- dev
npm run env:check -- db
```

## Initialize schema and Realtime

```bash
npm run db:push
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase_cli/enable_realtime.sql
```

The second command idempotently adds `public.message` to `supabase_realtime` and enables full replica identity. It is safe to rerun after a reset.

Verify:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'message';"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname;"
```

## RLS boundary

The canonical Drizzle frontend schema currently defines tables and relations but no RLS policies. Do not infer security from examples in archived documents. Several browser flows use the anon client directly, so production owners must review and test table policies before exposing a hosted project. The current policy state should be inspected with the query above and managed by reviewed database migrations in the owning service.

## Auth and cookies

The config permits `http://localhost:5173` and `http://127.0.0.1:5173`. Local login cookies are host-only with `secure=false`; an HTTPS production request uses `secure=true`, and `COOKIE_DOMAIN` is applied only away from localhost.

## Stop or reset

```bash
cd supabase_cli
supabase stop
```

A destructive reset removes local data:

```bash
cd supabase_cli
supabase stop --no-backup
supabase start
cd ..
npm run db:push
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase_cli/enable_realtime.sql
```

Confirm the exact destructive flag supported by your installed Supabase CLI before running it; CLI versions have used different reset flags. The normal `supabase stop` command preserves local state.
