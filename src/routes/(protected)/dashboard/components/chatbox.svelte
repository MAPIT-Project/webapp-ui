<script lang="ts">
    import { createConversation } from "$lib/clients/conversationService";
    import { goto } from "$app/navigation";
    import Icon from "$lib/components/generic/icon.svelte";
    
    let userInput = $state("");
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    
    async function handleSubmit() {
        if (!userInput.trim() || isProcessing) return;
        
        error = null;
        isProcessing = true;
        
        try {
            const currentInput = userInput;
            userInput = ""; // Clear input right away for better UX
            
            // Create a new conversation with the user message
            const conversation = await createConversation(currentInput);
            
            if (!conversation) {
                throw new Error("Failed to create conversation");
            }
            
            // Navigate to the new conversation page
            goto(`/dashboard/conversations/${conversation.id}`);
            
        } catch (err) {
            console.error("Error creating conversation:", err);
            error = err instanceof Error ? err.message : "Failed to create conversation";
            isProcessing = false;
        }
    }
    
    // Example conversation starters
    const examples = [
        {
            icon: "science",
            text: "Tell me about funding opportunities in clean energy research",
            shade: "dark",
            color: "#4CAF50" // Green for science/research
        },
        {
            icon: "health_and_safety",
            text: "What are the latest trends in AI for healthcare?",
            shade: "medium",
            color: "#2196F3" // Blue for healthcare
        },
        {
            icon: "eco",
            text: "Help me draft a proposal outline for sustainable agriculture",
            shade: "dark",
            color: "#8BC34A" // Light green for eco/agriculture
        },
        {
            icon: "public",
            text: "What EU programs focus on climate change mitigation?",
            shade: "medium",
            color: "#009688" // Teal for climate/global topics
        }
    ];
    
    function startWithExample(text: string) {
        userInput = text;
        handleSubmit();
    }
</script>

<div class="w-full max-w-[800px]">
    <form 
        on:submit|preventDefault={handleSubmit}
        class="relative mb-8"
    >
        <div class="relative shadow-lg rounded-lg overflow-hidden">
            <input
                type="text"
                bind:value={userInput}
                placeholder="Send a message..."
                class="w-full px-5 py-4 pr-14 bg-[#383842] border border-[#4A4A57]/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#525252]/70 transition-all"
                disabled={isProcessing}
            />
            <button
                type="submit"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0A8] hover:text-white p-2 rounded-md disabled:opacity-50 transition-colors"
                disabled={isProcessing || !userInput.trim()}
            >
                <Icon name="send" class="text-current" />
            </button>
        </div>
    </form>
    
    {#if error}
        <div class="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg mb-6 shadow-lg">
            <div class="flex">
                <div class="flex-shrink-0 mr-3">
                    <Icon name="error" class="text-red-400" />
                </div>
                <p>{error}</p>
            </div>
        </div>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each examples as example, i}
            <button 
                on:click={() => startWithExample(example.text)}
                class="bg-[#343541] hover:bg-[#3E3E48] text-white p-5 rounded-lg text-left border border-[#4A4A57]/30 hover:border-[#4A4A57]/80 transition-all shadow-md group"
                disabled={isProcessing}
            >
                <div class="flex items-start">
                    <div style="background-color: {example.color}" class="p-1.5 rounded-md mr-3 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon name={example.icon} iconSize="small" class="text-white" />
                    </div>
                    <span class="pt-0.5">{example.text}</span>
                </div>
            </button>
        {/each}
    </div>
</div>