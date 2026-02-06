<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';

	import { user } from '$lib/stores/sessionStore';
	import { ensureClientExists } from '$lib/clients/clientService';
	import { createConversation } from '$lib/clients/conversationService';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { getSpace, getAllAvailableSpaces } from '$lib/stores/collaborationStore.svelte';
	import { goto } from '$app/navigation';
	import { scale, fade } from 'svelte/transition';
	import ApiModeToggle from '../../components/api-mode-toggle.svelte';
	import AIProviderSelector from '../../components/ai-provider-selector.svelte';
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
		const space = spaces.find((s) => s.id === currentSpace);
		return space?.name || 'Team Workspace';
	});

	// Quick start templates
	const chatTemplates = [
		{
			title: 'Project Planning',
			description: 'Organize project tasks and timelines',
			icon: 'assignment',
			color: '#3B82F6'
		},
		{
			title: 'Brainstorming Session',
			description: 'Collaborate on new ideas and concepts',
			icon: 'lightbulb',
			color: '#8B5CF6'
		},
		{
			title: 'Research Discussion',
			description: 'Share findings and analyze data',
			icon: 'science',
			color: '#10B981'
		},
		{
			title: 'Design Review',
			description: 'Review and iterate on designs',
			icon: 'palette',
			color: '#F59E0B'
		}
	];

	// Use $effect instead of onMount — onMount doesn't fire reliably
	// in runes-mode components with newer Vite versions
	let initialized = false;
	$effect(() => {
		const currentUser = $user;
		if (currentUser && !initialized) {
			initialized = true;
			(async () => {
				try {
					const client = await ensureClientExists(currentUser.email?.split('@')[0]);
					if (!client) {
						console.error('Failed to create or find client record');
						clientError = 'Failed to initialize user data';
					}
					await fetchAvailableProviders();
				} catch (err) {
					console.error('Error during client initialization:', err);
					clientError = 'Error setting up user account';
				} finally {
					clientLoading = false;
				}
			})();
		}
	});

	async function handleCreateChat(customTitle?: string) {
		const title = customTitle || chatTitle;

		// Validate title
		if (!title.trim()) {
			titleError = 'Chat title is required';
			return;
		}

		if (title.length > 30) {
			titleError = 'Chat title must be 30 characters or less';
			return;
		}

		titleError = null;
		isCreatingChat = true;

		try {
			const currentSpace = getSpace();

			// Create conversation with a placeholder message that won't trigger AI
			const conversation = await createConversation(
				'Chat initialized', // This won't be shown to user, just used internally
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
				titleError = 'Failed to create chat. Please try again.';
			}
		} catch (error) {
			console.error('Error creating chat:', error);
			titleError = 'An error occurred while creating the chat';
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

<div
	class="relative flex h-full min-h-screen w-full bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
>
	<!-- Main content -->
	<div class="relative flex flex-1 flex-col overflow-hidden">
		<!-- Header Bar -->
		<div class="flex items-center justify-between border-b border-[#2C2C2C] bg-[#1E1E1E] p-4">
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600"
					>
						<Icon name="groups" iconClass="text-white text-sm" />
					</div>
					<div>
						<span class="font-medium text-[#E0E0E0]">Team Collaboration</span>
						<span
							class="ml-2 rounded-full border border-[#4F4F4F] bg-[#3A3A3A] px-2 py-0.5 text-xs font-bold text-[#FFFFFF]"
							>NEW CHAT</span
						>
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
		<div class="relative flex flex-1 items-center justify-center p-6">
			<!-- Background decoration -->
			<div class="pointer-events-none absolute inset-0 overflow-hidden">
				<div
					class="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl"
				></div>
				<div
					class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl"
				></div>
			</div>

			{#if clientLoading}
				<div class="flex flex-col items-center gap-6" in:fade={{ duration: 300 }}>
					<!-- Enhanced loading animation -->
					<div class="relative">
						<div
							class="h-16 w-16 animate-spin rounded-full border-4 border-gray-700/30 border-t-purple-500"
						></div>
						<div
							class="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-r-blue-500"
							style="animation-direction: reverse; animation-duration: 1.5s;"
						></div>
					</div>
					<div class="text-center">
						<h3 class="mb-2 text-xl font-semibold text-[#E0E0E0]">Setting up team workspace</h3>
						<p class="text-[#B0B0B0]">Initializing collaboration tools...</p>
					</div>
				</div>
			{:else if clientError}
				<div class="w-full max-w-md" in:scale={{ duration: 300, start: 0.95 }}>
					<div
						class="rounded-2xl border border-[#F44336]/50 bg-[#1E1E1E] p-6 shadow-xl backdrop-blur-sm"
					>
						<div class="flex items-start gap-4">
							<div class="rounded-xl bg-red-500/20 p-3">
								<Icon name="error" iconClass="text-red-400 w-6 h-6" />
							</div>
							<div class="flex-1">
								<h3 class="mb-2 text-lg font-semibold text-[#F44336]">Setup Error</h3>
								<p class="mb-4 text-sm leading-relaxed text-[#F44336]">{clientError}</p>
								<button
									class="w-full rounded-xl bg-[#8A2BE2] px-4 py-3 font-medium text-[#FFFFFF] transition-all hover:bg-[#A052E8]"
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
				<div
					class="flex w-full max-w-4xl flex-col items-center"
					in:fade={{ duration: 400, delay: 100 }}
				>
					<!-- Welcome Section -->
					<div class="mb-8 text-center" in:scale={{ duration: 400, delay: 200, start: 0.95 }}>
						<div class="mb-4 inline-flex items-center gap-3">
							<div
								class="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg"
							>
								<Icon name="add_comment" iconClass="text-white text-lg" />
							</div>
							<h1 class="text-3xl font-bold text-[#E0E0E0]">Start a new team chat</h1>
						</div>
						<!-- <p class="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Create a collaborative space for your team in <span class="text-purple-400 font-medium">{currentSpaceName()}</span>. 
                            Work together, share ideas, and get AI assistance.
                        </p> -->
					</div>

					<!-- Chat Creation Form -->
					<div class="mb-12 w-full max-w-lg" in:scale={{ duration: 400, delay: 300, start: 0.95 }}>
						<div
							class="rounded-2xl border border-[#2C2C2C] bg-[#1E1E1E] p-6 shadow-xl backdrop-blur-sm"
						>
							<div class="mb-6">
								<label
									for="chatTitle"
									class="mb-3 block flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]"
								>
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
									class="w-full rounded-xl border border-[#4F4F4F] bg-[#2C2C2C] px-4 py-4 text-lg text-[#E0E0E0] placeholder-[#B0B0B0] transition-all focus:border-[#8A2BE2]/50 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/50"
									disabled={isCreatingChat}
								/>
								<div class="mt-3 flex items-center justify-between">
									{#if titleError}
										<span class="flex items-center gap-1 text-sm font-medium text-red-400">
											<Icon name="error" iconClass="w-3 h-3" />
											{titleError}
										</span>
									{:else}
										<span class="text-sm text-[#B0B0B0]">Choose a clear, descriptive name</span>
									{/if}
									<span
										class="rounded-full bg-[#2C2C2C] px-2 py-1 text-xs font-medium text-[#B0B0B0]"
									>
										{chatTitle.length}/30
									</span>
								</div>
							</div>

							<button
								onclick={() => handleCreateChat()}
								disabled={isCreatingChat || !chatTitle.trim() || chatTitle.length > 30}
								class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8A2BE2] px-6 py-4 font-semibold text-[#FFFFFF] transition-all hover:bg-[#A052E8] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{#if isCreatingChat}
									<div
										class="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-white"
									></div>
									Creating Chat...
								{:else}
									<Icon name="add" iconClass="w-5 h-5" />
									Create Team Chat
								{/if}
							</button>
						</div>
					</div>

					<!-- Quick Start Templates -->
					<!-- <div class="w-full max-w-4xl" in:scale={{ duration: 400, delay: 400, start: 0.95 }}>
                        <div class="text-center mb-8">
                            <h2 class="text-2xl font-semibold text-white mb-2">Quick Start Templates</h2>
                            <p class="text-[#B0B0B0]">Get started faster with pre-made chat templates</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each chatTemplates as template, i}
                                <button 
                                    onclick={() => useTemplate(template)}
                                    class="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 hover:from-gray-700/50 hover:to-gray-800/50 border border-gray-700/50 hover:border-gray-600/70 rounded-xl p-5 text-left transition-all duration-300 shadow-lg hover:shadow-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCreatingChat}
                                    in:scale={{ duration: 200, delay: 450 + (i * 50), start: 0.95 }}
                                >
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
                                        
                                        <div class="absolute bottom-0 left-0 w-full h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-xl"
                                             style="background-color: {template.color}"></div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                        
                        <div class="text-center mt-8" in:fade={{ delay: 600 }}>
                            <div class="inline-flex items-center gap-2 text-gray-500 text-sm">
                                <Icon name="info" iconClass="w-4 h-4" />
                                <span>Templates help you get started quickly with common collaboration patterns</span>
                            </div>
                        </div>
                    </div> -->
				</div>
			{/if}
		</div>
	</div>
</div>
