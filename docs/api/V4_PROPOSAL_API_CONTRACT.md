> Documentation status: current, version-bound | Owner: MAP-IT backend/API team | Scope: V4 proposal-session contract consumed by this SvelteKit repo | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# V4 proposal-session API contract

This is a consumer-side description of the V4 backend contract currently encoded in `proposalSessionService.ts` and `types/proposal-session.ts`. The original external React/Redux handoff is preserved in [the archive](../archive/AI_Proposal_Writer_Frontend_Integration_Guide.md) and is not an implementation guide for this SvelteKit repository.

## Proxy boundary

Browser base path: `/api/v4/proposal-session`. SvelteKit transparently maps `/api/v4/*` to `${BACKEND_URL}/api/v4/*`, including response streams. The proxy does not generate the V3 backend JWT; any incoming authorization header is merely forwarded.

## Endpoints consumed

| Method and browser path | Purpose |
| --- | --- |
| `POST /api/v4/proposal-session/create` | Create/initialize a session |
| `GET /api/v4/proposal-session/:sessionId` | Load full session state |
| `POST /api/v4/proposal-session/:sessionId/message/stream` | Send chat input and consume SSE |
| `PATCH /api/v4/proposal-session/:sessionId/section/:sectionId` | Replace section content |
| `PATCH /api/v4/proposal-session/:sessionId/section/:sectionId/status` | Update section status |
| `POST /api/v4/proposal-session/:sessionId/section/:sectionId/generate` | Trigger AI generation |
| `POST /api/v4/proposal-session/:sessionId/section/:sectionId/evaluate` | Evaluate a section |
| `POST /api/v4/proposal-session/:sessionId/section/:sectionId/analyze-gaps` | Analyze content gaps |
| `POST /api/v4/proposal-session/:sessionId/focus/:sectionId` | Set active section |

Create payload fields are `proposal_id`, `call_id`, `title`, and optional `proposal_type`. The session response includes session/proposal/call IDs, status, active section, progress/word totals, and a section map. Type definitions in code are authoritative when this summary drifts.

## SSE events

The client reads `data: <JSON>` records separated by blank lines. Supported event types are `status`, `agent_thinking`, `tool_call`, `tool_result`, `section_update`, `token`, `chunk`, `agent_complete`, `session_state`, and `error`.

- `section_update` mutates the matching session section.
- `token` and `chunk` append assistant text.
- `agent_complete` provides final answer, affected sections, iterations, confidence, and timing.
- `session_state` refreshes completion/word state.

nginx and all intermediate proxies must disable buffering for this route.

## Current UI integration

The active editor is integrated with `proposalSessionStore`. It still loads proposal metadata first through the legacy `proposalStore`/`/api/proposal-document/*` flow, then creates the V4 session. The archived guide's migration name `015_proposal_sessions.sql` belongs to the backend handoff and is not present or executable in this repository.
