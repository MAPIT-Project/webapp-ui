<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getCurrentClient } from '$lib/clients/clientService';
  import { proposalStore, loadProposal } from '$lib/stores/proposalStore';
  import { proposalSessionStore } from '$lib/stores/proposalSessionStore';
  import ProposalEditorLayout from '$lib/components/proposal/proposal-editor-layout.svelte';

  // Get proposal ID from URL params
  const proposalId = $derived(parseInt($page.params.proposal_id));
  let userId = $state<string>('');
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Subscribe to old proposal store just to get metadata
  let proposal: any;
  proposalStore.subscribe(state => {
    proposal = state.proposal;
  });

  onMount(async () => {
    try {
      const client = await getCurrentClient();
      if (!client) {
        error = 'User not authenticated';
        isLoading = false;
        return;
      }
      userId = client.id.toString();
      
      // 1. Load basic proposal data (metadata)
      await loadProposal(proposalId);
      
      if (!proposal) {
        error = 'Proposal not found';
        isLoading = false;
        return;
      }

      // 2. Initialize the AI Session
      await proposalSessionStore.initSession(
        proposalId, 
        proposal.call_id, 
        proposal.proposal_title, 
        userId
      );
      
      isLoading = false;
    } catch (err: any) {
      console.error('Error loading:', err);
      error = err.message || 'Failed to load proposal';
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <div class="h-screen flex items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-[#B0B0B0]">Initializing editor...</p>
    </div>
  </div>
{:else if error}
  <div class="h-screen flex items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]">
    <div class="text-center">
      <h2 class="text-xl font-bold text-[#F44336] mb-2">Error</h2>
      <p class="text-[#B0B0B0]">{error}</p>
    </div>
  </div>
{:else}
  <ProposalEditorLayout 
    {proposalId} 
    userId={userId} 
  />
{/if}