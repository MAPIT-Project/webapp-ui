<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Chatbox from '../../components/chatbox.svelte';

	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';
	import CapabilitiesModal from '$lib/components/ui/CapabilitiesModal.svelte';

	let showCapabilities = $state(false);

	// Fire-and-forget: fetch providers in background (cached if already loaded)
	let _initDone = false;
	$effect(() => {
		if (_initDone) return;
		_initDone = true;
		fetchAvailableProviders();
	});
</script>

<div
	class="relative flex h-full min-h-screen w-full bg-gradient-to-br from-[#1C1C1C] via-[#181818] to-[#121212]"
>
	<!-- Subtle pattern overlay -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_theme(colors.white)_1px,_transparent_1px)] bg-[length:32px_32px] opacity-[0.02]"
	></div>

	<!-- Main content -->
	<div class="relative flex flex-1 flex-col overflow-hidden">
		<!-- Header Bar -->
		<div
			class="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#333] bg-[#1C1C1C]/90 px-4 backdrop-blur-md"
		>
			<div class="flex items-center gap-3">
				<div class="relative rounded-lg border border-white/10 bg-[#252525] p-1">
					<img
						src="/images/mapit_logo_no_bg.png"
						class="size-5 object-contain"
						alt="MAPIT Logo"
					/>
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-bold text-[#E0E0E0] leading-none tracking-wide">MAPIT</span>
					<span class="text-[10px] font-medium text-gray-500 leading-none mt-1">AI DOMAIN EXPERT TOOL</span>
				</div>
			</div>
			<div class="flex items-center gap-4">
				<!-- Capabilities Info Button -->
				<button
					class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
					title="AI Capabilities"
					onclick={() => (showCapabilities = true)}
				>
					<Icon name="info" iconClass="w-5 h-5 group-hover:text-blue-400 transition-colors" />
				</button>
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="relative flex flex-1 items-center justify-center p-6">
			<div class="flex w-full max-w-4xl flex-col items-center gap-10 pb-40">
				<!-- Welcome Section -->
				<div class="text-center space-y-6">
					<div class="inline-flex flex-col items-center gap-4">
						<img
							src="/images/mapit_logo_no_bg.png"
							alt="MAPIT Logo"
							class="h-14 w-14 object-contain drop-shadow-lg"
						/>
						<h1 class="text-4xl font-bold text-[#E0E0E0] tracking-tight pb-2">
							Welcome back
						</h1>
					</div>
				</div>

				<!-- Chat interface -->
				<div class="w-full">
					<Chatbox />
				</div>
			</div>
		</div>
	</div>
</div>

<CapabilitiesModal bind:isOpen={showCapabilities} />
