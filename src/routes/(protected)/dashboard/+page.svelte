<script lang="ts">
  import { getSpace } from '$lib/stores/collaborationStore.svelte';
  import PersonalDashboard from './components/personal-dashboard.svelte';
  import CollaborationDashboard from './components/collaboration-dashboard.svelte';
  
  // Track the space value reactively
  $: currentSpace = getSpace();
</script>

{#if currentSpace === 'personal'}
  <PersonalDashboard />
{:else}
  <CollaborationDashboard />
{/if}

