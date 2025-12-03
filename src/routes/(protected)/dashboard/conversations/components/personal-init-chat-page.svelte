<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Chatbox from '../../components/chatbox.svelte';

	import { user } from '$lib/stores/sessionStore';
	import { ensureClientExists } from '$lib/clients/clientService';
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import AIProviderSelector from '../../components/ai-provider-selector.svelte';
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';

	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);

	// Create client record if one doesn't exist
	onMount(async () => {
		if ($user) {
			try {
				const client = await ensureClientExists($user.email?.split('@')[0]);
				if (!client) {
					console.error('Failed to create or find client record');
					clientError = 'Failed to initialize user data';
				}
				// Fetch available AI providers
				await fetchAvailableProviders();
			} catch (err) {
				console.error('Error during client initialization:', err);
				clientError = 'Error setting up user account';
			} finally {
				clientLoading = false;
			}
		}
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
			class="absolute left-0 right-0 top-0 z-40 h-14 border-b border-[#333] bg-[#1C1C1C]/90 backdrop-blur-md"
		>
			<div class="flex h-full items-center justify-between max-w-7xl px-4">
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
						<span class="text-[10px] font-medium text-gray-500 leading-none mt-1">AI DOMAIN EXPORT TOOL</span>
					</div>
                    <!-- <div class="ml-3 h-4 w-[1px] bg-[#333]"></div> -->
                    <!-- <span class="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20">BETA v3.0</span> -->
				</div>
				<!-- <div class="flex items-center gap-4">
					<AIProviderSelector />
				</div> -->
			</div>
		</div>

		<!-- Main Content Area -->
		<div class="relative flex flex-1 items-center justify-center p-6 pt-20">
			{#if clientLoading}
				<div class="flex flex-col items-center gap-8" in:fade={{ duration: 300 }}>
                    <div class="relative">
                        <!-- Simple ring -->
                        <div class="relative w-12 h-12">
                            <svg class="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
					<div class="text-center space-y-2">
						<h3 class="text-lg font-medium text-[#E0E0E0] tracking-tight">Initializing Workspace</h3>
						<p class="text-sm text-gray-500 font-mono">Preparing environment...</p>
					</div>
				</div>
			{:else if clientError}
				<div class="w-full max-w-md" in:scale={{ duration: 300, start: 0.95 }}>
					<div
						class="rounded-xl border border-red-500/20 bg-[#1E1E1E] p-8 shadow-xl backdrop-blur-sm relative overflow-hidden"
					>
                        <div class="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
						<div class="flex flex-col items-center text-center gap-4">
							<div class="rounded-full bg-red-500/10 p-3 border border-red-500/20">
								<Icon name="error" iconClass="text-red-500 w-6 h-6" />
							</div>
                            <div class="space-y-2">
                                <h3 class="text-lg font-semibold text-[#E0E0E0]">Initialization Failed</h3>
                                <p class="text-sm text-gray-400">{clientError}</p>
                            </div>
                            <button
                                class="mt-4 w-full rounded-lg bg-[#333] hover:bg-[#444] text-white px-4 py-2.5 font-medium transition-all flex items-center justify-center gap-2"
                                onclick={() => window.location.reload()}
                            >
                                <Icon name="refresh" iconClass="w-4 h-4" />
                                Reload Application
                            </button>
						</div>
					</div>
				</div>
			{:else}
				<div
					class="flex w-full max-w-4xl flex-col items-center gap-10 pb-40"
					in:fade={{ duration: 500, delay: 100 }}
				>
					<!-- Welcome Section -->
					<div class="text-center space-y-6" in:scale={{ duration: 500, delay: 200, start: 0.98 }}>
                        <div class="inline-flex flex-col items-center gap-4">
                            <div class="relative">
                                <img
                                    src="/images/mapit_logo_no_bg.png"
                                    alt="MAPIT Logo"
                                    class="h-14 w-14 object-contain relative z-10 drop-shadow-lg"
                                />
                            </div>
                            <h1 class="text-4xl font-bold text-[#E0E0E0] tracking-tight pb-2">
                                Welcome back
                            </h1>
                        </div>
                        
                        <!-- <p class="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                            Ready to explore funding opportunities and analyze research data?
                        </p> -->
					</div>

					<!-- Chat interface -->
					<div class="w-full relative" in:scale={{ duration: 500, delay: 300, start: 0.98 }}>
                        <div class="relative">
						    <Chatbox />
                        </div>
					</div>
                    
                    <!-- Quick hints -->
                    <!-- <div class="grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto" in:fade={{ delay: 600, duration: 500 }}>
                        {#each ['Find Open Calls', 'Analyze Budget', 'Generate Timeline'] as hint}
                            <div class="text-xs text-center py-2.5 px-4 rounded-lg border border-[#333] bg-[#1E1E1E] text-gray-400 font-mono hover:border-[#444] hover:text-gray-200 transition-colors cursor-default select-none">
                                {hint}
                            </div>
                        {/each}
                    </div> -->
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
    /* Custom scrollbar for smoother feel if needed */
    :global(::-webkit-scrollbar) {
        width: 6px;
        height: 6px;
    }
    :global(::-webkit-scrollbar-track) {
        background: transparent;
    }
    :global(::-webkit-scrollbar-thumb) {
        background: #333;
        border-radius: 3px;
    }
    :global(::-webkit-scrollbar-thumb:hover) {
        background: #444;
    }
</style>
