<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import { page } from "$app/stores";
    import Icon from "$lib/components/generic/icon.svelte";
    import { 
        getConversationMessages,
        addUserMessage,
        addAIMessage
    } from "$lib/clients/conversationService";
    import type { Message, Conversation } from "$lib/server/db/schema";
    import ChatSidebar from "../../components/chat-sidebar.svelte";
    import { supabase } from "$lib/clients/supabaseClient";
    
    // Use reactive statement to get chatId from URL
    $: chatId = parseInt($page.params.chat_id);
    $: if (chatId) {
        loadMessages(chatId);
        loadConversationDetails(chatId);
    }
    
    // State variables
    let userInput = "";
    let messages: Message[] = [];
    let conversation: Conversation | null = null;
    let isLoading = false;
    let isSending = false;
    let error: string | null = null;
    
    // Load conversation details (title)
    async function loadConversationDetails(id: number) {
        try {
            const { data, error } = await supabase
                .from('conversation')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            conversation = data;
        } catch (err) {
            console.error("Error loading conversation details:", err);
        }
    }
    
    onMount(() => {
        // Initial load handled by the reactive statement now
    });
    
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
            // Add the user message
            const userMessage = await addUserMessage(chatId, userInput);
            
            if (userMessage) {
                messages = [...messages, userMessage];
            }
            
            // Clear the input field
            userInput = "";
            
            // Simulate AI thinking with a small delay
            setTimeout(async () => {
                // Add the AI response (for now, just a simple placeholder response)
                const aiResponse = await addAIMessage(
                    chatId, 
                    "Example response message"
                );
                
                if (aiResponse) {
                    messages = [...messages, aiResponse];
                }
                
                isSending = false;
            }, 1000);
            
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            isSending = false;
            console.error("Chat error:", err);
        }
    }
    
    function getSenderClass(sender: string) {
        return sender === 'user' 
            ? "bg-blue-600 text-white self-end" 
            : "bg-gray-700 text-[#CACACA] self-start";
    }

    // Helper function to safely format date
    function formatMessageTime(dateString: string): string {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);

            console.log(date);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return '';
            }
            
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.error('Error formatting message time:', error);
            return '';
        }
    }
</script>

<div class="w-full min-h-screen h-full flex bg-gray-900">
    <ChatSidebar />
    
    <div class="flex-1 flex flex-col items-center relative">
        <span class="text-[#CACACA] text-xs absolute left-4 top-4 z-10">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1">BETA</span> </span>
    
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
                                <p>{message.text}</p>
                            </div>
                            <span class="text-xs text-gray-500 mt-1 {message.sender === 'user' ? 'text-right' : 'text-left'}">
                                {formatMessageTime(message.created_at || message.createdAt)}
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
