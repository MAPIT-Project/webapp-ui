<script lang="ts">
    import { useDemo } from '$lib/stores/apiModeStore';
    import Icon from "$lib/components/generic/icon.svelte";
</script>

<div class="flex items-center gap-2 text-xs text-gray-400 rounded px-2 py-1 bg-gray-800 border border-gray-700">
    <div class="flex items-center">
        <label for="apiModeToggle" class="cursor-pointer select-none flex items-center gap-1.5">
            <div class="relative">
                <input 
                    type="checkbox" 
                    id="apiModeToggle" 
                    class="sr-only" 
                    bind:checked={$useDemo}
                />
                <div class="block w-7 h-3.5 rounded-full transition-colors duration-300"
                    class:bg-blue-600={$useDemo}
                    class:bg-gray-600={!$useDemo}></div>
                <div class="dot absolute left-0.5 top-0.5 bg-white w-2.5 h-2.5 rounded-full transition" 
                    class:translate-x-3.5={$useDemo}></div>
            </div>
            <span class="text-xs">
                {$useDemo ? 'Demo' : 'Production'}
            </span>
        </label>
    </div>
    <div class="relative group">
        <Icon name="info" class="h-3 w-3 cursor-help text-gray-500" />
        <div class="tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 
                  absolute mt-2 -right-2 bg-gray-900 border border-gray-700 rounded p-2 text-xs w-48 z-50 pointer-events-none shadow-lg">
            <p class="mb-1">Demo mode uses simulated responses.</p>
            <p>Production mode queries CORDIS database.</p>
        </div>
    </div>
</div>

<style>
    .dot {
        transition: transform 0.3s ease-in-out;
    }
    
    /* Make sure group has position to anchor the tooltip */
    .group {
        position: relative;
    }
</style>
