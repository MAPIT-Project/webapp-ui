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
  const unsubscribe = searchStore.subscribe(state => {
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
    searchStore.update(state => ({ ...state, query: searchQuery, isSearching: true }));
    
    // Call parent component's search handler
    try {
      await onSearch();
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      searchStore.update(state => ({ ...state, isSearching: false }));
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

<div class="absolute top-10 left-1/2 transform -translate-x-1/2 z-[500] flex flex-col gap-2.5 max-w-[500px] w-4/5 text-black">
  <form class="flex bg-white rounded shadow-md overflow-hidden" on:submit={handleSearch}>
    <input 
      bind:this={searchInput}
      type="text" 
      bind:value={searchQuery}
      placeholder="Search for projects by title or objective..." 
      class="flex-grow p-[10px_12px] border-none text-sm font-sans focus:outline-none"
      aria-label="Search query"
    />
    <button 
      type="submit" 
      disabled={isSearching}
      class="bg-[#4285F4] text-white border-none py-0 px-[15px] cursor-pointer font-sans text-sm min-w-[100px] disabled:bg-[#9cb3e4] disabled:cursor-not-allowed hover:enabled:bg-[#3367D6]"
    >
      {isSearching ? 'Searching...' : 'Search'}
    </button>
  </form>
  
  {#if searchResults.length > 0}
    <div class="bg-white/90 p-[8px_12px] rounded text-sm font-sans shadow-md max-w-full">
      Found {totalResultsCount.toLocaleString()} organizations in matching projects
      <button 
        type="button"
        class="text-[#4285F4] ml-2 cursor-pointer font-bold underline" 
        on:click={clearSearch}
        on:keydown={handleClearKeyDown}
        aria-label="Clear search results"
      >
        Clear
      </button>
    </div>
  {/if}
</div>
