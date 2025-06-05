<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import Icon from "$lib/components/generic/icon.svelte";
    import { 
        getConversationMessages,
        addUserMessage,
        addAIMessage,
        getAIResponse
    } from "$lib/clients/conversationService";
    import type { Message, Conversation } from "$lib/server/db/schema";
    import ChatSidebar from "../../components/chat-sidebar.svelte";
    import ApiModeToggle from "../../components/api-mode-toggle.svelte";
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';
    import AIProviderSelector from "../../components/ai-provider-selector.svelte";

    // State using runes
    let userInput = $state("");
    let messages = $state<Message[]>([]);
    let conversation = $state<Conversation | null>(null);
    let isLoading = $state(false);
    let isSending = $state(false);
    let error = $state<string | null>(null);
    let lastResponseProvider = $state<string | null>(null);
    let lastResponseModel = $state<string | null>(null);
    
    // Reference to the messages container for auto-scrolling
    let messagesContainer: HTMLDivElement;
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Effect to load messages and conversation details when chatId changes
    $effect(() => {
        if (chatId) {
            loadMessages(chatId);
            loadConversationDetails(chatId);
        }
    });
    
    // Effect to scroll to bottom when messages change
    $effect(() => {
        if (messagesContainer && (messages.length > 0 || isSending)) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
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

    async function handleSubmit() {
        if (!userInput.trim()) return;
        
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
            
            // Get AI response from the API
            try {
                const aiResponseData = await getAIResponse(currentInput);
                
                // Store provider and model info
                lastResponseProvider = aiResponseData.ai_provider || null;
                lastResponseModel = aiResponseData.model_used || null;
                
                // Add the AI response to the conversation (including errors)
                const aiResponse = await addAIMessage(
                    chatId, 
                    aiResponseData.answer
                );
                
                if (aiResponse) {
                    messages = [...messages, aiResponse];
                }
            } catch (aiError) {
                console.error("Error getting AI response:", aiError);
                error = "Failed to get AI response. Please try again.";
            } finally {
                isSending = false;
            }
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            isSending = false;
            console.error("Chat error:", err);
        }
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
            // Pre-process the text to add proper line breaks for better formatting
            let processedText = text
                // Add double line breaks before lines that start with capital letters and contain colons (likely project titles)
                .replace(/([.!?])\s+([A-Z][^:]*:)/g, '$1\n\n$2')
                // Add line breaks before RCN numbers
                .replace(/(\([^)]*RCN:\s*\d+[^)]*\))/g, '\n\n$1')
                // Ensure proper spacing around colons in project descriptions
                .replace(/([A-Za-z0-9)]+):\s*/g, '$1: ')
                // Add line breaks before "Project X" references
                .replace(/(Project \d+,)/g, '\n\n$1');
            
            // Configure marked options for better formatting
            marked.setOptions({
                gfm: true,
                breaks: true, // Convert \n to <br>
                sanitize: false // We'll use DOMPurify for sanitization
            });
            
            // Parse markdown and sanitize HTML
            const parsed = marked.parse(processedText);
            return DOMPurify.sanitize(parsed);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return text;
        }
    }
</script>

<div class="w-full h-screen flex bg-[#2B2A2C] overflow-hidden">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col relative h-full overflow-hidden">
        <!-- Top header with dark glass morphism effect -->
        <div class="absolute top-0 left-0 right-0 h-16 bg-[#2B2A2C]/90 backdrop-blur-xl border-b border-gray-700/50 z-10">
            <div class="flex items-center justify-between h-full px-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                        <Icon name="smart_toy" class="text-white text-sm" />
                    </div>
                    <div>
                        <span class="text-gray-100 text-sm font-medium">AI Assistant</span>
                        <span class="text-xs font-semibold ml-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full">BETA</span>
                    </div>
                </div>
                
                <!-- API Controls -->
                <div class="flex items-center gap-3">
                    <AIProviderSelector />
                    <ApiModeToggle />
                </div>
            </div>
        </div>
    
        <div class="flex-1 flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden pt-16">
            <!-- Chat title area -->
            <div class="flex-shrink-0 p-6 text-center">
                {#if conversation}
                    <div class="space-y-2">
                        <h1 class="text-2xl font-bold text-gray-100">{conversation.name}</h1>
                        {#if conversation.topic}
                            <p class="text-sm text-gray-400">{conversation.topic}</p>
                        {/if}
                    </div>
                {:else if !isLoading}
                    <div class="space-y-2">
                        <h1 class="text-2xl font-bold text-gray-100">New Conversation</h1>
                        <p class="text-sm text-gray-400">How can I help you today?</p>
                    </div>
                {/if}
                
                <!-- AI Provider info with dark styling -->
                {#if lastResponseProvider && lastResponseModel}
                    <div class="mt-4">
                        <span class="inline-flex items-center gap-2 text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full border border-gray-600">
                            <div class="w-2 h-2 rounded-full bg-green-500"></div>
                            Powered by {lastResponseProvider} ({lastResponseModel})
                        </span>
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
                                <Icon name="chat" class="text-white text-xl" />
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
                                                <Icon name="person" class="text-white text-sm" />
                                            </div>
                                        {:else}
                                            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                                <Icon name="smart_toy" class="text-white text-sm" />
                                            </div>
                                        {/if}
                                    </div>
                                    
                                    <!-- Message bubble -->
                                    <div class="flex-1 max-w-[80%] {message.sender === 'user' ? 'text-right' : 'text-left'}">
                                        <div class="inline-block">
                                            {#if message.sender === 'user'}
                                                <div class="bg-gray-600 text-white px-4 py-3 rounded-2xl rounded-tr-md shadow-lg">
                                                    <div class="prose prose-sm max-w-none">
                                                        <p class="whitespace-pre-wrap leading-relaxed m-0">{message.text}</p>
                                                    </div>
                                                </div>
                                            {:else}
                                                {#if isErrorMessage(message.text)}
                                                    <!-- Error message styling -->
                                                    <div class="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-2xl rounded-tl-md shadow-lg">
                                                        <div class="flex items-start gap-3">
                                                            <div class="flex-shrink-0 pt-1">
                                                                <Icon name="error" class="text-red-400 text-sm" />
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
                                                {formatMessageTime(message.created_at)}
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
                                            <Icon name="smart_toy" class="text-white text-sm" />
                                        </div>
                                    </div>
                                    
                                    <div class="bg-[#3A3A3C] px-4 py-3 rounded-2xl rounded-tl-md shadow-lg border border-gray-600">
                                        <div class="flex items-center gap-1">
                                            <div class="flex space-x-1">
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.1s"></div>
                                                <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
                                            </div>
                                            <span class="text-xs text-gray-400 ml-2">AI is thinking...</span>
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
                                        <Icon name="error" class="text-red-400 text-sm" />
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
                            placeholder="Message AI Assistant..."
                            class="w-full px-4 py-4 bg-transparent text-gray-100 focus:outline-none placeholder-gray-400 pr-12 rounded-2xl"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 {userInput.trim() && !isSending ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl' : 'bg-gray-600 text-gray-400'}"
                            disabled={isSending || !userInput.trim()}
                        >
                            <Icon name="send" class="text-current" />
                        </button>
                    </div>
                    
                    <!-- Input hint -->
                    <div class="text-center mt-3">
                        <p class="text-xs text-gray-500">
                            Press Enter to send • AI can make mistakes, verify important information
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
    
    /* Dark prose styles for AI responses */
    :global(.prose) {
        font-size: 0.95rem;
        line-height: 1.7;
        color: #e5e7eb;
    }
    
    :global(.prose p) {
        margin-bottom: 1rem;
        color: #e5e7eb;
    }
    
    :global(.prose p:last-child) {
        margin-bottom: 0;
    }
    
    :global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
        color: #f3f4f6;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    :global(.prose h1:first-child, .prose h2:first-child, .prose h3:first-child) {
        margin-top: 0;
    }
    
    :global(.prose ul, .prose ol) {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    
    :global(.prose li) {
        margin: 0.25rem 0;
    }
    
    :global(.prose pre) {
        background-color: rgba(0, 0, 0, 0.4) !important;
        padding: 1rem !important;
        border-radius: 0.75rem !important;
        overflow-x: auto;
        margin: 1rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        font-size: 0.875rem;
    }
    
    :global(.prose code) {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 0.15rem 0.4rem;
        border-radius: 0.375rem;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Liberation Mono', 'Menlo', monospace !important;
        font-size: 0.875em;
        font-weight: 500;
        color: #e5e7eb;
    }
    
    :global(.prose blockquote) {
        border-left: 4px solid rgba(255, 255, 255, 0.2);
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #d1d5db;
        opacity: 0.8;
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