> Documentation status: current | Owner: MAP-IT operations | Scope: local and production diagnostics | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# MAP-IT troubleshooting

Start with secret-safe validation and health checks:

```bash
npm run env:check -- dev        # local .env
npm run env:check -- production # .env.production
curl --fail http://127.0.0.1:54321/auth/v1/health
curl --fail http://127.0.0.1:18000/api/health
curl --fail http://localhost:5173/api/backend-status
```

## Local login does not persist

- Use exactly `http://localhost:5173` or `http://127.0.0.1:5173`.
- Confirm `supabase_cli/supabase/config.toml` still allows both redirects.
- Leave `COOKIE_DOMAIN` unset locally. The login handler ignores it for localhost and sets `secure=false` on HTTP.
- Clear old `.mapit.work`, `localhost`, and `127.0.0.1` cookies after switching environments.
- Confirm `.env` uses the API on 54321, not Studio on 54323.

## Production login does not persist

- Confirm `ORIGIN=https://new.mapit.work` and nginx forwards `X-Forwarded-Proto $scheme`.
- Inspect cookies: they must be `Secure`, `SameSite=Lax`, and host-only or scoped to `new.mapit.work`.
- Validate `PUBLIC_SUPABASE_URL` and the anon key; do not print the key in logs.
- Rebuild after changing `PUBLIC_*` variables because they are build-time public values.

## Backend or SSE is unavailable

```bash
curl --fail http://127.0.0.1:18000/api/health
curl --fail http://127.0.0.1:3000/api/backend-status # production app upstream
pm2 logs mapit-ui --lines 50 --nostream
```

`BACKEND_URL` is server-only and may use loopback HTTP behind nginx. The V3 streaming route additionally needs the same `JWT_SECRET_KEY` as the backend. `/api/query/stream` and `/api/v4/*` stream SSE through SvelteKit.

## Realtime is unavailable

```bash
psql "$DATABASE_URL" -c "select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'message';"
psql "$DATABASE_URL" -f supabase_cli/enable_realtime.sql
```

In production, verify nginx forwards both `Upgrade` and `Connection` and does not remove `Authorization`. Browser network tools should show a WebSocket under `/supabase/realtime/v1/websocket`. `/api/chat/websocket` itself is only an HTTP POST that inserts a message.

## Database commands fail immediately

- `DATABASE_URL` is required by `drizzle.config.ts` and every `npm run db:*` command.
- `PRIVATE_DATABASE_URL` is separately required by application runtime.
- Run `npm run env:check -- db` from the repository root.
- Do not apply the legacy `supabase_cli/schema.sql` dump.

## Production app listens on the wrong port

Adapter-node defaults are not the runbook contract. Set `HOST=127.0.0.1`, `PORT=3000`, and `ORIGIN=https://new.mapit.work`; start with `npm run start:prod`. nginx must proxy `/` to `127.0.0.1:3000`, never 5173.

## Check baseline

The pre-remediation `npm run check` baseline was 64 errors and 76 warnings in 34 files. Compare against the final result in [REMEDIATION_LOG.md](REMEDIATION_LOG.md) rather than assuming every non-zero exit is newly introduced. There is no standalone unit-test runner.

For complete deployment steps see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md); for local reset details see [supabase_cli/how_to_run.md](supabase_cli/how_to_run.md).
