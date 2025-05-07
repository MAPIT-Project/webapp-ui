<script lang="ts">
    import { page } from "$app/stores";
    import Icon from "$lib/components/generic/icon.svelte";
    import { 
        getConversationMessages,
        addUserMessage,
        addAIMessage,
        getAIResponse
    } from "$lib/clients/conversationService";
    import type { Message, Conversation } from "$lib/server/db/schema";
    import ChatSidebar from "../../components/chat-sidebar.svelte";
    import { supabase } from "$lib/clients/supabaseClient";
    import ApiModeToggle from "../../components/api-mode-toggle.svelte";
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    
    // State using runes
    let userInput = $state("");
    let messages = $state<Message[]>([]);
    let conversation = $state<Conversation | null>(null);
    let isLoading = $state(false);
    let isSending = $state(false);
    let error = $state<string | null>(null);
    
    // Derive chatId from URL params
    let chatId = $derived(parseInt($page.params.conversation_id));
    
    // Effect to load messages and conversation details when chatId changes
    $effect(() => {
        if (chatId) {
            loadMessages(chatId);
            loadConversationDetails(chatId);
        }
    });
    
    // Load conversation details (title)
    async function loadConversationDetails(id: number) {
        try {
            const { data, error: supabaseError } = await supabase
                .from('conversation')
                .select('*')
                .eq('id', id)
                .single();
                
            if (supabaseError) throw supabaseError;
            conversation = data;
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
            
            // Get AI response from the FastAPI demo endpoint
            try {
                const aiResponseText = await getAIResponse(currentInput);
                
                // Add the AI response to the conversation
                const aiResponse = await addAIMessage(
                    chatId, 
                    aiResponseText
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

    // Function to safely render markdown
    function renderMarkdown(text: string): string {
        try {
            // Parse markdown and sanitize HTML
            const parsed = marked.parse(text);
            return DOMPurify.sanitize(parsed);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return text;
        }
    }
</script>

<div class="w-full min-h-screen h-full flex bg-[#2B2A2C]">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col relative">
        <div class="absolute left-4 top-4 z-10 flex items-center">
            <div class="bg-[#525252] p-1 rounded-md mr-2">
                <Icon name="smart_toy" iconSize="small" class="text-white text-xs" />
            </div>
            <span class="text-[#A0A0A8] text-xs">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1 bg-gray-700 text-gray-300 px-1 py-0.5 rounded">BETA</span></span>
        </div>
        
        <!-- API Mode Toggle -->
        <div class="absolute right-4 top-4 z-10">
            <ApiModeToggle />
        </div>
    
        <div class="flex-1 flex flex-col p-4 overflow-hidden w-full max-w-[900px] mx-auto">
            <!-- Chat title -->
            {#if conversation}
                <div class="text-center mb-4 pt-10">
                    <h1 class="text-xl font-semibold text-white">{conversation.name}</h1>
                    {#if conversation.topic}
                        <p class="text-sm text-[#A0A0A8]">{conversation.topic}</p>
                    {/if}
                </div>
            {:else if !isLoading}
                <div class="text-center mb-4 pt-10">
                    <h1 class="text-xl font-semibold text-white">Chat</h1>
                </div>
            {/if}
            
            <!-- Chat messages area -->
            <div class="flex-1 overflow-y-auto flex flex-col">
                {#if isLoading}
                    <div class="flex-1 flex items-center justify-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#A0A0A8]"></div>
                    </div>
                {:else if messages.length === 0}
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center p-8 max-w-md">
                            <div class="mx-auto w-12 h-12 bg-[#3E3E48] rounded-full flex items-center justify-center mb-4">
                                <Icon name="chat" iconSize="base" class="text-[#A0A0A8]" />
                            </div>
                            <h3 class="text-lg font-medium text-white mb-2">No messages yet</h3>
                            <p class="text-[#A0A0A8]">Start the conversation by typing a message below.</p>
                        </div>
                    </div>
                {:else}
                    {#each messages as message}
                        <div class="w-full chat-message {getSenderBackground(message.sender)} py-6">
                            <div class="max-w-[800px] mx-auto px-4">
                                <div class="flex">
                                    <div class="w-6 h-6 rounded-md mr-3 flex-shrink-0 {message.sender === 'user' ? 'user-icon bg-[#606060]' : 'ai-icon bg-[#525252]'} flex items-center justify-center shadow-md">
                                        <Icon name={message.sender === 'user' ? 'person' : 'smart_toy'} iconSize="small" class="text-white" />
                                    </div>
                                    <div class="flex-1">
                                        <div class="{getSenderClass(message.sender)}">
                                            {#if message.sender === 'user'}
                                                <p class="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                                            {:else}
                                                <div class="prose prose-invert prose-sm max-w-none">
                                                    {@html renderMarkdown(message.text)}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                    
                    {#if isSending}
                        <div class="w-full chat-message bg-[#343541] py-6">
                            <div class="max-w-[800px] mx-auto px-4">
                                <div class="flex">
                                    <div class="w-6 h-6 rounded-md mr-3 flex-shrink-0 ai-icon bg-[#525252] flex items-center justify-center">
                                        <Icon name="smart_toy" iconSize="small" class="text-white" />
                                    </div>
                                    <div class="flex-1 text-white pt-1">
                                        <div class="flex space-x-2">
                                            <div class="w-2 h-2 rounded-full bg-[#A0A0A8] animate-bounce"></div>
                                            <div class="w-2 h-2 rounded-full bg-[#A0A0A8] animate-bounce" style="animation-delay: 0.2s"></div>
                                            <div class="w-2 h-2 rounded-full bg-[#A0A0A8] animate-bounce" style="animation-delay: 0.4s"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
                
                {#if error}
                    <div class="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg w-full mx-auto max-w-[800px] my-4 shadow-lg">
                        <div class="flex">
                            <div class="flex-shrink-0 mr-3">
                                <Icon name="error" iconSize="small" class="text-red-400" />
                            </div>
                            <p>{error}</p>
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- Input area -->
            <div class="p-4 max-w-[800px] w-full mx-auto">
                <form on:submit|preventDefault={handleSubmit} class="relative shadow-lg rounded-lg">
                    <input
                        type="text"
                        bind:value={userInput}
                        placeholder="Type a message..."
                        class="chat-input w-full px-4 py-3 bg-[#383842] border border-[#4A4A57]/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#525252]/70 pr-12"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-[#A0A0A8] hover:text-white rounded-md disabled:opacity-50 transition-colors"
                        disabled={isSending || !userInput.trim()}
                    >
                        <Icon name="send" iconSize="small" class="text-current" />
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
    /* Add styles for markdown content */
    :global(.prose) {
        font-size: 0.95rem;
        line-height: 1.7;
    }
    
    :global(.prose p) {
        margin-bottom: 1rem;
    }
    
    :global(.prose p:last-child) {
        margin-bottom: 0;
    }
    
    :global(.prose pre) {
        background-color: rgba(0, 0, 0, 0.3) !important;
        padding: 1rem !important;
        border-radius: 0.5rem !important;
        overflow-x: auto;
        margin: 1rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    :global(.prose code) {
        background-color: rgba(0, 0, 0, 0.3);
        padding: 0.1rem 0.3rem;
        border-radius: 0.25rem;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace !important;
        font-size: 0.9em;
    }
    
    /* Custom animation for loading dots */
    @keyframes bounceDot {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-5px); }
    }
    
    .animate-bounce {
        animation: bounceDot 1.4s infinite ease-in-out both;
    }
</style>
