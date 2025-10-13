<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    proposalStore, 
    loadProposal, 
    getSection, 
    refreshProgress, 
    setError, 
    clearError,
    currentSection
  } from '$lib/stores/proposalStore';
  import { proposalService } from '$lib/clients/proposalService';
  import { streamingConversationStore } from '$lib/stores/streamingConversationStore';
  import type { ProposalSection } from '$lib/types/proposal';
  import ProposalDocumentViewer from './proposal-document-viewer.svelte';
  import ProposalChatInterface from './proposal-chat-interface.svelte';
  import Icon from '$lib/components/generic/icon.svelte';
  import { PROPOSAL_QUICK_ACTIONS } from '$lib/types/proposal';
  import type { QuickAction } from '$lib/types/proposal';

  interface Props {
    proposalId: number;
    conversationId: number;
    userId: string;
  }

  let { proposalId, conversationId, userId }: Props = $props();

  let isMobileView = $state(false);
  let activeTab = $state<'chat' | 'document'>('chat');
  let eventSource: EventSource | null = null;

  // Subscribe to store values
  let proposal: any;
  let error: string | null;
  let currentSectionData: ProposalSection | null;

  proposalStore.subscribe(state => {
    proposal = state.proposal;
    error = state.error;
  });

  currentSection.subscribe(value => {
    currentSectionData = value;
  });

  // Check for mobile view
  onMount(() => {
    const checkMobileView = () => {
      isMobileView = window.innerWidth < 768;
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  });

  // Load proposal on mount
  onMount(async () => {
    await loadProposal(proposalId);
    
    // Set up real-time events
    eventSource = proposalService.setupProposalEvents(proposalId, {
      onSectionUpdated: (sectionId: string, content: string) => {
        // Update the section in the store
        const section = getSection(sectionId);
        if (section) {
          // We would need to update the store, but for now just log
          console.log(`Section ${sectionId} updated`);
        }
      },
      onProgressUpdated: () => {
        refreshProgress();
      }
    });
  });

  // Cleanup on unmount
  $effect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  });

  async function handleMessageSent() {
    // Refresh proposal after message is sent
    await refreshProgress();
  }

  function handleError(error: string) {
    setError(error);
  }

  function handleQuickAction(action: QuickAction) {
    // Add the action as a message to the conversation
    const message = getActionMessage(action.action);
    if (message) {
      // This will be handled by the streaming conversation interface
      // We need to trigger the message send programmatically
      const inputElement = document.querySelector('.proposal-chat-interface input') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = message;
        // Trigger the send button click
        const sendButton = document.querySelector('.proposal-chat-interface button') as HTMLButtonElement;
        if (sendButton) {
          sendButton.click();
        }
      }
    }
  }

  function getActionMessage(action: string): string {
    const sectionName = currentSectionData?.section_name || 'current section';
    
    switch (action) {
      case 'draft_next':
        return 'Draft the next section of the proposal';
      case 'improve':
        return `Improve the ${sectionName} section`;
      case 'be_specific':
        return `Make the ${sectionName} section more specific and add measurable KPIs`;
      case 'add_examples':
        return `Add relevant examples to the ${sectionName} section`;
      case 'compliance':
        return `Check the ${sectionName} section for compliance with requirements`;
      default:
        return '';
    }
  }

  function switchToTab(tab: 'chat' | 'document') {
    activeTab = tab;
  }

  // Responsive layout
  const layoutClass = $derived(isMobileView ? 'flex-col' : 'grid grid-cols-5');
  const chatPanelClass = $derived(isMobileView 
    ? activeTab === 'chat' ? 'block' : 'hidden' 
    : 'col-span-2');
  const documentPanelClass = $derived(isMobileView 
    ? activeTab === 'document' ? 'block' : 'hidden' 
    : 'col-span-3');
</script>

<div class="proposal-editor-layout h-screen flex flex-col bg-gray-900">
  <!-- Header -->
  <header class="border-b border-gray-800 bg-gray-800/50 backdrop-blur-sm px-4 py-3 z-10">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon name="description" className="text-purple-500 text-xl" />
        <h1 class="text-lg font-semibold text-white">Proposal Editor</h1>
        {#if proposal}
          <span class="text-sm text-gray-400">
            {proposal.call_id}
          </span>
        {/if}
      </div>
      
      <!-- Mobile tab switcher -->
      {#if isMobileView}
        <div class="flex bg-gray-800 rounded-lg p-1">
          <button
            class="px-3 py-1 rounded text-sm font-medium transition-colors {
              activeTab === 'chat' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }"
            onclick={() => switchToTab('chat')}
          >
            Chat
          </button>
          <button
            class="px-3 py-1 rounded text-sm font-medium transition-colors {
              activeTab === 'document' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }"
            onclick={() => switchToTab('document')}
          >
            Document
          </button>
        </div>
      {/if}
      
      <!-- Error display -->
      {#if error}
        <div class="flex items-center gap-2 text-red-400 text-sm">
          <Icon name="error" />
          <span>{error}</span>
          <button
            class="ml-2 text-gray-400 hover:text-white"
            onclick={() => clearError()}
          >
            <Icon name="close" />
          </button>
        </div>
      {/if}
    </div>
  </header>

  <!-- Main content area -->
  <main class="flex-1 overflow-hidden {layoutClass}">
    <!-- Chat Panel -->
    <div class="{chatPanelClass} border-r border-gray-800 bg-gray-800/30 flex flex-col">
      <!-- Quick Actions -->
      <div class="p-4 border-b border-gray-700">
        <h3 class="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
        <div class="grid grid-cols-1 gap-2">
          {#each PROPOSAL_QUICK_ACTIONS as action}
            <button
              class="flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left disabled:opacity-50"
              onclick={() => handleQuickAction(action)}
              disabled={$streamingConversationStore.isProcessing}
            >
              <span class="text-lg">{action.icon}</span>
              <div class="flex-1">
                <div class="text-sm font-medium text-white">{action.label}</div>
                {#if action.description}
                  <div class="text-xs text-gray-400">{action.description}</div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Chat Interface -->
      <div class="flex-1 flex flex-col min-h-0">
        <ProposalChatInterface
          conversationId={conversationId}
          onMessageSent={handleMessageSent}
          onError={handleError}
        />
      </div>
    </div>

    <!-- Document Panel -->
    <div class="{documentPanelClass} bg-gray-900 flex flex-col">
      <ProposalDocumentViewer />
    </div>
  </main>

  <!-- Mobile overlay for active tab -->
  {#if isMobileView && activeTab === 'chat'}
    <div 
      class="fixed inset-0 bg-black/50 z-20 md:hidden"
      onclick={() => switchToTab('document')}
    ></div>
  {/if}
</div>

<style>
  /* Custom scrollbar styling */
  :global(.proposal-editor-layout ::-webkit-scrollbar) {
    width: 6px;
  }
  
  :global(.proposal-editor-layout ::-webkit-scrollbar-track) {
    background: transparent;
  }
  
  :global(.proposal-editor-layout ::-webkit-scrollbar-thumb) {
    background-color: rgba(64, 64, 64, 0.4);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }
  
  :global(.proposal-editor-layout ::-webkit-scrollbar-thumb:hover) {
    background-color: rgba(80, 80, 80, 0.7);
  }
</style>