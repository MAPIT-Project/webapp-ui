<script lang="ts">
	import { getSpace } from '$lib/stores/collaborationStore.svelte';
	import PersonalInitChatPage from './components/personal-init-chat-page.svelte';
	import CollaborationInitChatPage from './components/collaboration-init-chat-page.svelte';

	const space = getSpace();
	console.log('[CONVERSATIONS PAGE] Rendering. Current space:', space);
</script>

{#if getSpace() === 'personal'}
	<PersonalInitChatPage />
{:else}
	<CollaborationInitChatPage />
{/if}
