<script lang="ts">
    import { useDemo } from '$lib/stores/apiModeStore';
    import Icon from "$lib/components/generic/icon.svelte";
</script>

<div class="flex items-center gap-2 text-xs text-gray-400 rounded p-2 bg-gray-800 border border-gray-700">
    <div class="flex items-center">
        <label for="apiModeToggle" class="cursor-pointer select-none flex items-center gap-2">
            <div class="relative">
                <input 
                    type="checkbox" 
                    id="apiModeToggle" 
                    class="sr-only" 
                    bind:checked={$useDemo}
                />
                <div class="block bg-gray-600 w-10 h-5 rounded-full"></div>
                <div class="dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition" 
                    class:translate-x-5={$useDemo}></div>
            </div>
            <span>
                {$useDemo ? 'Using Demo API' : 'Using Production API'}
            </span>
        </label>
    </div>
    <div class="relative group">
        <Icon name="info" class="h-4 w-4 cursor-help text-gray-500" />
        <div class="tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300 
                  absolute top-full mt-2 -right-32 bg-gray-900 border border-gray-700 rounded p-2 text-xs w-64 z-50 pointer-events-none shadow-lg">
            <p class="mb-1">Demo mode uses /api/demo endpoint which returns simulated responses without making actual CORDIS queries.</p>
            <p>Production mode uses /api/query endpoint which performs real searches against the CORDIS database.</p>
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
