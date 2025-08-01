<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import ApiModeToggle from '../../../components/api-mode-toggle.svelte';
	import AIProviderSelector from '../../../components/ai-provider-selector.svelte';
</script>

<!-- Compact modern header -->
<div
	class="absolute left-0 right-0 top-0 z-40 my-px h-14 border-b border-[#404040]/20 bg-gradient-to-l from-[#2A2A2A]/30 to-[#202020]/30 backdrop-blur-sm"
>
	<!-- Same pattern overlay as main page -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
	></div>
	<div class="relative flex h-full items-center justify-between px-4">
		<!-- Left side - Compact logo and branding -->
		<div class="flex items-center gap-2">
			<div class="rounded-lg border border-white/10 bg-white/5 p-1">
				<img src="/images/mapit_logo_no_bg.png" class="size-5 object-contain" alt="MAPIT Logo" />
			</div>
			<div class="flex items-center gap-1.5">
				<span class="text-sm font-semibold text-white">AI Assistant</span>
				<span
					class="rounded-full bg-gradient-to-tr from-sky-900 to-sky-700 px-[6px] py-[1px] text-[8px] font-semibold text-white"
				>
					BETA
				</span>
			</div>
		</div>

		<!-- Right side - Compact controls -->
		<div class="flex items-center gap-2">
			<AIProviderSelector />
			<!-- <div class="w-px h-4 bg-white/20"></div> -->
			<!-- <ApiModeToggle /> -->
		</div>
	</div>
</div>
