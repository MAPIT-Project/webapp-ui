> Documentation status: current, transitional | Owner: MAP-IT frontend team | Scope: active SvelteKit proposal editor | Last verified: 18-08-2026 against `bf0ea5f` + working tree remediation

# Proposal editor implementation

The protected editor route is `/dashboard/proposals/[proposal_id]/edit`. Its layout combines V4 session chat, section navigation/editing, evaluation, and progress state.

## Current flow

1. The page gets the authenticated client and loads proposal metadata with `loadProposal(proposalId)` from `proposalStore`.
2. It initializes `proposalSessionStore` with proposal ID, call ID, title, and user ID.
3. `proposal-editor-layout.svelte`, `proposal-chat-interface.svelte`, and `proposal-document-viewer.svelte` consume the session store.
4. `proposalSessionService.ts` calls same-origin `/api/v4/proposal-session/*`; the catch-all SvelteKit route proxies to `${BACKEND_URL}/api/v4/*`.
5. Chat responses stream as SSE events; section updates and progress are applied to the store.

This is a transitional hybrid: legacy proposal-document APIs supply metadata while V4 proposal sessions drive the active editor. The current code is the source of truth; old mock claims and React/Redux examples are not.

## Main files

| File | Responsibility |
| --- | --- |
| `src/routes/(protected)/dashboard/proposals/[proposal_id]/edit/+page.svelte` | auth-aware page initialization |
| `src/lib/components/proposal/proposal-editor-layout.svelte` | split editor shell and responsive layout |
| `src/lib/components/proposal/proposal-chat-interface.svelte` | V4 session chat and stream state |
| `src/lib/components/proposal/proposal-document-viewer.svelte` | section selection, edit, status, evaluation |
| `src/lib/stores/proposalSessionStore.ts` | active V4 session state and SSE reducer |
| `src/lib/stores/proposalStore.ts` | legacy document metadata during transition |
| `src/lib/clients/proposalSessionService.ts` | V4 browser client |
| `src/routes/api/v4/[...path]/+server.ts` | transparent backend proxy |

## Testing status

There is no dedicated proposal-editor unit/E2E runner. `npm test` currently invokes Svelte diagnostics only. Manually verify load, section switching/editing, SSE token/chunk rendering, `section_update`, evaluation, gap analysis, responsive layout, and recovery after a failed backend stream.

## Related documentation

- [Architecture](ARCHITECTURE.md)
- [V4 proposal API contract](api/V4_PROPOSAL_API_CONTRACT.md)
- [Known check baseline](../README.md#known-quality-baseline)
