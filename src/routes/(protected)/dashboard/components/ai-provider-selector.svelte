<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from "$lib/components/generic/icon.svelte";
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
  $: currentVersionProviders = $availableProviders && $selectedVersion 
    ? $availableProviders.available_providers[$selectedVersion] || {}
    : {};

  // Reactive statement to check if data source toggle should be visible
  $: showDataSourceToggle = isVersionV5OrHigher($selectedVersion) && !$useDemo;
</script>

<div class="flex items-center gap-2 text-xs text-gray-400 rounded px-2 py-1 bg-gray-800 border border-gray-700">
  {#if $isLoadingProviders}
    <div class="flex items-center gap-1">
      <div class="animate-spin rounded-full h-2.5 w-2.5 border-t-2 border-b-2 border-blue-500"></div>
      <span class="text-xs">Loading...</span>
    </div>
  {:else if $useDemo}
    <div class="flex items-center gap-1">
      <Icon name="rocket_launch" class="text-gray-400 text-xs" />
      <span class="text-xs">Demo</span>
    </div>
  {:else if $availableProviders}
    <div class="flex items-center gap-2">
      <Icon name="smart_toy" class="text-gray-400 text-xs" />
      
      <!-- Version Selector -->
      <div class="relative">
        <select
          class="appearance-none bg-gray-700 border border-gray-600 text-white rounded py-0.5 px-1.5 pr-4 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-xs"
          value={$selectedVersion}
          onchange={handleVersionChange}
          disabled={$useDemo}
        >
          {#each Object.keys($availableProviders.available_providers) as version}
            <option value={version}>{version}</option>
          {/each}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-0.5 text-gray-400">
          <Icon name="expand_more" class="text-xs" />
        </div>
      </div>

      <!-- Provider Selector -->
      <div class="relative">
        <select
          class="appearance-none bg-gray-700 border border-gray-600 text-white rounded py-0.5 px-2 pr-5 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-xs"
          value={$selectedProvider || ''}
          onchange={handleProviderChange}
          disabled={$useDemo}
        >
          {#each Object.entries(currentVersionProviders) as [provider, info]}
            <option value={provider}>{provider}</option>
          {/each}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-400">
          <Icon name="expand_more" class="text-xs" />
        </div>
      </div>

      <!-- Data Source Toggle (V5+ only) -->
      {#if showDataSourceToggle}
        <div class="flex items-center border-l border-gray-700 pl-2 ml-1">
            <label for="dataSourceToggle" class="cursor-pointer select-none flex items-center gap-1.5">
                <div class="relative">
                    <input 
                        type="checkbox" 
                        id="dataSourceToggle" 
                        class="sr-only" 
                        bind:checked={$useLocalDb}
                    />
                    <div class="block w-7 h-3.5 rounded-full transition-colors duration-300"
                        class:bg-emerald-500={$useLocalDb}
                        class:bg-sky-500={!$useLocalDb}></div>
                    <div class="dot absolute left-0.5 top-0.5 bg-white w-2.5 h-2.5 rounded-full transition" 
                        class:translate-x-3.5={$useLocalDb}></div>
                </div>
                <span class="text-xs">
                    {$useLocalDb ? 'Local DB' : 'CORDIS API'}
                </span>
            </label>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex items-center gap-1">
      <Icon name="warning" class="text-yellow-500 text-xs" />
      <span class="text-xs">No providers</span>
    </div>
  {/if}

  <div class="relative group">
    <Icon name="info" class="h-3 w-3 cursor-help text-gray-500" />
    <div class="tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 
              absolute mt-2 -right-2 bg-gray-900 border border-gray-700 rounded p-2 text-xs w-48 z-50 pointer-events-none shadow-lg">
      <p class="mb-1">Select API version, provider, and data source (for V5+).</p>
      <p>Different versions may have varying capabilities.</p>
    </div>
  </div>
</div>
