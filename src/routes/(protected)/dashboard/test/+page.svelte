<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Chatbox from '../components/chatbox.svelte';
	import TestRLS from '../test-rls.svelte';
	import { user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/clients/supabaseClient';
	import { ensureClientExists } from '$lib/clients/clientService';
	import { onMount } from 'svelte';

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}

	// Create client record if one doesn't exist
	onMount(async () => {
		if ($user) {
			await ensureClientExists($user.email?.split('@')[0]);
		}
	});
</script>

<div class="relative flex h-full min-h-screen w-full items-center justify-center">
	<span class="absolute left-4 top-4 text-xs text-[#CACACA]"
		>AI Domain Expert Tool <span class="ml-1 text-[0.5rem] font-bold">BETA</span>
	</span>

	<!-- User menu -->
	<div class="absolute right-4 top-4">
		<button
			class="flex items-center gap-2 text-sm text-[#CACACA] hover:text-white"
			on:click={handleSignOut}
		>
			<span>{$user?.email}</span>
			<Icon name="logout" iconSize="sm" />
		</button>
	</div>

	<div class="flex w-[800px] flex-col items-center">
		<div class="mt-8 w-full">
			<TestRLS />
		</div>
	</div>
</div>
