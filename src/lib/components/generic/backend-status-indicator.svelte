<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from './icon.svelte';
	import { backendStatusStore } from '$lib/stores/backendStatusStore';

	let isClient = $state(false);

	onMount(() => {
		isClient = true;
		// Start checking status
		backendStatusStore.startChecking(30000);
	});

	onDestroy(() => {
		// Stop checking when component is destroyed
		backendStatusStore.stopChecking();
	});
</script>

{#if isClient}
	<div class="relative">
		<button
			class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
			title="Backend Status"
		>
			<div class="flex items-center gap-2">
				<div class="relative">
					<Icon name="cloud" iconClass="w-4 h-4" />
					<div
						class="absolute -right-1 -top-1 size-2.5 rounded-full {$backendStatusStore.status === 'connected'
							? 'bg-green-500 animate-pulse'
							: $backendStatusStore.status === 'disconnected'
							? 'bg-red-500'
							: 'bg-yellow-500 animate-pulse'}"
					></div>
				</div>
			</div>
		</button>
	</div>
{/if}
