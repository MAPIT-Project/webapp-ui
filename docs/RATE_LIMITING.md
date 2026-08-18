> Documentation status: current | Owner: MAP-IT frontend team | Scope: in-process SvelteKit rate limiting | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Rate limiting

`src/lib/server/rateLimit.ts` implements in-memory, per-process IP rate limiters. This is not distributed protection: counters reset on process restart and are not shared by PM2 workers or hosts.

## Current enforcement

| Limiter | Window/limit | Applied |
| --- | --- | --- |
| `authRateLimit` | 5 requests per 15 minutes | login/register routes |
| `aiQueryRateLimit` | 10 requests per minute | `/api/query` |
| `apiRateLimit` | 100 requests per 15 minutes | defined, but global middleware is disabled |
| `strictRateLimit` | 3 requests per hour | defined; verify call sites before relying on it |

The global `/api/*` block in `src/hooks.server.ts` is commented out and explicitly marked disabled. Therefore there is no global application-wide protection. Endpoint responses may include `X-RateLimit-*` and `Retry-After` headers.

## Operational limits

Client IP extraction trusts forwarded headers. nginx must overwrite `X-Forwarded-For`/`X-Real-IP`; do not expose adapter-node directly to untrusted clients. For multi-process or multi-host production, enforce coarse limits at nginx/API gateway and move shared counters to a central store before claiming globally consistent quotas.

Changes to tiers or middleware require code tests plus an update to this table. Avoid logging request bodies or credentials while diagnosing limits.
