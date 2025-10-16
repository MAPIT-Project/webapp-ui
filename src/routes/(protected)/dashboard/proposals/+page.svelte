<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getCurrentClient } from '$lib/clients/clientService';
  import { proposalService } from '$lib/clients/proposalService';
  import type { Proposal } from '$lib/types/proposal';
  import Icon from '$lib/components/generic/icon.svelte';

  let proposals = $state<Proposal[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let userId = $state<string>('');
  let showNewProposalDialog = $state(false);
  let newProposalTitle = $state('');
  let newProposalCallId = $state('');
  let newProposalAcronym = $state('');
  let newProposalType = $state('RIA');
  let isCreatingProposal = $state(false);

  // Load proposals on mount
  onMount(async () => {
    try {
      const client = await getCurrentClient();
      if (!client) {
        error = 'User not authenticated';
        isLoading = false;
        return;
      }
      
      userId = client.id.toString();
      
      // Load proposals from API
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
  });

  function handleNewProposal() {
    showNewProposalDialog = true;
  }

  async function handleCreateProposal() {
    if (!newProposalTitle.trim() || !newProposalCallId.trim()) {
      error = 'Please fill in all required fields';
      return;
    }

    isCreatingProposal = true;
    error = null;

    try {
      const result = await proposalService.createProposal({
        call_id: newProposalCallId,
        proposal_title: newProposalTitle,
        proposal_acronym: newProposalAcronym || '',
        proposal_type: newProposalType
      });

      if (result?.success) {
        // Add the new proposal to the list
        proposals = [...proposals, result.proposal];
        
        // Close dialog and reset form
        showNewProposalDialog = false;
        newProposalTitle = '';
        newProposalCallId = '';
        newProposalAcronym = '';
        newProposalType = 'RIA';
        
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

  function getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'bg-gray-800 text-gray-300';
      case 'in_review': return 'bg-blue-900/50 text-blue-400';
      case 'submitted': return 'bg-yellow-900/50 text-yellow-400';
      case 'approved': return 'bg-green-900/50 text-green-400';
      case 'rejected': return 'bg-red-900/50 text-red-400';
      default: return 'bg-gray-800 text-gray-300';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function closeNewProposalDialog() {
    showNewProposalDialog = false;
    newProposalTitle = '';
    newProposalCallId = '';
    newProposalAcronym = '';
    newProposalType = 'RIA';
    error = null;
  }
</script>

<!-- Modern dark grey gradient background -->
<div
  class="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]"
>
  <!-- Subtle pattern overlay for texture -->
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
  ></div>

  <!-- Top header with modern backdrop -->
  <div class="relative z-30 border-b border-[#3A3A3A] bg-[#1E1E1E]/70 backdrop-blur-md px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon name="description" className="text-[#2196F3] text-xl" />
        <h1 class="text-2xl font-bold text-[#E0E0E0]">Proposals</h1>
      </div>
      
      <button
        class="flex items-center gap-2 px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#42A5F5] transition-colors"
        onclick={handleNewProposal}
      >
        <Icon name="add" />
        New Proposal
      </button>
    </div>
  </div>

  <!-- Content -->
  <main class="relative z-10 flex h-full w-full flex-1 flex-col overflow-hidden pt-8">
    <div class="px-6 py-4">
      {#if isLoading}
        <div class="flex items-center justify-center h-64">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 border-4 border-[#2196F3] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-[#B0B0B0]">Loading proposals...</p>
          </div>
        </div>
      {:else if error}
        <div class="text-center py-12">
          <div class="text-red-400 text-xl mb-4">
            <Icon name="error" className="w-16 h-16 mx-auto" />
          </div>
          <h2 class="text-xl font-semibold text-[#E0E0E0] mb-2">Error</h2>
          <p class="text-[#B0B0B0] mb-6">{error}</p>
          <button
            class="px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#42A5F5] transition-colors"
            onclick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      {:else if proposals.length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 text-xl mb-4">
            <Icon name="description" className="w-16 h-16 mx-auto" />
          </div>
          <h2 class="text-xl font-semibold text-[#E0E0E0] mb-2">No proposals yet</h2>
          <p class="text-[#B0B0B0] mb-6">Create your first proposal to get started</p>
          <button
            class="px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#42A5F5] transition-colors"
            onclick={handleNewProposal}
          >
            Create Proposal
          </button>
        </div>
      {:else}
        <div class="space-y-4">
          {#each proposals as proposal (JSON.stringify(proposal) + '-' + Math.random())}
            <div class="bg-[#1E1E1E]/50 border border-[#3A3A3A] rounded-lg p-6 hover:bg-[#2C2C2C]/50 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-[#E0E0E0]">
                      {proposal.proposal_title}
                    </h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(proposal.status)}">
                      {proposal.status}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm text-[#B0B0B0] mb-4">
                    <span class="flex items-center gap-1">
                      <Icon name="tag" className="w-4 h-4" />
                      {proposal.call_id}
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon name="text_fields" className="w-4 h-4" />
                      {proposal.progress.total_words} words
                    </span>
                    <span class="flex items-center gap-1">
                      <Icon name="calendar_today" className="w-4 h-4" />
                      Updated {formatDate(proposal.updated_at)}
                    </span>
                  </div>
                  
                  <!-- Progress bar -->
                  <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-[#B0B0B0]">Progress</span>
                      <span class="text-[#E0E0E0]">{proposal.progress.completion_percentage}%</span>
                    </div>
                    <div class="w-full bg-[#2C2C2C] rounded-full h-2">
                      <div 
                        class="bg-gradient-to-r from-[#2196F3] to-[#42A5F5] h-2 rounded-full transition-all duration-300"
                        style="width: {proposal.progress.completion_percentage}%"
                      ></div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4 text-sm text-[#B0B0B0]">
                    <span>{proposal.progress.completed_sections} of {proposal.progress.total_sections} sections</span>
                    <span>~{proposal.progress.estimated_pages} pages</span>
                  </div>
                </div>
                
                <div class="ml-6">
                  <button
                    class="px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#42A5F5] transition-colors flex items-center gap-2"
                    onclick={() => handleEditProposal(proposal.proposal_id)}
                  >
                    <Icon name="edit" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <!-- New Proposal Dialog -->
  {#if showNewProposalDialog}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-semibold text-[#E0E0E0] mb-4">Create New Proposal</h2>
        
        {#if error}
          <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        {/if}
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#E0E0E0] mb-1">Proposal Title *</label>
            <input
              type="text"
              bind:value={newProposalTitle}
              placeholder="Enter proposal title"
              class="w-full px-3 py-2 bg-[#2C2C2C] border border-[#4F4F4F] rounded-lg text-[#E0E0E0] placeholder-[#B0B0B0] focus:outline-none focus:border-[#2196F3]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-[#E0E0E0] mb-1">Call ID *</label>
            <input
              type="text"
              bind:value={newProposalCallId}
              placeholder="Enter call ID"
              class="w-full px-3 py-2 bg-[#2C2C2C] border border-[#4F4F4F] rounded-lg text-[#E0E0E0] placeholder-[#B0B0B0] focus:outline-none focus:border-[#2196F3]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-[#E0E0E0] mb-1">Acronym</label>
            <input
              type="text"
              bind:value={newProposalAcronym}
              placeholder="Enter acronym (optional)"
              class="w-full px-3 py-2 bg-[#2C2C2C] border border-[#4F4F4F] rounded-lg text-[#E0E0E0] placeholder-[#B0B0B0] focus:outline-none focus:border-[#2196F3]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-[#E0E0E0] mb-1">Type</label>
            <select
              bind:value={newProposalType}
              class="w-full px-3 py-2 bg-[#2C2C2C] border border-[#4F4F4F] rounded-lg text-[#E0E0E0] focus:outline-none focus:border-[#2196F3]"
            >
              <option value="RIA">RIA</option>
              <option value="IA">IA</option>
              <option value="CSA">CSA</option>
              <option value="MSCA">MSCA</option>
            </select>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button
            class="px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg hover:bg-[#4F4F4F] transition-colors"
            onclick={closeNewProposalDialog}
            disabled={isCreatingProposal}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#42A5F5] transition-colors flex items-center gap-2"
            onclick={handleCreateProposal}
            disabled={isCreatingProposal}
          >
            {#if isCreatingProposal}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            {:else}
              Create
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}

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