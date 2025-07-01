<script lang="ts">
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import Icon from "$lib/components/generic/icon.svelte";
    import type { Conversation } from "$lib/types/schema";
    import type { CollaborationMessage } from "$lib/clients/collaborationService";
    import { collaborationRealtimeService } from "$lib/clients/collaborationService";
    
    import EditableTitle from "$lib/components/generic/editable-title.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";
    import { getCurrentClient } from "$lib/clients/clientService";
    import { goto } from "$app/navigation";
    import { getSpace } from '$lib/stores/collaborationStore.svelte';
    import Modal from "$lib/components/generic/modal.svelte";
    import AIProviderSelector from "../../../components/ai-provider-selector.svelte";
    import { selectedProvider, selectedVersion, fetchAvailableProviders } from '$lib/stores/aiProviderStore';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';

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
    
    // Autocomplete state for @mapit suggestions
    let showAutocomplete = $state(false);
    let inputElement: HTMLInputElement | undefined;
    
    // Derived state for conversation name handling
    let conversationName = $derived(conversation?.name || "Untitled Collaboration");
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Function to check if a message should be grouped with the previous one
    function shouldGroupMessage(currentMessage: CollaborationMessage, previousMessage: CollaborationMessage | undefined): boolean {
        if (!previousMessage) return false;
        
        // Group if same user and within 5 minutes
        const currentTime = new Date(currentMessage.createdAt).getTime();
        const previousTime = new Date(previousMessage.createdAt).getTime();
        const timeDiff = currentTime - previousTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        return currentMessage.userId === previousMessage.userId && timeDiff <= fiveMinutes;
    }

    // Function to check if this is the last message in a group (WhatsApp style)
    function isLastInGroup(currentMessage: CollaborationMessage, nextMessage: CollaborationMessage | undefined): boolean {
        if (!nextMessage) return true; // Last message overall
        
        // Check if next message is from different user or outside time window
        const currentTime = new Date(currentMessage.createdAt).getTime();
        const nextTime = new Date(nextMessage.createdAt).getTime();
        const timeDiff = nextTime - currentTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        return currentMessage.userId !== nextMessage.userId || timeDiff > fiveMinutes;
    }
    

    
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
            
            // Check if this is an AI query with @mapit
            if (currentInput.trim().toLowerCase().startsWith('@mapit ')) {
                await handleAIQuery(currentInput);
            } else {
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
            }
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            console.error("Chat error:", err);
        } finally {
            isSending = false;
        }
    }
    
    // Handle AI queries with @mapit
    async function handleAIQuery(input: string) {
        try {
            // Extract the question after @mapit
            const question = input.replace(/^@mapit\s+/i, '').trim();
            
            if (!question) {
                error = "Please provide a question after @mapit";
                userInput = input; // Restore the input
                return;
            }
            
            // First, send the user's @mapit message to the chat
            const userMessage = await collaborationRealtimeService.sendMessage(chatId, input);
            if (userMessage) {
                messages = [...messages, userMessage];
            }
            
            // Now query the AI
            const requestBody: any = {
                question: question,
                max_results: 5
            };
            
            // Add selected provider if available
            if ($selectedProvider) {
                requestBody.ai_provider = $selectedProvider;
            }
            
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
            }
            
            const aiData = await response.json();
            
            // Create AI response message and send it via AI endpoint
            const providerInfo = aiData.ai_provider ? `${aiData.ai_provider}` : 'AI';
            const modelInfo = aiData.model_used ? ` (${aiData.model_used})` : '';
            const aiResponseText = `🤖 **MAPIT AI Response:**\n\n${aiData.answer}\n\n*Powered by ${providerInfo}${modelInfo}*`;
            
            // Send AI message using the dedicated AI endpoint
            const aiResponse = await fetch('/api/chat/ai-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationId: chatId,
                    text: aiResponseText
                })
            });

            if (!aiResponse.ok) {
                const errorData = await aiResponse.json();
                console.error('Error sending AI message:', errorData);
                error = 'Failed to send AI response';
            }
            // Note: AI message will be added via real-time subscription, no need to add manually
            
        } catch (err) {
            console.error("AI query error:", err);
            error = err instanceof Error ? err.message : "Failed to get AI response";
            
            // Send error message via AI endpoint
            const errorText = `🤖 **MAPIT AI Error:** ${error}`;
            try {
                const errorResponse = await fetch('/api/chat/ai-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        conversationId: chatId,
                        text: errorText
                    })
                });

                // Error message will be added via real-time subscription
                if (!errorResponse.ok) {
                    console.error('Failed to send AI error message via API');
                }
            } catch (sendError) {
                console.error('Failed to send AI error message:', sendError);
            }
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
    
    function getSenderIcon(isOwnMessage: boolean, message?: any) {
        // Special styling for AI messages
        if (message?.user?.email === 'ai@mapit.com' || message?.user?.firstName === 'MAPIT') {
            return "bg-gradient-to-r from-emerald-500 to-teal-600";
        }
        
        return isOwnMessage 
            ? "bg-blue-500" 
            : "bg-purple-500";
    }
    
    // Check if a message is from AI
    function isAIMessage(message: any): boolean {
        return message?.user?.email === 'ai@mapit.com' || message?.user?.firstName === 'MAPIT';
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

    // Function to check if a message is an error
    function isErrorMessage(text: string): boolean {
        return text.startsWith('Error:') || text.includes('🤖 **MAPIT AI Error:**');
    }

    // Function to safely render markdown
    function renderMarkdown(text: string): string {
        try {
            // Configure marked options for better formatting
            marked.setOptions({
                gfm: true,
                breaks: true // Convert \n to <br>
            });
            
            // Parse markdown and sanitize HTML
            const parsed = marked.parse(text) as string;
            let sanitized = DOMPurify.sanitize(parsed) as string;
            
            // Post-process to add target="_blank" to all links
            sanitized = sanitized.replace(
                /<a\s+href="([^"]*)"([^>]*)>/g, 
                '<a href="$1" target="_blank" rel="noopener noreferrer"$2>'
            );
            
            return sanitized;
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

    onMount(async () => {
        // Load current user for display
        try {
            currentUser = await getCurrentClient();
        } catch (err) {
            console.error("Error loading current user:", err);
        }
        
        // Fetch available AI providers
        await fetchAvailableProviders();
    });

    // Handle input changes for autocomplete
    function handleInputChange() {
        const trimmedInput = userInput.trim();
        const target = '@mapit';
        
        // Show autocomplete if user is typing something that could become @mapit
        // Show for partial matches: "@", "@m", "@ma", "@map", "@mapi"
        // Hide when they complete "@mapit" or type something that doesn't match
        if (trimmedInput.length > 0 && 
            trimmedInput.length < target.length && 
            target.startsWith(trimmedInput.toLowerCase())) {
            showAutocomplete = true;
        } else {
            showAutocomplete = false;
        }
    }
    
    // Function to highlight @mapit in messages
    function highlightMapitInMessage(text: string): string {
        // Replace @mapit (case insensitive) with highlighted version
        return text.replace(/@mapit\b/gi, '<span class="mapit-highlight">@mapit</span>');
    }
    
    // Check if input contains @mapit for styling
    function hasMapitInput(text: string): boolean {
        return /@mapit\b/i.test(text);
    }
    
    // Handle key presses for autocomplete
    function handleKeyDown(event: KeyboardEvent) {
        if (showAutocomplete && event.key === 'Tab') {
            event.preventDefault();
            selectMapitSuggestion();
        } else if (event.key === 'Escape') {
            showAutocomplete = false;
        }
    }
    
    // Select @mapit suggestion
    function selectMapitSuggestion() {
        userInput = '@mapit ';
        showAutocomplete = false;
        if (inputElement) {
            inputElement.focus();
            // Set cursor to end of input
            setTimeout(() => {
                if (inputElement) {
                    inputElement.setSelectionRange(userInput.length, userInput.length);
                }
            }, 0);
        }
    }
    
    // Close autocomplete when clicking outside
    function handleInputBlur() {
        // Delay hiding to allow clicking on the suggestion
        setTimeout(() => {
            showAutocomplete = false;
        }, 150);
    }
</script>

<div class="w-full h-screen flex flex-col relative bg-[#2B2A2C] overflow-hidden">
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
                    <!-- AI Provider Selector -->
                    <AIProviderSelector />
                    
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
                    <div class="space-y-1 pb-6">
                        {#each messages as message, index}
                            {@const isOwnMessage = currentUser && message.userId === currentUser.id}
                            {@const isAI = isAIMessage(message)}
                            {@const isGrouped = shouldGroupMessage(message, messages[index - 1])}
                            {@const isLastInGroupFlag = isLastInGroup(message, messages[index + 1])}
                            <div class="group relative {isGrouped ? 'mt-0.5' : 'mt-4'}">
                                <div class="flex items-start gap-4 {isOwnMessage && !isAI ? 'flex-row-reverse' : 'flex-row'}">
                                    <!-- Avatar with user initials - only show for first message in group -->
                                    <div class="flex-shrink-0 {isGrouped ? 'invisible' : ''}">
                                        <div class="w-8 h-8 rounded-full {getSenderIcon(isOwnMessage, message)} flex items-center justify-center shadow-lg text-white text-xs font-semibold">
                                            {#if isAI}
                                                🤖
                                            {:else}
                                                {getUserInitials(message.user)}
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <!-- Message bubble -->
                                    <div class="flex-1 max-w-[80%] {isOwnMessage && !isAI ? 'text-right' : 'text-left'}">
                                        <!-- Username - only show for first message in group -->
                                        {#if !isGrouped}
                                            <div class="text-xs text-gray-400 mb-1 {isOwnMessage && !isAI ? 'text-right' : 'text-left'}">
                                                {#if isAI}
                                                    <span class="text-emerald-400 font-medium">MAPIT AI</span>
                                                {:else}
                                                    {getUserDisplayName(message.user)}
                                                {/if}
                                            </div>
                                        {/if}
                                        
                                        <div class="inline-block">
                                            {#if isAI}
                                                {#if isErrorMessage(message.text)}
                                                    <!-- AI Error message styling -->
                                                    <div class="bg-red-900/20 border border-red-800 text-red-300 px-3 py-2 rounded-lg {isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm'} shadow-sm">
                                                        <div class="flex items-start gap-3">
                                                            <div class="flex-shrink-0 pt-1">
                                                                <Icon name="error" className="text-red-400 text-sm" />
                                                            </div>
                                                            <div class="flex-1">
                                                                <div class="prose prose-sm max-w-none">
                                                                    <p class="whitespace-pre-wrap leading-relaxed m-0 text-red-300 text-sm">{message.text}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {#if isLastInGroupFlag}
                                                            <div class="text-xs text-red-400/60 mt-1 text-right leading-none">
                                                                {formatMessageTime(message.createdAt)}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                    <!-- Normal AI response with enhanced styling -->
                                                    <div class="bg-[#3A3A3C] text-gray-100 px-3 py-2 rounded-lg {isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm'} shadow-sm border border-emerald-500/30">
                                                        <div class="prose prose-sm prose-invert max-w-none">
                                                            {@html renderMarkdown(message.text)}
                                                        </div>
                                                        {#if isLastInGroupFlag}
                                                            <div class="text-xs text-gray-400/60 mt-1 text-right leading-none">
                                                                {formatMessageTime(message.createdAt)}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            {:else}
                                                <!-- Regular user message -->
                                                <div class="{getSenderBackground(isOwnMessage)} text-white px-3 py-2 rounded-lg {isOwnMessage ? (isGrouped ? 'rounded-tr-lg' : 'rounded-tr-sm') : (isGrouped ? 'rounded-tl-lg' : 'rounded-tl-sm')} shadow-sm">
                                                    <div class="prose prose-sm max-w-none">
                                                        <p class="whitespace-pre-wrap leading-relaxed m-0 text-sm">
                                                            {@html highlightMapitInMessage(message.text)}
                                                        </p>
                                                    </div>
                                                    {#if isLastInGroupFlag}
                                                        <div class="text-xs text-white/60 mt-1 text-right leading-none">
                                                            {formatMessageTime(message.createdAt)}
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/if}

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
                    <div class="relative bg-[#3A3A3C] rounded-2xl shadow-lg border border-gray-600 transition-all">
                        <!-- Autocomplete popup -->
                        {#if showAutocomplete}
                            <div class="absolute bottom-full left-4 right-4 mb-2 bg-[#2B2A2C] border border-gray-600 rounded-lg shadow-xl z-50">
                                <button
                                    type="button"
                                    onclick={selectMapitSuggestion}
                                    class="w-full px-4 py-3 text-left hover:bg-[#3A3A3C] transition-colors rounded-lg flex items-start gap-3"
                                >
                                    <div class="flex-shrink-0 mt-1">
                                        <div class="w-6 h-6 rounded bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <span class="text-white text-xs">🤖</span>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-emerald-400 font-medium text-sm">
                                            <!-- Show what user has typed in white, rest in emerald -->
                                            <span class="text-white">{userInput.trim()}</span><span class="text-emerald-400">{'@mapit'.slice(userInput.trim().length)}</span>
                                        </div>
                                        <div class="text-gray-400 text-xs mt-1">Ask MAPIT AI a question</div>
                                        <div class="text-gray-500 text-xs mt-1">Press Tab or click to select</div>
                                    </div>
                                </button>
                            </div>
                        {/if}
                        
                        <input
                            bind:this={inputElement}
                            type="text"
                            bind:value={userInput}
                            oninput={handleInputChange}
                            onkeydown={handleKeyDown}
                            onblur={handleInputBlur}
                            placeholder="Message your team... (Try @mapit for AI assistance)"
                            class="w-full px-4 py-4 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400 pr-12 rounded-2xl {hasMapitInput(userInput) ? 'mapit-input-active' : ''}"
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
    
    /* Enhanced prose styles for AI responses */
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
    
    /* Enhanced heading styles with colors */
    :global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
        color: #60a5fa;
        margin-top: 1.8rem;
        margin-bottom: 0.8rem;
        font-weight: 700;
        line-height: 1.3;
    }
    
    :global(.prose h1:first-child, .prose h2:first-child, .prose h3:first-child) {
        margin-top: 0;
    }
    
    :global(.prose h1) {
        font-size: 1.5rem;
        color: #60a5fa;
    }
    
    :global(.prose h2) {
        font-size: 1.3rem;
        color: #34d399;
    }
    
    :global(.prose h3) {
        font-size: 1.15rem;
        color: #ffffff;
    }
    
    /* Enhanced list styles */
    :global(.prose ul, .prose ol) {
        margin: 1.2rem 0;
        padding-left: 1.8rem;
    }
    
    :global(.prose li) {
        margin: 0.6rem 0;
        color: #d1d5db;
    }
    
    :global(.prose ul li) {
        position: relative;
    }
    
    :global(.prose ul li::marker) {
        color: #60a5fa;
        font-weight: bold;
    }
    
    :global(.prose ol li::marker) {
        color: #34d399;
        font-weight: bold;
    }
    
    /* Enhanced strong/bold text */
    :global(.prose strong, .prose b) {
        color: #ffffff;
        font-weight: 700;
    }
    
    /* Enhanced emphasis/italic text */
    :global(.prose em, .prose i) {
        color: #93c5fd;
        font-style: italic;
    }
    
    /* Enhanced link styles */
    :global(.prose a) {
        color: #60a5fa;
        text-decoration: underline;
        text-decoration-color: rgba(96, 165, 250, 0.5);
        transition: all 0.2s ease;
    }
    
    :global(.prose a:hover) {
        color: #93c5fd;
        text-decoration-color: #93c5fd;
    }
    
    /* Enhanced code styles */
    :global(.prose code) {
        background-color: rgba(99, 102, 241, 0.15);
        color: #c7d2fe;
        padding: 0.2rem 0.5rem;
        border-radius: 0.375rem;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace !important;
        font-size: 0.875em;
        font-weight: 500;
        border: 1px solid rgba(99, 102, 241, 0.2);
    }
    
    :global(.prose pre) {
        background-color: rgba(15, 23, 42, 0.8) !important;
        padding: 1.2rem !important;
        border-radius: 0.75rem !important;
        overflow-x: auto;
        margin: 1.5rem 0;
        border: 1px solid rgba(99, 102, 241, 0.2) !important;
        font-size: 0.875rem;
    }
    
    :global(.prose pre code) {
        background: transparent;
        border: none;
        padding: 0;
        color: #e2e8f0;
    }
    
    /* Enhanced blockquote styles */
    :global(.prose blockquote) {
        border-left: 4px solid #60a5fa;
        padding-left: 1.2rem;
        margin: 1.5rem 0;
        font-style: italic;
        color: #cbd5e1;
        background-color: rgba(96, 165, 250, 0.05);
        padding: 1rem 1.2rem;
        border-radius: 0.5rem;
    }
    
    /* Enhanced table styles */
    :global(.prose table) {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        background-color: rgba(30, 41, 59, 0.5);
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    :global(.prose th) {
        background-color: rgba(60, 75, 100, 0.8);
        color: #ffffff;
        font-weight: 700;
        padding: 0.75rem;
        text-align: left;
        border-bottom: 2px solid rgba(99, 102, 241, 0.3);
    }
    
    :global(.prose td) {
        padding: 0.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        color: #d1d5db;
    }
    
    :global(.prose tr:nth-child(even)) {
        background-color: rgba(51, 65, 85, 0.3);
    }
    
    /* Special styling for nested project details */
    :global(.prose ul ul) {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        background-color: rgba(15, 23, 42, 0.4);
        padding: 0.6rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    :global(.prose ul ul li) {
        margin: 0.3rem 0;
        font-size: 0.9rem;
    }
    
    /* @mapit highlighting */
    :global(.mapit-highlight) {
        background: linear-gradient(90deg, #10b981, #059669);
        color: white;
        padding: 0.1rem 0.3rem;
        border-radius: 0.25rem;
        font-weight: 600;
        font-size: 0.9em;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    /* Input field @mapit highlighting */
    .mapit-input-active {
        color: #10b981 !important;
        font-weight: 600 !important;
        text-shadow: 0 0 8px rgba(16, 185, 129, 0.4) !important;
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