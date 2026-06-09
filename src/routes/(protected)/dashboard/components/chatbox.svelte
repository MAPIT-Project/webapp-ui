<script lang="ts">
	import { createConversation, addUserMessage } from '$lib/clients/conversationService';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/generic/icon.svelte';
	import { getSpace } from '$lib/stores/collaborationStore.svelte';
	import { conversationStore } from '$lib/stores/conversationStore';
	import { scale, fade } from 'svelte/transition';
	import { tick } from 'svelte';

	let userInput = $state('');
	let isProcessing = $state(false);
	let error = $state<string | null>(null);
	let scroller: HTMLDivElement;
	let canPrev = $state(false);
	let canNext = $state(false);

	function updateArrows() {
		if (!scroller) return;
		canPrev = scroller.scrollLeft > 0;
		canNext = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
	}

	function scrollByAmount(amount: number) {
		if (!scroller) return;
		scroller.scrollBy({ left: amount, behavior: 'smooth' });
	}

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

			// Navigate immediately to the conversation page
			// The conversation page will handle saving the user message and starting the AI response
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
			text: 'What is the structure of the Horizon Europe programme? ',
			shade: 'dark',
			color: '#10B981', // Emerald
			category: 'Research'
		},
		{
			icon: 'public',
			text: 'What EU programs focus on climate change mitigation?',
			shade: 'medium',
			color: '#F59E0B', // Amber
			category: 'Policy'
		},
		{
			icon: 'health_and_safety',
			text: 'What are instruments? (RIA, CSA, IA etc)',
			shade: 'medium',
			color: '#3B82F6', // Blue
			category: 'Healthcare'
		},
		// {
		// 	icon: 'eco',
		// 	text: 'Help me draft a proposal outline for sustainable agriculture',
		// 	shade: 'dark',
		// 	color: '#8B5CF6', // Purple
		// 	category: 'Agriculture'
		// },
		
	];

	function startWithExample(text: string) {
		userInput = text;
		handleSubmit();
	}

	let _chatboxInit = false;
	// Add event listener for capabilities modal questions
	$effect(() => {
		if (!_chatboxInit) {
			_chatboxInit = true;
			Promise.resolve().then(updateArrows);
		}
		
		const handleFillChatInput = (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			if (customEvent.detail) {
				userInput = customEvent.detail;
				handleSubmit();
			}
		};
		
		window.addEventListener('mapit:fillChatInput', handleFillChatInput);
		return () => {
			window.removeEventListener('mapit:fillChatInput', handleFillChatInput);
		};
	});
</script>

<div class="mx-auto w-full max-w-4xl" in:scale={{ duration: 300, start: 0.98 }}>
	<!-- Enhanced Input Section -->
	<form onsubmit={handleSubmit} class="relative mb-8" in:fade={{ duration: 200 }}>
		<div
			class="relative overflow-hidden rounded-2xl bg-[#141414]/90 border border-[#2A2A2A] shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-md focus-within:border-[#3B82F6]/50 focus-within:ring-1 focus-within:ring-[#3B82F6]/50 transition-all duration-300"
		>
			<input
				type="text"
				bind:value={userInput}
				placeholder={isProcessing
					? 'Creating conversation...'
					: 'What would you like to explore today?'}
				class="w-full bg-transparent px-6 py-5 pr-16 text-lg text-white placeholder-[#6B7280] focus:outline-none"
				disabled={isProcessing}
			/>
			<button
				type="submit"
				class="group absolute right-3 top-1/2 -translate-y-1/2 transform rounded-xl p-2.5 text-[#6B7280] transition-all duration-200 hover:bg-[#3B82F6] hover:text-white disabled:opacity-50"
				disabled={isProcessing || !userInput.trim()}
			>
				{#if isProcessing}
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
				{:else}
					<div class="transition-transform group-hover:scale-110">
						<Icon name="send" className="text-current w-5 h-5" />
					</div>
				{/if}
			</button>
		</div>
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

	<!-- Example chips redesigned -->
	<div class="space-y-2">
		<div class="relative overflow-hidden" in:scale={{ duration: 200, delay: 120, start: 0.98 }}>
			<button
				aria-label="Previous"
				class="absolute left-1 top-1/2 z-50 -translate-y-1/2 rounded-full border border-[#2C2C2C] bg-[#1E1E1E]/90 p-2 text-[#E0E0E0] hover:bg-[#2C2C2C] disabled:pointer-events-none disabled:opacity-0"
				onclick={() => scrollByAmount(-600)}
				disabled={!canPrev}
			>
				<Icon name="chevron_left" iconClass="w-5 h-5" />
			</button>
			<div
				class="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[#1C1C1C] to-transparent"
			></div>
			<div
				class="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#1C1C1C] to-transparent"
			></div>
			<div
				bind:this={scroller}
				onscroll={updateArrows}
				class="scrollbar-thin -mx-12 overflow-x-auto px-12 [mask-image:linear-gradient(to_right,transparent_0,black_40px,black_calc(100%-40px),transparent_100%)]"
				style="scrollbar-width: none; -ms-overflow-style: none;"
			>
				<div class="flex w-max min-w-full gap-2">
					{#each examples as example, i}
						<button
							onclick={() => startWithExample(example.text)}
							class="inline-flex items-center gap-2.5 rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] px-4 py-2.5 text-sm text-[#9CA3AF] transition-all hover:border-[#3B82F6]/40 hover:bg-[#1E1E1E]/80 hover:text-white disabled:opacity-60 shadow-lg shadow-black/20"
							disabled={isProcessing}
							in:scale={{ duration: 150, delay: i * 30, start: 0.98 }}
						>
							<span
								class="inline-block size-2 rounded-full shadow-[0_0_8px_currentColor]"
								style="color: {example.color}; background-color: currentColor;"
							></span>
							<span class="whitespace-nowrap font-medium tracking-wide">{example.text}</span>
						</button>
					{/each}
				</div>
			</div>
			<button
				aria-label="Next"
				class="absolute right-1 top-1/2 z-50 -translate-y-1/2 rounded-full border border-[#2C2C2C] bg-[#1E1E1E]/90 p-2 text-[#E0E0E0] hover:bg-[#2C2C2C] disabled:pointer-events-none disabled:opacity-0"
				onclick={() => scrollByAmount(600)}
				disabled={!canNext}
			>
				<Icon name="chevron_right" iconClass="w-5 h-5" />
			</button>
		</div>
		<div class="pt-2 text-center" in:fade={{ delay: 220 }}>
			<div class="inline-flex items-center gap-2 text-xs text-[#757575]">
				<Icon name="lightbulb" iconClass="w-4 h-4" />
				<span>Or type your own question above</span>
			</div>
		</div>
	</div>
</div>

<style>
	.scrollbar-thin::-webkit-scrollbar {
		display: none;
	}
</style>
