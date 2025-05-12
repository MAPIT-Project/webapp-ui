<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeSession } from '$lib/stores/sessionStore';
	import type { LayoutData } from './$types'; // Import LayoutData type

	export let data: LayoutData; // Receive session data from +layout.server.ts

	let loading = true;

	onMount(async () => {
		// Initialize the session store, which will also listen for auth changes
		await initializeSession();
		// The server layout (+layout.server.ts) already protects the route.
		// Session data is available via `data.session`.
		// No need for an additional client-side redirect here.
		loading = false;
	});
</script>

{#if loading && !data.session} 
	// Show loading indicator only if session is not yet available from server
	// and still in the process of client-side initialization.
	<div class="w-full h-screen flex items-center justify-center bg-gray-900">
		<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
	</div>
{:else if !data.session && !loading}
    <!-- This case should ideally be handled by the server redirect, but as a fallback -->
    <div class="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <p>Session expired or not found.</p>
        <a href="/login" class="text-blue-400 hover:text-blue-300 mt-2">Go to Login</a>
    </div>
{:else}
	<slot />
{/if}
