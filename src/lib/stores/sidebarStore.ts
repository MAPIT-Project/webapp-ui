import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const sidebarExpanded = writable(false);

// Function to toggle the sidebar state
export function toggleSidebar() {
  sidebarExpanded.update(value => !value);
}

// Set up event listener for sidebar toggle
if (browser) {
  document.addEventListener('toggle-sidebar', () => {
    console.log('Sidebar toggle event received');
    toggleSidebar();
  });
}