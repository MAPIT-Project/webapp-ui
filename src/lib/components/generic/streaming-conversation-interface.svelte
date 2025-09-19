<script lang="ts">
  import { streamingConversationStore, conversationSummary } from '$lib/stores/streamingConversationStore';
  import { streamingClient } from '$lib/clients/streamingConversationClient';
  import StreamingMessageBubble from './streaming-message-bubble.svelte';
  import ProcessingStageIndicator from './processing-stage-indicator.svelte';
  import FollowUpSuggestions from './follow-up-suggestions.svelte';
  
  export let conversationId: number;
  export let onMessageSent: () => void = () => {};
  export let onError: (error: string) => void = () => {};
  
  import Icon from '$lib/components/generic/icon.svelte';
  let messagesContainer: HTMLElement;
  let showScrollDown = false;

  function updateScrollDownVisibility() {
    if (!messagesContainer) return;
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    showScrollDown = distanceFromBottom > 120;
  }

  function scrollToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
  }
  
  $: {
    streamingConversationStore.setConversation(conversationId);
    if (conversationId) {
      streamingConversationStore.loadExistingMessages(conversationId);
    }
  }
  
  function scrollElementTopIntoView(container: HTMLElement, element: HTMLElement) {
    try {
      const containerRect = container.getBoundingClientRect();
      const elRect = element.getBoundingClientRect();
      const top = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: Math.max(top - 72, 0), behavior: 'smooth' });
    } catch (e) {
      console.error('Scroll error', e);
    }
  }

  // Anchor to the top of the latest AI message instead of the bottom
  $: if ($streamingConversationStore.messages.length > 0) {
    setTimeout(() => {
      const msgs = $streamingConversationStore.messages;
      const lastAi = [...msgs].reverse().find((m) => m.sender === 'ai');
      if (!messagesContainer || !lastAi) return;
      const el = document.getElementById(`stream-msg-${lastAi.id}`) as HTMLElement | null;
      if (el) {
        scrollElementTopIntoView(messagesContainer, el);
      }
    }, 100);
  }
  
  async function handleSendMessage(message: string) {
    if (!message.trim() || $streamingConversationStore.isProcessing) return;
    
    const userMessage = message;
    
    // Add user message
    streamingConversationStore.addUserMessage(userMessage);
    
    // Start AI response
    const aiMessageId = streamingConversationStore.startAIResponse();
    
    // Send streaming request
    await streamingClient.sendStreamingMessage(
      conversationId,
      userMessage,
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
      },
      
      // onComplete
      (metadata: any) => {
        streamingConversationStore.completeAIMessage(aiMessageId, metadata);
        onMessageSent();
      },
      
      // onError
      (error: string) => {
        streamingConversationStore.setError(error);
        onError(error);
      }
    );
  }
  
  function handleSuggestionClick(suggestion: string) {
    handleSendMessage(suggestion);
  }
</script>

<div class="streaming-conversation-container">
  <!-- Context and Status Header -->
  {#if $conversationSummary.hasContext}
    <div class="conversation-header">
      <div class="context-info">
        💬 {$conversationSummary.messageCount} messages • 
        📊 {$conversationSummary.projectCount} projects discussed
      </div>
    </div>
  {/if}
  
  <!-- Messages Container -->
  <div class="messages-container" bind:this={messagesContainer} onscroll={updateScrollDownVisibility}>
    {#each $streamingConversationStore.messages as message (message.id)}
      <div id={"stream-msg-" + message.id}>
        <StreamingMessageBubble 
          {message}
          isStreaming={message.isStreaming}
        />
      </div>
    {/each}
  </div>

  {#if showScrollDown}
    <button
      onclick={scrollToBottom}
      class="scroll-down-btn"
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      <Icon name="arrow_downward" className="text-white text-xl" />
    </button>
  {/if}
  
  <!-- Follow-up Suggestions -->
  {#if $streamingConversationStore.followUpSuggestions.length > 0 && !$streamingConversationStore.isProcessing}
    <FollowUpSuggestions
      suggestions={$streamingConversationStore.followUpSuggestions}
      onSelect={handleSuggestionClick}
    />
  {/if}
  
  <!-- Input Area -->
  <div class="input-container">
    <input
      type="text"
      onkeypress={(e) => e.key === 'Enter' && handleSendMessage(e.currentTarget.value)}
      placeholder={$conversationSummary.hasContext 
        ? "Ask a follow-up question..." 
        : "Ask about European research projects..."}
      disabled={$streamingConversationStore.isProcessing}
      class:disabled={$streamingConversationStore.isProcessing}
    />
    <button 
      onclick={() => handleSendMessage((document.querySelector('.input-container input') as HTMLInputElement)?.value || '')}
      disabled={$streamingConversationStore.isProcessing}
      class:loading={$streamingConversationStore.isProcessing}
    >
      {#if $streamingConversationStore.isProcessing}
        <span class="spinner"></span>
      {:else}
        Send
      {/if}
    </button>
  </div>
</div>

<style>
  .streaming-conversation-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 900px;
    margin: 0 auto;
    background: #121212; /* palette.primary.background */
  }
  
  .conversation-header {
    padding: 1rem;
    background: #1E1E1E; /* palette.primary.surface */
    border-bottom: 1px solid #3A3A3A; /* palette.secondary.main */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .context-info {
    font-size: 0.9rem;
    color: #B0B0B0; /* palette.text.secondary */
  }
  
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #121212; /* palette.primary.background */
  }

  .scroll-down-btn {
    position: fixed;
    right: 1.5rem;
    bottom: 7rem;
    z-index: 40;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    background: #2C2C2C; /* palette.secondary.dark */
    color: #E0E0E0; /* palette.text.primary */
    border: 1px solid #4F4F4F; /* components.input.border */
    box-shadow: 0 10px 15px rgba(0,0,0,0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: background-color 0.2s ease, opacity 0.2s ease;
  }

  .scroll-down-btn:hover {
    background: #4F4F4F; /* palette.secondary.light */
    opacity: 1;
  }
  
  .input-container {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: #1E1E1E; /* palette.primary.surface */
    border-top: 1px solid #3A3A3A; /* palette.secondary.main */
  }
  
  input {
    flex: 1;
    padding: 12px; /* components.input.padding */
    background: #2C2C2C; /* palette.secondary.dark */
    border: 1px solid #4F4F4F; /* components.input.border */
    border-radius: 8px; /* components.input.borderRadius */
    font-size: 1rem;
    color: #E0E0E0; /* palette.text.primary */
    transition: border-color 0.3s ease;
  }
  
  input::placeholder {
    color: #B0B0B0; /* palette.text.secondary */
  }
  
  input:focus {
    outline: none;
    border-color: #8A2BE2; /* palette.accent.main */
  }
  
  input.disabled {
    background: #3A3A3A; /* palette.secondary.main */
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  button {
    padding: 10px 16px; /* components.button.base.padding */
    background: #8A2BE2; /* palette.accent.main */
    color: #FFFFFF; /* palette.accent.contrastText */
    border: none;
    border-radius: 8px; /* components.button.base.borderRadius */
    cursor: pointer;
    font-weight: 500; /* components.button.base.fontWeight */
    font-size: 1rem;
    transition: background-color 0.3s ease; /* components.button.base.transition */
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  button:hover:not(:disabled) {
    background: #A052E8; /* palette.accent.light */
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>