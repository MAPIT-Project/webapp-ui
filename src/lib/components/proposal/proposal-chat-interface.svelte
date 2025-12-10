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

<div class="proposal-chat-interface h-full flex flex-col bg-transparent">
  <!-- Header with Quick Actions -->
  <div class="border-b border-[#40404033] p-4 bg-[#1E1E1E]/30">
    <h3 class="text-xs font-semibold text-[#B0B0B0] uppercase tracking-wider mb-3">Quick Actions</h3>
    <div class="grid grid-cols-1 gap-2">
      {#each PROPOSAL_QUICK_ACTIONS as action}
        <button
          class="flex items-center gap-3 p-3 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#4F4F4F] rounded-xl transition-all duration-200 text-left disabled:opacity-50 group"
          onclick={() => handleQuickAction(action)}
          disabled={$isProcessing}
        >
          <span class="text-[#3B82F6] group-hover:text-white transition-colors">{action.icon}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-medium text-[#F5F5F5] truncate">{action.label}</div>
            {#if action.description}
              <div class="text-[10px] text-[#B0B0B0] truncate">{action.description}</div>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Messages Container -->
  <div class="flex-1 overflow-y-auto p-4 space-y-6" bind:this={messagesContainer} onscroll={updateScrollDownVisibility}>
    {#each $messages as message (message.id)}
      <div class="flex flex-col gap-2">
        <div class="flex items-start gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
          <!-- Avatar -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#4F4F4F] shadow-sm
            {message.role === 'user' ? 'bg-[#3B82F6] border-[#2563EB]' : 'bg-[#1E1E1E]'}">
            {#if message.role === 'user'}
              <span class="text-xs font-bold text-white">You</span>
            {:else}
              <span class="text-xs font-bold text-[#3B82F6]">AI</span>
            {/if}
          </div>
          
          <div class="flex-1 max-w-[85%]">
            <!-- Message Bubble -->
            <div class="rounded-2xl p-4 shadow-sm backdrop-blur-sm
              {message.role === 'user' 
                ? 'bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#93C5FD]' 
                : 'bg-[#1E1E1E] border border-[#4F4F4F] text-[#F5F5F5]'}">
              <div class="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
            </div>

            <!-- Thinking / Tool Logs (Only for Assistant) -->
            {#if message.role === 'assistant' && ((message.thinking && message.thinking.length > 0) || (message.toolCalls && message.toolCalls.length > 0))}
              <div class="mt-3 pl-2 text-xs space-y-2 border-l-2 border-[#40404033] ml-2">
                {#if message.thinking}
                  {#each message.thinking as thought}
                    <div class="flex items-start gap-2 text-[#6B7280]">
                      <span class="opacity-70">💭</span>
                      <span class="italic">{thought.thought}</span>
                    </div>
                  {/each}
                {/if}
                {#if message.toolCalls}
                  {#each message.toolCalls as tool}
                    <div class="flex items-start gap-2 text-[#3B82F6]/80">
                      <span class="opacity-70">🛠️</span>
                      <span>Called <code class="px-1 py-0.5 bg-[#1E1E1E] border border-[#4F4F4F] rounded text-[#3B82F6]">{tool.tool_name}</code></span>
                    </div>
                  {/each}
                {/if}
                {#if message.sectionsAffected && message.sectionsAffected.length > 0}
                   <div class="flex items-start gap-2 text-[#4CAF50]/80">
                      <span class="opacity-70">📝</span>
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
        <div class="w-8 h-8 rounded-full bg-[#1E1E1E] border border-[#4F4F4F] flex items-center justify-center shrink-0">
          <span class="animate-pulse text-xs">AI</span>
        </div>
        <div class="bg-[#1E1E1E]/50 border border-[#3B82F6]/30 rounded-xl p-3">
          <div class="flex items-center gap-3 text-[#B0B0B0] text-sm">
            <div class="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
            <span class="italic">{$currentThought}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if showScrollDown}
    <button
      onclick={scrollToBottom}
      class="absolute bottom-24 right-6 z-40 w-10 h-10 rounded-full bg-[#1E1E1E] text-[#F5F5F5] border border-[#4F4F4F] shadow-lg hover:bg-[#2A2A2A] transition-all flex items-center justify-center"
    >
      <Icon name="arrow_down" />
    </button>
  {/if}
  
  <!-- Input Area -->
  <div class="p-4 border-t border-[#40404033] bg-[#1E1E1E]/30 backdrop-blur-sm">
    <div class="flex gap-3">
      <input
        bind:this={inputElement}
        type="text"
        onkeypress={(e) => e.key === 'Enter' && handleSendMessage(e.currentTarget.value)}
        placeholder={$isProcessing ? "AI is working..." : "Ask to write or improve a section..."}
        disabled={$isProcessing}
        class="flex-1 px-4 py-3 bg-[#1F2937]/50 border border-[#3B82F6]/50 rounded-xl text-[#F5F5F5] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/50 disabled:opacity-50 transition-all"
      />
      <button 
        onclick={() => {
          if (inputElement?.value) {
            handleSendMessage(inputElement.value);
            inputElement.value = '';
          }
        }}
        disabled={$isProcessing}
        class="px-5 py-3 bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] shadow-lg shadow-blue-900/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
