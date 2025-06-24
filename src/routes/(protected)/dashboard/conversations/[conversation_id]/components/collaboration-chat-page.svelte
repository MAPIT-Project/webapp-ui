<script lang="ts">
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import Icon from "$lib/components/generic/icon.svelte";
    import type { Conversation } from "$lib/types/schema";
    import type { CollaborationMessage } from "$lib/clients/collaborationService";
    import { collaborationRealtimeService } from "$lib/clients/collaborationService";
    import ChatSidebar from "../../../components/chat-sidebar.svelte";
    import EditableTitle from "$lib/components/generic/editable-title.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";
    import { getCurrentClient } from "$lib/clients/clientService";
    import { goto } from "$app/navigation";
    import { getSpace } from '$lib/stores/collaborationStore.svelte';
    import Modal from "$lib/components/generic/modal.svelte";

    interface Props {
        conversationId: number;
    }
    
    let { conversationId }: Props = $props();
    
    let conversation = $state<any>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let currentUser = $state<any>(null);

    // State using runes
    let userInput = $state("");
    let messages = $state<CollaborationMessage[]>([]);
    let isConnected = $state(false); // Track real-time connection status
    let isSending = $state(false);
    
    // Reference to the messages container for auto-scrolling
    let messagesContainer: HTMLDivElement;
    
    // Derived state for conversation name handling
    let conversationName = $derived(conversation?.name || "Untitled Collaboration");
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Effect to load messages and conversation details when chatId changes
    $effect(() => {
        if (chatId) {
            loadCurrentUser();
            loadMessages(chatId);
            loadConversationDetails(chatId);
            setupRealtimeSubscription(chatId);
        }
    });
    
    // Separate effect to check ownership when both conversation and currentUser are loaded

    
    // Effect to scroll to bottom when messages change
    $effect(() => {
        if (messagesContainer && (messages.length > 0 || isSending)) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
        }
    });
    
    // Cleanup on destroy
    onDestroy(() => {
        if (chatId) {
            collaborationRealtimeService.unsubscribeFromConversation(chatId);
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
            console.error("Error loading conversation details:", err);
        }
    }


    
    async function loadMessages(id: number) {
        if (isNaN(id)) {
            error = "Invalid conversation ID";
            return;
        }
        
        isLoading = true;
        error = null;
        
        try {
            messages = await collaborationRealtimeService.loadConversationMessages(id);
        } catch (err) {
            console.error("Error loading messages:", err);
            error = "Failed to load conversation messages";
        } finally {
            isLoading = false;
        }
    }
    
    // Setup real-time subscription for new messages
    async function setupRealtimeSubscription(conversationId: number) {
        try {
            await collaborationRealtimeService.subscribeToConversation(
                conversationId,
                (newMessage) => {
                    // Only add message if it's not from current user (to avoid duplicates)
                    // since we add sent messages immediately after sending
                    if (!currentUser || newMessage.userId !== currentUser.id) {
                        messages = [...messages, newMessage];
                    }
                }
            );
            isConnected = true;
        } catch (err) {
            console.error("Error setting up real-time subscription:", err);
            isConnected = false;
        }
    }

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



    async function handleSubmit(event: Event) {
        event.preventDefault();
        if (!userInput.trim()) return;
        
        isSending = true;
        error = null;
        
        try {
            // Store the current input before clearing it
            const currentInput = userInput;
            
            // Clear the input field immediately
            userInput = "";
            
            // Send the collaboration message using the realtime service
            const message = await collaborationRealtimeService.sendMessage(chatId, currentInput);
            
            if (message) {
                // Add message immediately for current user (real-time will handle other users)
                messages = [...messages, message];
            } else {
                error = "Failed to send message. Please try again.";
                // Restore the input if sending failed
                userInput = currentInput;
            }
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            console.error("Chat error:", err);
        } finally {
            isSending = false;
        }
    }
    
    // Helper functions
    function getSenderClass(isOwnMessage: boolean) {
        return isOwnMessage 
            ? "text-white" 
            : "text-white";
    }

    function getSenderBackground(isOwnMessage: boolean) {
        return isOwnMessage 
            ? "bg-[#2F2F33]" 
            : "bg-[#343541]";
    }
    
    function getSenderIcon(isOwnMessage: boolean) {
        return isOwnMessage 
            ? "bg-blue-500" 
            : "bg-purple-500";
    }

    function formatMessageTime(date: Date | string): string {
        if (!date) return '';
        
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '';
            }
            
            return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error('Error formatting message time:', error);
            return '';
        }
    }

    // Function to safely render markdown (for formatted messages)
    function renderMarkdown(text: string): string {
        try {
            // For simple text rendering, we'll just return the text
            // If markdown support is needed later, we can implement it properly
            return text;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return text;
        }
    }

    // Get display name for a user
    function getUserDisplayName(user: CollaborationMessage['user']): string {
        if (!user) {
            return 'Unknown User';
        }
        const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return displayName || 'Unknown User';
    }

    // Get user initials for avatar
    function getUserInitials(user: CollaborationMessage['user']): string {
        if (!user) return 'U';
        const firstInitial = user.firstName?.[0] || '';
        const lastInitial = user.lastName?.[0] || '';
        return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
    }

    // Load current user info
    async function loadCurrentUser() {
        try {
            currentUser = await getCurrentClient();
        } catch (err) {
            console.error("Error loading current user:", err);
        }
    }
</script>

<div class="w-full h-screen flex bg-[#2B2A2C] overflow-hidden">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col relative h-full overflow-hidden">
        <!-- Top header with dark glass morphism effect -->
        <div class="absolute top-0 left-0 right-0 h-12 bg-[#2B2A2C]/90 backdrop-blur-xl border-b border-gray-700/50 z-10">
            <div class="flex items-center justify-between h-full px-4">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <Icon name="groups" className="text-white text-xs" />
                    </div>
                    <div>
                        <span class="text-gray-100 text-xs font-medium">Collaboration Chat</span>
                        <span class="text-xs font-semibold ml-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-1.5 py-0.5 rounded-full">
                            {isConnected ? 'LIVE' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
                
                <div class="flex items-center gap-4">
                    <!-- Connection status indicator -->
                    <div class="flex items-center gap-1 text-xs text-gray-400">
                        <div class="w-2 h-2 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
                        <span>{isConnected ? 'Real-time connected' : 'Connecting...'}</span>
                    </div>
                </div>
            </div>
        </div>
    
        <div class="flex-1 flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden pt-12">
            <!-- Chat title area -->
            <div class="flex-shrink-0 p-4 pb-8 text-center">
                {#if conversation}
                    <div class="space-y-2">
                        <EditableTitle 
                            value={conversationName}
                            onSave={handleSaveConversationName}
                            placeholder="Untitled Collaboration"
                            maxLength={30}
                            showEditIcon={true}
                            titleClass="text-xl font-semibold text-gray-100"
                            inputClass="text-xl font-semibold bg-transparent border-b-2 border-purple-500 text-gray-100 outline-none text-center"
                        />
                        <p class="text-xs text-gray-400">Real-time collaboration with your team</p>
                    </div>
                {:else if !isLoading}
                    <div class="space-y-2">
                        <h1 class="text-xl font-semibold text-gray-100">New Collaboration</h1>
                        <p class="text-xs text-gray-400">Start collaborating with your team</p>
                    </div>
                {/if}
            </div>
            
            <!-- Chat messages area -->
            <div class="flex-1 overflow-y-auto min-h-0 px-4 pb-4 scroll-smooth" bind:this={messagesContainer}>
                {#if isLoading}
                    <div class="flex items-center justify-center h-full">
                        <div class="flex flex-col items-center gap-4">
                            <div class="relative">
                                <div class="w-12 h-12 rounded-full border-4 border-gray-700"></div>
                                <div class="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                            </div>
                            <p class="text-gray-400 text-sm">Loading conversation...</p>
                        </div>
                    </div>
                {:else if messages.length === 0}
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center p-8 max-w-md">
                            <div class="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Icon name="groups" className="text-white text-xl" />
                            </div>
                            <h3 class="text-xl font-semibold text-gray-200 mb-3">Start collaborating</h3>
                            <p class="text-gray-400 leading-relaxed">Send a message to begin real-time collaboration with your team members.</p>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-6 pb-6">
                        {#each messages as message, index}
                            {@const isOwnMessage = currentUser && message.userId === currentUser.id}
                            <div class="group relative">
                                <div class="flex items-start gap-4 {isOwnMessage ? 'flex-row-reverse' : 'flex-row'}">
                                    <!-- Avatar with user initials -->
                                    <div class="flex-shrink-0">
                                        <div class="w-8 h-8 rounded-full {getSenderIcon(isOwnMessage)} flex items-center justify-center shadow-lg text-white text-xs font-semibold">
                                            {getUserInitials(message.user)}
                                        </div>
                                    </div>
                                    
                                    <!-- Message bubble -->
                                    <div class="flex-1 max-w-[80%] {isOwnMessage ? 'text-right' : 'text-left'}">
                                        <!-- Username -->
                                        <div class="text-xs text-gray-400 mb-1 {isOwnMessage ? 'text-right' : 'text-left'}">
                                            {getUserDisplayName(message.user)}
                                        </div>
                                        
                                        <div class="inline-block">
                                            <div class="{getSenderBackground(isOwnMessage)} text-white px-4 py-3 rounded-2xl {isOwnMessage ? 'rounded-tr-md' : 'rounded-tl-md'} shadow-lg">
                                                <div class="prose prose-sm max-w-none">
                                                    <p class="whitespace-pre-wrap leading-relaxed m-0">{message.text}</p>
                                                </div>
                                            </div>
                                            
                                            <!-- Timestamp -->
                                            <div class="text-xs text-gray-500 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {formatMessageTime(message.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                        
                        <!-- Typing indicator -->
                        {#if isSending}
                            <div class="group relative">
                                <div class="flex items-start gap-4">
                                    <div class="flex-shrink-0">
                                        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                            <Icon name="person" className="text-white text-sm" />
                                        </div>
                                    </div>
                                    
                                    <div class="bg-[#3A3A3C] px-4 py-4 rounded-2xl rounded-tl-md shadow-lg border border-gray-600 max-w-md">
                                        <div class="flex items-center gap-2">
                                            <div class="flex space-x-1">
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.1s"></div>
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
                                            </div>
                                            <span class="text-xs text-gray-400 ml-2">Sending message...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- Error message -->
                {#if error}
                    <div class="mx-auto max-w-2xl my-4">
                        <div class="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="flex-shrink-0">
                                    <div class="w-6 h-6 rounded-full bg-red-800 flex items-center justify-center">
                                        <Icon name="error" className="text-red-400 text-sm" />
                                    </div>
                                </div>
                                <p class="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- Input area -->
            <div class="flex-shrink-0 p-6">
                <form onsubmit={handleSubmit} class="relative max-w-4xl mx-auto">
                    <div class="relative bg-[#3A3A3C] rounded-2xl shadow-lg border border-gray-600 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
                        <input
                            type="text"
                            bind:value={userInput}
                            placeholder="Message your team..."
                            class="w-full px-4 py-4 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400 pr-12 rounded-2xl"
                            disabled={isSending || !isConnected}
                        />
                        <button
                            type="submit"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 {userInput.trim() && !isSending && isConnected ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-600 text-gray-400'}"
                            disabled={isSending || !userInput.trim() || !isConnected}
                        >
                            <Icon name="send" className="text-current" />
                        </button>
                    </div>
                    
                    <!-- Input hint -->
                    <div class="text-center mt-3">
                        <p class="text-xs text-gray-500">
                            Press Enter to send • Real-time collaboration {isConnected ? 'active' : 'connecting...'}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>



<style>
    /* Dark scrollbar */
    :global(*::-webkit-scrollbar) {
        width: 6px;
    }
    
    :global(*::-webkit-scrollbar-track) {
        background: transparent;
    }
    
    :global(*::-webkit-scrollbar-thumb) {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    
    :global(*::-webkit-scrollbar-thumb:hover) {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Enhanced prose styles */
    :global(.prose) {
        font-size: 0.95rem;
        line-height: 1.7;
        color: #e5e7eb;
        max-width: none;
    }
    
    :global(.prose p) {
        margin-bottom: 1.2rem;
        color: #e5e7eb;
    }
    
    :global(.prose p:last-child) {
        margin-bottom: 0;
    }
    
    /* Smooth animations */
    :global(.group) {
        animation: fadeInUp 0.3s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Enhanced bounce animation */
    @keyframes bounceDot {
        0%, 80%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.7;
        }
        40% { 
            transform: translateY(-4px) scale(1.1); 
            opacity: 1;
        }
    }
    
    .animate-bounce {
        animation: bounceDot 1.4s infinite ease-in-out both;
    }
</style>