> Documentation status: current | Owner: MAP-IT operations and database owners | Scope: hosted/self-hosted production Supabase | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Supabase production

Local setup is documented separately in [supabase_cli/how_to_run.md](../supabase_cli/how_to_run.md). This chapter covers production choices and checks.

## Choose one public topology

- **Hosted Supabase:** set `PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`; no nginx Supabase proxy is needed.
- **Self-hosted behind MAP-IT nginx:** keep Supabase on `127.0.0.1:54321` and publish it only as `https://new.mapit.work/supabase`. Use the checked-in [nginx example](../nginx-supabase.conf).

Do not expose 54321 directly over TLS and do not mix direct and prefixed URLs across clients.

## Required configuration

Set the public URL/anon key for browser Auth, REST, and Realtime. Store `SUPABASE_SERVICE_ROLE_KEY`, `PRIVATE_DATABASE_URL`, and `DATABASE_URL` only in the server/deployment environment. Validate with:

```bash
npm run env:check -- production
```

Configure Supabase Auth site URL and exact redirect URLs for `https://new.mapit.work`. Production login cookies derive `Secure` from HTTPS. `COOKIE_DOMAIN` is optional and should be `new.mapit.work` only when a domain attribute is needed.

## Schema ownership

- Frontend-owned tables: `src/lib/server/db/schema.ts`, applied with reviewed Drizzle changes.
- Backend-owned proposal/search/analytics tables: backend migrations in `MAP-IT_SA`.
- Realtime publication for `public.message`: `supabase_cli/enable_realtime.sql`.
- `supabase_cli/schema.sql`: legacy reference snapshot only; never a production migration.

## RLS and key review

The frontend Drizzle schema currently does not define RLS policies. Archived guides contain examples, not authoritative production policy. Before go-live, the database owner must inventory every anon-accessed table and install/test least-privilege policies tied to `auth.uid()`.

Inspect rather than assume:

```sql
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Test policies with an anon client and an authenticated non-owner. Service-role requests bypass RLS and therefore belong only in server routes. Rotate both anon and service-role keys after accidental exposure.

## Realtime

Apply the idempotent publication script with the production database URL, then verify:

```bash
psql "$DATABASE_URL" -f supabase_cli/enable_realtime.sql
psql "$DATABASE_URL" -c "select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'message';"
```

Realtime does not replace RLS: subscription visibility follows database policies. For self-hosting, nginx must forward WebSocket `Upgrade`/`Connection`, preserve authorization, disable buffering, and use a long read timeout.

## Production acceptance

Verify Auth signup/login/logout, one REST query as anon and authenticated users, denied cross-tenant access, invite/member administration, and two-browser `public.message` inserts/updates. The browser connection should upgrade at `/realtime/v1/websocket` (or `/supabase/realtime/v1/websocket` for the prefixed topology).
