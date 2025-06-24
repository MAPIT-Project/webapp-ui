<script lang="ts">
  import { getSpace } from '$lib/stores/collaborationStore.svelte';
  import PersonalInitChatPage from './components/personal-init-chat-page.svelte';
  import CollaborationInitChatPage from './components/collaboration-init-chat-page.svelte';
  
  // Track the space value reactively
  let currentSpace = $derived(getSpace());
</script>

{#if currentSpace === 'personal'}
  <PersonalInitChatPage />
{:else}
  <CollaborationInitChatPage />
{/if}

