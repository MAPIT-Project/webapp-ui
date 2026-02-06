<script lang="ts">
  import { conversationContextStore, contextSummary } from '$lib/stores/conversationContextStore';
  import { sendContextualMessage } from '$lib/clients/contextService';
  import { getConversationContext } from '$lib/clients/contextService';
  import FollowUpSuggestions from './follow-up-suggestions.svelte';

  let { 
    conversationId,
    onMessageSent = () => {},
    onError = () => {}
  } = $props();

  let userInput = $state('');
  let isLoading = $state(false);
  let isSending = $state(false);
  let error = $state<string | null>(null);

  // Initialize conversation context
  $effect(() => {
    if (conversationId) {
      conversationContextStore.setConversation(conversationId);
      loadConversationContext();
    }
  });

  async function loadConversationContext() {
    try {
      isLoading = true;
      const context = await getConversationContext(conversationId);
      
      // Update store with context data
      conversationContextStore.updateProjects(context.projects_discussed || []);
      conversationContextStore.updateTopics(context.topics || []);
      conversationContextStore.updateQueryType(context.last_query_type || '');
      
    } catch (err) {
      console.error('Error loading conversation context:', err);
      error = 'Failed to load conversation context';
    } finally {
      isLoading = false;
    }
  }

  async function handleSendMessage(message: string = userInput) {
    if (!message.trim() || isSending) return;

    isSending = true;
    error = null;
    const currentInput = message;
    userInput = '';

    try {
      // Send contextual message
      const response = await sendContextualMessage(
        conversationId,
        currentInput,
        $conversationContextStore.isContextual
      );

      // Add user message to context
      conversationContextStore.addMessage({
        text: currentInput,
        sender: 'user',
        timestamp: new Date().toISOString()
      });

      // Add AI response to context
      conversationContextStore.addMessage({
        text: response.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      });

      // Update context with new information
      if (response.projects_discussed) {
        conversationContextStore.updateProjects(response.projects_discussed);
      }

      if (response.follow_up_suggestions) {
        conversationContextStore.updateSuggestions(response.follow_up_suggestions);
      }

      // Show resolved question if different
      if (response.resolved_question && response.resolved_question !== currentInput) {
        conversationContextStore.addMessage({
          text: `Understood as: "${response.resolved_question}"`,
          sender: 'system',
          timestamp: new Date().toISOString()
        });
      }

      // Call parent callback
      onMessageSent?.(response);

    } catch (err) {
      console.error('Failed to send message:', err);
      error = err instanceof Error ? err.message : 'Failed to send message';
      onError?.(error);
      
      // Restore input if sending failed
      userInput = currentInput;
    } finally {
      isSending = false;
    }
  }

  function handleFollowUpSelect(suggestion: string) {
    handleSendMessage(suggestion);
  }

  function handleToggleContext() {
    conversationContextStore.toggleContext();
  }

  // Expose methods for parent component
  $inspect({
    sendMessage: handleSendMessage,
    clearError: () => error = null,
    getContext: () => $conversationContextStore
  });
</script>

<div class="context-chat-interface">

  <!-- Follow-up Suggestions -->
  {#if $conversationContextStore.followUpSuggestions.length > 0 && !isSending}
    <FollowUpSuggestions 
      suggestions={$conversationContextStore.followUpSuggestions}
      onSelect={handleFollowUpSelect}
    />
  {/if}

  <!-- Input Area -->
  <div class="input-container">
    <div class="input-wrapper">
      <input
        type="text"
        bind:value={userInput}
        on:keypress={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder={$contextSummary.hasContext 
          ? "Ask a follow-up question..." 
          : "Ask about European research projects..."}
        disabled={isSending}
        class="chat-input"
      />
      
      <button 
        on:click={() => handleSendMessage()}
        disabled={!userInput.trim() || isSending}
        class="send-button"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    {/if}

    <!-- Context Status -->
    <div class="context-status">
      <span class="status-text">
        {#if $conversationContextStore.isContextual}
          Context-aware mode: AI will remember previous messages
        {:else}
          Standard mode: Each message is processed independently
        {/if}
      </span>
    </div>
  </div>
</div>

<style>
  .context-chat-interface {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .input-container {
    margin-top: 20px;
  }

  .input-wrapper {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #4b5563;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #e5e7eb;
    font-size: 14px;
    transition: border-color 0.2s ease;
  }

  .chat-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-button {
    padding: 12px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    min-width: 80px;
  }

  .send-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .send-button:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    color: #ef4444;
    font-size: 14px;
  }

  .error-icon {
    font-size: 16px;
  }

  .context-status {
    margin-top: 8px;
    text-align: center;
  }

  .status-text {
    font-size: 12px;
    color: #9ca3af;
    font-style: italic;
  }
</style>