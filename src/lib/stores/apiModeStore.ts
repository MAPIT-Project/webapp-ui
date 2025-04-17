import { writable } from 'svelte/store';

// Create a writable store with initial value of true (use demo by default)
export const useDemo = writable<boolean>(true);
