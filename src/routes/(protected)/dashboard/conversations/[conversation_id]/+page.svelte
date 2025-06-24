<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PersonalChatPage from './components/personal-chat-page.svelte';
  import CollaborationChatPage from './components/collaboration-chat-page.svelte';
  
  // Get conversation ID from URL params
  let conversationId = $derived(parseInt($page.params.conversation_id));
  let isCollaborationConversation = $state<boolean | null>(null); // null = loading
  let isLoading = $state(true);
  
  // Fetch conversation details to determine if it's a collaboration conversation
  $effect(() => {
    if (conversationId) {
      loadConversationDetails(conversationId);
    }
  });

  async function loadConversationDetails(id: number) {
    isLoading = true;
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'GET'
      });

      const result = await response.json();

      if (response.ok && result.conversation) {
        // Handle both snake_case (from API) and camelCase (from types)
        const conversation = result.conversation;
        isCollaborationConversation = !!(conversation.collaborationId || (conversation as any).collaboration_id);
      } else {
        console.error('Error loading conversation details:', result.error);
        isCollaborationConversation = false; // Default to personal on error
      }
    } catch (err) {
      console.error("Error loading conversation details:", err);
      isCollaborationConversation = false; // Default to personal on error
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center h-screen bg-[#2B2A2C]">
    <div class="flex flex-col items-center gap-4">
      <div class="relative">
        <div class="w-12 h-12 rounded-full border-4 border-gray-700"></div>
        <div class="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
      </div>
      <p class="text-gray-400 text-sm">Loading conversation...</p>
    </div>
  </div>
{:else if isCollaborationConversation}
  <CollaborationChatPage />
{:else}
  <PersonalChatPage />
{/if}

