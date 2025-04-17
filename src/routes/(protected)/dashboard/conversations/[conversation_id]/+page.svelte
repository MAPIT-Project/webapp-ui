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
            ? "bg-blue-600 text-white self-end" 
            : "bg-gray-700 text-[#CACACA] self-start";
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

<div class="w-full min-h-screen h-full flex bg-gray-900">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col items-center relative">
        <span class="text-[#CACACA] text-xs absolute left-4 top-4 z-10">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1">BETA</span> </span>
        
        <!-- API Mode Toggle -->
        <div class="absolute right-4 top-4 z-10">
            <ApiModeToggle />
        </div>
    
        <div class="flex-1 flex flex-col p-4 overflow-hidden w-full max-w-[900px]">
            <!-- Chat title -->
            {#if conversation}
                <div class="text-center mb-4 pt-2">
                    <h1 class="text-xl font-semibold text-[#CACACA]">{conversation.name}</h1>
                    {#if conversation.topic}
                        <p class="text-sm text-gray-400">{conversation.topic}</p>
                    {/if}
                </div>
            {:else if !isLoading}
                <div class="text-center mb-4 pt-2">
                    <h1 class="text-xl font-semibold text-[#CACACA]">Chat</h1>
                </div>
            {/if}
            
            <!-- Chat messages area -->
            <div class="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                {#if isLoading}
                    <div class="flex-1 flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                {:else if messages.length === 0}
                    <div class="flex-1 flex items-center justify-center text-gray-500">
                        <p>No messages in this conversation yet.</p>
                    </div>
                {:else}
                    {#each messages as message}
                        <div class="flex flex-col max-w-[80%] {message.sender === 'user' ? 'ml-auto' : 'mr-auto'}">
                            <div class="rounded-lg px-4 py-2 {getSenderClass(message.sender)}">
                                {#if message.sender === 'user'}
                                    <p class="whitespace-pre-wrap">{message.text}</p>
                                {:else}
                                    <div class="prose prose-invert prose-sm max-w-none">
                                        {@html renderMarkdown(message.text)}
                                    </div>
                                {/if}
                            </div>
                            <span class="text-xs text-gray-500 mt-1 {message.sender === 'user' ? 'text-right' : 'text-left'}">
                                {formatMessageTime(message.createdAt)}
                            </span>
                        </div>
                    {/each}
                    
                    {#if isSending}
                        <div class="flex max-w-[80%] mr-auto">
                            <div class="rounded-lg px-4 py-2 bg-gray-700 text-[#CACACA]">
                                <div class="flex space-x-2">
                                    <div class="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                                    <div class="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style="animation-delay: 0.2s"></div>
                                    <div class="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style="animation-delay: 0.4s"></div>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
                
                {#if error}
                    <div class="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg w-full">
                        <p>{error}</p>
                    </div>
                {/if}
            </div>
            
            <!-- Input area -->
            <div class="border-t border-gray-700 p-4">
                <form on:submit|preventDefault={handleSubmit} class="flex items-center gap-2">
                    <input
                        type="text"
                        bind:value={userInput}
                        placeholder="Type a message..."
                        class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-[#CACACA] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={isSending || !userInput.trim()}
                    >
                        <Icon name="send" iconSize="base" />
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
    /* Add styles for markdown content */
    :global(.prose) {
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    :global(.prose p) {
        margin-bottom: 0.75rem;
    }
    
    :global(.prose p:last-child) {
        margin-bottom: 0;
    }
    
    :global(.prose pre) {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.5rem;
        border-radius: 0.25rem;
        overflow-x: auto;
    }
    
    :global(.prose code) {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 0.1rem 0.3rem;
        border-radius: 0.25rem;
        font-family: monospace;
    }
    
    :global(.prose ul, .prose ol) {
        margin-left: 1.5rem;
        margin-bottom: 0.75rem;
    }
    
    :global(.prose li) {
        margin-bottom: 0.25rem;
    }
</style>
