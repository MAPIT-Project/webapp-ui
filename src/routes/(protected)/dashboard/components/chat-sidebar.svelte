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
    import { getSpace } from "$lib/stores/collaborationStore.svelte";
    
    // Get the current chat id from the URL if we're on a chat page
    const currentChatId = $derived($page.params.conversation_id ? parseInt($page.params.conversation_id) : null);
    
    // Get current space to determine if we're in a collaboration
    const currentSpace = $derived(getSpace());
    const isCollaboration = $derived(currentSpace && currentSpace !== 'personal');
    const sidebarTitle = $derived(isCollaboration ? 'Shared chats' : 'Chats');
    
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

<div class="w-64 min-h-screen max-h-screen h-full flex flex-col bg-gradient-to-b from-[#1E1E20] to-[#1A1A1C] border-r border-[#4A4A57]/20 flex-shrink-0 overflow-hidden shadow-xl">
    <!-- Header Section -->
    <div class="p-4 border-b border-[#4A4A57]/20 bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Icon name="chat" iconClass="text-white text-sm" />
                </div>
                <h2 class="text-lg font-semibold text-white">{sidebarTitle}</h2>
            </div>
            <div class="flex gap-1">
                <button 
                    class="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 group"
                    title="Refresh conversations"
                    onclick={() => conversationStore.loadConversations(true)}
                >
                    <Icon name="refresh" iconClass="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <a 
                    href="/dashboard/conversations" 
                    class="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all duration-200 group"
                    title="New chat"
                >
                    <Icon name="add_comment" iconClass="w-4 h-4 group-hover:scale-110 transition-transform"/>
                </a>
            </div>
        </div>
    </div>
    
    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1">
        {#if $conversationStore.isLoading}
            <!-- Enhanced Loading State -->
            <div class="flex flex-col items-center justify-center h-32 gap-4">
                <div class="relative">
                    <div class="w-8 h-8 rounded-full border-2 border-gray-700/30 border-t-blue-500 animate-spin"></div>
                    <div class="absolute inset-0 w-8 h-8 rounded-full border-2 border-transparent border-r-purple-500 animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                </div>
                <p class="text-gray-400 text-sm font-medium">Loading conversations...</p>
            </div>
        {:else if $conversationStore.error}
            <!-- Enhanced Error State -->
            <div class="p-4 m-2 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 p-1.5 bg-red-500/20 rounded-lg">
                        <Icon name="error" iconClass="text-red-400 w-4 h-4" />
                    </div>
                    <div class="flex-1">
                        <p class="text-red-300 text-sm font-medium mb-1">Failed to load</p>
                        <p class="text-red-400 text-xs mb-3">{$conversationStore.error}</p>
                        <button 
                            class="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors font-medium"
                            onclick={() => conversationStore.loadConversations(true)}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        {:else if $conversationStore.conversations.length === 0}
            <!-- Enhanced Empty State -->
            <div class="flex flex-col items-center justify-center h-48 gap-4 px-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 flex items-center justify-center">
                    <Icon name="chat" iconClass="text-gray-400 w-8 h-8" />
                </div>
                <div class="text-center">
                    <h3 class="text-white font-medium mb-1">No conversations yet</h3>
                    <p class="text-gray-400 text-sm leading-relaxed">Start a new conversation to begin chatting with AI assistants</p>
                </div>
                <a 
                    href="/dashboard/conversations"
                    class="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
                >
                    Start First Chat
                </a>
            </div>
        {:else}
            <!-- Conversations List -->
            <div class="space-y-1">
                {#each $conversationStore.conversations as conversation}
                    <a 
                        href="/dashboard/conversations/{conversation.id}" 
                        class="group relative flex items-start justify-between p-3 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/20 {currentChatId === conversation.id ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 border border-blue-500/30' : 'border border-transparent'} rounded-xl transition-all duration-200 hover:shadow-lg"
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
                                        titleClass="text-white text-sm font-medium truncate {currentChatId === conversation.id ? 'text-blue-100' : 'group-hover:text-blue-100'}"
                                        inputClass="text-white text-sm font-medium bg-gray-800/50 border border-blue-500/50 rounded-lg px-2 py-1 outline-none w-full text-left"
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
                                                class="ml-2 p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                                                title="Delete conversation (Owner only)"
                                                disabled={isDeleting}
                                            >
                                                <Icon name="delete" iconClass="w-3.5 h-3.5" />
                                            </button>
                                        {/if}
                                    {:catch}
                                        <!-- Error checking ownership, don't show delete button -->
                                    {/await}
                                {/if}
                            </div>
                            
                            <div class="flex items-center justify-between mt-2">
                                <div class="flex items-center gap-2">
                                    <!-- Conversation type indicator -->
                                    {#if conversation.collaborationId || (conversation as any).collaboration_id}
                                        <div class="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
                                            <Icon name="group" iconClass="w-3 h-3 text-purple-400" />
                                            <span class="text-purple-300 text-xs font-medium">Team</span>
                                        </div>
                                    {:else}
                                        <div class="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                                            <Icon name="person" iconClass="w-3 h-3 text-blue-400" />
                                            <span class="text-blue-300 text-xs font-medium">Personal</span>
                                        </div>
                                    {/if}
                                </div>
                                
                                <span class="text-gray-500 text-xs font-medium">
                                    {formatDate(conversation.createdAt)}
                                </span>
                            </div>
                            
                            {#if conversation.topic && conversation.topic !== 'General'}
                                <p class="text-gray-400 text-xs truncate mt-1 font-medium">
                                    {conversation.topic}
                                </p>
                            {/if}
                        </div>
                        
                        <!-- Active indicator -->
                        {#if currentChatId === conversation.id}
                            <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
                        {/if}
                    </a>
                {/each}
            </div>
        {/if}
    </div>
    
    <!-- Footer -->
    <div class="p-3 border-t border-[#4A4A57]/20 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div class="flex items-center justify-center">
            <div class="text-xs text-gray-500 flex items-center gap-1">
                <Icon name="info" iconClass="w-3 h-3" />
                <span>{$conversationStore.conversations.length} conversation{$conversationStore.conversations.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    </div>
</div>

<!-- Enhanced Delete Confirmation Modal -->
<Modal
    bind:isOpen={showDeleteConfirm}
    title="Delete Conversation"
    on:cancel={() => showDeleteConfirm = false}
    closeOnEscape={true}
    background="bg-gradient-to-br from-gray-900 to-gray-800"
>
    <div slot="content" class="p-6 flex flex-col gap-6 w-full">
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0 mt-1">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                    <Icon name="warning" iconClass="text-red-400 w-6 h-6" />
                </div>
            </div>
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-white mb-2">Delete "{conversationToDelete?.name || 'this conversation'}"?</h3>
                <p class="text-gray-300 text-sm mb-3 leading-relaxed">
                    This action cannot be undone. All messages and data in this conversation will be permanently deleted.
                </p>
                <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon name="info" iconClass="text-red-400 w-4 h-4" />
                        <span class="text-red-300 text-xs font-medium">This will affect all team members with access to this conversation</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div slot="footer" class="flex justify-end gap-3 p-6 border-t border-gray-700/50">
        <button 
            onclick={() => showDeleteConfirm = false}
            class="px-6 py-2.5 rounded-xl border border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:border-gray-500/50 transition-all duration-200 font-medium"
            disabled={isDeleting}
        >
            Cancel
        </button>
        <button 
            onclick={handleDeleteConversation}
            disabled={isDeleting}
            class="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25"
        >
            {#if isDeleting}
                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Deleting...
            {:else}
                <Icon name="delete" iconClass="w-4 h-4" />
                Delete Forever
            {/if}
        </button>
    </div>
</Modal>
