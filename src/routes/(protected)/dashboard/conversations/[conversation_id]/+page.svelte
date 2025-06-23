<script lang="ts">
  import { getSpace } from '$lib/stores/collaborationStore.svelte';
  import PersonalChatPage from './components/personal-chat-page.svelte';
  import CollaborationChatPage from './components/collaboration-chat-page.svelte';
  
  // Track the space value reactively
  let currentSpace = $derived(getSpace());
</script>

{#if currentSpace === 'personal'}
  <PersonalChatPage />
{:else}
  <CollaborationChatPage />
{/if}

