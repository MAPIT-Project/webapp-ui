<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { getCurrentClient } from '$lib/clients/clientService';
  import { proposalService } from '$lib/clients/proposalService';
  import type { Proposal } from '$lib/types/proposal';
  import Icon from '$lib/components/generic/icon.svelte';
  import Modal from '$lib/components/generic/modal.svelte';

  let proposals = $state<Proposal[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let userId = $state<string>('');
  let showNewProposalDialog = $state(false);
  let newProposalCallId = $state('');
  let isCreatingProposal = $state(false);

  // Load proposals on init
  let _proposalsInit = false;
  $effect(() => {
    if (_proposalsInit) return;
    _proposalsInit = true;
    console.log('[PROPOSALS PAGE] $effect FIRED — loading proposals');
    (async () => {
      try {
        const client = await getCurrentClient();
        if (!client) {
          error = 'User not authenticated';
          isLoading = false;
          return;
        }
        
        userId = client.id.toString();
        
        const proposalsData = await proposalService.getProposals();
        if (proposalsData) {
          proposals = proposalsData;
        }
        
        isLoading = false;
      } catch (err) {
        console.error('Error loading proposals:', err);
        error = 'Failed to load proposals';
        isLoading = false;
      }
    })();
  });

  function handleNewProposal() {
    showNewProposalDialog = true;
  }

  async function handleCreateProposal() {
    if (!newProposalCallId.trim()) {
      error = 'Please enter a Call ID';
      return;
    }

    isCreatingProposal = true;
    error = null;

    try {
      const result = await proposalService.createProposal({
        call_id: newProposalCallId
      });

      if (result?.success) {
        // Add the new proposal to the list
        proposals = [...proposals, result.proposal];
        
        // Close dialog and reset form
        showNewProposalDialog = false;
        newProposalCallId = '';
        
        // Navigate to the new proposal editor
        goto(`/dashboard/proposals/${result.proposal.proposal_id}/edit`);
      } else {
        error = 'Failed to create proposal';
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      error = 'Failed to create proposal';
    } finally {
      isCreatingProposal = false;
    }
  }

  function handleEditProposal(proposalId: number) {
    goto(`/dashboard/proposals/${proposalId}/edit`);
  }

  async function handleDeleteProposal(proposalId: number, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    
    try {
      const success = await proposalService.deleteProposal(proposalId);
      if (success) {
        proposals = proposals.filter(p => p.proposal_id !== proposalId);
      } else {
        alert('Failed to delete proposal');
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
      alert('Failed to delete proposal');
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'bg-[#2A2A2A] text-[#B0B0B0]';
      case 'in_review': return 'bg-[#3B82F6]/10 text-[#3B82F6]';
      case 'submitted': return 'bg-[#FFC107]/10 text-[#FFC107]';
      case 'approved': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'rejected': return 'bg-[#F44336]/10 text-[#F44336]';
      default: return 'bg-[#2A2A2A] text-[#B0B0B0]';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function closeNewProposalDialog() {
    showNewProposalDialog = false;
    newProposalCallId = '';
    error = null;
  }
</script>

<!-- Modern dark grey gradient background -->
<div class="min-h-screen w-full bg-gradient-to-b from-[#1A1A1A] to-[#141414] text-[#F5F5F5] p-6 sm:p-8 lg:p-10 relative overflow-y-auto">
  <!-- Subtle pattern overlay for texture -->
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
  ></div>

  <div class="mx-auto max-w-5xl relative z-10" in:fade={{ duration: 300 }}>
    <!-- Header -->
    <header class="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4" in:fly={{ y: -10, duration: 300 }}>
      <div>
        <p class="text-[#6B7280] text-sm mb-1">Manage Workspace</p>
        <h1 class="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          Proposals
        </h1>
      </div>
      
      <button
        class="flex items-center gap-2 px-5 py-2.5 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-[#A855F7]/20 hover:shadow-lg"
        onclick={handleNewProposal}
      >
        <Icon name="add" />
        New Proposal
      </button>
    </header>

    <!-- Content -->
    <main class="w-full flex-1 flex-col">
      <div>
      {#if isLoading}
        <div class="flex items-center justify-center h-64">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-[#9CA3AF]">Loading proposals...</p>
          </div>
        </div>
      {:else if error}
        <div class="text-center py-12">
          <div class="text-[#F44336] text-xl mb-4">
            <Icon name="error" className="w-16 h-16 mx-auto" />
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Error</h2>
          <p class="text-[#9CA3AF] mb-6">{error}</p>
          <button
            class="px-4 py-2 bg-[#A855F7] text-white rounded-xl hover:bg-[#9333EA] transition-colors font-medium"
            onclick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      {:else if proposals.length === 0}
        <div class="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] p-12 text-center max-w-2xl mx-auto">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#2A2A2A] text-[#6B7280]">
            <Icon name="description" iconSize="2xl" />
          </div>
          <h2 class="text-xl font-medium text-white mb-2">No proposals yet</h2>
          <p class="text-[#6B7280] mb-8 max-w-md mx-auto">Create your first proposal to get started with drafting and managing your grant applications.</p>
          <button
            class="px-5 py-2.5 bg-[#A855F7] text-white rounded-xl hover:bg-[#9333EA] transition-colors font-medium text-sm"
            onclick={handleNewProposal}
          >
            Create Proposal
          </button>
        </div>
      {:else}
        <div class="rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] divide-y divide-[#2A2A2A]">
          {#each proposals as proposal (JSON.stringify(proposal) + '-' + Math.random())}
             <div class="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 transition-colors hover:bg-[#252525] first:rounded-t-xl last:rounded-b-xl gap-4">
                 
                 <!-- left side: icon + title/call_id -->
                 <div class="flex items-center gap-4 flex-1 min-w-0">
                     <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2A2A2A] text-[#6B7280] group-hover:text-[#A855F7] transition-colors">
                         <Icon name="description" />
                     </div>
                     <div class="min-w-0 flex-1">
                         <div class="flex items-center gap-3 mb-1">
                             <a href="/dashboard/proposals/{proposal.proposal_id}/edit" class="truncate text-base font-medium text-[#E5E7EB] group-hover:text-white transition-colors hover:underline">
                                 {proposal.proposal_title || 'Untitled Proposal'}
                             </a>
                             <span class="px-2 py-0.5 rounded-full text-[10px] font-medium {getStatusColor(proposal.status)}">
                                 {proposal.status}
                             </span>
                         </div>
                         <div class="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                             <span class="flex items-center gap-1">
                                 <Icon name="tag" iconSize="sm" />
                                 {proposal.call_id}
                             </span>
                             <span class="flex items-center gap-1 hidden md:flex">
                                 <Icon name="calendar_today" iconSize="sm" />
                                 {formatDate(proposal.updated_at)}
                             </span>
                             <span class="flex items-center gap-1 hidden lg:flex">
                                 <Icon name="text_fields" iconSize="sm" />
                                 {proposal.progress.total_words} words
                             </span>
                         </div>
                     </div>
                 </div>
                 
                 <!-- right side: progress + actions -->
                 <div class="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                     <!-- progress -->
                     <div class="flex-1 max-w-[120px] hidden sm:block">
                         <div class="flex justify-between text-[10px] mb-1.5">
                             <span class="text-[#6B7280]">Progress</span>
                             <span class="text-[#9CA3AF] font-medium">{proposal.progress.completion_percentage}%</span>
                         </div>
                         <div class="w-full bg-[#141414] rounded-full h-1.5 overflow-hidden">
                             <div 
                                 class="bg-[#A855F7] h-1.5 rounded-full transition-all duration-300"
                                 style="width: {proposal.progress.completion_percentage}%"
                             ></div>
                         </div>
                     </div>
                     
                     <!-- Actions -->
                     <div class="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                             class="p-2 text-[#6B7280] rounded-lg hover:bg-[#F44336]/10 hover:text-[#F44336] transition-colors"
                             onclick={() => handleDeleteProposal(proposal.proposal_id, proposal.proposal_title)}
                             title="Delete"
                         >
                             <Icon name="delete" iconSize="sm" />
                         </button>
                         <button
                             class="p-2 text-[#6B7280] rounded-lg hover:bg-[#A855F7]/10 hover:text-[#A855F7] transition-colors"
                             onclick={() => handleEditProposal(proposal.proposal_id)}
                             title="Edit"
                         >
                             <Icon name="edit" iconSize="sm" />
                         </button>
                     </div>
                 </div>
             </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
  </div>

  <!-- New Proposal Dialog -->
  <Modal
    bind:isOpen={showNewProposalDialog}
    title="Create New Proposal"
    on:cancel={closeNewProposalDialog}
    background="bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl max-w-xl w-full"
    fullWidth={true}
  >
    <div slot="content" class="w-full text-[#E0E0E0] p-6">
        <div class="mb-6 flex justify-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 text-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
            <Icon name="add_circle" iconSize="3xl" />
          </div>
        </div>
        
        <p class="text-center text-[#B0B0B0] mb-8 max-w-md mx-auto">
          Enter a Call ID and our autonomous agent will automatically fetch the grant guidelines, objectives, and parameters to set up your intelligent workspace.
        </p>

        {#if error}
          <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <Icon name="error" />
            {error}
          </div>
        {/if}
        
        <div class="space-y-4 mb-8">
          <div>
            <label for="newProposalCallId" class="block text-sm font-medium text-gray-300 mb-2">Call Identifier *</label>
            <input
              id="newProposalCallId"
              type="text"
              bind:value={newProposalCallId}
              placeholder="e.g., HORIZON-CL5-2024-D2-01"
              class="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-lg font-mono shadow-inner"
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-4 mt-8 border-t border-white/10 pt-6">
          <button
            class="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors font-medium"
            onclick={closeNewProposalDialog}
            disabled={isCreatingProposal}
          >
            Cancel
          </button>
          <button
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-medium shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
            onclick={handleCreateProposal}
            disabled={isCreatingProposal}
          >
            {#if isCreatingProposal}
              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Initializing Workspace...
            {:else}
              <Icon name="rocket_launch" />
              Create Proposal
            {/if}
          </button>
        </div>
    </div>
  </Modal>

  <!-- Subtle bottom gradient overlay -->
  <div
    class="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414]/80 to-transparent"
  ></div>
</div>

<style>
  /* Modern animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.4s ease-out forwards;
  }

  /* Custom scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background-color: rgba(64, 64, 64, 0.4);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(80, 80, 80, 0.7);
  }

  /* Modern glass effect */
  .backdrop-blur-md {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
</style>