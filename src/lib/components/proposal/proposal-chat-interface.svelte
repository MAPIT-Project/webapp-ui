<script lang="ts">
  import { streamingConversationStore } from '$lib/stores/streamingConversationStore';
  import { streamingClient } from '$lib/clients/streamingConversationClient';
  import { 
    proposalStore, 
    currentSection, 
    updateSection, 
    getSection,
    setActiveSection
  } from '$lib/stores/proposalStore';
  import { PROPOSAL_QUICK_ACTIONS } from '$lib/types/proposal';
  import type { QuickAction } from '$lib/types/proposal';
  
  interface Props {
    conversationId: number;
    onMessageSent?: () => void;
    onError?: (error: string) => void;
  }

  let { conversationId, onMessageSent = () => {}, onError = () => {} }: Props = $props();
  
  let messagesContainer: HTMLElement;
  let showScrollDown = $state(false);
  let previewContent = $state('');
  let isGeneratingContent = $state(false);
  let targetSectionId = $state<string>('');
  let currentStreamingMessageId = $state<string>('');

  // Subscribe to store values
  let activeSection: string;
  let currentSectionData: any;

  proposalStore.subscribe(state => {
    activeSection = state.activeSection;
  });

  currentSection.subscribe(value => {
    currentSectionData = value;
  });

  function updateScrollDownVisibility() {
    if (!messagesContainer) return;
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    showScrollDown = distanceFromBottom > 120;
  }

  function scrollToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
  }
  
  $effect(() => {
    streamingConversationStore.setConversation(conversationId);
    if (conversationId) {
      streamingConversationStore.loadExistingMessages(conversationId);
    }
  });

  async function handleSendMessage(message: string) {
    if (!message.trim() || $streamingConversationStore.isProcessing) return;
    
    // Add user message
    streamingConversationStore.addUserMessage(message);
    
    // Start AI response
    const aiMessageId = streamingConversationStore.startAIResponse();
    currentStreamingMessageId = aiMessageId;
    
    // Check if this is a proposal editing request
    const isProposalEdit = isProposalEditingRequest(message);
    
    if (isProposalEdit) {
      isGeneratingContent = true;
      targetSectionId = determineTargetSection(message);
      previewContent = '';
    }
    
    // Send streaming request
    await streamingClient.sendStreamingMessage(
      conversationId,
      message,
      true, // include context
      
      // onProgress
      (stage: string, message: string, extras?: any) => {
        streamingConversationStore.updateStage({
          stage,
          message,
          timestamp: new Date().toISOString(),
          routingDecision: extras?.routingDecision,
          intentConfidence: extras?.intentConfidence
        });
      },
      
      // onToken
      (content: string) => {
        streamingConversationStore.appendToAIMessage(aiMessageId, content);
        
        // If this is a proposal edit, accumulate preview content
        if (isGeneratingContent) {
          previewContent += content;
        }
      },
      
      // onComplete
      async (metadata: any) => {
        streamingConversationStore.completeAIMessage(aiMessageId, metadata);
        
        // If this was a proposal edit, save the content
        if (isGeneratingContent && previewContent && targetSectionId) {
          await saveGeneratedContent(targetSectionId, previewContent);
        }
        
        isGeneratingContent = false;
        previewContent = '';
        targetSectionId = '';
        currentStreamingMessageId = '';
        
        onMessageSent();
      },
      
      // onError
      (error: string) => {
        streamingConversationStore.setError(error);
        isGeneratingContent = false;
        previewContent = '';
        targetSectionId = '';
        currentStreamingMessageId = '';
        onError(error);
      }
    );
  }
  
  function isProposalEditingRequest(message: string): boolean {
    const proposalKeywords = [
      'write', 'draft', 'create', 'generate', 'improve', 'edit', 'modify',
      'section', 'proposal', 'objectives', 'methodology', 'impact', 'implementation',
      'add', 'remove', 'update', 'revise', 'enhance'
    ];
    
    const lowerMessage = message.toLowerCase();
    return proposalKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  function determineTargetSection(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit section mentions
    if (lowerMessage.includes('objectives')) return 'excellence.objectives';
    if (lowerMessage.includes('methodology')) return 'excellence.methodology';
    if (lowerMessage.includes('state of the art') || lowerMessage.includes('background')) return 'excellence.state_of_art';
    if (lowerMessage.includes('innovation')) return 'excellence.innovation';
    if (lowerMessage.includes('impact strategy') || lowerMessage.includes('impact')) return 'impact.impact_strategy';
    if (lowerMessage.includes('dissemination')) return 'impact.dissemination';
    if (lowerMessage.includes('communication')) return 'impact.communication';
    if (lowerMessage.includes('exploitation')) return 'impact.exploitation';
    if (lowerMessage.includes('work plan') || lowerMessage.includes('workplan')) return 'implementation.work_plan';
    if (lowerMessage.includes('consortium')) return 'implementation.consortium';
    if (lowerMessage.includes('resources')) return 'implementation.resources';
    if (lowerMessage.includes('risk management') || lowerMessage.includes('risks')) return 'implementation.risk_management';
    
    // Default to current active section
    return activeSection;
  }
  
  async function saveGeneratedContent(sectionId: string, content: string) {
    try {
      await updateSection(sectionId, content);
      
      // Show success message in the current stage
      streamingConversationStore.updateStage({
        stage: 'content_saved',
        message: `✅ Content saved to ${getSection(sectionId)?.section_name || 'section'}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving generated content:', error);
      streamingConversationStore.updateStage({
        stage: 'save_error',
        message: '❌ Failed to save content. Please try again.',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  function handleSuggestionClick(suggestion: string) {
    handleSendMessage(suggestion);
  }
  
  function handleQuickAction(action: QuickAction) {
    const message = getActionMessage(action.action);
    if (message) {
      handleSendMessage(message);
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
  
  function handleStopGeneration() {
    streamingClient.closeConnection();
    streamingConversationStore.setError('Generation stopped by user');
    isGeneratingContent = false;
    previewContent = '';
    targetSectionId = '';
    currentStreamingMessageId = '';
  }
</script>

<div class="proposal-chat-interface h-full flex flex-col bg-gray-900">
  <!-- Header with Quick Actions -->
  <div class="border-b border-gray-800 p-4 bg-gray-800/50">
    <h3 class="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
    <div class="grid grid-cols-1 gap-2">
      {#each PROPOSAL_QUICK_ACTIONS as action}
        <button
          class="flex items-center gap-3 p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left disabled:opacity-50"
          onclick={() => handleQuickAction(action)}
          disabled={$streamingConversationStore.isProcessing}
        >
          <span class="text-sm">{action.icon}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-white truncate">{action.label}</div>
            {#if action.description}
              <div class="text-xs text-gray-400 truncate">{action.description}</div>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Messages Container -->
  <div class="flex-1 overflow-y-auto p-4" bind:this={messagesContainer} onscroll={updateScrollDownVisibility}>
    {#each $streamingConversationStore.messages as message (message.id)}
      <div class="mb-4">
        <div class="bg-gray-800 rounded-lg p-3 text-white">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center {message.sender === 'user' ? 'bg-purple-600' : 'bg-gray-700'}">
              {#if message.sender === 'user'}
                <span class="text-xs">You</span>
              {:else}
                <span class="text-xs">AI</span>
              {/if}
            </div>
            <div class="flex-1">
              <div class="text-sm">{message.text}</div>
            </div>
          </div>
        </div>
        
        <!-- Show content preview when generating proposal content -->
        {#if isGeneratingContent && message.id === currentStreamingMessageId && previewContent}
          <div class="mt-2 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-purple-400">
                Preview: {getSection(targetSectionId)?.section_name || 'Section'}
              </span>
              <button
                class="text-xs text-red-400 hover:text-red-300"
                onclick={handleStopGeneration}
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="text-sm text-gray-300 prose prose-invert max-w-none">
              {@html previewContent}
            </div>
            {#if isGeneratingContent}
              <div class="flex items-center gap-2 mt-2">
                <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span class="text-xs text-purple-400">Generating...</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Processing stage indicator -->
    {#if $streamingConversationStore.currentStage}
      <div class="mb-4">
        <div class="bg-gray-800 rounded-lg p-3 text-gray-300 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>{$streamingConversationStore.currentStage.message}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if showScrollDown}
    <button
      onclick={scrollToBottom}
      class="absolute bottom-20 right-4 z-40 w-8 h-8 rounded-full bg-gray-700 text-gray-300 opacity-80 hover:opacity-100 shadow-md transition-colors transition-opacity hover:bg-gray-600 focus:outline-none flex items-center justify-center border border-gray-600"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    </button>
  {/if}
  
  <!-- Follow-up Suggestions -->
  {#if $streamingConversationStore.followUpSuggestions.length > 0 && !$streamingConversationStore.isProcessing}
    <div class="p-4 border-t border-gray-800 bg-gray-800/30">
      <div class="flex flex-wrap gap-2">
        {#each $streamingConversationStore.followUpSuggestions as suggestion}
          <button
            class="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 transition-colors"
            onclick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Input Area -->
  <div class="p-4 border-t border-gray-800 bg-gray-800/50">
    <div class="flex gap-2">
      <input
        type="text"
        onkeypress={(e) => e.key === 'Enter' && handleSendMessage(e.currentTarget.value)}
        placeholder="Ask me to write or improve any section..."
        disabled={$streamingConversationStore.isProcessing}
        class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
      />
      <button 
        onclick={() => {
          const input = document.querySelector('.proposal-chat-interface input') as HTMLInputElement;
          if (input?.value) {
            handleSendMessage(input.value);
            input.value = '';
          }
        }}
        disabled={$streamingConversationStore.isProcessing}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if $streamingConversationStore.isProcessing}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar styling */
  .proposal-chat-interface ::-webkit-scrollbar {
    width: 4px;
  }
  
  .proposal-chat-interface ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .proposal-chat-interface ::-webkit-scrollbar-thumb {
    background-color: rgba(64, 64, 64, 0.4);
    border-radius: 2px;
  }
  
  .proposal-chat-interface ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(80, 80, 80, 0.7);
  }
</style>