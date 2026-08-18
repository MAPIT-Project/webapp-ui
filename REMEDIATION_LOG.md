> Documentation status: current | Owner: MAP-IT frontend team | Scope: remediation evidence for `DOCUMENTATION_AUDIT.md` | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Documentation remediation log

This log records the implementation of every recommended action in `DOCUMENTATION_AUDIT.md`. No commit or push was made.

## P0 — onboarding blockers

### P0-1 — Canonical README

- Rebuilt `README.md` as the sole onboarding entry with exact Node `24.17.0`/npm `11.17.0`, `npm ci`, env creation, local Supabase start, all four ports, schema/Realtime initialization, sibling backend start, frontend start, URLs, and health/login/stream checks.
- Added `.nvmrc`, `packageManager`, and `engines`; synchronized root metadata in `package-lock.json`.
- Choice: pinned the toolchain actually used to reproduce the audit baseline on this workspace.

### P0-2 — One env contract

- Replaced `.env.example` and `.env.production` with labeled required/optional and public/server plus build/runtime/db scopes.
- Added both `PRIVATE_DATABASE_URL` (runtime) and `DATABASE_URL` (Drizzle); completed production backend, JWT, service-role, adapter-node, cookie, and legacy test-route values.
- Removed unused `PUBLIC_SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `GOOGLE_API_KEY`, `MAPBOX_API_KEY`, and `DEBUG` from templates. Kept `VITE_SUPABASE_*` because `/api/test_rls` still reads them, and labeled them optional legacy aliases.
- Updated `.gitignore` so the secret-free `.env.production` template is reviewable.

### P0-3 — Localhost auth and cookie behavior

- Updated `src/routes/api/auth/login/+server.ts`: `secure` now follows the request protocol; `COOKIE_DOMAIN` is applied only away from localhost/loopback; local cookies remain host-only.
- Removed invalid manual `Headers.set(..., cookieOptions)` token handling and rely on Supabase SSR `setAll`, which emits the actual auth cookies.
- Aligned `supabase_cli/supabase/config.toml` Auth URLs to port 5173 for both localhost spellings.

### P0-4 — Reproducible database route

- Chose `src/lib/server/db/schema.ts` as the single frontend schema source; clean local setup uses `npm run db:push`.
- Added idempotent `supabase_cli/enable_realtime.sql` for `public.message` publication/replica identity.
- Rewrote `supabase_cli/how_to_run.md` with correct `cd ..`, both database env names, exact ports/commands, ownership boundary, RLS reality, and reset flow.
- Labeled `supabase_cli/schema.sql` legacy/reference-only because it mixes frontend, backend, and Supabase-internal objects. Archived the duplicate `supabase_cli/config.toml` instead of deleting it.

### P0-5 — Production runbook

- Replaced `DEPLOYMENT_GUIDE.md` with one `new.mapit.work` topology and explicit `HOST=127.0.0.1`, `PORT=3000`, and `ORIGIN=https://new.mapit.work`.
- Added `start:prod`; fixed `host` so PM2 cannot start after a failed build and only a missing old process is tolerated.
- Replaced `nginx-supabase.conf`: app upstream is 3000, Supabase is 54321, and Authorization/WebSocket headers are preserved with buffering disabled.
- Corrected build-mode claims: `build` and `build:prod` are both Vite production-mode builds; `start:prod` loads runtime private env.

## P1 — understanding and maintenance

### P1-6 — Architecture document

- Added `docs/ARCHITECTURE.md` covering route groups, protected server layout, server/client env boundary, `lib` structure, Supabase Auth/Drizzle/Realtime, V3/V4 proxies, SSE/JWT, and proposal document/session flows.
- Actualized the audit: the editor now uses `proposalSessionStore` in its page/components while retaining `proposalStore` for initial metadata.

### P1-7 — API/backend matrix

- Added the full current matrix to `docs/ARCHITECTURE.md`, including target, transport, env, session/JWT behavior, the follow-up stub, and the HTTP nature of `/api/chat/websocket`.
- Added `docs/api/V4_PROPOSAL_API_CONTRACT.md` for the endpoints and SSE event types actually consumed by the Svelte client.

### P1-8 — Environment validator

- Replaced `check-env.js` with `npm run env:check -- dev|db|production`; it loads the appropriate env file, validates required values and production invariants, and prints names/status only.
- Converted `check-env.sh` to a compatibility wrapper for production validation instead of inspecting PM2 or grepping values.

### P1-9 — Quality status

- Added the verified 64-error/76-warning/34-file baseline and lack of a standalone test runner to `README.md`, `TROUBLESHOOTING.md`, and corrected `CRUSH.md`.
- Kept `npm test` documented as an alias for `npm run check`; removed the unsupported single-file test instruction.

## P2 — documentation cleanup

### P2-10 — Archive artifacts

- Used `git mv` to move session/check/proposal reports, both conversation documents, citation plan, old setup/architecture stubs, both old Supabase guides, and the original React-oriented V4 handoff into `docs/archive/`.
- Used `git mv` for the duplicate Supabase root config to `docs/archive/supabase-cli-root-config.legacy.toml`. Nothing was deleted.

### P2-11 — Document metadata

- Added status, owner, scope, and last-verified metadata to every current and archived Markdown document. `DOCUMENTATION_AUDIT.md` also has the required remediation status line.

### P2-12 — Separate API specs from onboarding

- Archived the 1,700+ line React/Redux handoff and replaced its active role with the compact, version-bound `docs/api/V4_PROPOSAL_API_CONTRACT.md`.
- Rewrote `docs/PROPOSAL_EDITOR_IMPLEMENTATION.md` around the actual SvelteKit hybrid document/session flow.

### P2-13 — Repair internal links

- Replaced out-of-repository start-page links with `README.md`, removed the absolute local schema URI, and replaced missing proposal-document links with existing architecture/V4/baseline targets.
- Final verification checks every relative Markdown target and scans current docs for local file URI schemes.

### P2-14 — Consolidate Supabase documentation

- Made `supabase_cli/how_to_run.md` the single local setup chapter and added `docs/SUPABASE_PRODUCTION.md` as the single hosted/self-hosted production chapter.
- Both chapters distinguish API 54321, DB 54322, Studio 54323, Inbucket 54324, current RLS ownership/status, and the canonical Realtime publication script.

## Verification

- Pre-change baseline: `npm run check` → 64 errors, 76 warnings in 34 files.
- Final `npm run check`: **62 errors, 76 warnings in 33 files** (exit 1 because known diagnostics remain; below the 64/76 baseline and no new TypeScript diagnostic from this work).
- `npm ci --dry-run --ignore-scripts`: passed; package manifest and lockfile are consistent.
- Env validator: all scopes exercised; `db` passes on `.env.example`, while `dev`/`production` correctly reject placeholder secrets. A positive synthetic-value run also passed without printing values.
- Relative Markdown link check: **23 Markdown files checked; every relative file target exists**.
- Current-doc local file URI scan: **0 matches**.
