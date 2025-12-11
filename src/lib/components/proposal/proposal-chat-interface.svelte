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
    <div class="relative mx-auto max-w-4xl">
       <div
            class="relative rounded-2xl border border-gray-600/30 bg-[#2A2A2A]/50 backdrop-blur-sm transition-all focus-within:border-gray-600/50 focus-within:ring-2 focus-within:ring-gray-600/50"
        >
      <input
        bind:this={inputElement}
        type="text"
        onkeypress={(e) => e.key === 'Enter' && handleSendMessage(e.currentTarget.value)}
        placeholder={$isProcessing ? "AI is working..." : "Ask to write or improve a section..."}
        disabled={$isProcessing}
        class="w-full rounded-2xl bg-transparent px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none"
      />
      
      <button 
        onclick={() => {
          if (inputElement?.value) {
            handleSendMessage(inputElement.value);
            inputElement.value = '';
          }
        }}
        disabled={$isProcessing || !inputElement?.value?.trim()}
        class="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-xl border px-2 py-2 transition-all duration-200 {inputElement?.value?.trim() && !$isProcessing
						? 'border-blue-500/30 bg-blue-500/20 text-blue-300 hover:border-blue-400 hover:text-blue-200'
						: 'border-gray-600/50 text-gray-500'}"
      >
        {#if $isProcessing}
           <!-- Simple spinner for processing state -->
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        {:else}
            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
        {/if}
      </button>
      </div>
       <!-- Input hint -->
		<div class="mt-2 text-center">
			<p class="text-xs text-gray-600">
				{#if $isProcessing}
					AI is generating content...
				{:else}
					Press Enter to send • AI can make mistakes, verify important information
				{/if}
			</p>
		</div>
    </div>
  </div>
</div>
