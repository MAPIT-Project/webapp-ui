<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { getUserConversations } from "$lib/clients/conversationService";
    import type { Conversation } from "$lib/server/db/schema";
    import { page } from "$app/stores";
    import Icon from "$lib/components/generic/icon.svelte";
    
    let conversations: Conversation[] = [];
    let isLoading = true;
    let error: string | null = null;
    
    // Get the current chat id from the URL if we're on a chat page
    $: currentChatId = $page.params.chat_id ? parseInt($page.params.chat_id) : null;
    
    // Reload conversations when navigating
    $: if ($page.url) loadConversations();
    
    onMount(async () => {
        // Initial load handled by reactive statement
    });
    
    async function loadConversations() {
        isLoading = true;
        error = null;
        
        try {
            conversations = await getUserConversations();
        } catch (err) {
            console.error("Error loading conversations:", err);
            error = "Failed to load conversations";
        } finally {
            isLoading = false;
        }
    }
    
    function formatDate(dateString: string): string {
        if (!dateString) return '';
        
        try {
            // Ensure we parse the date correctly
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            const now = new Date();
            
            // If the date is today, return the time
            if (date.toDateString() === now.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // If the date is within the last week, return the day of week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (date > oneWeekAgo) {
                return date.toLocaleDateString([], { weekday: 'short' });
            }
            
            // Otherwise return the date
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    }
</script>

<div class="w-64 min-h-screen h-full flex flex-col bg-gray-800 border-r border-gray-700 flex-shrink-0">
    <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-medium text-[#CACACA]">Conversations</h2>
        <a 
            href="/dashboard" 
            class="p-2 rounded-lg hover:bg-gray-700 text-[#CACACA]"
            title="New chat"
        >
            <Icon name="add_comment" iconSize="base" />
        </a>
    </div>
    
    <div class="flex-1 overflow-y-auto bg-gray-800">
        {#if isLoading}
            <div class="flex justify-center items-center h-20">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        {:else if error}
            <div class="p-4 text-red-400 text-sm">
                <p>{error}</p>
                <button 
                    class="mt-2 text-blue-400 hover:underline"
                    on:click={loadConversations}
                >
                    Try again
                </button>
            </div>
        {:else if conversations.length === 0}
            <div class="p-4 text-gray-500 text-sm">
                <p>No conversations yet.</p>
                <p>Start a new chat to begin.</p>
            </div>
        {:else}
            <div class="py-2">
                {#each conversations as conversation}
                    <a 
                        href="/dashboard/chat/{conversation.id}" 
                        class="flex items-center justify-between px-4 py-3 hover:bg-gray-700 {currentChatId === conversation.id ? 'bg-gray-700' : ''}"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-[#CACACA] text-sm font-medium truncate">
                                {conversation.name}
                            </p>
                            <p class="text-gray-500 text-xs truncate">
                                {conversation.topic || 'General'}
                            </p>
                        </div>
                        <span class="text-gray-500 text-xs ml-2">
                            {formatDate(conversation.created_at || conversation.createdAt)}
                        </span>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
