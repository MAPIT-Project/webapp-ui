<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from "$lib/components/generic/icon.svelte";
  import { selectedProvider, selectedVersion, availableProviders, fetchAvailableProviders, isLoadingProviders } from '$lib/stores/aiProviderStore';
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
</script>

<div class="flex items-center gap-2 text-xs text-gray-400 rounded p-2 bg-gray-800 border border-gray-700">
  {#if $isLoadingProviders}
    <div class="flex items-center gap-2">
      <div class="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
      <span>Loading providers...</span>
    </div>
  {:else if $useDemo}
    <div class="flex items-center gap-2">
      <Icon name="rocket_launch" class="text-gray-400" />
      <span>Using Demo API</span>
    </div>
  {:else if $availableProviders}
    <div class="flex items-center gap-3">
      <Icon name="smart_toy" class="text-gray-400" />
      
      <!-- Version Selector -->
      <div class="relative">
        <select
          class="appearance-none bg-gray-700 border border-gray-600 text-white rounded py-1 px-2 pr-6 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs"
          value={$selectedVersion}
          onchange={handleVersionChange}
          disabled={$useDemo}
        >
          {#each Object.keys($availableProviders.available_providers) as version}
            <option value={version}>{version}</option>
          {/each}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-400">
          <Icon name="expand_more" class="text-xs" />
        </div>
      </div>

      <!-- Provider Selector -->
      <div class="relative">
        <select
          class="appearance-none bg-gray-700 border border-gray-600 text-white rounded py-1 px-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs"
          value={$selectedProvider || ''}
          onchange={handleProviderChange}
          disabled={$useDemo}
        >
          {#each Object.entries(currentVersionProviders) as [provider, info]}
            <option value={provider}>{provider} ({info.model})</option>
          {/each}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <Icon name="expand_more" />
        </div>
      </div>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <Icon name="warning" class="text-yellow-500" />
      <span>No AI providers available</span>
    </div>
  {/if}

  <div class="relative group">
    <Icon name="info" class="h-4 w-4 cursor-help text-gray-500" />
    <div class="tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 
              absolute mt-4 -right-2 bg-gray-900 border border-gray-700 rounded p-2 text-xs w-64 z-50 pointer-events-none shadow-lg">
      <p class="mb-1">Select API version and AI provider for generating responses.</p>
      <p>Different versions and providers may have varying capabilities and response styles.</p>
    </div>
  </div>
</div>
