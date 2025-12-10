<script lang="ts">
  import { proposalSessionStore, sessionMessages, isSessionStreaming, sessionThought } from '$lib/stores/proposalSessionStore';
  import { PROPOSAL_QUICK_ACTIONS } from '$lib/types/proposal';
  import type { QuickAction } from '$lib/types/proposal';
  import Icon from '$lib/components/generic/icon.svelte';
  
  interface Props {
    conversationId?: number; // Kept for prop compatibility, but unused
    onMessageSent?: () => void;
    onError?: (error: string) => void;
  }

  let { onMessageSent = () => {}, onError = () => {} }: Props = $props();
  
  let messagesContainer: HTMLElement;
  let showScrollDown = $state(false);
  let inputElement: HTMLInputElement;

  // Subscribe to derived stores
  const messages = sessionMessages;
  const isProcessing = isSessionStreaming;
  const currentThought = sessionThought;

  $effect(() => {
    if (messagesContainer) {
      updateScrollDownVisibility();
      scrollToBottom(); // Auto-scroll on new messages
    }
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

  async function handleSendMessage(message: string) {
    if (!message.trim() || $isProcessing) return;
    
    try {
      await proposalSessionStore.sendMessage(message);
      onMessageSent();
    } catch (error: any) {
      onError(error.message || 'Failed to send message');
    }
  }

  function handleQuickAction(action: QuickAction) {
    const message = getActionMessage(action.action);
    if (message) {
      handleSendMessage(message);
    }
  }

  function getActionMessage(action: string): string {
    // We could get context from the active section here if needed
    // For now returning generic templates
    switch (action) {
      case 'draft_next': return 'Draft the next logical section of the proposal based on context.';
      case 'improve': return 'Improve the current section content, making it more persuasive.';
      case 'be_specific': return 'Make the current section more specific and add measurable KPIs.';
      case 'add_examples': return 'Add relevant examples to the current section.';
      case 'compliance': return 'Check the current section for compliance with standard requirements.';
      default: return '';
    }
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
          disabled={$isProcessing}
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
  <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={messagesContainer} onscroll={updateScrollDownVisibility}>
    {#each $messages as message (message.id)}
      <div class="flex flex-col gap-2">
        <div class="flex items-start gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 {message.role === 'user' ? 'bg-purple-600' : 'bg-gray-700'}">
            {#if message.role === 'user'}
              <span class="text-xs">You</span>
            {:else}
              <span class="text-xs">AI</span>
            {/if}
          </div>
          
          <div class="flex-1 max-w-[85%]">
            <!-- Message Bubble -->
            <div class="bg-gray-800 rounded-lg p-3 text-white {message.role === 'user' ? 'bg-purple-900/50 border border-purple-700/50' : 'bg-gray-800 border border-gray-700'}">
              <div class="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>

            <!-- Thinking / Tool Logs (Only for Assistant) -->
            {#if message.role === 'assistant' && ((message.thinking && message.thinking.length > 0) || (message.toolCalls && message.toolCalls.length > 0))}
              <div class="mt-2 text-xs space-y-1">
                {#if message.thinking}
                  {#each message.thinking as thought}
                    <div class="flex items-start gap-2 text-gray-500 italic">
                      <span class="opacity-50">💭</span>
                      <span>{thought.thought}</span>
                    </div>
                  {/each}
                {/if}
                {#if message.toolCalls}
                  {#each message.toolCalls as tool}
                    <div class="flex items-start gap-2 text-blue-400/80">
                      <span class="opacity-50">🛠️</span>
                      <span>Called <code>{tool.tool_name}</code></span>
                    </div>
                  {/each}
                {/if}
                {#if message.sectionsAffected && message.sectionsAffected.length > 0}
                   <div class="flex items-start gap-2 text-green-400/80">
                      <span class="opacity-50">📝</span>
                      <span>Updated: {message.sectionsAffected.join(', ')}</span>
                    </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}

    <!-- Transient Thinking Indicator -->
    {#if $isProcessing && $currentThought}
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
          <span class="animate-pulse">⏳</span>
        </div>
        <div class="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
          <div class="flex items-center gap-2 text-gray-400 text-sm italic">
            <span class="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full"></span>
            <span>{$currentThought}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if showScrollDown}
    <button
      onclick={scrollToBottom}
      class="absolute bottom-20 right-4 z-40 w-8 h-8 rounded-full bg-gray-700 text-gray-300 opacity-80 hover:opacity-100 shadow-md transition-colors transition-opacity hover:bg-gray-600 focus:outline-none flex items-center justify-center border border-gray-600"
    >
      <Icon name="arrow_down" />
    </button>
  {/if}
  
  <!-- Input Area -->
  <div class="p-4 border-t border-gray-800 bg-gray-800/50">
    <div class="flex gap-2">
      <input
        bind:this={inputElement}
        type="text"
        onkeypress={(e) => e.key === 'Enter' && handleSendMessage(e.currentTarget.value)}
        placeholder={$isProcessing ? "AI is working..." : "Ask to write or improve a section..."}
        disabled={$isProcessing}
        class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
      />
      <button 
        onclick={() => {
          if (inputElement?.value) {
            handleSendMessage(inputElement.value);
            inputElement.value = '';
          }
        }}
        disabled={$isProcessing}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if $isProcessing}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <Icon name="send" />
        {/if}
      </button>
    </div>
  </div>
</div>