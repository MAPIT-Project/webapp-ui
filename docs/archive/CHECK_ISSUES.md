> Documentation status: archived | Owner: MAP-IT frontend team | Scope: time-bound diagnostics baseline | Last verified: 18-08-2026 for archival classification

# Frontend check baseline

## Scope and reproduction

Baseline captured on 2026-07-20 with Node.js `v24.17.0`, npm `11.17.0`, and the dependencies currently installed from `package-lock.json`.

```bash
npm run check
```

Result: **64 errors and 76 warnings in 34 files**. The command exits with status 1. It also reports that the local `caniuse-lite` browser dataset is 19 months old; that maintenance notice is not included in the diagnostic counts.

No application source fixes were made in Wave 2. Several messages that look small are symptoms of broader schema, Svelte 5 migration, or map-library type-contract drift, so changing them without runtime coverage would be risky.

## Error categories

The categories below are mutually exclusive and account for all 64 errors.

| Category | Count | Typical locations | Notes |
| --- | ---: | --- | --- |
| Null/undefined safety and indexing | 20 | `agent-reasoning-view.svelte`, proposal viewer, `test-rls.svelte`, consortium pages | Values returned as nullable/optional are used without narrowing; includes optional keys used as indexes. |
| Implicit `any` and `unknown` handling | 13 | budget/timeline tool results, `test-rls.svelte`, collaboration and consortium callbacks | Missing result and callback types, plus `Object.entries` values inferred as `unknown`. |
| Data-model/component assignment incompatibilities | 10 | auth hook, collaboration service, search store, heatmap query, chat components | Constructed objects no longer match current session, message, store, Drizzle, or component contracts. |
| Missing exported schema types | 9 | `clientService.ts`, `collaborationService.ts`, `dataService.ts`, collaborations page | Imports reference types that `$lib/server/db/schema` or `$lib/types/schema` does not export. |
| Incorrect library/framework API usage | 10 | form validation, login cookies, download/progress/modal components, consortium map | Zod generic lacks `.shape`; cookie calls have an obsolete signature; Svelte-derived values are treated as properties/strings; one Mapbox bounds method is unavailable. |
| Streaming event discriminator mismatch | 1 | `streamingConversationClient.ts` | The `chunk` branch is absent from the declared event union. |
| Always-true reference comparison | 1 | `personal-chat-page.svelte` | An array is compared with `[]` by reference. |
| **Total** | **64** |  |  |

## Warning categories

The categories below are mutually exclusive and account for all 76 warnings.

| Category | Count | Typical locations | Notes |
| --- | ---: | --- | --- |
| Unknown Tailwind `@apply` CSS rules | 37 | download button, progress indicator, streaming message | `svelte-check`'s CSS diagnostics do not recognize these rules in the current preprocessing setup. |
| Unused CSS selectors | 15 | context indicator, consortium pages/pop-up, personal-chat components | May indicate stale styles, but dynamic class use should be checked before removal. |
| Accessibility | 10 | citation components, context/proposal layouts, collaboration toast | Missing control associations, keyboard equivalents, roles, or accessible labels; includes one redundant role. |
| Deprecated Svelte event directives | 10 | context components, follow-up suggestions, `ChatInput.svelte` | Svelte 5 recommends event attributes such as `onclick` instead of `on:click`. |
| Non-reactive updates | 3 | editable title and proposal layout | Variables updated after initialization are not declared with `$state(...)`. |
| CSS compatibility | 1 | citation sources | Standard `line-clamp` is missing beside `-webkit-line-clamp`. |
| **Total** | **76** |  |  |

## Diagnostics by file

This inventory accounts for every reported diagnostic and helps prioritize work without relying on truncated console output.

| File | Errors | Warnings |
| --- | ---: | ---: |
| `src/components/MapSearch.svelte` | 2 | 0 |
| `src/hooks.server.ts` | 1 | 0 |
| `src/lib/clients/clientService.ts` | 1 | 0 |
| `src/lib/clients/collaborationService.ts` | 5 | 0 |
| `src/lib/clients/dataService.ts` | 4 | 0 |
| `src/lib/clients/streamingConversationClient.ts` | 1 | 0 |
| `src/lib/components/generic/agent-reasoning-view.svelte` | 3 | 0 |
| `src/lib/components/generic/citation-sources.svelte` | 0 | 6 |
| `src/lib/components/generic/context-chat-interface.svelte` | 0 | 2 |
| `src/lib/components/generic/context-header-indicator.svelte` | 0 | 5 |
| `src/lib/components/generic/context-indicator.svelte` | 0 | 1 |
| `src/lib/components/generic/download-button.svelte` | 3 | 25 |
| `src/lib/components/generic/editable-title.svelte` | 0 | 1 |
| `src/lib/components/generic/follow-up-suggestions.svelte` | 0 | 1 |
| `src/lib/components/generic/modal.svelte` | 1 | 0 |
| `src/lib/components/generic/progress-indicator.svelte` | 1 | 11 |
| `src/lib/components/generic/streaming-message.svelte` | 0 | 1 |
| `src/lib/components/proposal/proposal-document-viewer.svelte` | 2 | 0 |
| `src/lib/components/proposal/proposal-editor-layout.svelte` | 0 | 4 |
| `src/lib/components/tools/budget-calculation-result.svelte` | 4 | 0 |
| `src/lib/components/tools/timeline-result.svelte` | 1 | 0 |
| `src/lib/components/ui/citation-popover/citation-popover.svelte` | 0 | 1 |
| `src/lib/utils/formValidation.ts` | 2 | 0 |
| `src/routes/(protected)/dashboard/collaborations/+page.svelte` | 2 | 0 |
| `src/routes/(protected)/dashboard/components/collaboration-dashboard.svelte` | 0 | 1 |
| `src/routes/(protected)/dashboard/consortium/+page.svelte` | 8 | 1 |
| `src/routes/(protected)/dashboard/consortium3/+page.svelte` | 9 | 0 |
| `src/routes/(protected)/dashboard/consortium3/components/OrgPopup.svelte` | 0 | 9 |
| `src/routes/(protected)/dashboard/conversations/[conversation_id]/components/ChatInput.svelte` | 0 | 3 |
| `src/routes/(protected)/dashboard/conversations/[conversation_id]/components/personal-chat-context.svelte` | 1 | 2 |
| `src/routes/(protected)/dashboard/conversations/[conversation_id]/components/personal-chat-page.svelte` | 3 | 2 |
| `src/routes/(protected)/dashboard/test-rls.svelte` | 7 | 0 |
| `src/routes/api/auth/login/+server.ts` | 2 | 0 |
| `src/routes/api/heatmap/+server.ts` | 1 | 0 |
| **Total** | **64** | **76** |

## Suggested handover order

1. Reconcile generated/database schema exports and the shared collaboration/message types; this should remove many downstream errors without local casts.
2. Confirm the intended Supabase session and SvelteKit cookie APIs, then update the auth boundary with runtime tests.
3. Narrow optional Mapbox values at their source and verify the installed Mapbox typings before changing map behavior.
4. Complete the Svelte 5 reactivity/event migration component by component.
5. Decide whether Tailwind preprocessing should suppress the 37 false-positive-looking `@apply` warnings, then address genuine accessibility and stale-CSS warnings.
