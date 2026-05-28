<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from './icon.svelte';

	let backendStatus = $state<'loading' | 'connected' | 'disconnected'>('loading');
	let responseTime = $state<number | null>(null);
	let showTooltip = $state(false);
	let checkInterval: NodeJS.Timeout | null = null;

	async function checkBackendStatus() {
		try {
			const response = await fetch('/api/backend-status');
			const data = await response.json();

			if (data.status === 'connected') {
				backendStatus = 'connected';
				responseTime = data.response_time_ms;
			} else {
				backendStatus = 'disconnected';
				responseTime = null;
			}
		} catch (error) {
			backendStatus = 'disconnected';
			responseTime = null;
		}
	}

	onMount(() => {
		checkBackendStatus();
		// Check status every 30 seconds
		checkInterval = setInterval(checkBackendStatus, 30000);
	});

	onDestroy(() => {
		if (checkInterval) {
			clearInterval(checkInterval);
		}
	});

	function getStatusColor() {
		switch (backendStatus) {
			case 'connected':
				return 'bg-green-500';
			case 'disconnected':
				return 'bg-red-500';
			default:
				return 'bg-yellow-500';
		}
	}

	function getStatusText() {
		switch (backendStatus) {
			case 'connected':
				return responseTime ? `${responseTime}ms` : 'Connected';
			case 'disconnected':
				return 'Disconnected';
			default:
				return 'Checking...';
		}
	}
</script>

<div class="relative" onmouseenter={() => (showTooltip = true)} onmouseleave={() => (showTooltip = false)}>
	<button
		class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
		title="Backend Status"
	>
		<div class="flex items-center gap-2">
			<div class="relative">
				<Icon name="cloud" iconClass="w-4 h-4" />
				<div
					class="absolute -right-1 -top-1 size-2.5 rounded-full {getStatusColor()} animate-pulse"
				></div>
			</div>
		</div>
	</button>

	{#if showTooltip}
		<div
			class="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[#3A3A3A] bg-[#1E1E1E] p-3 shadow-lg"
		>
			<div class="flex items-center gap-2">
				<div class="size-2.5 rounded-full {getStatusColor()}" class:animate-pulse={backendStatus !== 'disconnected'}></div>
				<span class="text-sm font-medium text-white">{getStatusText()}</span>
			</div>
			{#if backendStatus === 'connected' && responseTime}
				<p class="mt-2 text-xs text-gray-400">Response time: {responseTime}ms</p>
			{:else if backendStatus === 'disconnected'}
				<p class="mt-2 text-xs text-red-400">Backend connection failed</p>
			{/if}
		</div>
	{/if}
</div>
