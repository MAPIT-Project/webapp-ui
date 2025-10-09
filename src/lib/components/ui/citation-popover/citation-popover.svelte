<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Citation } from '$lib/types/schema';

	export let citation: Citation;
	export let position: { x: number; y: number } = { x: 0, y: 0 };
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.citation-popover')) {
			isOpen = false;
		}
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	$: if (isOpen) {
		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleEscape);
	} else {
		document.removeEventListener('click', handleClickOutside);
		document.removeEventListener('keydown', handleEscape);
	}
</script>

<svelte:window />

<!-- Citation marker -->
<button
	class="citation-marker inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-blue-400 dark:bg-blue-900 dark:hover:bg-blue-800"
	on:click={() => (isOpen = !isOpen)}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			isOpen = !isOpen;
		}
	}}
	aria-label={`View citation ${citation.id}`}
	aria-expanded={isOpen}
	role="button"
	tabindex="0"
>
	{citation.id}
</button>

<!-- Popover -->
{#if isOpen}
	<div
		class="citation-popover fixed z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700"
		style="left: {Math.min(position.x, window.innerWidth - 320)}px; top: {Math.min(position.y, window.innerHeight - 200)}px;"
		transition:fly={{ y: -10, duration: 200 }}
	>
		<div class="flex items-start justify-between mb-2">
			<h3 class="text-sm font-medium text-gray-900 dark:text-white">Source</h3>
			<button
				class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
				on:click={() => (isOpen = false)}
				aria-label="Close citation"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
				</svg>
			</button>
		</div>
		
		<div class="space-y-2">
			<div>
				<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Title</h4>
				<p class="text-sm text-gray-900 dark:text-white">{citation.title}</p>
			</div>
			
			{#if citation.snippet}
				<div>
					<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Snippet</h4>
					<p class="text-sm text-gray-600 dark:text-gray-400 italic">"{citation.snippet}"</p>
				</div>
			{/if}
			
			{#if citation.url}
				<div>
					<a
						href={citation.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
					>
						View Source
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
							<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
						</svg>
					</a>
				</div>
			{/if}
			
			{#if citation.metadata}
				<div class="pt-2 border-t border-gray-200 dark:border-gray-700">
					{#if citation.metadata.authors && citation.metadata.authors.length > 0}
						<div class="mb-1">
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Authors:</span>
							<span class="text-xs text-gray-600 dark:text-gray-400 ml-1">
								{citation.metadata.authors.join(', ')}
							</span>
						</div>
					{/if}
					
					{#if citation.metadata.publicationDate}
						<div class="mb-1">
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Published:</span>
							<span class="text-xs text-gray-600 dark:text-gray-400 ml-1">
								{citation.metadata.publicationDate}
							</span>
						</div>
					{/if}
					
					{#if citation.metadata.sourceType}
						<div class="mb-1">
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Type:</span>
							<span class="text-xs text-gray-600 dark:text-gray-400 ml-1 capitalize">
								{citation.metadata.sourceType}
							</span>
						</div>
					{/if}
					
					{#if citation.metadata.relevanceScore !== undefined}
						<div>
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400">Relevance:</span>
							<span class="text-xs text-gray-600 dark:text-gray-400 ml-1">
								{Math.round(citation.metadata.relevanceScore * 100)}%
							</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}