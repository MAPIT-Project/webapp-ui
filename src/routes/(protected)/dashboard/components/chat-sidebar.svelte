<script lang="ts">
    import { onMount } from "svelte";
    import type { Conversation } from "$lib/server/db/schema";
    import { page } from "$app/stores";
    import Icon from "$lib/components/generic/icon.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";
    
    // Get the current chat id from the URL if we're on a chat page
    const currentChatId = $derived($page.params.chat_id ? parseInt($page.params.chat_id) : null);
    
    let loadAttempts = $state(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    async function loadWithRetry() {
        try {
            await conversationStore.loadConversations();
        } catch (err) {
            console.error("Failed to load conversations:", err);
            
            if (loadAttempts < MAX_RETRIES) {
                loadAttempts++;
                // Wait and try again
                setTimeout(loadWithRetry, RETRY_DELAY);
            }
        }
    }

    onMount(() => {
        loadWithRetry();
    });
    
    function formatDate(date: Date | string | null): string {
        if (!date) return '';
        
        try {
            // Convert string to Date if needed
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '';
            }
            
            const now = new Date();
            
            // If the date is today, return the time
            if (dateObj.toDateString() === now.toDateString()) {
                return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // If the date is within the last week, return the day of week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (dateObj > oneWeekAgo) {
                return dateObj.toLocaleDateString([], { weekday: 'short' });
            }
            
            // Otherwise return the date
            return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    }
</script>

<div class="w-64 min-h-screen max-h-screen h-full flex flex-col bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-hidden">
    <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-medium text-[#CACACA]">Conversations</h2>
        <div class="flex gap-2">
            <button 
                class="p-2 rounded-lg hover:bg-gray-700 text-[#CACACA]"
                title="Refresh conversations"
                on:click={() => conversationStore.loadConversations(true)}
            >
                <Icon name="refresh" iconSize="base" />
            </button>
            <a 
                href="/dashboard/conversations" 
                class="p-2 rounded-lg hover:bg-gray-700 text-[#CACACA]"
                title="New chat"
            >
                <Icon name="add_comment" iconSize="base" />
            </a>
        </div>
    </div>
    
    <div class="flex-1 overflow-y-auto overflow-x-hidden bg-gray-800">
        {#if $conversationStore.isLoading}
            <div class="flex justify-center items-center h-20">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        {:else if $conversationStore.error}
            <div class="p-4 text-red-400 text-sm">
                <p>{$conversationStore.error}</p>
                <button 
                    class="mt-2 text-blue-400 hover:underline"
                    on:click={() => conversationStore.loadConversations(true)}
                >
                    Try again
                </button>
            </div>
        {:else if $conversationStore.conversations.length === 0}
            <div class="p-4 text-gray-500 text-sm">
                <p>No conversations yet.</p>
                <p>Start a new chat to begin.</p>
            </div>
        {:else}
            <div class="py-2">
                {#each $conversationStore.conversations as conversation}
                    <a 
                        href="/dashboard/conversations/{conversation.id}" 
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
                            {formatDate(conversation.createdAt)}
                        </span>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
