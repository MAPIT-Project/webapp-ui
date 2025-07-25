<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { 
        getConversationMessages,
        addUserMessage,
        addAIMessage,
        getAIResponse,
        getStreamingAIResponse,
    addStreamingAIMessage
    } from "$lib/clients/conversationService";
    import type { Message, Conversation } from "$lib/types/schema";
    
    import { fetchAvailableProviders, selectedVersion } from '$lib/stores/aiProviderStore';
    import { conversationStore } from "$lib/stores/conversationStore";
    
    // Import components
    import ChatHeader from "./ChatHeader.svelte";
    import ChatTitle from "./ChatTitle.svelte";
    import ChatMessage from "./ChatMessage.svelte";
    import TypingIndicator from "./TypingIndicator.svelte";
    import ChatInput from "./ChatInput.svelte";
    import ErrorMessage from "./ErrorMessage.svelte";
    import EmptyState from "./EmptyState.svelte";
    import LoadingState from "./LoadingState.svelte";

    // State using runes
    let userInput = $state("");
    let messages = $state<Message[]>([]);
    let conversation = $state<Conversation | null>(null);
    let isLoading = $state(false);
    let isSending = $state(false);
    let isStreaming = $state(false);
    let streamingProgress = $state("");
    let error = $state<string | null>(null);
    let currentStreamingService: any = null;

    // Reference to the messages container for auto-scrolling
    let messagesContainer: HTMLDivElement;
    
    // Derived state for conversation name handling
    let conversationName = $derived(conversation?.name || "Untitled Conversation");
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Function to check if a message should be grouped with the previous one
    function shouldGroupMessage(currentMessage: Message, previousMessage: Message | undefined): boolean {
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
            loadMessages(chatId);
            loadConversationDetails(chatId);
        }
    });
    
    // Track if autostart has been processed to prevent loops
    let autostartProcessed = $state(false);
    
    // Effect to check for autostart parameter and trigger AI response
    $effect(() => {
        const autostartQuestion = $page.url.searchParams.get('autostart');
        if (autostartQuestion && chatId && messages.length > 0 && !isStreaming && !isSending && !autostartProcessed) {
            // Only autostart if we have messages loaded and we're not already processing
            // This means the user message is already in the conversation
            autostartProcessed = true; // Set flag immediately to prevent re-triggering
            
            // Remove the autostart parameter from URL to prevent re-triggering
            const url = new URL($page.url);
            url.searchParams.delete('autostart');
            window.history.replaceState({}, '', url.toString());
            
            // Start the AI response
            startAIResponse(autostartQuestion);
        }
    });
    
    // Reset autostart flag when navigating to a different conversation
    $effect(() => {
        if (chatId) {
            autostartProcessed = false;
        }
    });
    
    // Effect to scroll to bottom when messages change
    $effect(() => {
        if (messagesContainer && (messages.length > 0 || isSending || isStreaming)) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
        }
    });

    // Cleanup effect for streaming service
    $effect(() => {
        return () => {
            if (currentStreamingService) {
                currentStreamingService.destroy();
            }
        };
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
            messages = await getConversationMessages(id);
        } catch (err) {
            console.error("Error loading messages:", err);
            error = "Failed to load conversation messages";
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

    async function startAIResponse(question: string) {
        if (isStreaming || isSending) return;
        
        isStreaming = true;
        streamingProgress = "";
        error = null;
        
        try {
            // Create initial AI message for streaming
            const { message: aiMessage, updateMessage } = await addStreamingAIMessage(chatId, "");
            
            if (aiMessage) {
                messages = [...messages, aiMessage];
                
                let currentAnswer = "";
                let finalData: any = null;
                let lastSaveTime = Date.now();
                let lastSavedLength = 0;
                const SAVE_INTERVAL_MS = 3000; // Save every 3 seconds
                const MIN_SAVE_TOKENS = 50; // Or every 50 tokens, whichever comes first
                
                // Periodic save function
                const saveProgress = async (text: string, trackingData?: any) => {
                    try {
                        await updateMessage(text, trackingData || {});
                        lastSaveTime = Date.now();
                        lastSavedLength = text.length;
                        console.log('Saved streaming progress:', text.length, 'characters');
                    } catch (error) {
                        console.error('Error saving streaming progress:', error);
                    }
                };
                
                // Start streaming
                currentStreamingService = getStreamingAIResponse(question, {
                    onMetadata: (data) => {
                        console.log('Streaming metadata:', data);
                    },
                    
                    onProgress: (data) => {
                        console.log('Streaming progress:', data);
                        streamingProgress = data.message;
                    },
                    
                    onToken: (token, fullAnswer) => {
                        currentAnswer = fullAnswer;
                        // Update the message in the UI immediately
                        const messageIndex = messages.findIndex(m => m.id === aiMessage.id);
                        if (messageIndex !== -1) {
                            const updatedMessages = [...messages];
                            updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], text: fullAnswer };
                            messages = updatedMessages;
                        }
                        
                        // Check if we should save progress to database
                        const now = Date.now();
                        const timeSinceLastSave = now - lastSaveTime;
                        const tokensSinceLastSave = fullAnswer.length - lastSavedLength;
                        
                        if (timeSinceLastSave >= SAVE_INTERVAL_MS || tokensSinceLastSave >= MIN_SAVE_TOKENS) {
                            saveProgress(fullAnswer);
                        }
                    },
                    
                    onComplete: async (data) => {
                        console.log('Streaming complete:', data);
                        finalData = data;
                        
                        // Final save with complete tracking data
                        await saveProgress(currentAnswer || data.answer, {
                            ai_provider: data.ai_provider,
                            ai_version: data.ai_version,
                            model_used: data.logs?.model_used,
                            data_source: data.data_source,
                            processing_time: data.processing_time,
                            projects_found: data.projects_found,
                            logs: data.logs
                        });
                        
                        // Update the local message object with metadata for immediate UI display
                        const messageIndex = messages.findIndex(m => m.id === aiMessage.id);
                        if (messageIndex !== -1) {
                            const updatedMessages = [...messages];
                            updatedMessages[messageIndex] = { 
                                ...updatedMessages[messageIndex], 
                                text: currentAnswer || data.answer,
                                // Add metadata fields using camelCase to match TypeScript types
                                aiProvider: data.ai_provider,
                                aiVersion: data.ai_version,
                                modelUsed: data.logs?.model_used,
                                dataSource: data.data_source,
                                processingTime: data.processing_time,
                                projectsFound: data.projects_found
                            };
                            messages = updatedMessages;
                        }
                        
                        isStreaming = false;
                        streamingProgress = "";
                        currentStreamingService = null;
                    },
                    
                    onError: async (errorEvent) => {
                        console.error('Streaming error:', errorEvent);
                        
                        // Construct the error message
                        const errorTitle = errorEvent.error || 'Streaming error';
                        const errorDetails = errorEvent.details || 'No additional details available';
                        const fullErrorMessage = `Error: ${errorTitle}\n\nDetails: ${errorDetails}`;
                        
                        // Always save the error message to the database
                        if (currentAnswer) {
                            // If we have partial content, append the error
                            await saveProgress(currentAnswer + `\n\n${fullErrorMessage}`);
                        } else {
                            // If no content yet, save just the error message
                            await saveProgress(fullErrorMessage);
                        }
                        
                        isStreaming = false;
                        streamingProgress = "";
                        
                        // Set error for UI display
                        error = `${errorTitle}\n\nDetails: ${errorDetails}`;
                        
                        currentStreamingService = null;
                        
                        // Update the message in UI with error
                        const messageIndex = messages.findIndex(m => m.id === aiMessage.id);
                        if (messageIndex !== -1) {
                            const updatedMessages = [...messages];
                            updatedMessages[messageIndex] = { 
                                ...updatedMessages[messageIndex], 
                                text: fullErrorMessage
                            };
                            messages = updatedMessages;
                        }
                    }
                });
            }
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            isStreaming = false;
            streamingProgress = "";
            console.error("AI response error:", err);
        }
    }

    async function handleSubmit() {
        if (!userInput.trim() || isStreaming || isSending) return;
        
        isSending = true;
        error = null;
        
        try {
            // Store the current input before clearing it
            const currentInput = userInput;
            
            // Add the user message
            const userMessage = await addUserMessage(chatId, currentInput);
            
            if (userMessage) {
                messages = [...messages, userMessage];
            }
            
            // Clear the input field
            userInput = "";
            isSending = false;
            
            // Start the AI response
            await startAIResponse(currentInput);
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            isSending = false;
            isStreaming = false;
            streamingProgress = "";
            console.error("Chat error:", err);
        }
    }

    function stopStreaming() {
        if (currentStreamingService) {
            currentStreamingService.stopStreaming();
            currentStreamingService = null;
        }
        isStreaming = false;
        streamingProgress = "";
        
        // Note: currentAnswer will be saved by the onError callback when streaming stops
    }
    
    // Helper functions for message grouping
    function handleUserInputChange(value: string) {
        userInput = value;
    }
    
    function handleChatInputSubmit() {
        handleSubmit();
    }
    
    function handleStopStreaming() {
        stopStreaming();
    }
</script>

<!-- Modern dark grey gradient background -->
<div class="w-full h-screen flex flex-col relative bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#141414] overflow-hidden">
    <!-- Subtle pattern overlay for texture -->
    <div class="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px]"></div>
    
    <!-- Top header with modern backdrop -->
    <div class="relative z-10">
        <ChatHeader />
    </div>
    
    <!-- Main chat container with full-width scrollable area -->
    <div class="flex-1 flex flex-col h-full w-full overflow-hidden pt-12 relative z-10">
        <!-- Chat title area - centered content -->
        <div class="w-full max-w-4xl mx-auto px-6">
            <ChatTitle
                {conversation}
                {isLoading}
                {conversationName}
                onSave={handleSaveConversationName}
            />
        </div>
        
        <!-- Chat messages area with full-width scrollbar -->
        <div 
            class="flex-1 overflow-y-auto min-h-0 pb-6 scroll-smooth scrollbar-thin" 
            bind:this={messagesContainer}
        >
            <!-- Centered content container -->
            <div class="w-full max-w-4xl mx-auto px-6">
                {#if isLoading}
                    <div class="mt-8">
                        <LoadingState />
                    </div>
                {:else if messages.length === 0}
                    <div class="mt-8">
                        <EmptyState />
                    </div>
                {:else}
                    <div class="space-y-1 pt-6 pb-8">
                        {#each messages as message, index}
                            {@const isGrouped = shouldGroupMessage(message, messages[index - 1])}
                            {@const isLastInGroupFlag = isLastInGroup(message, messages[index + 1])}
                            <div class="animate-fadeInUp">
                                <ChatMessage
                                    {message}
                                    isGrouped={isGrouped}
                                    isLastInGroup={isLastInGroupFlag}
                                />
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
                
                <!-- Error message with modern styling -->
                {#if error}
                    <div class="mt-4 animate-fadeInUp">
                        <ErrorMessage {error} />
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Input area - centered content -->
        <div class="w-full max-w-4xl mx-auto px-6">
            <ChatInput
                {userInput}
                {isStreaming}
                {isSending}
                {streamingProgress}
                onInputChange={handleUserInputChange}
                onSubmit={handleChatInputSubmit}
                onStopStreaming={handleStopStreaming}
            />
        </div>
    </div>
    
    <!-- Subtle bottom gradient overlay -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414]/80 to-transparent pointer-events-none"></div>
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
</style>