<script lang="ts">
    import { createConversation, addUserMessage } from "$lib/clients/conversationService";
    import { goto } from "$app/navigation";
    import Icon from "$lib/components/generic/icon.svelte";
    import { getSpace } from "$lib/stores/collaborationStore.svelte";
    import { conversationStore } from "$lib/stores/conversationStore";
    import { scale, fade } from "svelte/transition";
    
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

            // Add the new conversation to the store so it appears in the sidebar immediately
            conversationStore.addConversation(conversation);
            
            // Explicitly add the user's first message to the conversation
            const userMessage = await addUserMessage(conversation.id, currentInput);
            if (!userMessage) {
                throw new Error("Failed to save your message to the new conversation.");
            }
            
            // Navigate immediately to the conversation page
            // The conversation page will handle starting the AI response
            goto(`/dashboard/conversations/${conversation.id}?autostart=${encodeURIComponent(currentInput)}`);
            
        } catch (err) {
            console.error("Error creating conversation:", err);
            error = err instanceof Error ? err.message : "Failed to create conversation";
        } finally { 
            isProcessing = false;
        }
    }

    // No cleanup needed since we're not managing streaming here anymore
    
    const examples = [
        {
            icon: "science",
            text: "Tell me about funding opportunities in clean energy research",
            shade: "dark",
            color: "#10B981", // Emerald
            category: "Research"
        },
        {
            icon: "health_and_safety",
            text: "What are the latest trends in AI for healthcare?",
            shade: "medium",
            color: "#3B82F6", // Blue
            category: "Healthcare"
        },
        {
            icon: "eco",
            text: "Help me draft a proposal outline for sustainable agriculture",
            shade: "dark",
            color: "#8B5CF6", // Purple
            category: "Agriculture"
        },
        {
            icon: "public",
            text: "What EU programs focus on climate change mitigation?",
            shade: "medium",
            color: "#F59E0B", // Amber
            category: "Policy"
        }
    ];
    
    function startWithExample(text: string) {
        userInput = text;
        handleSubmit();
    }
</script>

<div class="w-full max-w-4xl mx-auto" in:scale={{ duration: 300, start: 0.98 }}>
    <!-- Enhanced Input Section -->
    <form 
        onsubmit={handleSubmit}
        class="relative mb-8"
        in:fade={{ duration: 200 }}
    >
        <div class="relative shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
            <input
                type="text"
                bind:value={userInput}
                placeholder={isProcessing ? "Creating conversation..." : "What would you like to explore today?"}
                class="w-full px-6 py-5 pr-16 bg-[#383842]/80 border border-[#4A4A57]/30 rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                disabled={isProcessing}
            />
            <button
                type="submit"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-3 rounded-xl hover:bg-white/10 disabled:opacity-50 transition-all duration-200 group"
                disabled={isProcessing || !userInput.trim()}
            >
                {#if isProcessing}
                    <div class="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                {:else}
                    <div class="group-hover:scale-110 transition-transform">
                        <Icon name="send" iconClass="text-current w-5 h-5" />
                    </div>
                {/if}
            </button>
        </div>
        
        <!-- Enhanced Loading Status -->
        {#if isProcessing}
            <div class="mt-4 bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50" 
                 in:scale={{ duration: 300, start: 0.95 }}>
                <div class="flex flex-col items-center gap-4">
                    <!-- Animated dots -->
                    <div class="flex items-center gap-3 text-gray-400 text-sm">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                            <div class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                        <span class="font-medium">Creating conversation and generating response...</span>
                    </div>
                    
                    <!-- Progress indicator -->
                    <div class="w-full bg-gray-700/50 rounded-full h-1 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 animate-pulse"></div>
                    </div>
                    
                    <!-- Timing information -->
                    <div class="text-xs text-center text-gray-400 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-600/30">
                        <div class="flex items-center justify-center gap-2 mb-1">
                            <Icon name="info" iconClass="w-4 h-4 text-blue-400" />
                            <span>Please wait</span>
                        </div>
                        <div class="text-gray-500">
                            Response generation typically takes <span class="text-blue-300 font-medium">30-60 seconds</span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}


    </form>
    
    <!-- Enhanced Error Display -->
    {#if error}
        <div class="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/50 text-red-200 p-5 rounded-xl mb-8 shadow-lg backdrop-blur-sm" 
             in:scale={{ duration: 300, start: 0.95 }}>
            <div class="flex items-start">
                <div class="flex-shrink-0 mr-4 p-2 bg-red-500/20 rounded-lg">
                    <Icon name="error" iconClass="text-red-400 w-5 h-5" />
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-red-200 mb-1">Something went wrong</h3>
                    <div class="text-red-300 text-sm whitespace-pre-line">{error}</div>
                </div>
            </div>
        </div>
    {/if}
    
    <!-- Enhanced Example Cards -->
    <div class="space-y-6 pt-8">
        <!-- <div class="text-center" in:fade={{ delay: 100 }}>
            <h2 class="text-2xl font-semibold text-white mb-2">Get started with these examples</h2>
            <p class="text-gray-400 ">Choose a topic or ask your own question</p>
        </div> -->
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" in:scale={{ duration: 300, delay: 200, start: 0.98 }}>
            {#each examples as example, i}
                <button 
                    onclick={() => startWithExample(example.text)}
                    class="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-gray-700/60 hover:to-gray-800/60 text-white p-6 rounded-2xl text-left border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300 shadow-lg hover:shadow-xl group backdrop-blur-sm overflow-hidden"
                    disabled={isProcessing}
                    in:scale={{ duration: 200, delay: i * 50, start: 0.95 }}
                >
                    <!-- Gradient overlay -->
                    <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                         style="background: linear-gradient(135deg, {example.color}20, {example.color}05)"></div>
                    
                    <div class="relative z-10">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex items-center gap-4">
                                <div style="background-color: {example.color}" 
                                     class="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Icon name={example.icon} iconSize="sm" iconClass="text-white" />
                                </div>
                                <div>
                                    <div class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{example.category}</div>
                                    <div class="w-8 h-0.5 rounded" style="background-color: {example.color}"></div>
                                </div>
                            </div>
                            <div class="text-gray-500 group-hover:text-gray-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </div>
                        
                        <p class="text-gray-200 font-medium leading-relaxed group-hover:text-white transition-colors duration-300">{example.text}</p>
                        
                        <!-- Hover effect indicator -->
                        <div class="absolute bottom-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                             style="background-color: {example.color}"></div>
                    </div>
                </button>
            {/each}
        </div>
        
        <!-- Additional CTA -->
        <div class="text-center pt-8" in:fade={{ delay: 300 }}>
            <div class="inline-flex items-center gap-2 text-gray-500 text-sm">
                <Icon name="lightbulb" iconClass="w-4 h-4" />
                <span>Or type your own question in the search box above</span>
            </div>
        </div>
    </div>
</div>