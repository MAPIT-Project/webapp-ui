<script lang="ts">
    import { onMount } from "svelte";
    import type { Conversation } from "$lib/types/schema";
    import { page } from "$app/stores";
    import Icon from "$lib/components/generic/icon.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";
    import EditableTitle from "$lib/components/generic/editable-title.svelte";
    import Modal from "$lib/components/generic/modal.svelte";
    import { getCurrentClient } from "$lib/clients/clientService";
    import { goto } from "$app/navigation";
    
    // Get the current chat id from the URL if we're on a chat page
    const currentChatId = $derived($page.params.conversation_id ? parseInt($page.params.conversation_id) : null);
    
    let loadAttempts = $state(0);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    
    // Delete functionality state
    let currentUser = $state<any>(null);
    let ownershipCache = $state<Map<number, boolean>>(new Map()); // Cache ownership checks
    let showDeleteConfirm = $state(false);
    let conversationToDelete = $state<Conversation | null>(null);
    let isDeleting = $state(false);

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

    onMount(async () => {
        loadWithRetry();
        // Load current user for ownership checks
        try {
            currentUser = await getCurrentClient();
        } catch (err) {
            console.error("Error loading current user:", err);
        }
    });

    // Function to handle saving conversation name
    async function handleSaveConversationName(conversationId: number, newName: string): Promise<boolean> {
        return await conversationStore.updateConversationName(conversationId, newName);
    }
    
    // Check if current user is an owner of a collaboration conversation
    async function checkOwnership(conversation: Conversation): Promise<boolean> {
        // Only check for collaboration conversations
        const collaborationId = conversation.collaborationId || (conversation as any).collaboration_id;
        if (!collaborationId || !currentUser) {
            return false;
        }

        // Check cache first
        const cacheKey = conversation.id;
        if (ownershipCache.has(cacheKey)) {
            return ownershipCache.get(cacheKey)!;
        }

        try {
            const response = await fetch(`/api/collaborations/${collaborationId}/members`);
            const result = await response.json();

            if (response.ok && result.members) {
                const userMembership = result.members.find(
                    (member: any) => member.id === currentUser.id
                );
                const isOwner = userMembership?.role === 'owner';
                
                // Cache the result
                ownershipCache.set(cacheKey, isOwner);
                return isOwner;
            }
        } catch (err) {
            console.error("Error checking ownership:", err);
        }
        
        ownershipCache.set(cacheKey, false);
        return false;
    }
    
    // Handle delete button click
    async function handleDeleteClick(event: Event, conversation: Conversation) {
        event.preventDefault();
        event.stopPropagation();
        
        conversationToDelete = conversation;
        showDeleteConfirm = true;
    }
    
    // Handle conversation deletion
    async function handleDeleteConversation() {
        if (!conversationToDelete) return;

        isDeleting = true;
        showDeleteConfirm = false;

        try {
            const success = await conversationStore.deleteConversationById(conversationToDelete.id);
            
            if (success) {
                // Clear ownership cache for deleted conversation
                ownershipCache.delete(conversationToDelete.id);
                
                // If we're currently viewing the deleted conversation, navigate away
                if (currentChatId === conversationToDelete.id) {
                    goto('/dashboard/conversations');
                }
            }
        } catch (err) {
            console.error("Error deleting conversation:", err);
        } finally {
            isDeleting = false;
            conversationToDelete = null;
        }
    }
    
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
            <h2 class="text-lg font-medium text-white">Chats</h2>
        </div>
        <div class="flex gap-2">
            <button 
                class="py-1.5 px-2 rounded-lg hover:bg-[#3E3E48] text-white transition-colors"
                title="Refresh conversations"
                onclick={() => conversationStore.loadConversations(true)}
            >
                <Icon name="refresh" />
            </button>
            <a 
                href="/dashboard/conversations" 
                class="py-1.5 px-2 rounded-lg hover:bg-[#3E3E48] text-white transition-colors"
                title="New chat"
            >
                <Icon name="add_comment"/>
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
                    onclick={() => conversationStore.loadConversations(true)}
                >
                    Try again
                </button>
            </div>
        {:else if $conversationStore.conversations.length === 0}
            <div class="p-4 mt-4 bg-[#2B2A2C] rounded-lg border border-[#4A4A57]/30 text-[#A0A0A8] text-sm">
                <div class="flex justify-center mb-2">
                    <div class="p-2 rounded-full bg-[#3E3E48]">
                        <Icon name="chat" iconSize="sm" className="text-[#A0A0A8]" />
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
                        class="flex items-start justify-between px-4 py-3 mb-1 hover:bg-[#3E3E48] {currentChatId === conversation.id ? 'bg-[#3E3E48]' : ''} rounded-lg transition-colors group relative"
                    >
                        <div class="flex-1 min-w-0 pr-2">
                            <div class="relative flex items-center justify-between">
                                <div class="flex-1">
                                    <EditableTitle 
                                        value={conversation.name || "Untitled"}
                                        onSave={(newName) => handleSaveConversationName(conversation.id, newName)}
                                        placeholder="Untitled Conversation"
                                        maxLength={30}
                                        showEditIcon={true}
                                        compactMode={true}
                                        titleClass="text-white text-sm font-medium truncate"
                                        inputClass="text-white text-sm font-medium bg-transparent border-b border-blue-500 outline-none w-full text-left"
                                        class="w-full"
                                    />
                                </div>
                                
                                <!-- Delete button for collaboration conversations where user is owner -->
                                {#if (conversation.collaborationId || (conversation as any).collaboration_id) && currentUser}
                                    {#await checkOwnership(conversation)}
                                        <!-- Loading ownership check -->
                                    {:then isOwner}
                                        {#if isOwner}
                                            <button
                                                onclick={(e) => handleDeleteClick(e, conversation)}
                                                class="ml-1 p-0.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete conversation (Owner only)"
                                                disabled={isDeleting}
                                            >
                                                <Icon name="delete" iconSize="sm" className="text-current" />
                                            </button>
                                        {/if}
                                    {:catch}
                                        <!-- Error checking ownership, don't show delete button -->
                                    {/await}
                                {/if}
                            </div>
                            <p class="text-[#A0A0A8] text-xs truncate mt-1">
                                {conversation.topic || 'General'}
                            </p>
                        </div>
                        <span class="text-[#A0A0A8] text-xs flex-shrink-0 mt-0.5">
                            {formatDate(conversation.createdAt)}
                        </span>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Delete Confirmation Modal -->
<Modal
    bind:isOpen={showDeleteConfirm}
    title="Delete Conversation"
    on:cancel={() => showDeleteConfirm = false}
    closeOnEscape={true}
    background="bg-[#1E1E1E]"
>
    <div slot="content" class="p-4 flex flex-col gap-4 w-full">
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
                <div class="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                    <Icon name="warning" className="text-red-400" />
                </div>
            </div>
            <div class="flex-1">
                <p class="text-gray-300 text-sm mb-2">
                    Are you sure you want to delete <strong>"{conversationToDelete?.name || 'this conversation'}"</strong>?
                </p>
                <p class="text-gray-400 text-xs">
                    This cannot be undone. All messages in this conversation will be permanently deleted.
                </p>
            </div>
        </div>
    </div>
    
    <div slot="footer" class="flex justify-end gap-3">
        <button 
            onclick={() => showDeleteConfirm = false}
            class="px-4 py-2.5 rounded-md border border-[#444444] text-gray-300 hover:bg-[#2A2A2A] transition-colors duration-200 font-medium"
            disabled={isDeleting}
        >
            Cancel
        </button>
        <button 
            onclick={handleDeleteConversation}
            disabled={isDeleting}
            class="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {#if isDeleting}
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Deleting...
            {:else}
                <Icon name="delete" className="text-white" />
                Delete Chat
            {/if}
        </button>
    </div>
</Modal>
