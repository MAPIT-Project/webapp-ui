<script lang="ts">
    import { useDemo } from '$lib/stores/apiModeStore';
    import Icon from "$lib/components/generic/icon.svelte";
</script>

<div class="flex items-center gap-1.5 px-2 py-1">
    <div class="flex items-center gap-1">
        <Icon name={$useDemo ? "science" : "database"} 
              className="text-xs {$useDemo ? 'text-blue-400' : 'text-green-400'}" />
        
        <label for="apiModeToggle" class="cursor-pointer select-none flex items-center gap-1.5">
            <div class="relative">
                <input 
                    type="checkbox" 
                    id="apiModeToggle" 
                    class="sr-only" 
                    bind:checked={$useDemo}
                />
                <div class="block w-6 h-3 rounded-full transition-all duration-300 border border-white/20 {$useDemo ? 'bg-blue-500' : 'bg-green-500'}"></div>
                <div class="absolute left-0.5 top-0.5 bg-white w-2 h-2 rounded-full transition-all duration-300" 
                    class:translate-x-3={$useDemo}></div>
            </div>
            <span class="text-xs text-white/90">
                {$useDemo ? 'Demo' : 'Prod'}
            </span>
        </label>
    </div>
    
    <!-- Compact info icon -->
    <div class="relative group">
        <Icon name="info" className="h-3 w-3 text-white/50 hover:text-white/80 transition-colors cursor-help" />
                 <div class="tooltip opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 
                  absolute mt-2 -right-2 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-lg p-2 text-xs w-44 z-[100] pointer-events-none shadow-xl">
            <div class="space-y-1">
                <p class="text-white font-medium text-xs">API Mode</p>
                <div class="space-y-0.5 text-[10px] text-white/70 leading-relaxed">
                    <p><span class="text-blue-400 font-medium">Demo:</span> Simulated responses</p>
                    <p><span class="text-green-400 font-medium">Prod:</span> Live CORDIS data</p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .group {
        position: relative;
    }
</style>
