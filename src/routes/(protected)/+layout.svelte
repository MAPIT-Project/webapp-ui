<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/clients/supabaseClient';
	import { user, initializeSession } from '$lib/stores/sessionStore';

	let loading = true;

	onMount(async () => {
		// Initialize the session
		await initializeSession();
		
		// Check if user is logged in
		const { data } = await supabase.auth.getSession();
		
		if (!data.session) {
			// Redirect to login if no session
			window.location.href = '/login';
			return;
		}
		
		loading = false;
	});
</script>

{#if loading}
	<div class="w-full h-screen flex items-center justify-center bg-gray-900">
		<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
	</div>
{:else}
	<slot />
{/if}
