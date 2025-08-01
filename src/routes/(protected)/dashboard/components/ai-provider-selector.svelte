<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/generic/icon.svelte';
	import {
		selectedProvider,
		selectedVersion,
		availableProviders,
		fetchAvailableProviders,
		isLoadingProviders,
		useLocalDb, // Import new store
		isVersionV5OrHigher // Import helper
	} from '$lib/stores/aiProviderStore';
	import { useDemo } from '$lib/stores/apiModeStore';

	onMount(() => {
		fetchAvailableProviders();
	});

	// Handler for switching versions
	function handleVersionChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		selectedVersion.set(select.value as any);
	}

	// Handler for switching providers
	function handleProviderChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		selectedProvider.set(select.value as any);
	}

	// Get available providers for the selected version
	$: currentVersionProviders =
		$availableProviders && $selectedVersion
			? $availableProviders.available_providers[$selectedVersion] || {}
			: {};

	// Reactive statement to check if data source toggle should be visible
	$: showDataSourceToggle = isVersionV5OrHigher($selectedVersion) && !$useDemo;
</script>

<div class="flex items-center gap-1.5 px-2 py-1 text-xs">
	{#if $isLoadingProviders}
		<div class="flex items-center gap-1">
			<div
				class="h-2 w-2 animate-spin rounded-full border border-blue-400 border-t-transparent"
			></div>
			<span class="text-xs text-white/70">Loading...</span>
		</div>
	{:else if $useDemo}
		<div class="flex items-center gap-1">
			<Icon name="rocket_launch" className="text-purple-400 text-xs" />
			<span class="text-xs text-white">Demo</span>
		</div>
	{:else if $availableProviders}
		<div class="flex items-center gap-1.5">
			<Icon name="smart_toy" className="text-blue-400 text-xs" />

			<!-- Compact Version Selector -->
			<div class="relative">
				<select
					class="cursor-pointer appearance-none rounded border border-white/20 bg-white/10 px-1.5 py-0.5 pr-4 text-xs text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
					value={$selectedVersion}
					onchange={handleVersionChange}
					disabled={$useDemo}
				>
					{#each Object.keys($availableProviders.available_providers) as version}
						<option value={version} class="bg-gray-800 text-white">{version}</option>
					{/each}
				</select>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-white/60"
				>
					<Icon name="expand_more" className="text-xs" />
				</div>
			</div>

			<!-- Compact Provider Selector -->
			<div class="relative">
				<select
					class="cursor-pointer appearance-none rounded border border-white/20 bg-white/10 px-1.5 py-0.5 pr-4 text-xs text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
					value={$selectedProvider || ''}
					onchange={handleProviderChange}
					disabled={$useDemo}
				>
					{#each Object.entries(currentVersionProviders) as [provider, info]}
						<option value={provider} class="bg-gray-800 text-white">{provider}</option>
					{/each}
				</select>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-white/60"
				>
					<Icon name="expand_more" className="text-xs" />
				</div>
			</div>

			<!-- Compact Data Source Toggle (V5+ only) -->
			{#if showDataSourceToggle}
				<div class="flex items-center gap-1 border-l border-white/20 pl-1.5">
					<label for="dataSourceToggle" class="flex cursor-pointer select-none items-center gap-1">
						<div class="relative">
							<input
								type="checkbox"
								id="dataSourceToggle"
								class="sr-only"
								bind:checked={$useLocalDb}
							/>
							<div
								class="block h-3 w-6 rounded-full border border-white/20 transition-all duration-300 {$useLocalDb
									? 'bg-emerald-500'
									: 'bg-blue-500'}"
							></div>
							<div
								class="absolute left-0.5 top-0.5 h-2 w-2 rounded-full bg-white transition-all duration-300"
								class:translate-x-3={$useLocalDb}
							></div>
						</div>
						<span class="text-xs text-white/90">
							{$useLocalDb ? 'Local' : 'API'}
						</span>
					</label>
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex items-center gap-1">
			<Icon name="warning" className="text-yellow-400 text-xs" />
			<span class="text-xs text-white/70">No providers</span>
		</div>
	{/if}

	<!-- Compact info icon -->
	<div class="group relative">
		<Icon
			name="info"
			className="h-3 w-3 text-white/50 hover:text-white/80 transition-colors cursor-help"
		/>
		<div
			class="tooltip pointer-events-none invisible absolute -right-2 z-[100] mt-2
              w-48 rounded-lg border border-white/20 bg-gray-900/95 p-2 text-xs opacity-0 shadow-xl backdrop-blur-lg transition-all duration-300 group-hover:visible group-hover:opacity-100"
		>
			<div class="space-y-1">
				<p class="text-xs font-medium text-white">AI Configuration</p>
				<p class="text-[10px] leading-relaxed text-white/70">
					Select API version, provider, and data source for queries.
				</p>
			</div>
		</div>
	</div>
</div>
