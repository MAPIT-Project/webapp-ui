import { writable } from 'svelte/store';

// Create a writable store with initial value of false (use production by default)
export const useDemo = writable<boolean>(false);
