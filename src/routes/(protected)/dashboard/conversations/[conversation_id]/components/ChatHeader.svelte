<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import ApiModeToggle from '../../../components/api-mode-toggle.svelte';
	import AIProviderSelector from '../../../components/ai-provider-selector.svelte';
	import ContextHeaderIndicator from '$lib/components/generic/context-header-indicator.svelte';
	import { contextSummary } from '$lib/stores/conversationContextStore';
	import { conversationContextStore } from '$lib/stores/conversationContextStore';
</script>

<!-- Modern header following Mapit UI design system -->
<div
	class="absolute left-0 right-0 top-0 z-40 h-14 border-b border-[#3A3A3A] bg-[#1E1E1E] backdrop-blur-sm"
>
	<!-- Subtle pattern overlay -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
	></div>
	
	<div class="relative flex h-full items-center justify-between px-4">
		<!-- Left side - Logo and branding -->
		<div class="flex items-center gap-3">
			<div class="rounded-lg border border-white/10 bg-white/5 p-1.5">
				<img src="/images/mapit_logo_no_bg.png" class="size-5 object-contain" alt="MAPIT Logo" />
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm font-semibold text-[#FFFFFF]">AI Assistant</span>
				<span
					class="rounded-full bg-[#2196F3] px-2 py-0.5 text-[10px] font-semibold text-[#FFFFFF]"
				>
					BETA
				</span>
			</div>
		</div>

		<!-- Right side - Controls and context indicator -->
		<div class="flex items-center gap-3">
			<!-- Context indicator -->
			<ContextHeaderIndicator
				projectCount={$contextSummary.projectCount}
				messageCount={$contextSummary.messageCount}
				isContextual={$contextSummary.isContextual}
				topics={$contextSummary.topics}
				onToggle={() => conversationContextStore.toggleContext()}
			/>
			
			<!-- Vertical divider -->
			<div class="h-6 w-px bg-[#4F4F4F]"></div>
			
			<!-- AI provider selector -->
			<AIProviderSelector />
			
			<!-- Optional: API mode toggle (commented out) -->
			<!-- <div class="h-6 w-px bg-[#4F4F4F]"></div> -->
			<!-- <ApiModeToggle /> -->
		</div>
	</div>
</div>
