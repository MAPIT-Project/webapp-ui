<script lang="ts">
	import { user, initializeSession } from '$lib/stores/sessionStore';
	import type { LayoutData } from './$types';
	import { getSpace, setSpace } from '$lib/stores/collaborationStore.svelte';

	export let data: LayoutData;

	let loading = true;
	let currentSpace: string = getSpace();

	console.log('[PROTECTED LAYOUT] Script executed. data.session exists:', !!data.session, 'data.session?.user:', data.session?.user?.email);

	// BYPASS ALL LIFECYCLE HOOKS — they don't fire in this component.
	// Set user store directly from server-provided session data.
	// This runs during both SSR and CSR, but the downstream $effect
	// subscriptions only fire on the client, which is what we want.
	if (data.session?.user) {
		console.log('[PROTECTED LAYOUT] Setting user store IMMEDIATELY from server data:', data.session.user.email);
		user.set(data.session.user);
	}

	// Also kick off the full session initialization (client-side auth refresh,
	// onAuthStateChange listener). This is async but we don't need to wait for it
	// — the user store is already set above, so child components can proceed.
	if (typeof window !== 'undefined') {
		console.log('[PROTECTED LAYOUT] Running initializeSession in browser');
		initializeSession(data.session?.user).then(() => {
			console.log('[PROTECTED LAYOUT] initializeSession completed. loading = false');
			loading = false;
		});
	}

	function switchToPersonalSpace() {
		setSpace('personal');
		currentSpace = getSpace();
	}
</script>

{#if loading && !data.session}
	<!-- Show loading indicator while session is not yet available -->
	<div
		class="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
	>
		<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
	</div>
{:else if !data.session && !loading}
	<div
		class="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212] text-[#E0E0E0]"
	>
		<p>Session expired or not found.</p>
		<a href="/login" class="mt-2 text-blue-400 hover:text-blue-300">Go to Login</a>
	</div>
{:else}
	<slot />
{/if}
