> Documentation status: current | Owner: MAP-IT operations | Scope: production build and deployment runbook | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# MAP-IT production deployment

This runbook deploys adapter-node behind nginx at the single public origin `https://new.mapit.work`. Local onboarding belongs in the [README](README.md). Hosted Supabase security details are in [Supabase production](docs/SUPABASE_PRODUCTION.md).

## Runtime contract

| Component | Bind/upstream | Public route |
| --- | --- | --- |
| SvelteKit adapter-node | `127.0.0.1:3000` | `https://new.mapit.work/` |
| MAP-IT FastAPI | `127.0.0.1:18000` | server-side only through SvelteKit |
| Supabase gateway | `127.0.0.1:54321` when self-hosted | `https://new.mapit.work/supabase/` |

`PORT=3000`, `HOST=127.0.0.1`, and `ORIGIN=https://new.mapit.work` are mandatory. Port 5173 is development-only.

## 1. Prepare and validate

Use Node `24.17.0`, npm `11.17.0`, nginx, PM2, Docker/Supabase as applicable, and TLS certificates for `new.mapit.work`.

```bash
nvm install
nvm use
npm ci
```

Edit `.env.production` on the host with real values. It is a tracked placeholder template; deployment automation should preferably inject secrets instead of storing them on disk. Required variables are documented inline. In particular:

- `PRIVATE_DATABASE_URL` is for app runtime; `DATABASE_URL` is for Drizzle tooling.
- `JWT_SECRET_KEY` must match the backend and contain at least 32 characters.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- `PUBLIC_SUPABASE_URL`, `PUBLIC_APP_URL`, and `ORIGIN` use HTTPS.
- `COOKIE_DOMAIN=new.mapit.work` is optional; omitting it produces safer host-only cookies.

```bash
npm run env:check -- production
```

The validator prints variable names/status only, never secret values.

## 2. Database and backend

Apply database changes through the owning migration source. For frontend-owned Drizzle schema changes:

```bash
set -a
. ./.env.production
set +a
npm run db:push
psql "$DATABASE_URL" -f supabase_cli/enable_realtime.sql
```

For a hosted Supabase project, use its direct database connection for `DATABASE_URL`; do not run the legacy full dump. Apply backend-owned migrations from `MAP-IT_SA`, then start and verify the backend:

```bash
cd ../MAP-IT_SA
make docker-up
curl --fail http://127.0.0.1:18000/api/health
cd ../webapp-ui
```

## 3. Build and run

Both `npm run build` and `npm run build:prod` execute Vite's production mode and therefore load `.env.production` according to Vite rules. `build:prod` is the canonical runbook spelling. Runtime private variables are loaded by `start:prod`.

```bash
npm run build:prod
npm run start:prod
```

For PM2:

```bash
pm2 delete mapit-ui 2>/dev/null || true
pm2 start npm --name mapit-ui -- run start:prod
pm2 save
```

`npm run host` performs the build, tolerates only a missing old PM2 process, and starts PM2 only after a successful build.

## 4. nginx and Realtime WebSockets

Install [nginx-supabase.conf](nginx-supabase.conf) as an HTTP-context config after replacing certificate paths, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The config proxies the app to 3000 and `/supabase/` to 54321. It preserves `Authorization`, forwards `Upgrade`, and maps `Connection` to `upgrade` only for WebSocket requests. Do not clear or hide those headers: Supabase Realtime uses a real WebSocket at `/realtime/v1/websocket` behind the prefix.

If using hosted Supabase directly, set `PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co` and remove the `/supabase/` nginx location; do not mix the two topologies.

## 5. Verify before traffic

```bash
curl --fail http://127.0.0.1:3000/api/backend-status
curl --fail http://127.0.0.1:18000/api/health
curl --fail https://new.mapit.work/api/backend-status
curl --fail https://new.mapit.work/supabase/auth/v1/health
pm2 logs mapit-ui --lines 50 --nostream
```

In a browser, verify login, `/dashboard`, one SSE conversation, and two-client collaboration updates. Confirm session cookies are `Secure`, `SameSite=Lax`, and scoped to the configured/host-only domain.

## Rollback

Keep the previous build/release directory. Restore it, ensure its matching environment is present, and restart PM2. Database rollback is migration-specific and must be prepared before applying schema changes; never restore by applying `supabase_cli/schema.sql`.
