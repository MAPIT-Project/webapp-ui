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

<div class="w-64 min-h-screen max-h-screen h-full flex flex-col bg-[#1E1E20] border-r border-[#4A4A57]/30 flex-shrink-0 overflow-hidden">
    <div class="p-4 border-b border-[#4A4A57]/30 flex justify-between items-center">
        <div class="flex items-center">
            <div class="w-5 h-5 mr-2 rounded-full bg-[#525252] flex items-center justify-center">
                <Icon name="chat" iconSize="small" class="text-white" />
            </div>
            <h2 class="text-lg font-medium text-white">Chats</h2>
        </div>
        <div class="flex gap-2">
            <button 
                class="p-1.5 rounded-lg hover:bg-[#3E3E48] text-white transition-colors"
                title="Refresh conversations"
                on:click={() => conversationStore.loadConversations(true)}
            >
                <Icon name="refresh" iconSize="small" class="text-white" />
            </button>
            <a 
                href="/dashboard/conversations" 
                class="p-1.5 rounded-lg hover:bg-[#3E3E48] text-white transition-colors"
                title="New chat"
            >
                <Icon name="add_comment" iconSize="small" class="text-white" />
            </a>
        </div>
    </div>
    
    <div class="flex-1 overflow-y-auto overflow-x-hidden bg-[#1E1E20] px-2">
        {#if $conversationStore.isLoading}
            <div class="flex justify-center items-center h-20">
                <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#A0A0A8]"></div>
            </div>
        {:else if $conversationStore.error}
            <div class="p-4 text-red-400 text-sm">
                <p>{$conversationStore.error}</p>
                <button 
                    class="mt-2 text-[#A0A0A8] hover:underline"
                    on:click={() => conversationStore.loadConversations(true)}
                >
                    Try again
                </button>
            </div>
        {:else if $conversationStore.conversations.length === 0}
            <div class="p-4 mt-4 bg-[#2B2A2C] rounded-lg border border-[#4A4A57]/30 text-[#A0A0A8] text-sm">
                <div class="flex justify-center mb-2">
                    <div class="p-2 rounded-full bg-[#3E3E48]">
                        <Icon name="chat" iconSize="small" class="text-[#A0A0A8]" />
                    </div>
                </div>
                <p class="text-center">No conversations yet.</p>
                <p class="text-center mt-1">Start a new chat to begin.</p>
            </div>
        {:else}
            <div class="py-3">
                {#each $conversationStore.conversations as conversation}
                    <a 
                        href="/dashboard/conversations/{conversation.id}" 
                        class="flex items-center justify-between px-4 py-3 mb-1 hover:bg-[#3E3E48] {currentChatId === conversation.id ? 'bg-[#3E3E48]' : ''} rounded-lg transition-colors"
                    >
                        <div class="flex-1 min-w-0">
                            <p class="text-white text-sm font-medium truncate">
                                {conversation.name}
                            </p>
                            <p class="text-[#A0A0A8] text-xs truncate">
                                {conversation.topic || 'General'}
                            </p>
                        </div>
                        <span class="text-[#A0A0A8] text-xs ml-2 flex-shrink-0">
                            {formatDate(conversation.createdAt)}
                        </span>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
