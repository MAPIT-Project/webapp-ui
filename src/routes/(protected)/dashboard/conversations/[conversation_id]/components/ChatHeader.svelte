<script lang="ts">
    import Icon from "$lib/components/generic/icon.svelte";
    import ApiModeToggle from "../../../components/api-mode-toggle.svelte";
    import AIProviderSelector from "../../../components/ai-provider-selector.svelte";
</script>

<!-- Compact modern header -->
<div class="absolute top-0 left-0 right-0 h-14 my-px z-40 bg-gradient-to-l from-[#2A2A2A]/30 to-[#202020]/30 backdrop-blur-sm border-b border-[#404040]/20">
    <!-- Same pattern overlay as main page -->
    <div class="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] pointer-events-none"></div>
    <div class="relative flex items-center justify-between h-full px-4">
        <!-- Left side - Compact logo and branding -->
        <div class="flex items-center gap-2">
            <div class="p-1 rounded-lg bg-white/5 border border-white/10">
                <img src="/images/mapit_logo_no_bg.png" class="size-5 object-contain" alt="MAPIT Logo">
            </div>
            <div class="flex items-center gap-1.5">
                <span class="text-white font-semibold text-sm">AI Assistant</span>
                <span class="text-[8px] font-semibold bg-gradient-to-tr from-sky-900 to-sky-700 text-white px-[6px] py-[1px] rounded-full">
                    BETA
                </span>
            </div>
        </div>
        
        <!-- Right side - Compact controls -->
        <div class="flex items-center gap-2">
            <AIProviderSelector />
            <div class="w-px h-4 bg-white/20"></div>
            <ApiModeToggle />
        </div>
    </div>
</div> 