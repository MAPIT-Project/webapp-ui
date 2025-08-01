import { writable } from 'svelte/store';

// Store for persisting search state across map movements
export const searchStore = writable({
	query: '',
	isSearching: false,
	results: [],
	totalCount: 0
});
