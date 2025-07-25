<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import ApiModeToggle from "../../../components/api-mode-toggle.svelte";
    import AIProviderSelector from "../../../components/ai-provider-selector.svelte";
</script>

<div class="absolute top-0 left-0 right-0 h-12 z-10">
    <div class="flex items-center justify-between h-full px-4">
        <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Icon name="smart_toy" className="text-white text-xs" />
            </div>
            <div>
                <span class="text-gray-100 text-xs font-medium">AI Assistant</span>
                <span class="text-xs font-semibold ml-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-1.5 py-0.5 rounded-full shadow-md">BETA</span>
            </div>
        </div>
        
        <!-- API Controls -->
        <div class="flex items-center gap-2">
            <AIProviderSelector />
            <ApiModeToggle />
        </div>
    </div>
</div> 