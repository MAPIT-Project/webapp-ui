<script lang="ts">
	import { supabase } from '$lib/clients/supabaseClient';
	import { user } from '$lib/stores/sessionStore';
	import { onMount } from 'svelte';
	import { ensureClientExists } from '$lib/clients/clientService';

	let apiResult = null;
	let loading = false;
	let error = null;
	let tokenInfo = null;

	async function testRLS() {
		loading = true;
		error = null;

		try {
			// Ensure we have a client record
			await ensureClientExists();

			// Get the current user with a fresh request (secure)
			const { data: userData, error: userError } = await supabase.auth.getUser();

			if (userError) {
				error = 'Error getting user: ' + userError.message;
				console.error('User error:', userError);
				return;
			}

			if (!userData.user) {
				error = 'No active session found';
				return;
			}

			// Get session for token info (needed for API authorization)
			const { data: sessionData } = await supabase.auth.getSession();
			
			// Retrieve token info for debugging
			tokenInfo = sessionData.session ? {
				expires_at: new Date(sessionData.session.expires_at * 1000).toLocaleString(),
				token_preview: sessionData.session.access_token.substring(0, 10) + '...'
			} : null;

			// Call our test API
			const response = await fetch('/api/test_rls', {
				headers: sessionData.session ? {
					Authorization: `Bearer ${sessionData.session.access_token}`
				} : {}
			});

			apiResult = await response.json();

			if (!response.ok) {
				error = apiResult.error || 'API request failed';
				console.error('API error:', apiResult);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.error('Unexpected error:', err);
		} finally {
			loading = false;
		}
	}

	// Test the API when the component mounts
	onMount(() => {
		testRLS();
	});
</script>

<div>
	<h2 class="mb-4 text-xl font-semibold text-[#CACACA]">Row Level Security Test</h2>

	<button
		on:click={testRLS}
		disabled={loading}
		class="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
	>
		{loading ? 'Testing...' : 'Test RLS Now'}
	</button>

	{#if tokenInfo}
		<div class="mb-4 rounded-lg bg-gray-800 p-4">
			<h3 class="mb-2 font-medium text-[#CACACA]">Token Info:</h3>
			<p class="text-sm text-[#CACACA]">Token preview: {tokenInfo.token_preview}</p>
			<p class="text-sm text-[#CACACA]">Expires at: {tokenInfo.expires_at}</p>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-4">
			<p class="text-red-300">{error}</p>
		</div>
	{/if}

	{#if apiResult}
		<div class="rounded-lg bg-gray-800 p-4">
			<h3 class="mb-2 font-medium text-[#CACACA]">API Response:</h3>
			<pre class="overflow-x-auto whitespace-pre-wrap text-xs text-[#CACACA]">
                {JSON.stringify(apiResult, null, 2)}
            </pre>
		</div>
	{/if}
</div>
