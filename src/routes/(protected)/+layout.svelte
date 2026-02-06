<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { initializeSession } from '$lib/stores/sessionStore';
	import type { LayoutData } from './$types';
	import { getSpace, setSpace } from '$lib/stores/collaborationStore.svelte';

	export let data: LayoutData;

	let loading = true;
	let currentSpace: string = getSpace();
	let sessionInitStarted = false;

	console.log('[PROTECTED LAYOUT] Script executed. data.session exists:', !!data.session, 'data.session?.user:', data.session?.user?.email);

	async function doInit() {
		if (sessionInitStarted) return;
		sessionInitStarted = true;
		console.log('[PROTECTED LAYOUT] doInit() — calling initializeSession with user:', data.session?.user?.email);
		await initializeSession(data.session?.user);
		console.log('[PROTECTED LAYOUT] initializeSession completed. loading = false');
		loading = false;
	}

	onMount(() => {
		console.log('[PROTECTED LAYOUT] onMount FIRED');
		doInit();
	});

	// Safety net: afterUpdate is a legacy lifecycle hook that runs after every state change.
	// If onMount somehow doesn't fire, this will catch it on the first render.
	afterUpdate(() => {
		if (!sessionInitStarted) {
			console.warn('[PROTECTED LAYOUT] afterUpdate — onMount did NOT fire! Running doInit as fallback.');
			doInit();
		}
	});

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
