<script lang="ts">
	import Icon from "$lib/components/generic/icon.svelte";
	import ChatSidebar from "../../components/chat-sidebar.svelte";
	import { user } from '$lib/stores/sessionStore';
	import { ensureClientExists } from "$lib/clients/clientService";
	import { createConversation } from "$lib/clients/conversationService";
	import { conversationStore } from "$lib/stores/conversationStore";
	import { getSpace, getAllAvailableSpaces } from '$lib/stores/collaborationStore.svelte';
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { scale, fade } from "svelte/transition";
	import ApiModeToggle from "../../components/api-mode-toggle.svelte";
	import AIProviderSelector from "../../components/ai-provider-selector.svelte";
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';

	
	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);
	let chatTitle: string = $state('');
	let isCreatingChat: boolean = $state(false);
	let titleError: string | null = $state(null);
	
	// Get current collaboration info
	let currentSpaceName = $derived(() => {
		const spaces = getAllAvailableSpaces();
		const currentSpace = getSpace();
		const space = spaces.find(s => s.id === currentSpace);
		return space?.name || 'Team Workspace';
	});
	
	// Quick start templates
	const chatTemplates = [
		{
			title: "Project Planning",
			description: "Organize project tasks and timelines",
			icon: "assignment",
			color: "#3B82F6"
		},
		{
			title: "Brainstorming Session",
			description: "Collaborate on new ideas and concepts",
			icon: "lightbulb",
			color: "#8B5CF6"
		},
		{
			title: "Research Discussion", 
			description: "Share findings and analyze data",
			icon: "science",
			color: "#10B981"
		},
		{
			title: "Design Review",
			description: "Review and iterate on designs",
			icon: "palette",
			color: "#F59E0B"
		}
	];
	
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

	async function handleCreateChat(customTitle?: string) {
		const title = customTitle || chatTitle;
		
		// Validate title
		if (!title.trim()) {
			titleError = "Chat title is required";
			return;
		}

		if (title.length > 30) {
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
				await conversationStore.updateConversationName(conversation.id, title.trim());
				
				// Add to store
				conversationStore.addConversation({
					...conversation,
					name: title.trim()
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

	function useTemplate(template: { title: string }) {
		chatTitle = template.title;
		handleCreateChat();
	}
</script>

<div class="w-full min-h-screen h-full flex relative bg-gradient-to-br from-[#2B2A2C] via-[#282729] to-[#252327]">
    
    <!-- Chat sidebar -->
    <ChatSidebar />
    
    <!-- Main content -->
    <div class="flex-1 flex flex-col relative overflow-hidden">
        <!-- Header Bar -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700/30 bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                        <Icon name="groups" iconClass="text-white text-sm" />
                    </div>
                    <div>
                        <span class="text-white font-medium">Team Collaboration</span>
                        <span class="text-xs text-purple-400 font-bold ml-2 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">NEW CHAT</span>
                    </div>
                </div>
            </div>
            
            <!-- API Controls -->
            <div class="flex items-center gap-3">
                <AIProviderSelector />
                <ApiModeToggle />
            </div>
        </div>
    
        <!-- Main Content Area -->
        <div class="flex-1 flex items-center justify-center p-6 relative">
            <!-- Background decoration -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"></div>
            </div>
            
            {#if clientLoading}
                <div class="flex flex-col items-center gap-6" in:fade={{ duration: 300 }}>
                    <!-- Enhanced loading animation -->
                    <div class="relative">
                        <div class="w-16 h-16 rounded-full border-4 border-gray-700/30 border-t-purple-500 animate-spin"></div>
                        <div class="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-r-blue-500 animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <div class="text-center">
                        <h3 class="text-xl font-semibold text-white mb-2">Setting up team workspace</h3>
                        <p class="text-gray-400">Initializing collaboration tools...</p>
                    </div>
                </div>
            {:else if clientError}
                <div class="w-full max-w-md" in:scale={{ duration: 300, start: 0.95 }}>
                    <div class="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div class="flex items-start gap-4">
                            <div class="p-3 bg-red-500/20 rounded-xl">
                                <Icon name="error" iconClass="text-red-400 w-6 h-6" />
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-red-200 mb-2">Setup Error</h3>
                                <p class="text-red-300 mb-4 text-sm leading-relaxed">{clientError}</p>
                                <button 
                                    class="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-red-500/25"
                                    onclick={() => window.location.reload()}
                                >
                                    <div class="flex items-center justify-center gap-2">
                                        <Icon name="refresh" iconClass="w-4 h-4" />
                                        Try Again
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="w-full max-w-4xl flex flex-col items-center" in:fade={{ duration: 400, delay: 100 }}>
                    <!-- Welcome Section -->
                    <div class="text-center mb-12" in:scale={{ duration: 400, delay: 200, start: 0.95 }}>
                        <div class="inline-flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Icon name="add_comment" iconClass="text-white text-xl" />
                            </div>
                            <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Start a new team chat
                            </h1>
                        </div>
                        <p class="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Create a collaborative space for your team in <span class="text-purple-400 font-medium">{currentSpaceName()}</span>. 
                            Work together, share ideas, and get AI assistance.
                        </p>
                    </div>
                    
                    <!-- Chat Creation Form -->
                    <div class="w-full max-w-lg mb-12" in:scale={{ duration: 400, delay: 300, start: 0.95 }}>
                        <div class="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                            <div class="mb-6">
                                <label for="chatTitle" class="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <Icon name="edit" iconClass="text-purple-400 w-4 h-4" />
                                    Chat Title
                                </label>
                                <input
                                    id="chatTitle"
                                    type="text"
                                    bind:value={chatTitle}
                                    onkeydown={handleKeyDown}
                                    placeholder="Enter a descriptive chat title..."
                                    maxlength="30"
                                    class="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                                    disabled={isCreatingChat}
                                />
                                <div class="flex justify-between items-center mt-3">
                                    {#if titleError}
                                        <span class="text-red-400 text-sm font-medium flex items-center gap-1">
                                            <Icon name="error" iconClass="w-3 h-3" />
                                            {titleError}
                                        </span>
                                    {:else}
                                        <span class="text-gray-500 text-sm">Choose a clear, descriptive name</span>
                                    {/if}
                                    <span class="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-700/50 rounded-full">
                                        {chatTitle.length}/30
                                    </span>
                                </div>
                            </div>

                            <button
                                onclick={() => handleCreateChat()}
                                disabled={isCreatingChat || !chatTitle.trim() || chatTitle.length > 30}
                                class="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                            >
                                {#if isCreatingChat}
                                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Creating Chat...
                                {:else}
                                    <Icon name="add" iconClass="w-5 h-5" />
                                    Create Team Chat
                                {/if}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Quick Start Templates -->
                    <div class="w-full max-w-4xl" in:scale={{ duration: 400, delay: 400, start: 0.95 }}>
                        <div class="text-center mb-8">
                            <h2 class="text-2xl font-semibold text-white mb-2">Quick Start Templates</h2>
                            <p class="text-gray-400">Get started faster with pre-made chat templates</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each chatTemplates as template, i}
                                <button 
                                    onclick={() => useTemplate(template)}
                                    class="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 hover:from-gray-700/50 hover:to-gray-800/50 border border-gray-700/50 hover:border-gray-600/70 rounded-xl p-5 text-left transition-all duration-300 shadow-lg hover:shadow-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCreatingChat}
                                    in:scale={{ duration: 200, delay: 450 + (i * 50), start: 0.95 }}
                                >
                                    <!-- Gradient overlay -->
                                    <div class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
                                         style="background: linear-gradient(135deg, {template.color}20, {template.color}05)"></div>
                                    
                                    <div class="relative z-10">
                                        <div class="flex items-start justify-between mb-3">
                                            <div class="flex items-center gap-3">
                                                <div style="background-color: {template.color}" 
                                                     class="p-2.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Icon name={template.icon} iconClass="text-white w-5 h-5" />
                                                </div>
                                                <div class="w-6 h-0.5 rounded" style="background-color: {template.color}"></div>
                                            </div>
                                            <div class="text-gray-500 group-hover:text-gray-400 transition-colors">
                                                <Icon name="arrow_forward" iconClass="w-4 h-4" />
                                            </div>
                                        </div>
                                        
                                        <h3 class="text-white font-semibold mb-2 group-hover:text-purple-100 transition-colors">{template.title}</h3>
                                        <p class="text-gray-400 text-sm leading-relaxed">{template.description}</p>
                                        
                                        <!-- Hover effect indicator -->
                                        <div class="absolute bottom-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-xl"
                                             style="background-color: {template.color}"></div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                        
                        <!-- Footer info -->
                        <div class="text-center mt-8" in:fade={{ delay: 600 }}>
                            <div class="inline-flex items-center gap-2 text-gray-500 text-sm">
                                <Icon name="info" iconClass="w-4 h-4" />
                                <span>Templates help you get started quickly with common collaboration patterns</span>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>