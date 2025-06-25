<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import Icon from "$lib/components/generic/icon.svelte";
    import { 
        getConversationMessages,
        addUserMessage,
        addAIMessage,
        getAIResponse,
        getStreamingAIResponse,
        addStreamingAIMessage
    } from "$lib/clients/conversationService";
    import type { Message, Conversation } from "$lib/types/schema";
    
    import ApiModeToggle from "../../../components/api-mode-toggle.svelte";
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import { fetchAvailableProviders, selectedVersion } from '$lib/stores/aiProviderStore';
    import AIProviderSelector from "../../../components/ai-provider-selector.svelte";
    import EditableTitle from "$lib/components/generic/editable-title.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";

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
    let lastResponseProvider = $state<string | null>(null);
    let lastResponseModel = $state<string | null>(null);
    let lastResponseVersion = $state<string | null>(null);
    let lastResponseDataSource = $state<string | null>(null);
    let lastResponseProcessingTime = $state<number | null>(null);
    let lastResponseProjectsFound = $state<number | null>(null);

    // Reference to the messages container for auto-scrolling
    let messagesContainer: HTMLDivElement;
    
    // Derived state for conversation name handling
    let conversationName = $derived(conversation?.name || "Untitled Conversation");
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Effect to load messages and conversation details when chatId changes
    $effect(() => {
        if (chatId) {
            loadMessages(chatId);
            loadConversationDetails(chatId);
        }
    });
    
    // Effect to check for autostart parameter and trigger AI response
    $effect(() => {
        const autostartQuestion = $page.url.searchParams.get('autostart');
        if (autostartQuestion && chatId && messages.length > 0 && !isStreaming && !isSending) {
            // Only autostart if we have messages loaded and we're not already processing
            // This means the user message is already in the conversation
            startAIResponse(autostartQuestion);
            
            // Remove the autostart parameter from URL to prevent re-triggering
            const url = new URL($page.url);
            url.searchParams.delete('autostart');
            window.history.replaceState({}, '', url.toString());
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
                        lastResponseProvider = data.ai_provider || null;
                        lastResponseVersion = data.ai_version || null;
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
                        
                        // Store final response metadata
                        lastResponseProvider = data.ai_provider || null;
                        lastResponseModel = data.logs?.model_used || null;
                        lastResponseVersion = data.ai_version || null;
                        lastResponseDataSource = data.data_source || null;
                        lastResponseProcessingTime = data.processing_time || null;
                        lastResponseProjectsFound = data.projects_found || null;
                        
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
    
    // Helper functions
    function getSenderClass(sender: string) {
        return sender === 'user' 
            ? "text-white" 
            : "text-white";
    }

    function getSenderBackground(sender: string) {
        return sender === 'user' 
            ? "bg-[#2F2F33]" 
            : "bg-[#343541]";
    }
    
    function getSenderIcon(sender: string) {
        return sender === 'user' 
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

    // Function to check if a message is an error
    function isErrorMessage(text: string): boolean {
        return text.startsWith('Error:');
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
    
    // Function to highlight @mapit in messages
    function highlightMapitInMessage(text: string): string {
        // Replace @mapit (case insensitive) with highlighted version
        return text.replace(/@mapit\b/gi, '<span class="mapit-highlight">@mapit</span>');
    }
    
    // Check if input contains @mapit for styling
    function hasMapitInput(text: string): boolean {
        return /@mapit\b/i.test(text);
    }
</script>

<div class="w-full h-screen flex flex-col relative bg-[#2B2A2C] overflow-hidden">
        <!-- Top header with dark glass morphism effect - made smaller -->
        <div class="absolute top-0 left-0 right-0 h-12 bg-[#2B2A2C]/90 backdrop-blur-xl border-b border-gray-700/50 z-10">
            <div class="flex items-center justify-between h-full px-4">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Icon name="smart_toy" className="text-white text-xs" />
                    </div>
                    <div>
                        <span class="text-gray-100 text-xs font-medium">AI Assistant</span>
                        <span class="text-xs font-semibold ml-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-1.5 py-0.5 rounded-full">BETA</span>
                    </div>
                </div>
                
                <!-- API Controls -->
                <div class="flex items-center gap-2">
                    <AIProviderSelector />
                    <ApiModeToggle />
                </div>
            </div>
        </div>
    
        <div class="flex-1 flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden pt-12">
            <!-- Chat title area - with extra space for warning -->
            <div class="flex-shrink-0 p-4 pb-8 text-center">
                {#if conversation}
                    <div class="space-y-2">
                        <EditableTitle 
                            value={conversationName}
                            onSave={handleSaveConversationName}
                            placeholder="Untitled Conversation"
                            maxLength={30}
                            showEditIcon={true}
                            titleClass="text-xl font-semibold text-gray-100"
                            inputClass="text-xl font-semibold bg-transparent border-b-2 border-blue-500 text-gray-100 outline-none text-center"
                        />
                    </div>
                {:else if !isLoading}
                    <div class="space-y-2">
                        <h1 class="text-xl font-semibold text-gray-100">New Conversation</h1>
                        <p class="text-xs text-gray-400">How can I help you today?</p>
                    </div>
                {/if}
                
                <!-- AI Provider info with dark styling - made smaller -->
                {#if lastResponseProvider || lastResponseDataSource}
                    <div class="mt-3 flex flex-wrap gap-2 justify-center">
                        {#if lastResponseProvider && lastResponseModel}
                            <span class="inline-flex items-center gap-2 text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full border border-gray-600">
                                <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                {lastResponseProvider} ({lastResponseModel})
                                {#if lastResponseVersion}
                                    <span class="text-blue-400">• {lastResponseVersion}</span>
                                {/if}
                            </span>
                        {/if}
                        
                        {#if lastResponseDataSource}
                            <span class="inline-flex items-center gap-2 text-xs bg-blue-900/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-700">
                                <Icon name="storage" className="text-xs" />
                                {lastResponseDataSource}
                            </span>
                        {/if}
                        
                        {#if lastResponseProcessingTime}
                            <span class="inline-flex items-center gap-2 text-xs bg-purple-900/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-700">
                                <Icon name="timer" className="text-xs" />
                                {lastResponseProcessingTime.toFixed(2)}s
                            </span>
                        {/if}
                        
                        {#if lastResponseProjectsFound !== null && lastResponseProjectsFound !== undefined}
                            <span class="inline-flex items-center gap-2 text-xs bg-emerald-900/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-700">
                                <Icon name="folder" className="text-xs" />
                                {lastResponseProjectsFound} projects
                            </span>
                        {/if}
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
                                <div class="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                            </div>
                            <p class="text-gray-400 text-sm">Loading conversation...</p>
                        </div>
                    </div>
                {:else if messages.length === 0}
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center p-8 max-w-md">
                            <div class="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Icon name="chat" className="text-white text-xl" />
                            </div>
                            <h3 class="text-xl font-semibold text-gray-200 mb-3">Start a conversation</h3>
                            <p class="text-gray-400 leading-relaxed">I'm here to help answer your questions and assist with your tasks. What would you like to know?</p>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-6 pb-6">
                        {#each messages as message, index}
                            <div class="group relative">
                                <div class="flex items-start gap-4 {message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}">
                                    <!-- Avatar -->
                                    <div class="flex-shrink-0">
                                        {#if message.sender === 'user'}
                                            <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shadow-lg">
                                                <Icon name="person" className="text-white text-sm" />
                                            </div>
                                        {:else}
                                            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                                <Icon name="smart_toy" className="text-white text-sm" />
                                            </div>
                                        {/if}
                                    </div>
                                    
                                    <!-- Message bubble -->
                                    <div class="flex-1 max-w-[80%] {message.sender === 'user' ? 'text-right' : 'text-left'}">
                                        <div class="inline-block">
                                            {#if message.sender === 'user'}
                                                <div class="bg-gray-600 text-white px-4 py-3 rounded-2xl rounded-tr-md shadow-lg">
                                                    <div class="prose prose-sm max-w-none">
                                                        <p class="whitespace-pre-wrap leading-relaxed m-0">
                                                            {@html highlightMapitInMessage(message.text)}
                                                        </p>
                                                    </div>
                                                </div>
                                            {:else}
                                                {#if isErrorMessage(message.text)}
                                                    <!-- Error message styling -->
                                                    <div class="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-2xl rounded-tl-md shadow-lg">
                                                        <div class="flex items-start gap-3">
                                                            <div class="flex-shrink-0 pt-1">
                                                                <Icon name="error" className="text-red-400 text-sm" />
                                                            </div>
                                                            <div class="flex-1">
                                                                <div class="prose prose-sm max-w-none">
                                                                    <p class="whitespace-pre-wrap leading-relaxed m-0 text-red-300">{message.text}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                {:else}
                                                    <!-- Normal AI response -->
                                                    <div class="bg-[#3A3A3C] text-gray-100 px-4 py-3 rounded-2xl rounded-tl-md shadow-lg border border-gray-600">
                                                        <div class="prose prose-sm prose-invert max-w-none">
                                                            {@html renderMarkdown(message.text)}
                                                        </div>
                                                    </div>
                                                {/if}
                                            {/if}
                                            
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
                                        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                            <Icon name="smart_toy" className="text-white text-sm" />
                                        </div>
                                    </div>
                                    
                                    <!-- Enhanced typing indicator with timing info - only shows while sending -->
                                    <div class="bg-[#3A3A3C] px-4 py-4 rounded-2xl rounded-tl-md shadow-lg border border-gray-600 max-w-md">
                                        <div class="space-y-3">
                                            <!-- Animated dots -->
                                            <div class="flex items-center gap-2">
                                                <div class="flex space-x-1">
                                                    <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                                                    <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.1s"></div>
                                                    <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
                                                </div>
                                                <span class="text-xs text-gray-400 ml-2">AI is analyzing your query...</span>
                                            </div>
                                            
                                            <!-- Timing information -->
                                            <div class="text-xs text-gray-500 bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600/50">
                                                <div class="flex items-center gap-2 mb-1">
                                                    <Icon name="schedule" className="text-xs text-blue-400" />
                                                    <span class="text-gray-400 font-medium">Response Time</span>
                                                </div>
                                                <div class="space-y-1 ml-5">
                                                    <div class="text-gray-400">• Average: <span class="text-blue-300">40 seconds</span></div>
                                                    <div class="text-gray-500">• Complex queries may take longer</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- Error message with dark styling -->
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
            
            <!-- Input area with dark design -->
            <div class="flex-shrink-0 p-6">
                <form on:submit|preventDefault={handleSubmit} class="relative max-w-4xl mx-auto">
                    <div class="relative bg-[#3A3A3C] rounded-2xl shadow-lg border border-gray-600 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                        <input
                            type="text"
                            bind:value={userInput}
                            placeholder={isStreaming ? "AI is generating response..." : "Message AI Assistant..."}
                            class="w-full px-4 py-4 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400 pr-12 rounded-2xl {hasMapitInput(userInput) ? 'mapit-input-active' : ''}"
                            disabled={isSending || isStreaming}
                        />
                        
                        {#if isStreaming}
                            <button
                                type="button"
                                on:click={stopStreaming}
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Icon name="stop" className="text-current" />
                            </button>
                        {:else}
                            <button
                                type="submit"
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 {userInput.trim() && !isSending ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-600 text-gray-400'}"
                                disabled={isSending || !userInput.trim()}
                            >
                                <Icon name="send" className="text-current" />
                            </button>
                        {/if}
                    </div>
                    
                    <!-- Streaming progress indicator -->
                    {#if isStreaming && streamingProgress}
                        <div class="mt-4 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30">
                            <div class="flex items-center gap-3">
                                <div class="flex space-x-1">
                                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                                    <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style="animation-delay: 0.1s"></div>
                                    <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0.2s"></div>
                                </div>
                                <span class="text-emerald-300 font-medium text-sm">{streamingProgress}</span>
                            </div>
                            <div class="mt-2 w-full bg-gray-700/50 rounded-full h-1 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-pulse"></div>
                            </div>
                        </div>
                    {/if}

                    <!-- Input hint -->
                    <div class="text-center mt-3">
                        <p class="text-xs text-gray-500">
                            {#if isStreaming}
                                Real-time AI response streaming • Click stop to cancel
                            {:else}
                                Press Enter to send • AI can make mistakes, verify important information
                            {/if}
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
    
    /* Focus states */
    :global(.focus\:ring-2:focus) {
        ring-offset-width: 2px;
        ring-offset-color: transparent;
    }
</style>