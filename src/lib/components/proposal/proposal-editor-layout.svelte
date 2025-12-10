<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    proposalSessionStore
  } from '$lib/stores/proposalSessionStore';
  import ProposalDocumentViewer from './proposal-document-viewer.svelte';
  import ProposalChatInterface from './proposal-chat-interface.svelte';
  import Icon from '$lib/components/generic/icon.svelte';

  interface Props {
    proposalId: number;
    conversationId?: number;
    userId?: string;
  }

  // Props are kept for compatibility but largely handled by store initialization
  let { proposalId }: Props = $props();

  let isMobileView = $state(false);
  let activeTab = $state<'chat' | 'document'>('chat');
  
  // Store values
  let storeState: any;
  let error: string | null = null;
  let title: string | null = null;

  proposalSessionStore.subscribe(state => {
    storeState = state;
    error = state.error;
    title = state.title;
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

  function clearError() {
    // proposalSessionStore.clearError(); // If we add this action
    // For now, simple reactivity or manual store update if exposed
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
        {#if title}
          <span class="text-sm text-gray-400">
            {title}
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
        </div>
      {/if}
    </div>
  </header>

  <!-- Main content area -->
  <main class="flex-1 overflow-hidden {layoutClass}">
    <!-- Chat Panel -->
    <div class="{chatPanelClass} border-r border-gray-800 bg-gray-800/30 flex flex-col">
      <!-- Chat Interface -->
      <div class="flex-1 flex flex-col min-h-0">
        <ProposalChatInterface />
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