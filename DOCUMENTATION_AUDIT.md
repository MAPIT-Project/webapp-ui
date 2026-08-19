> Status: remediated at 18-08-2026 — see REMEDIATION_LOG.md
>
> Documentation status: remediated audit record | Owner: MAP-IT frontend team | Scope: documentation/code consistency audit | Last verified: 18-08-2026

# Documentation audit — webapp ui (NEWMAPIT)

**Audit date:** 18 August 2026
**Scope:** all tracked Markdown files in this repository, plus `package.json`, `package-lock.json`, `check-env.js`, `check-env.sh`, `drizzle.config.ts`, `.env.example`, `.env.production`, `svelte.config.js`, `vite.config.ts`, `nginx-supabase.conf`, the Supabase CLI configuration and relevant parts of `src/`. Secret values ​​from local `.env` are not included; only the variable names were compared.

## TL;DR

- **No: this repo is not yet independently ready for a new developer.**
- The README provides a global introduction, but not a reproducible end-to-end quick start for frontend, database, Supabase and MAP-IT backend.
- The env, database and port documentation contradicts the code at blocking points.
- The relevant knowledge is spread across 17 documents, including outdated plans, AI/session artifacts, and broken references.
- EFirst, one canonical onboarding route is needed; then deployment and feature docs must be tested against the current code.

## Score per criterion

| Criterion | Score | Rating |
| --- | --- | --- |
| README with project goal, tech stack and quick start | 🟡 | `README.md` describes goal, features and stack and mentions `npm install`/`npm run dev`, but lacks prerequisites, env configuration, database/Supabase/backend-start, port, authentication, and known limitations. |
| Installation & setup (Node, package manager, dependencies, etc.) | 🟡 | `DEPLOYMENT_GUIDE.md` names Node 18+, npm/yarn, clone, `npm install` and `cp .env.example .env`. However, there is no `.nvmrc`, `.node-version`, or `engines` field; `package-lock.json` actually makes npm the logical choice, but that is not recorded as canonical. The local full-stack setup is spread across multiple documents. |
| `.env.example` with all necessary variables | ❌ | The file exists, but is missing `DATABASE_URL`, which makes `drizzle.config.ts` mandatory for all `db:*` scripts. It contains multiple unused or duplicate variables at the same time and incorrectly puts a service role placeholder under a `PUBLIC_` name. The production template has a different, also incomplete contract. |
| Start Devserver + port | 🟡 | `npm run dev` is correct and Vite uses 5173 by default; that port is only explicitly mentioned in the deployment guide. The Supabase authconfig correctly uses port 3000 and the current login cookie code is hard linked to HTTPS/`.mapit.work`, making a documented localhost flow not reliable. |
| Link with MAP-IT backend, URL's and streaming | 🟡 | `BACKEND_URL=http://localhost:18000` and the health check are documented. One current overview of the same-origin frontend proxies, V3/V4 routes, JWT-secret and SSE flows is missing. `/api/chat/websocket` is also a HTTP POST; the real WebSocket connection is Supabase Realtime. |
| Supabase setup current and consistent | 🟡 | There are local and Realtime guides and `supabase_cli/schema.sql` contains the Realtime publication. However, they contain incorrect/confusing URLs, a broken Drizzle step, duplicate config locations, an auth port conflict, and sample RLS instead of a demonstrably up-to-date migration procedure. |
| Build & deployment | 🟡 | Scripts and an extensive guide exist, but production port, env contract, domain, nginxconfig and cookie behavior are not mutually consistent. The guide cannot therefore be safely followed as a runbook. |
| Project structure / architecture overview | ❌ | `docs/project_docs.md` is a WIP stub of 25 rules. There is no current overview of routes, server/client boundaries, stores, database, Supabase Auth/Realtime, backend proxies and the two proposal flows. The existing architecture docs are feature-specific or explicitly archived. |

## Top 5 gaps that block onboarding

### 1. There is no correct and unambiguous env contract

This is the largest direct blocker:

- The runtime database client requires `PRIVATE_DATABASE_URL` (`src/lib/server/db/index.ts`), but Drizzle CLI requires `DATABASE_URL` (`drizzle.config.ts`).
- `.env.example` contains only `PRIVATE_DATABASE_URL`; therefore, the documented `npm run db:push`, `db:generate`, `db:migrate`, and `db:studio` are not reproducible from the sample file.
In fact, - `.env.production` contains only `DATABASE_URL`, while the app runtime requires `PRIVATE_DATABASE_URL`. The file is also missing `BACKEND_URL`, `JWT_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and the Vite test variables.
- `JWT_SECRET_KEY` has an unsafe fallback in the code (`fallback-secret-change-in-production`), while the backend must use the same secret. The docs do not treat this as a hard production condition.
- `SUPABASE_SERVICE_ROLE_KEY` is read for invite/member-admin routes. The fallback to the anon key does not give the same rights and makes the variable operationally necessary for those functions.
- `PUBLIC_SUPABASE_SERVICE_KEY` is in `.env.example`, is not read anywhere and incorrectly suggests that a service role key may be public. A real service role key should never be exposed to client code via a `PUBLIC_` variable.

**Impact:** installation appears complete, but database commands, runtime, or admin functions may subsequently fail; In addition, the example naming is security-sensitive.

### 2. An end-to-end local quick start is missing and localhost-auth clashes with the code

A new developer will not receive any verified order for:

1. correct Node/npm version;
2. `npm ci` or `npm install`;
3. Launch local Supabase/Docker;
Apply 4. scheme/migrations;
5. anon and service role keys taken over;
6. MAP-IT Start FastAPI backend on 18000;
7. set shared `JWT_SECRET_KEY`;
Start 8. frontend on 5173;
9. health, login, query and streaming testing.

In addition, `DEPLOYMENT_GUIDE.md` says that cookies in development use `secure: false`, but `src/routes/api/auth/login/+server.ts` sets `secure: true` unconditionally and creates manual cookies for `.mapit.work`. Also, `supabase_cli/supabase/config.toml` is set to `site_url=http://127.0.0.1:3000`, while the Vite dev server uses 5173.

**Impact:** the server can start, but the documented local login/session flow is not reliably executable.

### 3. Database and Supabase initialization are not described reproducibly

- `supabase_cli/how_to_run.md` says from `supabase_cli/` then `cd webapp-ui`; that path does not exist there. The command in question is probably `cd ..`.
- The same guide runs `npm run db:push` using only `PRIVATE_DATABASE_URL`, while `drizzle.config.ts` controls `DATABASE_URL`.
- The guide links to an absolute local URI for `schema.sql`; that link doesn't work on any other machine.
- `supabase_cli/schema.sql` is a large database dump including Supabase internal objects, while Drizzle migrations exist in addition. It does not say which source is leading, when both are needed and how schedule drift is prevented.
- There are two Supabase configs (`supabase_cli/config.toml` and `supabase_cli/supabase/config.toml`) with different `project_id` values. With `supabase start` from `supabase_cli/` the nested config is relevant, but that distinction is not explained.
- `docs/SUPABASE_LOCAL_REALTIME_SETUP.md` calls `http://localhost:54323` “local Supabase”; that's Studio. The API URL is 54321, as `supabase_cli/how_to_run.md` itself correctly reports.
- The Realtime publication for `public.message` is already in `supabase_cli/schema.sql`, while the Realtime guide presents the same manual SQL as the necessary setup. An idempotent canonical migration step is missing.

**Impact:** a new developer can follow different, partly conflicting schema routes and end up with a different database.

### 4. The production runbook uses inconsistent ports, domains, and env assumptions

- `npm start` is running the adapter-node build. Without `PORT` it listens to 3000 by default; `nginx-supabase.conf` proxies the app to 5173 and `DEPLOYMENT_GUIDE.md` also signs the production app to 5173. `PORT`/`HOST`/`ORIGIN` are not listed anywhere in the env templates or runbook.
- `nginx-supabase.conf` uses `new.mapit.work`, while several guide examples use `mapit.work`.
- In the `/supabase/` location, nginx first sets `Connection 'upgrade'` and then `Connection ""`, and hides the `Upgrade` header. This conflicts with the claim that Supabase Realtime/WebSockets work via this proxy.
- `build:prod` is exactly `vite build`; the script does not make the production env choice more explicit than `npm run build`. The guide describes a stronger separation than the scripts guarantee.
- The `host` script uses `npm run build && pm2 delete ...; pm2 start ...`. The semicolon causes the start part to be executed even after a failed build.
- The guide refers to a complete `/etc/nginx/sites-available/mapit.conf`, but it is not in the repo; `nginx-supabase.conf` is another partial example.

**Impact:** Following the deployment guide to the letter may result in a reverse proxy to the wrong port or start an old/failed build.

### 5. There is no canonical documentation structure; historical artifacts appear authoritative

The root contains several competing guides, reports and session summaries in addition to the README. Some historical files are correctly marked `ARCHIVED`, but refer to a start file outside this Git repository for up-to-date information. After an independent clone, that target was not available. Other reports/plans have no status label and appear current, while routes, examples or claims are no longer correct.

**Impact:** a new developer cannot determine which source is leading and easily follows an old implementation proposal or incident fix instead of the current architecture.

## Document inventory and status

### Root

| File | Type | Assessment | Recommended status/action |
| --- | --- | --- | --- |
| `README.md` | Project introduction | Partially up to date, but not complete onboarding. | Expand to the canonical entry with quick start and links to in-depth docs. |
| `DEPLOYMENT_GUIDE.md` | Setup/deployment runbook | Extensive but crucially outdated or inconsistent with code/config. | Retain as production runbook after correction; local onboarding from the README refer to a separate setup guide. |
| `TROUBLESHOOTING.md` | Operations quick reference | Partly useful, but inherits port/env/cookie assumptions from the deployment guide. | Update after capturing the real deployment architecture. |
| `CRUSH.md` | AI agent configuration | No documentation for human onboarding. The build scripts are largely correct; the test section does not. | Keep out of human doc navigation. Fix `npm run test -- <file>`: There is no test runner and `test` is just an alias for `check`. |
ZZZPROTECTED0zzz SvelteKit repo. The mentioned backend migration `015_proposal_sessions.sql` is not listed here. The V4 service/store exists, but there is no route/component that imports `proposalSessionStore`; the visible editor still uses `proposalStore`. | Backend label API reference/handoff, mention owner and version, and honestly describe whether the V4 UI is integrated, partially integrated, or only prepared. |
| `CHECK_ISSUES.md` | Time-bound quality baseline | Status artifact, probably from an audit/AI work session; no onboarding. On 18 August 2026 re-verified: still **64 errors and 76 warnings in 34 files**. | Move to `docs/status/` or issue tracker; add date and commit. Do not use as permanent architecture document. |
| `SESSION_SUMMARY.md` | AI/session and incident artifact | Explicitly archived. Final claims “documentation complete” and “deployment ready” conflict with the current audit. Points outside the repo to a missing homepage. Remove | from root or move it to `docs/archive/`; do not use as a source for onboarding. |
| `proposal_editor_report.md` | Handoff/analysis artifact | Deprecated: Calls `.../proposals/[proposal_id]/+page.svelte`, while the route is now `.../[proposal_id]/edit/+page.svelte`. | Archive or update and clearly label as a historical backend handoff report. |

### `docs/`

| File | Type | Assessment | Recommended status/action |
| --- | --- | --- | --- |
| `docs/project_docs.md` | Intended architectural overview | WIP-stub; only mentions stack and timestamp convention. | Replaced with a real architecture overview. |
| `docs/project_setup.md` | Old VPS/demo setup | Explicitly archived; contains destructive steps, open firewall advice and old ports. Links outside the repo to a missing homepage. | To `docs/archive/` or delete after securing useful history. |
| `docs/SUPABASE_LOCAL_REALTIME_SETUP.md` | Local Realtime Setup | Partly useful, but confuses Studio with API, duplicates SQL from `schema.sql`, and does not record the schema owner. | Merge with the local Supabase guide. |
| `docs/SUPABASE_REALTIME_SETUP.md` | Hosted/generic Real-time setup | Describes the actual `postgres_changes` flow on `public.message`, but RLS is sample code and not demonstrably the same policy as the current schema initialization. | Update with the real migration/policies and distinguish local/hosted. |
| `docs/RATE_LIMITING.md` | Feature documentation | The endpoint limits are correct, but the claim “global protection on all `/api/*`” is incorrect: that middleware is commented out in `src/hooks.server.ts`. | Correct and clearly distinguish “implemented” versus “disabled/planned”. |
| `docs/PROPOSAL_EDITOR_IMPLEMENTATION.md` | Feature/Implementation Overview | Partially useful, but calls mock behavior as implementation, contains future claims, and links to missing `API_DOCUMENTATION.md` and `COMPONENT_LIBRARY.md`. | Validate against the current `/edit` route and V4 session flow; fix broken links. |
| `docs/CITATION_IMPLEMENTATION_VERIFICATION.md` | Test plan/AI implementation artifact | Unexecuted plan: All checklist items are open and sample tests (`citationRenderer.test.ts`) do not exist. | To `docs/testing/` with status “plan, not implemented”, or convert to real tests/issues. |
| `docs/CONVERSATIONAL_AI_ARCHITECTURE.md` | Historical architecture proposal | Explicitly archived pre-V3 proposal; points outside the repo to a missing homepage. | To `docs/archive/`. |
| `docs/CONVERSATION_IMPLEMENTATION_GUIDE.md` | Historical Implementation Guide | Explicitly archived; mainly contains backend Python files that do not exist in this repo. | To `docs/archive/`. |

### Other location

| File | Type | Assessment | Recommended status/action |
| --- | --- | --- | --- |
| `supabase_cli/how_to_run.md` | Local database/Supabase setup | Valuable base, but the `cd` step, absolute link and `DATABASE_URL`/`PRIVATE_DATABASE_URL` statement are incorrect. | Correct and link from README as the only local Supabase source. |

## Env-var cross-check

### By current code read or operationally required

| Variable | Reader / function | Status in `.env.example` | Audit |
| --- | --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | Browser client, hooks and many server routes | Present | Needed. For local this should normally point to API port 54321. |
| `PUBLIC_SUPABASE_ANON_KEY` | Browser client, hooks, and server routes | Present | Needed. |
| `PRIVATE_DATABASE_URL` | Runtime Drizzle client and test/migration code | Present | Needed for app runtime. |
| `DATABASE_URL` | `drizzle.config.ts` and thus `db:*` scripts | **Missing** | Blocking error in the sample contract. Document both names or standardize the code. |
| `BACKEND_URL` | Health, query, proposal, V3 and V4 proxies | Present | Has fallback `http://localhost:18000`, but must be explicitly recorded per environment. |
| `JWT_SECRET_KEY` | JWT for the secure backend V3 streaming proxy | Present | Operationally required; fallback is not secure and the “must match backend” step is missing in onboarding/deployment. |
| `SUPABASE_SERVICE_ROLE_KEY` | Collaboration invite/member-admin routes | Present | Keep server-only; functionally necessary for admin operations. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Only `/api/test_rls` | Present | Legacy/test alias, not the main Supabaseconfig. This distinction is missing. |
| `PUBLIC_APP_NAME`, `PUBLIC_APP_URL`, `PUBLIC_APP_ENV` | Config/SEO/defaults | Present | Optional by defaults, but `PUBLIC_APP_ENV` does not control SvelteKit's real build mode. |
| `PUBLIC_ENABLE_DEBUG_TOOLS`, `PUBLIC_ENABLE_ANALYTICS`, `PUBLIC_API_TIMEOUT_MS`, `PUBLIC_MAX_UPLOAD_SIZE_MB` | Only config object/defaults | Present | No detected consumers outside config; document as optional or remove dead configuration. |

### In `.env.example`, but not used by the current frontend code

- `PUBLIC_SUPABASE_SERVICE_KEY` — delete; the name is security dangerous.
- `SUPABASE_URL` — not used in addition to `PUBLIC_SUPABASE_URL`.
- `GOOGLE_API_KEY` — not read in this frontend.
- `MAPBOX_API_KEY` — not read in this frontend; there is also no documented alternate token variable.
- `DEBUG` — not read by the app.

`check-env.js` checks only four names, does not load `.env` itself and is not in `package.json`. `check-env.sh` only views PM2 and Supabase URL rules. Neither validates the actual contract described above. Create one fail-fast validator and link it to an npm script, for example `npm run env:check`.

## Current backend/API architecture as inferred from the code

The browser predominantly accesses relative, same-origin SvelteKit routes. SvelteKit talks server-side with `BACKEND_URL` (default `http://localhost:18000`). This important interface is nowhere compactly described.

| Frontend route | Backend target | Transport / target |
| --- | --- | --- |
| `/api/backend-status` | `${BACKEND_URL}/api/health` | JSON health check |
| `/api/query` | `${BACKEND_URL}/api/query` | Non-streaming AI query |
| `/api/query/stream` | `${BACKEND_URL}/api/query/stream` | SSE stream |
| `/api/proxy/conversation/:id/message` | `${BACKEND_URL}/api/v3/conversation/:id/message` | V3 JSON proxy; does not add backend JWT itself |
| `/api/proxy/conversation/:id/message/stream` | `${BACKEND_URL}/api/v3/conversation/:id/message/stream` | V3 SSE with backend JWT |
| `/api/proxy/conversation/:id/context`, `reset-context` | V3 conversation routes | Context management |
| `/api/proxy/conversation/:id/follow-ups` | No backend target; local stub | Currently always returns an empty list |
| `/api/v4/*` | `${BACKEND_URL}/api/v4/*` | Transparent V4 proxy, used by proposal sessions and SSE |
| `/api/proposal-document/*` | `${BACKEND_URL}/api/proposal-document/*` | Proposal document REST/proxy |
| `/api/providers` | `${BACKEND_URL}/api/providers` | Provider list |
| `/api/chat/websocket` | No backend WebSocket; writes via SvelteKit/Supabase | HTTP POST, despite the route name |
| Supabase browser client | `PUBLIC_SUPABASE_URL` | Auth, REST and real Realtime WebSocket (`postgres_changes` on `public.message`) |

The V3 streaming proxy creates a HS256 JWT with `JWT_SECRET_KEY`; the non-streaming V3 messaging proxy and the V4 catch-all proxy currently do not do this. This difference and the required backend configuration belong in the architecture overview.

## Concrete docs-vs-code contradictions

1. **Database variable:** README/deployment/Send Supabase guide on `PRIVATE_DATABASE_URL`; `drizzle.config.ts` refuses to start without `DATABASE_URL`.
2. **Production template:** `.env.production` has `DATABASE_URL`, but `src/lib/server/db/index.ts` stops without `PRIVATE_DATABASE_URL`; the template is therefore not independently usable for runtime.
3. **Production port:** nginx and the deployment diagram use 5173; `npm start` with adapter node used without `PORT` standard 3000.
4. **Dev auth port:** README/Vite use 5173; `supabase_cli/supabase/config.toml` uses 3000 for `site_url` and redirects.
5. **Cookie behavior:** deployment guide says development `secure: false`; login code always uses `secure: true` and `.mapit.work`.
6. **Global rate limiting:** `docs/RATE_LIMITING.md` says active for all `/api/*`; `src/hooks.server.ts` explicitly marks this as `DISABLED`.
7. **Tests:** `CRUSH.md` suggests one test file via `npm run test -- <file>`; `package.json` makes `test` run only `npm run check` and does not include a Vitest/Jest/Playwright runner.
8. **Proposal route:** `proposal_editor_report.md` points to `[proposal_id]/+page.svelte`; the real route is `[proposal_id]/edit/+page.svelte`.
9. **Proposalstack:** the V4 integration guide provides extensive React/Redux implementations; the repo uses Svelte stores and has `proposalSessionService.ts`/`proposalSessionStore.ts`, but the active editor route imports the older `proposalStore` and no UI imports the V4 session store.
10. **Realtime URL:** the local Realtime guide calls port 54323 as Supabase URL; that is Studio, while the API is 54321.
11. **Realtime setup:** docs ask manually `ALTER PUBLICATION`; `supabase_cli/schema.sql` already contains that publication. The canonical/idempotent route is missing.
12. **Nginx Realtime:** docs claim WebSocket support via `/supabase/`, but the included location clears the `Connection` header and hides `Upgrade` after setting it first.
13. **Production env:** the deployment guide shows `PRIVATE_DATABASE_URL`, `BACKEND_URL`, Vite-vars and service key; the tracked `.env.production` does not contain this.
14. **Buildmodes:** the guide says that by default `npm run build` uses `.env` and `build:prod` specifically uses `.env.production`; both production builds actually run `vite build`, with Vite's mode/env loading rules in effect. `build:dev` injects `.env`, but still runs a production build.
15. **Broken docs links:** `docs/PROPOSAL_EDITOR_IMPLEMENTATION.md` links to non-existent `API_DOCUMENTATION.md` and `COMPONENT_LIBRARY.md`. Archived docs point to a homepage outside the repository.
16. **Quality claim:** `SESSION_SUMMARY.md` ends with “documentation complete” and “deployment ready”; `npm run check` still fails with 64 errors/76 warnings and this report finds multiple onboarding blockers.

## Arecommended actions

### P0 — before transfer to a new developer

1. **Make the README the canonical homepage.** Add an actual tested quick start with exact Node/npm version, `npm ci`, env-copy, Supabase-start, schema-init, backend-start, frontend-start, URLs and health checks.
2. **Define one env contract.** Decide on `DATABASE_URL` vs. `PRIVATE_DATABASE_URL`; document required/optional, scope (public/server/build/runtime), example value and owner. Remove `PUBLIC_SUPABASE_SERVICE_KEY` and unused aliases.
3. **Make localhost-auth explicitly working and document the result.** Align Vite 5173, Supabase redirect URLs, and cookie `secure`/`domain` behavior. This will require a code change later; this audit deliberately did not carry out this.
4. **Create one reproducible database procedure.** Choose a lead migration source (Supabase migrations, Drizzle migrations or a clearly versioned bootstrap), correct the `cd` and env steps and test from a clean clone/database.
5. **Restore the production runbook.** Capture `PORT`, `HOST`, and `ORIGIN`, make nginx consistent with that port and one domain, and validate Supabase Realtime/WebSocket proxying.

### P1 — understanding and maintainability

6. **Add `docs/ARCHITECTURE.md`** with:
- SvelteKit route groups and server/client boundary;
- `src/lib/clients`, `stores`, `components`, `server/db` and `routes/api`;
- Supabase Auth, Postgres/Drizzle and Realtime;
- same-origin API proxies to backend V3/V4;
- SSE event flow and JWT link;
- proposal document versus proposal session flow.
7. **Add a compact API/backend matrix** as above, including which service each endpoint uses and which env-var/auth is needed.
8. **Make `npm run env:check`** that validates all mandatory variables for `dev`, `db` and `production` without printing secrets. Replace or document the limitations of the two current check-env scripts.
9. **Record the expected quality status.** `npm run check` is currently failing. Place this prominently under “Known issues” or correct the errors before claiming “ready”. Do not add real test commands until a test runner exists.

### P2 — clean up documentation

10. **Move session/AI artifacts to `docs/archive/` or the issue tracker:** `SESSION_SUMMARY.md`, `CHECK_ISSUES.md`, `proposal_editor_report.md`, the two archived conversation docs, and possibly the citation verification plan.
11. **Label each persistent document** with status (`current`, `draft`, `archived`), owner, scope and “last verified against commit/date”.
12. **Splits API repo onboarding specs.** Keep the V4 proposal guide as a versioned backend contract, but don't let it compete with SvelteKit deployment docs and delete/move the React examples.
13. **Restore all local links** and ensure that no current statement depends on a file outside this Git repository or an absolute local file URI.
14. **Combine the Supabase docs** into one local setup plus one hosted/production chapter; explicitly describe API (54321), DB (54322), Studio (54323), Inbucket (54324), RLS, and Real-Time Publishing.

## End verdict

The repo has a remarkable amount of documentation, but volume is no substitute for a reliable onboarding route. The current README is too thin, while the detailed information is scattered and sometimes contradictory. An experienced maintainer can reconstruct the intended architecture from the code; Based on the current docs, a new developer cannot configure a clean clone, log in locally, connect database and backend and deploy the same build with sufficient certainty. The recommended P0 actions are therefore prerequisites for an independent transfer.
