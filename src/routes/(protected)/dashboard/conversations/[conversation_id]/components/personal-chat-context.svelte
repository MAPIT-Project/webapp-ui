<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getConversationMessages, addUserMessage, addAIMessage } from '$lib/clients/conversationService';
  import { sendContextualMessage } from '$lib/clients/contextService';
  import { getConversationContext } from '$lib/clients/contextService';
  import type { Message, Conversation } from '$lib/types/schema';
  import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';
  import { conversationStore } from '$lib/stores/conversationStore';
  import { conversationContextStore, contextSummary } from '$lib/stores/conversationContextStore';

  // Import components
  import ChatHeader from './ChatHeader.svelte';
  import ChatMessage from './ChatMessage.svelte';
  import TypingIndicator from './TypingIndicator.svelte';
  import ErrorMessage from './ErrorMessage.svelte';
  import EmptyState from './EmptyState.svelte';
  import LoadingState from './LoadingState.svelte';
  import FollowUpSuggestions from '$lib/components/generic/follow-up-suggestions.svelte';

  interface Props {
    conversationId: number;
  }

  let { conversationId }: Props = $props();

  // State using runes
  let userInput = $state('');
  let messages = $state<Message[]>([]);
  let conversation = $state<Conversation | null>(null);
  let isLoading = $state(false);
  let isSending = $state(false);
  let error = $state<string | null>(null);

  // Reference to the messages container for auto-scrolling
  let messagesContainer: HTMLDivElement;

  // Use the provided conversationId prop
  let chatId = $derived(conversationId);

  // Function to check if a message should be grouped with the previous one
  function shouldGroupMessage(
    currentMessage: Message,
    previousMessage: Message | undefined
  ): boolean {
    if (!previousMessage) return false;

    // Group if same sender and within 5 minutes
    const currentTime = new Date(currentMessage.createdAt).getTime();
    const previousTime = new Date(previousMessage.createdAt).getTime();
    const timeDiff = currentTime - previousTime;
    const fiveMinutes = 5 * 60 * 1000;

    return currentMessage.sender === previousMessage.sender && timeDiff <= fiveMinutes;
  }

  // Function to check if this is the last message in a group (WhatsApp style)
  function isLastInGroup(currentMessage: Message, nextMessage: Message | undefined): boolean {
    if (!nextMessage) return true; // Last message overall

    // Check if next message is from different sender or outside time window
    const currentTime = new Date(currentMessage.createdAt).getTime();
    const nextTime = new Date(nextMessage.createdAt).getTime();
    const timeDiff = nextTime - currentTime;
    const fiveMinutes = 5 * 60 * 1000;

    return currentMessage.sender !== nextMessage.sender || timeDiff > fiveMinutes;
  }

  // Effect to load messages and conversation details when chatId changes
  $effect(() => {
    if (chatId) {
      // Reset conversation context store
      conversationContextStore.setConversation(chatId);
      loadMessages(chatId);
      loadConversationDetails(chatId);
      loadConversationContext();
    }
  });

  // Effect to scroll to bottom when messages change
  $effect(() => {
    if (messagesContainer && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 10);
    }
  });

  // Load conversation details using API endpoint
  async function loadConversationDetails(id: number) {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading conversation details:', result.error);
        return;
      }

      conversation = result.conversation;
    } catch (err) {
      console.error('Error loading conversation details:', err);
    }
  }

  async function loadConversationContext() {
    try {
      const context = await getConversationContext(chatId);
      
      // Update store with context data
      conversationContextStore.updateProjects(context.projects_discussed || []);
      conversationContextStore.updateTopics(context.topics || []);
      conversationContextStore.updateQueryType(context.last_query_type || '');
      
    } catch (err) {
      console.error('Error loading conversation context:', err);
    }
  }

  async function loadMessages(id: number) {
    if (isNaN(id)) {
      error = 'Invalid conversation ID';
      return;
    }

    isLoading = true;
    error = null;

    try {
      messages = await getConversationMessages(id);
      
      // Initialize conversation context with existing messages
      const contextMessages = messages.map(msg => ({
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.createdAt
      }));
      
      // Add each message individually to the context store
      for (const message of contextMessages) {
        conversationContextStore.addMessage(message);
      }
      
    } catch (err) {
      console.error('Error loading messages:', err);
      error = 'Failed to load conversation messages';
    } finally {
      isLoading = false;
    }
  }

  // On mount, fetch available providers
  onMount(() => {
    fetchAvailableProviders();
  });

  // Function to handle saving conversation name
  async function handleSaveConversationName(newName: string): Promise<boolean> {
    if (!conversation) return false;

    const success = await conversationStore.updateConversationName(conversation.id, newName);
    if (success && conversation) {
      // Update local conversation object
      conversation = { ...conversation, name: newName };
    }
    return success;
  }

  async function handleSubmit() {
    if (!userInput.trim() || isSending) return;

    isSending = true;
    error = null;

    try {
      // Store the current input before clearing it
      const currentInput = userInput;

      // Save user message to database
      const userMessage = await addUserMessage(chatId, currentInput);
      
      if (userMessage) {
        // Add the user message to context store
        conversationContextStore.addMessage({
          text: currentInput,
          sender: 'user',
          timestamp: new Date().toISOString()
        });

        // Also add to local messages array for immediate UI update
        messages = [...messages, userMessage];
      } else {
        throw new Error('Failed to save user message to database');
      }

      // Clear the input field
      userInput = '';

      // Send contextual message
      const response = await sendContextualMessage(
        chatId,
        currentInput,
        $conversationContextStore.isContextual
      );

      // Save AI response to database
      const aiMessage = await addAIMessage(chatId, response.response, {
        processing_time: response.processing_time,
        projects_found: response.projects_discussed.length
      });
      
      if (aiMessage) {
        // Add AI response to context store
        conversationContextStore.addMessage({
          text: response.response,
          sender: 'ai',
          timestamp: new Date().toISOString()
        });

        // Also add to local messages array for immediate UI update
        messages = [...messages, aiMessage];
      } else {
        throw new Error('Failed to save AI message to database');
      }

      // Update context with new information
      if (response.projects_discussed) {
        conversationContextStore.updateProjects(response.projects_discussed);
      }

      if (response.follow_up_suggestions) {
        conversationContextStore.updateSuggestions(response.follow_up_suggestions);
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Chat error:', err);
      
      // Add error message to UI
      messages = [...messages, {
        id: Date.now(),
        text: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        sender: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: chatId,
        userId: null,
        aiProvider: null,
        aiVersion: null,
        modelUsed: null,
        dataSource: null,
        processingTime: null,
        projectsFound: null,
        context: null,
        logsQuestion: null,
        logsModelUsed: null,
        logsPhases: null,
        logsTotalProcessingTimeMs: null,
        logsProjectsRetrieved: null,
        logsProjectsProcessed: null,
        logsSuccess: null,
        logsAverageRelevanceScore: null
      } as unknown as Message];
    } finally {
      isSending = false;
    }
  }

  function handleFollowUpSelect(suggestion: string) {
    handleSendMessage(suggestion);
  }

  function handleSendMessage(message: string) {
    userInput = message;
    handleSubmit();
  }

  function handleToggleContext() {
    conversationContextStore.toggleContext();
  }
</script>

<!-- Modern dark grey gradient background -->
<div
  class="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414]"
>
  <!-- Subtle pattern overlay for texture -->
  <div
    class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
  ></div>

  <!-- Top header with modern backdrop -->
  <div class="relative z-30">
    <ChatHeader />
  </div>

  <!-- Main chat container with full-width scrollable area -->
  <div class="relative z-10 flex h-full w-full flex-1 flex-col overflow-hidden pt-8">
    <!-- Chat messages area with full-width scrollbar -->
    <div
      class="scrollbar-thin min-h-0 flex-1 overflow-y-auto scroll-smooth pb-6"
      bind:this={messagesContainer}
    >
      <!-- Centered content container -->
      <div class="mx-auto w-full max-w-4xl px-6">
        {#if isLoading}
          <div class="mt-8">
            <LoadingState />
          </div>
        {:else if messages.length === 0}
          <div class="mt-8">
            <EmptyState />
          </div>
        {:else}
          <div class="space-y-1 pb-8 pt-6">
            {#each messages as message, index}
              {@const isGrouped = shouldGroupMessage(message, messages[index - 1])}
              {@const isLastInGroupFlag = isLastInGroup(message, messages[index + 1])}
              <div class="animate-fadeInUp">
                <ChatMessage {message} {isGrouped} isLastInGroup={isLastInGroupFlag} />
              </div>
            {/each}

            <!-- Typing indicator with modern styling -->
            {#if isSending}
              <div class="animate-fadeInUp">
                <TypingIndicator />
              </div>
            {/if}
          </div>
        {/if}

        <!-- Follow-up Suggestions -->
        {#if $conversationContextStore.followUpSuggestions.length > 0 && !isSending}
          <div class="animate-fadeInUp mt-4">
            <FollowUpSuggestions 
              suggestions={$conversationContextStore.followUpSuggestions}
              onSelect={handleFollowUpSelect}
            />
          </div>
        {/if}

        <!-- Error message with modern styling -->
        {#if error}
          <div class="animate-fadeInUp mt-4">
            <ErrorMessage {error} />
          </div>
        {/if}
      </div>
    </div>

    <!-- Input area - centered content -->
    <div class="mx-auto w-full max-w-4xl px-6 pb-6">
      <div class="input-container">
        <div class="input-wrapper">
          <input
            type="text"
            bind:value={userInput}
            onkeypress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={$contextSummary.hasContext 
              ? "Ask a follow-up question..." 
              : "Ask about European research projects..."}
            disabled={isSending}
            class="chat-input"
          />
          
          <button 
            onclick={() => handleSubmit()}
            disabled={!userInput.trim() || isSending}
            class="send-button"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

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
  </div>

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
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(64, 64, 64, 0.4);
    border-radius: 3px;
    transition: background-color 0.2s ease;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
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

  /* Input styling */
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