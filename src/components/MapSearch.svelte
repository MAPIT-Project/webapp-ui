<script lang="ts">
	import { searchStore } from '$lib/stores/searchStore';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Local copy of store values
	let searchQuery = '';
	let searchResults: any[] = [];
	let isSearching = false;
	let totalResultsCount = 0;
	let searchInput: HTMLInputElement;

	// Set up subscription to the search store
	const unsubscribe = searchStore.subscribe((state) => {
		searchQuery = state.query;
		searchResults = state.results;
		isSearching = state.isSearching;
		totalResultsCount = state.totalCount || searchResults.length;
	});

	// Export callbacks as props
	export let onSearch: () => Promise<void>;
	export let onClear: () => void;

	// Handle search submission
	async function handleSearch(event?: Event) {
		if (event) event.preventDefault();

		if (!searchQuery.trim()) {
			// Clear the search store
			searchStore.set({ query: '', isSearching: false, results: [] });
			onClear();
			return;
		}

		// Update store with the search query
		searchStore.update((state) => ({ ...state, query: searchQuery, isSearching: true }));

		// Call parent component's search handler
		try {
			await onSearch();
		} catch (error) {
			console.error('Error performing search:', error);
		} finally {
			searchStore.update((state) => ({ ...state, isSearching: false }));
		}
	}

	// Clear search and reset view
	function clearSearch() {
		searchStore.set({ query: '', isSearching: false, results: [] });
		onClear();
	}

	// Handle keyboard events for the clear button
	function handleClearKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			clearSearch();
		}
	}

	// Function to focus the search input
	function focusSearch() {
		if (searchInput) {
			searchInput.focus();
		}
	}

	onMount(() => {
		if (browser) {
			// Listen for the focus-search event from keyboard shortcuts
			document.addEventListener('focus-search', () => {
				console.log('Focus search event received');
				focusSearch();
			});
		}
	});

	// Cleanup on component unmount
	onDestroy(() => {
		unsubscribe();
		if (browser) {
			document.removeEventListener('focus-search', focusSearch);
		}
	});
</script>

<div
	class="absolute left-1/2 top-10 z-[500] flex w-4/5 max-w-[500px] -translate-x-1/2 transform flex-col gap-2.5 text-black"
>
	<form class="flex overflow-hidden rounded bg-white shadow-md" on:submit={handleSearch}>
		<input
			bind:this={searchInput}
			type="text"
			bind:value={searchQuery}
			placeholder="Search for projects by title or objective..."
			class="flex-grow border-none p-[10px_12px] font-sans text-sm focus:outline-none"
			aria-label="Search query"
		/>
		<button
			type="submit"
			disabled={isSearching}
			class="min-w-[100px] cursor-pointer border-none bg-[#4285F4] px-[15px] py-0 font-sans text-sm text-white hover:enabled:bg-[#3367D6] disabled:cursor-not-allowed disabled:bg-[#9cb3e4]"
		>
			{isSearching ? 'Searching...' : 'Search'}
		</button>
	</form>

	{#if searchResults.length > 0}
		<div class="max-w-full rounded bg-white/90 p-[8px_12px] font-sans text-sm shadow-md">
			Found {totalResultsCount.toLocaleString()} organizations in matching projects
			<button
				type="button"
				class="ml-2 cursor-pointer font-bold text-[#4285F4] underline"
				on:click={clearSearch}
				on:keydown={handleClearKeyDown}
				aria-label="Clear search results"
			>
				Clear
			</button>
		</div>
	{/if}
</div>
