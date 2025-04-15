<script lang="ts">
    import { goto } from "$app/navigation";
    import Icon from "$lib/components/generic/icon.svelte";
    import { onMount } from "svelte";
    import { 
        createConversation, 
        addUserMessage, 
        addAIMessage, 
        getConversationMessages,
        getAIResponse,
    } from "$lib/clients/conversationService";
    import {
        getCurrentClient
    } from "$lib/clients/clientService";
    import type { Message } from "$lib/server/db/schema";
    
    // State variables
    let userInput = "";
    let messages: Message[] = [];
    let activeConversationId: number | null = null;
    let isLoading = false;
    let error: string | null = null;
    let debug = false;
    let debugInfo = null;
    
    // Process the user message and get AI response
    async function handleSubmit() {
        if (!userInput.trim()) return;
        
        isLoading = true;
        error = null;
        debugInfo = null;
        
        try {
            // Get client info first to verify it exists
            const clientInfo = await getCurrentClient();
            
            if (!clientInfo) {
                debugInfo = "Failed to get client info - user not properly linked to a client record";
                throw new Error("User account not properly set up. Please try logging out and in again.");
            }
            
            // Create a new conversation
            debugInfo = { action: "Creating conversation", clientId: clientInfo.id };
            
            const conversation = await createConversation(userInput);
            
            if (!conversation) {
                throw new Error("Failed to create conversation. Please try again.");
            }
            
            // Add the user message
            const userMessage = await addUserMessage(conversation.id, userInput);
            
            if (userMessage) {
                // Get AI response from the FastAPI demo endpoint
                debugInfo = { ...debugInfo, action: "Getting AI response" };
                const aiResponseText = await getAIResponse(userInput);
                
                // Add the AI response to the conversation
                const aiResponse = await addAIMessage(
                    conversation.id, 
                    aiResponseText
                );
                
                // Redirect to the conversation page
                goto(`/dashboard/conversations/${conversation.id}`);
            } else {
                throw new Error("Failed to add message to conversation");
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "An error occurred";
            isLoading = false;
            console.error("Chat error:", err, debugInfo);
        }
    }
    
    function getSenderClass(sender: string) {
        return sender === 'user' 
            ? "bg-blue-600 text-white self-end" 
            : "bg-gray-700 text-[#CACACA] self-start";
    }
</script>

<div class="flex flex-col w-full rounded-lg border border-gray-700 bg-gray-800">
    <!-- Chat messages area -->
    <div class="h-[400px] overflow-y-auto p-4 flex flex-col space-y-4">
        {#if messages.length === 0 && !isLoading}
            <div class="flex-1 flex items-center justify-center text-gray-500">
                <p>Start a new conversation by typing a message below.</p>
            </div>
        {:else if messages.length > 0}
            {#each messages as message}
                <div class="flex flex-col max-w-[80%] {message.sender === 'user' ? 'ml-auto' : 'mr-auto'}">
                    <div class="rounded-lg px-4 py-2 {getSenderClass(message.sender)}">
                        <p>{message.text}</p>
                    </div>
                    <span class="text-xs text-gray-500 mt-1 {message.sender === 'user' ? 'text-right' : 'text-left'}">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            {/each}
        {/if}
        
        {#if isLoading}
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
        
        {#if error}
            <div class="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg w-full">
                <p>{error}</p>
                {#if debugInfo && debug}
                    <pre class="mt-2 text-xs overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
                {/if}
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
                disabled={isLoading}
            />
            <button
                type="submit"
                class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading || !userInput.trim()}
            >
                <Icon name="send" class="h-5 w-5" />
            </button>
        </form>
    </div>
</div>