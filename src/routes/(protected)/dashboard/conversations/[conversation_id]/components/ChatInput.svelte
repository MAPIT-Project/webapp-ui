<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';

	interface Props {
		userInput: string;
		isStreaming: boolean;
		isSending: boolean;
		streamingProgress: string;
		onInputChange: (value: string) => void;
		onSubmit: () => void;
		onStopStreaming: () => void;
	}

	let {
		userInput,
		isStreaming,
		isSending,
		streamingProgress,
		onInputChange,
		onSubmit,
		onStopStreaming
	}: Props = $props();

	// Check if input contains @mapit for styling
	function hasMapitInput(text: string): boolean {
		return /@mapit\b/i.test(text);
	}

	function handleSubmit() {
		onSubmit();
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		onInputChange(target.value);
	}
</script>

<div class="flex-shrink-0 p-4">
	<form on:submit|preventDefault={handleSubmit} class="relative mx-auto max-w-4xl">
		<div
			class="relative rounded-2xl border border-gray-600/30 bg-[#2A2A2A]/50 backdrop-blur-sm transition-all focus-within:border-gray-600/50 focus-within:ring-2 focus-within:ring-gray-600/50"
		>
			<input
				type="text"
				value={userInput}
				on:input={handleInput}
				placeholder={isStreaming ? 'AI is generating response...' : 'Message AI Assistant...'}
				class="w-full rounded-2xl bg-transparent px-4 py-3 pr-12 text-gray-200 placeholder-gray-500 focus:outline-none {hasMapitInput(
					userInput
				)
					? 'font-semibold'
					: ''}"
				disabled={isSending || isStreaming}
			/>

			{#if isStreaming}
				<button
					type="button"
					on:click={onStopStreaming}
					class="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-xl bg-red-500 px-2 py-1.5 text-white shadow-lg transition-all duration-200 hover:bg-red-600 hover:shadow-xl"
				>
					<Icon name="stop" className="text-current" />
				</button>
			{:else}
				<button
					type="submit"
					class="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-xl border px-2 py-1.5 transition-all duration-200 {userInput.trim() &&
					!isSending
						? 'border-blue-500/30 bg-blue-500/20 text-blue-300 hover:border-blue-400 hover:text-blue-200'
						: 'border-gray-600/50 text-gray-500'}"
					disabled={isSending || !userInput.trim()}
				>
					<Icon name="send" className="text-current" />
				</button>
			{/if}
		</div>

		<!-- Streaming progress indicator -->
		{#if isStreaming && streamingProgress}
			<div
				class="mt-4 rounded-xl border border-gray-600/30 bg-gradient-to-r from-gray-800/20 to-gray-700/20 p-4 backdrop-blur-sm"
			>
				<div class="flex items-center gap-3">
					<div class="flex space-x-1">
						<div class="h-2 w-2 animate-bounce rounded-full bg-gray-600"></div>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-gray-700 [animation-delay:0.1s]"
						></div>
						<div
							class="h-2 w-2 animate-bounce rounded-full bg-gray-800 [animation-delay:0.2s]"
						></div>
					</div>
					<span class="text-sm font-medium text-gray-400">{streamingProgress}</span>
				</div>
				<div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-800/50">
					<div
						class="h-full animate-pulse bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800"
					></div>
				</div>
			</div>
		{/if}

		<!-- Input hint -->
		<div class="mt-2 text-center">
			<p class="text-xs text-gray-600">
				{#if isStreaming}
					Real-time AI response streaming • Click stop to cancel
				{:else}
					Press Enter to send • AI can make mistakes, verify important information
				{/if}
			</p>
		</div>
	</form>
</div>
