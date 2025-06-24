<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeSession } from '$lib/stores/sessionStore';
	import type { LayoutData } from './$types'; // Import LayoutData type
	import { getSpace, setSpace } from '$lib/stores/collaborationStore.svelte'; // Import collaboration store

	export let data: LayoutData; // Receive session data from +layout.server.ts

	let loading = true;
	let currentSpace: string = getSpace(); // Use getter

	onMount(async () => {
		// Initialize the session store, which will also listen for auth changes
		await initializeSession();
		// The server layout (+layout.server.ts) already protects the route.
		// Session data is available via `data.session`.
		// No need for an additional client-side redirect here.
		loading = false;
	});

	function switchToPersonalSpace() {
		setSpace('personal');
		currentSpace = getSpace(); // Update local state after setting
		// Optionally, navigate to a default personal page, e.g., /dashboard
		// import { goto } from '$app/navigation';
		// goto('/dashboard');
	}
</script>

<!-- {#if getSpace() !== 'personal'} 
	<div class="bg-yellow-500 text-black p-2 text-center text-sm">
		You are in a collaboration workspace: <strong>{getSpace()}</strong>.
		<button on:click={switchToPersonalSpace} class="underline hover:text-blue-700 ml-2">
			(Go back to Personal Space)
		</button>
	</div>
{/if} -->

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
