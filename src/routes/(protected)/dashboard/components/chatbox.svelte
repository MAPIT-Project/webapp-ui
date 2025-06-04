<script lang="ts">
    import { createConversation, addUserMessage, addAIMessage, getAIResponse } from "$lib/clients/conversationService";
    import { goto } from "$app/navigation";
    import Icon from "$lib/components/generic/icon.svelte";
    import { getSpace } from "$lib/stores/collaborationStore.svelte";
    
    let userInput = $state("");
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    
    async function handleSubmit() {
        if (!userInput.trim() || isProcessing) return;
        
        error = null;
        isProcessing = true;
        
        try {
            const currentInput = userInput;
            userInput = ""; 
            
            const currentSpaceId = getSpace(); 
            const conversation = await createConversation(currentInput, currentSpaceId); 
            
            if (!conversation) {
                throw new Error("Failed to create conversation");
            }
            
            // Add the user's message to the conversation
            const userMessage = await addUserMessage(conversation.id, currentInput);
            if (!userMessage) {
                throw new Error("Failed to add user message");
            }
            
            // Get AI response
            const aiResponseData = await getAIResponse(currentInput);
            
            // Add the AI response to the conversation
            const aiMessage = await addAIMessage(conversation.id, aiResponseData.answer);
            if (!aiMessage) {
                throw new Error("Failed to add AI response");
            }
            
            // Navigate to the conversation page
            goto(`/dashboard/conversations/${conversation.id}`);
            
        } catch (err) {
            console.error("Error creating conversation:", err);
            error = err instanceof Error ? err.message : "Failed to create conversation";
        } finally { 
            isProcessing = false; 
        }
    }
    
    const examples = [
        {
            icon: "science",
            text: "Tell me about funding opportunities in clean energy research",
            shade: "dark",
            color: "#4CAF50"
        },
        {
            icon: "health_and_safety",
            text: "What are the latest trends in AI for healthcare?",
            shade: "medium",
            color: "#2196F3"
        },
        {
            icon: "eco",
            text: "Help me draft a proposal outline for sustainable agriculture",
            shade: "dark",
            color: "#8BC34A"
        },
        {
            icon: "public",
            text: "What EU programs focus on climate change mitigation?",
            shade: "medium",
            color: "#009688"
        }
    ];
    
    function startWithExample(text: string) {
        userInput = text;
        handleSubmit();
    }
</script>

<div class="w-full max-w-[800px]">
    <form 
        onsubmit={handleSubmit}
        class="relative mb-8"
    >
        <div class="relative shadow-lg rounded-lg overflow-hidden">
            <input
                type="text"
                bind:value={userInput}
                placeholder={isProcessing ? "Creating conversation..." : "Send a message..."}
                class="w-full px-5 py-4 pr-14 bg-[#383842] border border-[#4A4A57]/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#525252]/70 transition-all"
                disabled={isProcessing}
            />
            <button
                type="submit"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0A8] hover:text-white p-2 rounded-md disabled:opacity-50 transition-colors"
                disabled={isProcessing || !userInput.trim()}
            >
                {#if isProcessing}
                    <div class="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                {:else}
                    <Icon name="send" iconClass="text-current" />
                {/if}
            </button>
        </div>
        
        <!-- Loading status indicator -->
        {#if isProcessing}
            <div class="mt-3 flex items-center justify-center gap-3 text-gray-400 text-sm">
                <div class="flex space-x-1">
                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
                <span>Creating conversation and getting AI response...</span>
            </div>
        {/if}
    </form>
    
    {#if error}
        <div class="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg mb-6 shadow-lg">
            <div class="flex">
                <div class="flex-shrink-0 mr-3">
                    <Icon name="error" iconClass="text-red-400" />
                </div>
                <p>{error}</p>
            </div>
        </div>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each examples as example, i}
            <button 
                onclick={() => startWithExample(example.text)}
                class="bg-[#343541] hover:bg-[#3E3E48] text-white p-5 rounded-lg text-left border border-[#4A4A57]/30 hover:border-[#4A4A57]/80 transition-all shadow-md group"
                disabled={isProcessing}
            >
                <div class="flex items-start">
                    <div style="background-color: {example.color}" class="p-1.5 rounded-md mr-3 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon name={example.icon} iconSize="sm" iconClass="text-white" />
                    </div>
                    <span class="pt-0.5">{example.text}</span>
                </div>
            </button>
        {/each}
    </div>
</div>