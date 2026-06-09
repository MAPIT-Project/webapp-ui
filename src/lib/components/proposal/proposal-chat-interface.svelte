<script lang="ts">
  import { proposalSessionStore, sessionMessages, isSessionStreaming, sessionThought } from '$lib/stores/proposalSessionStore';
  import { PROPOSAL_QUICK_ACTIONS } from '$lib/types/proposal';
  import type { QuickAction } from '$lib/types/proposal';
  import Icon from '$lib/components/generic/icon.svelte';
  import AgentReasoningView from '$lib/components/generic/agent-reasoning-view.svelte';
  import ChatInput from '../../../routes/(protected)/dashboard/conversations/[conversation_id]/components/ChatInput.svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  
  interface Props {
    conversationId?: number; // Kept for prop compatibility, but unused
    onMessageSent?: () => void;
    onError?: (error: string) => void;
  }

  let { onMessageSent = () => {}, onError = () => {} }: Props = $props();
  
  let messagesContainer: HTMLElement;
  let showScrollDown = $state(false);
  let userInput = $state('');
  let isSending = $state(false);

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

  async function handleSendMessage() {
    if (!userInput.trim() || $isProcessing || isSending) return;
    
    isSending = true;
    const currentInput = userInput;
    userInput = '';

    try {
      await proposalSessionStore.sendMessage(currentInput);
      onMessageSent();
    } catch (error: any) {
      onError(error.message || 'Failed to send message');
      // On error, we might want to restore the input, but skipping for simplicity
    } finally {
      isSending = false;
    }
  }

  function handleQuickAction(action: QuickAction) {
    const message = getActionMessage(action.action);
    if (message) {
      userInput = message;
      handleSendMessage();
    }
  }

  function getActionMessage(action: string): string {
    switch (action) {
      case 'draft_next': return 'Draft the next logical section of the proposal based on context.';
      case 'improve': return 'Improve the current section content, making it more persuasive.';
      case 'be_specific': return 'Make the current section more specific and add measurable KPIs.';
      case 'add_examples': return 'Add relevant examples to the current section.';
      case 'compliance': return 'Check the current section for compliance with standard requirements.';
      default: return '';
    }
  }

  // Formatting helpers from ChatMessage.svelte
  function formatMessageTime(date: Date | string): string {
    if (!date) return '';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  function renderMarkdown(text: string): string {
    try {
      marked.setOptions({ gfm: true, breaks: true });
      const cleaned = String(text || '').replace(/^[\s\uFEFF\xA0]+/, '').replace(/\n{3,}/g, '\n\n');
      const parsed = marked.parse(cleaned) as string;
      let sanitized = DOMPurify.sanitize(parsed) as string;
      sanitized = sanitized.replace(/<a\s+href="([^"]*)"([^>]*)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer"$2>');
      return sanitized;
    } catch (error) {
      return text;
    }
  }

  function highlightMapitInMessage(text: string): string {
    return text.replace(/@mapit\b/gi, '<span class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-1 py-0.5 rounded font-semibold text-sm shadow-sm border border-emerald-400/30">@mapit</span>');
  }

  function renderMessageContent(content: string): string {
    let highlighted = highlightMapitInMessage(content);
    return renderMarkdown(highlighted);
  }

  // Combine thinking and tool calls into the array expected by AgentReasoningView
  function getAgentEvents(message: any): any[] {
    const events: any[] = [];
    if (message.thinking && Array.isArray(message.thinking)) {
      message.thinking.forEach((t: any) => events.push({ ...t, type: 'agent_thinking' }));
    }
    if (message.toolCalls && Array.isArray(message.toolCalls)) {
      message.toolCalls.forEach((t: any) => events.push({ ...t, type: 'tool_call' }));
    }
    // Simple sort to roughly interleave them based on array index, or rely on them being chronological if possible
    // For now they are separate arrays in the store, so we just concat them.
    return events;
  }

</script>

<div class="proposal-chat-interface h-full flex flex-col bg-transparent relative overflow-hidden">
  <!-- Subtle pattern overlay -->
  <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:24px_24px] opacity-[0.015]"></div>

  <div class="relative z-10 flex h-full w-full flex-1 flex-col overflow-hidden">
    <!-- Header with Quick Actions -->
    <div class="border-b border-gray-800/50 p-3 bg-[#1E1E1E]/20 backdrop-blur-sm z-20">
      <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</h3>
      <div class="flex flex-wrap gap-1.5">
        {#each PROPOSAL_QUICK_ACTIONS as action}
          <button
            class="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2A2A2A]/40 hover:bg-[#333333]/80 border border-[#404040]/50 rounded-lg transition-all duration-200 text-left disabled:opacity-50 group shadow-sm hover:shadow-md hover:border-gray-500/50"
            onclick={() => handleQuickAction(action)}
            disabled={$isProcessing}
          >
            <span class="text-blue-400/80 group-hover:text-blue-400 transition-colors text-xs">{action.icon}</span>
            <span class="text-[11px] font-medium text-gray-300">{action.label}</span>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Messages Container -->
    <div 
      class="scrollbar-thin flex-1 overflow-y-auto px-6 py-6" 
      bind:this={messagesContainer} 
      onscroll={updateScrollDownVisibility}
    >
      <div class="mx-auto max-w-4xl space-y-8 pb-4">
        {#each $messages as message, idx}
          {@const isGrouped = idx > 0 && $messages[idx - 1].role === message.role}
          {@const agentEvents = getAgentEvents(message)}
          <div class="group relative {isGrouped ? 'mt-2' : 'mt-8'} animate-[fadeInUp_0.3s_ease-out]">
            <div class="flex items-start gap-4 {message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
              
              <!-- Avatar -->
              <div class="flex-shrink-0 {isGrouped ? 'invisible' : ''}">
                {#if message.role === 'user'}
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 shadow-lg">
                    <Icon name="person" className="text-white text-sm" />
                  </div>
                {:else}
                  <div class="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-lg">
                    <img src="/images/mapit_logo_no_bg.png" class="size-4 object-contain" alt="MAPIT Logo" />
                  </div>
                {/if}
              </div>

              <!-- Message Bubble -->
              <div class="max-w-full flex-1 min-w-0 {message.role === 'user' ? 'text-right' : 'text-left'}">
                <div class="inline-block align-top">
                  {#if message.role === 'user'}
                    <div class="relative rounded-lg px-3 py-2 text-white {isGrouped ? 'rounded-tr-lg' : 'rounded-tr-sm'} backdrop-blur-sm bg-[#1E1E1E]/50">
                      <div class="prose prose-sm max-w-none">
                        <p class="m-0 whitespace-pre-wrap text-sm leading-relaxed">
                          {@html highlightMapitInMessage(message.content)}
                        </p>
                      </div>
                      <div class="text-right">
                        <span class="text-xs text-gray-500/70 font-medium">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  {:else}
                    <div class="group/ai relative inline-block max-w-full align-top min-w-0">
                      
                      <!-- Agent Reasoning -->
                      {#if agentEvents && agentEvents.length > 0}
                        <div class="mb-2">
                          <AgentReasoningView 
                            events={agentEvents}
                            isProcessing={$isProcessing && idx === $messages.length - 1}
                            hasContent={!!message.content}
                          />
                        </div>
                      {/if}

                      <div class="rounded-lg border-0 px-2 text-gray-100 {isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm'} backdrop-blur-sm overflow-x-auto min-w-0">
                        {#if message.content}
                          <div class="[&>p:first-child]:!mt-0 prose prose-sm prose-invert max-w-full leading-relaxed break-words [&>*]:text-gray-100 [&_a:hover]:text-blue-300 [&_a]:text-blue-400 [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:rounded [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-400/5 [&_blockquote]:p-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-300 [&_hr]:block [&_hr]:my-6 [&_hr]:border-t [&_hr]:border-slate-600/20 [&_code]:rounded [&_code]:border [&_code]:border-indigo-500/20 [&_code]:bg-indigo-500/15 [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:font-medium [&_code]:text-indigo-200 [&_em]:text-blue-300 [&_h1]:!text-white [&_h1:first-child]:mt-0 [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-xl [&_h2]:!text-white [&_h2:first-child]:mt-0 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h3]:!text-white [&_h3:first-child]:mt-0 [&_h3]:mb-2 [&_h3]:mt-2 [&_h3]:text-base [&_li]:my-1 [&_li]:text-gray-200 [&_ol]:my-3 [&_ol_li::marker]:text-gray-400 [&_p:last-child]:mb-0 [&_p]:mb-3 [&_p]:text-gray-100 [&_p]:leading-relaxed [&_p:not(:first-child)]:mt-2 [&_p:has(>strong:first-child)]:mt-6 [&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-indigo-500/20 [&_pre]:bg-slate-900/40 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre_code]:border-none [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-200 [&_strong]:text-white [&_table]:my-4 [&_table]:w-full [&_table]:overflow-x-auto [&_table]:rounded [&_td]:border-b [&_td]:border-slate-600/20 [&_td]:p-3 [&_td]:text-gray-200 [&_th]:border-b-2 [&_th]:border-indigo-500/30 [&_th]:bg-slate-700/50 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:text-white [&_tr:nth-child(even)]:bg-slate-700/20 [&_ul]:my-3 [&_ul_li::marker]:text-gray-400 [&_ul_ul]:mb-2 [&_ul_ul]:mt-2 [&_ul_ul]:rounded [&_ul_ul]:border [&_ul_ul]:border-slate-600/10 [&_ul_ul]:bg-slate-900/20 [&_ul_ul]:p-2 [&_ul_ul_li]:my-1 [&_ul_ul_li]:text-sm">
                            {@html renderMessageContent(message.content)}
                          </div>
                        {/if}
                        
                        {#if message.sectionsAffected && message.sectionsAffected.length > 0}
                          <div class="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
                            <Icon name="edit_document" className="text-xs" />
                            <span>Updated: {message.sectionsAffected.join(', ')}</span>
                          </div>
                        {/if}

                        <div class="text-right">
                          <span class="text-xs text-gray-500/70 font-medium">
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
        
        <!-- Transient Thinking Indicator -->
        {#if $isProcessing && $currentThought && $messages.length === 0}
          <div class="flex items-start gap-3 mt-8">
            <div class="w-8 h-8 rounded-full border border-white/10 bg-white/5 shadow-lg flex items-center justify-center shrink-0">
               <img src="/images/mapit_logo_no_bg.png" class="size-4 object-contain animate-pulse" alt="MAPIT Logo" />
            </div>
            <div class="bg-[#1A1A1A]/80 border border-gray-800 rounded-xl p-3 shadow-sm backdrop-blur-sm">
              <div class="flex items-center gap-3 text-gray-400 text-sm">
                <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="italic">{$currentThought}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Scroll Down Button -->
    {#if showScrollDown}
      <button
        onclick={scrollToBottom}
        class="absolute bottom-28 right-8 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#2A2A2A] text-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-gray-700/50 hover:bg-[#3A3A3A] hover:text-white transition-all duration-200"
      >
        <Icon name="arrow_downward" className="text-xl" />
      </button>
    {/if}
    
    <!-- Chat Input Area (Reusing Personal Chat styling) -->
    <div class="w-full bg-transparent px-4 pb-2 pt-2 z-20">
      <ChatInput
        {userInput}
        isStreaming={$isProcessing}
        {isSending}
        streamingProgress={$currentThought || 'Generating section...'}
        onInputChange={(val) => userInput = val}
        onSubmit={handleSendMessage}
        onStopStreaming={() => {}}
      />
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar styling matches personal chat */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
  }
  .scrollbar-thin:hover::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
