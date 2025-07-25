<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import ApiModeToggle from "../../../components/api-mode-toggle.svelte";
    import AIProviderSelector from "../../../components/ai-provider-selector.svelte";
</script>

<div class="absolute top-0 left-0 right-0 h-16 my-[1px] z-10 border-b border-gray-600/20">
    <div class="flex items-center justify-between h-full px-4">
        <div class="flex items-center gap-2">
            <div class="size-6 pt-[2px] rounded-lg flex items-center justify-center shadow-lg">
                <!-- <Icon name="smart_toy" className="text-white text-xs" /> -->
                <img src="/images/mapit_logo_no_bg.png" class="size-8 object-contain" alt="MAPIT Logo">
            </div>
            <div>
                <span class="text-gray-100 text-xs font-medium">AI Assistant</span>
                <span class="text-xs font-semibold ml-1 bg-gradient-to-r from-sky-600 to-sky-800 text-white px-1.5 py-0.5 rounded-full shadow-md">BETA</span>
            </div>
        </div>
        
        <!-- API Controls -->
        <div class="flex items-center gap-2">
            <AIProviderSelector />
            <ApiModeToggle />
        </div>
    </div>
</div> 