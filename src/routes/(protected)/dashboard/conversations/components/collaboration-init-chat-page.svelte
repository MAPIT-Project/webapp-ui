<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import ChatSidebar from "../../components/chat-sidebar.svelte";
	import { user } from '$lib/stores/sessionStore';
	import { ensureClientExists } from "$lib/clients/clientService";
	import { createConversation } from "$lib/clients/conversationService";
	import { conversationStore } from "$lib/stores/conversationStore";
	import { getSpace } from '$lib/stores/collaborationStore.svelte';
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import ApiModeToggle from "../../components/api-mode-toggle.svelte";
	import AIProviderSelector from "../../components/ai-provider-selector.svelte";
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';

	
	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);
	let chatTitle: string = $state('');
	let isCreatingChat: boolean = $state(false);
	let titleError: string | null = $state(null);
	
	// Create client record if one doesn't exist
	onMount(async () => {
	    if ($user) {
	        try {
	            const client = await ensureClientExists($user.email?.split('@')[0]);
	            if (!client) {
	                console.error("Failed to create or find client record");
	                clientError = "Failed to initialize user data";
	            }
	            // Fetch available AI providers
	            await fetchAvailableProviders();
	        } catch (err) {
	            console.error("Error during client initialization:", err);
	            clientError = "Error setting up user account";
	        } finally {
	            clientLoading = false;
	        }
	    }
	});

	async function handleCreateChat() {
		// Validate title
		if (!chatTitle.trim()) {
			titleError = "Chat title is required";
			return;
		}

		if (chatTitle.length > 30) {
			titleError = "Chat title must be 30 characters or less";
			return;
		}

		titleError = null;
		isCreatingChat = true;

		try {
			const currentSpace = getSpace();
			
			// Create conversation with a placeholder message that won't trigger AI
			const conversation = await createConversation(
				"Chat initialized", // This won't be shown to user, just used internally
				currentSpace === 'personal' ? null : currentSpace
			);

			if (conversation) {
				// Update the conversation name to the user's title
				await conversationStore.updateConversationName(conversation.id, chatTitle.trim());
				
				// Add to store
				conversationStore.addConversation({
					...conversation,
					name: chatTitle.trim()
				});

				// Navigate to the new conversation
				goto(`/dashboard/conversations/${conversation.id}`);
			} else {
				titleError = "Failed to create chat. Please try again.";
			}
		} catch (error) {
			console.error('Error creating chat:', error);
			titleError = "An error occurred while creating the chat";
		} finally {
			isCreatingChat = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleCreateChat();
		}
	}
</script>

<div class="w-full min-h-screen h-full flex relative bg-[#2B2A2C]">
    
    <!-- Chat sidebar -->
    <ChatSidebar />
    
    <!-- Main content -->
    <div class="flex-1 flex items-center justify-center relative">
        <div class="absolute left-4 top-4 z-10 flex items-center">
            <span class="text-[#A0A0A8] text-xs">AI Domain Expert Tool <span class="text-[0.5rem] font-bold ml-1 bg-gray-700 text-gray-300 px-1 py-0.5 rounded">BETA</span></span>
        </div>
        
        <!-- API Controls -->
        <div class="absolute right-4 top-4 z-10 flex items-center gap-2">
            <AIProviderSelector />
            <ApiModeToggle />
        </div>
    
        {#if clientLoading}
            <div class="w-full p-4 flex justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#A0A0A8]"></div>
            </div>
        {:else if clientError}
            <div class="w-full max-w-[800px] p-6 bg-red-900/30 border border-red-700/50 rounded-lg mb-6 shadow-lg">
                <div class="flex items-start">
                    <div class="mr-4 p-2 bg-red-900/50 rounded-lg">
                        <Icon name="error" className="text-red-400" />
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-red-300 mb-2">Error</h3>
                        <p class="text-red-300 mb-4">{clientError}</p>
                        <button 
                            class="px-4 py-2 bg-red-700/50 hover:bg-red-700/80 text-white rounded-lg transition-colors"
                            onclick={() => window.location.reload()}
                        >
                            <div class="flex items-center">
                                <Icon name="refresh" className="mr-2" />
                                Retry
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <div class="w-[800px] flex flex-col items-center pt-10">
                <span class="text-3xl pb-8 font-semibold text-white">Start a new collaboration chat</span>
                
                <!-- Chat Creation Form -->
                <div class="w-full max-w-md">
					<div class="mb-4">
						<label for="chatTitle" class="block text-sm font-medium text-[#A0A0A8] mb-2">
							Chat Title
						</label>
						<input
							id="chatTitle"
							type="text"
							bind:value={chatTitle}
							onkeydown={handleKeyDown}
							placeholder="Enter chat title (max 30 characters)"
							maxlength="30"
							class="w-full px-4 py-3 bg-[#3C3B3F] border border-[#4A4A4F] rounded-lg text-white placeholder-[#A0A0A8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isCreatingChat}
						/>
						<div class="flex justify-between items-center mt-1">
							{#if titleError}
								<span class="text-red-400 text-sm">{titleError}</span>
							{:else}
								<span></span>
							{/if}
							<span class="text-xs text-[#A0A0A8]">{chatTitle.length}/30</span>
						</div>
					</div>

					<button
						onclick={handleCreateChat}
						disabled={isCreatingChat || !chatTitle.trim() || chatTitle.length > 30}
						class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
					>
						{#if isCreatingChat}
							<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
							Creating...
						{:else}
							<Icon name="plus" className="mr-2" />
							Create Chat
						{/if}
					</button>
				</div>
            </div>
        {/if}
    </div>
</div>