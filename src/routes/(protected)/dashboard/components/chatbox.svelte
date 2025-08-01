<script lang="ts">
	import { createConversation, addUserMessage } from '$lib/clients/conversationService';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/generic/icon.svelte';
	import { getSpace } from '$lib/stores/collaborationStore.svelte';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { scale, fade } from 'svelte/transition';

	let userInput = $state('');
	let isProcessing = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (!userInput.trim() || isProcessing) return;

		error = null;
		isProcessing = true;

		try {
			const currentInput = userInput;
			userInput = '';

			const currentSpaceId = getSpace();
			const conversation = await createConversation(currentInput, currentSpaceId);

			if (!conversation) {
				throw new Error('Failed to create conversation');
			}

			// Add the new conversation to the store so it appears in the sidebar immediately
			conversationStore.addConversation(conversation);

			// Explicitly add the user's first message to the conversation
			const userMessage = await addUserMessage(conversation.id, currentInput);
			if (!userMessage) {
				throw new Error('Failed to save your message to the new conversation.');
			}

			// Navigate immediately to the conversation page
			// The conversation page will handle starting the AI response
			goto(
				`/dashboard/conversations/${conversation.id}?autostart=${encodeURIComponent(currentInput)}`
			);
		} catch (err) {
			console.error('Error creating conversation:', err);
			error = err instanceof Error ? err.message : 'Failed to create conversation';
		} finally {
			isProcessing = false;
		}
	}

	// No cleanup needed since we're not managing streaming here anymore

	const examples = [
		{
			icon: 'science',
			text: 'Tell me about funding opportunities in clean energy research',
			shade: 'dark',
			color: '#10B981', // Emerald
			category: 'Research'
		},
		{
			icon: 'health_and_safety',
			text: 'What are the latest trends in AI for healthcare?',
			shade: 'medium',
			color: '#3B82F6', // Blue
			category: 'Healthcare'
		},
		{
			icon: 'eco',
			text: 'Help me draft a proposal outline for sustainable agriculture',
			shade: 'dark',
			color: '#8B5CF6', // Purple
			category: 'Agriculture'
		},
		{
			icon: 'public',
			text: 'What EU programs focus on climate change mitigation?',
			shade: 'medium',
			color: '#F59E0B', // Amber
			category: 'Policy'
		}
	];

	function startWithExample(text: string) {
		userInput = text;
		handleSubmit();
	}
</script>

<div class="mx-auto w-full max-w-4xl" in:scale={{ duration: 300, start: 0.98 }}>
	<!-- Enhanced Input Section -->
	<form onsubmit={handleSubmit} class="relative mb-8" in:fade={{ duration: 200 }}>
		<div
			class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 shadow-2xl backdrop-blur-sm"
		>
			<input
				type="text"
				bind:value={userInput}
				placeholder={isProcessing
					? 'Creating conversation...'
					: 'What would you like to explore today?'}
				class="w-full rounded-2xl border border-[#4A4A57]/30 bg-[#383842]/80 px-6 py-5 pr-16 text-lg text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
				disabled={isProcessing}
			/>
			<button
				type="submit"
				class="group absolute right-4 top-1/2 -translate-y-1/2 transform rounded-xl p-3 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
				disabled={isProcessing || !userInput.trim()}
			>
				{#if isProcessing}
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
					></div>
				{:else}
					<div class="transition-transform group-hover:scale-110">
						<Icon name="send" iconClass="text-current w-5 h-5" />
					</div>
				{/if}
			</button>
		</div>

		<!-- Enhanced Loading Status -->
		{#if isProcessing}
			<div
				class="mt-4 rounded-xl border border-gray-700/50 bg-gradient-to-r from-gray-800/70 to-gray-900/70 p-6 backdrop-blur-sm"
				in:scale={{ duration: 300, start: 0.95 }}
			>
				<div class="flex flex-col items-center gap-4">
					<!-- Animated dots -->
					<div class="flex items-center gap-3 text-sm text-gray-400">
						<div class="flex space-x-1">
							<div class="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
							<div
								class="h-2 w-2 animate-bounce rounded-full bg-purple-500"
								style="animation-delay: 0.1s"
							></div>
							<div
								class="h-2 w-2 animate-bounce rounded-full bg-emerald-500"
								style="animation-delay: 0.2s"
							></div>
						</div>
						<span class="font-medium">Creating conversation and generating response...</span>
					</div>

					<!-- Progress indicator -->
					<div class="h-1 w-full overflow-hidden rounded-full bg-gray-700/50">
						<div
							class="h-full animate-pulse bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"
						></div>
					</div>

					<!-- Timing information -->
					<div
						class="rounded-lg border border-gray-600/30 bg-gray-800/50 px-4 py-3 text-center text-xs text-gray-400"
					>
						<div class="mb-1 flex items-center justify-center gap-2">
							<Icon name="info" iconClass="w-4 h-4 text-blue-400" />
							<span>Please wait</span>
						</div>
						<div class="text-gray-500">
							Response generation typically takes <span class="font-medium text-blue-300"
								>30-60 seconds</span
							>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</form>

	<!-- Enhanced Error Display -->
	{#if error}
		<div
			class="mb-8 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-900/40 to-red-800/40 p-5 text-red-200 shadow-lg backdrop-blur-sm"
			in:scale={{ duration: 300, start: 0.95 }}
		>
			<div class="flex items-start">
				<div class="mr-4 flex-shrink-0 rounded-lg bg-red-500/20 p-2">
					<Icon name="error" iconClass="text-red-400 w-5 h-5" />
				</div>
				<div class="flex-1">
					<h3 class="mb-1 font-medium text-red-200">Something went wrong</h3>
					<div class="whitespace-pre-line text-sm text-red-300">{error}</div>
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

		<div
			class="grid grid-cols-1 gap-6 lg:grid-cols-2"
			in:scale={{ duration: 300, delay: 200, start: 0.98 }}
		>
			{#each examples as example, i}
				<button
					onclick={() => startWithExample(example.text)}
					class="group relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-6 text-left text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600/70 hover:from-gray-700/60 hover:to-gray-800/60 hover:shadow-xl"
					disabled={isProcessing}
					in:scale={{ duration: 200, delay: i * 50, start: 0.95 }}
				>
					<!-- Gradient overlay -->
					<div
						class="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-10"
						style="background: linear-gradient(135deg, {example.color}20, {example.color}05)"
					></div>

					<div class="relative z-10">
						<div class="mb-4 flex items-start justify-between">
							<div class="flex items-center gap-4">
								<div
									style="background-color: {example.color}"
									class="rounded-xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-110"
								>
									<Icon name={example.icon} iconSize="sm" iconClass="text-white" />
								</div>
								<div>
									<div class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
										{example.category}
									</div>
									<div class="h-0.5 w-8 rounded" style="background-color: {example.color}"></div>
								</div>
							</div>
							<div class="text-gray-500 transition-colors group-hover:text-gray-400">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							</div>
						</div>

						<p
							class="font-medium leading-relaxed text-gray-200 transition-colors duration-300 group-hover:text-white"
						>
							{example.text}
						</p>

						<!-- Hover effect indicator -->
						<div
							class="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transform transition-transform duration-300 group-hover:scale-x-100"
							style="background-color: {example.color}"
						></div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Additional CTA -->
		<div class="pt-8 text-center" in:fade={{ delay: 300 }}>
			<div class="inline-flex items-center gap-2 text-sm text-gray-500">
				<Icon name="lightbulb" iconClass="w-4 h-4" />
				<span>Or type your own question in the search box above</span>
			</div>
		</div>
	</div>
</div>
