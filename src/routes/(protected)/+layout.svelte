<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeSession } from '$lib/stores/sessionStore';
	import type { LayoutData } from './$types';
	import { getSpace, setSpace } from '$lib/stores/collaborationStore.svelte';

	let { data, children } = $props<{ data: LayoutData; children: any }>();

	let loading = $state(true);

	onMount(async () => {
		// Initialize the session store with the server-validated user.
		// This sets the user store immediately so child components don't
		// have to wait for a client-side Supabase round-trip.
		await initializeSession(data.session?.user);
		loading = false;
	});
</script>

{#if loading && !data.session}
	<!-- Show loading indicator while session is not yet available -->
	<div
		class="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
	>
		<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
	</div>
{:else if !data.session && !loading}
	<!-- Fallback if server redirect didn't catch missing session -->
	<div
		class="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212] text-[#E0E0E0]"
	>
		<p>Session expired or not found.</p>
		<a href="/login" class="mt-2 text-blue-400 hover:text-blue-300">Go to Login</a>
	</div>
{:else}
	{@render children()}
{/if}
