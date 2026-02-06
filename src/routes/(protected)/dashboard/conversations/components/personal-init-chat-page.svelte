<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Chatbox from '../../components/chatbox.svelte';

	import { user } from '$lib/stores/sessionStore';
	import { ensureClientExists } from '$lib/clients/clientService';
	import { onMount } from 'svelte';
	import { scale, fade } from 'svelte/transition';
	import AIProviderSelector from '../../components/ai-provider-selector.svelte';
	import { fetchAvailableProviders } from '$lib/stores/aiProviderStore';
	import Modal from '$lib/components/generic/modal.svelte';

	let clientLoading: boolean = $state(true);
	let clientError: string | null = $state(null);
	let showCapabilities = $state(false);

	// Create client record if one doesn't exist
	// Using onMount + store subscription to handle the race condition
	// (user store may not be set yet when onMount fires)
	onMount(() => {
		let initialized = false;
		const unsub = user.subscribe(async (currentUser) => {
			if (currentUser && !initialized) {
				initialized = true;
				try {
					const client = await ensureClientExists(currentUser.email?.split('@')[0]);
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
		return unsub;
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
				<div class="flex items-center gap-4">
					<!-- Capabilities Info Button -->
					<button
						class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
						title="AI Capabilities"
						onclick={() => (showCapabilities = true)}
					>
						<Icon name="info" iconClass="w-5 h-5 group-hover:text-blue-400 transition-colors" />
					</button>
					<!-- <AIProviderSelector /> -->
				</div>
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

<!-- Capabilities Modal -->
<Modal
	bind:isOpen={showCapabilities}
	title="MAP-IT AI Assistant Capabilities"
	on:cancel={() => (showCapabilities = false)}
	closeOnEscape={true}
	background="bg-[#1E1E1E] border border-[#4F4F4F] rounded-xl shadow-lg max-w-2xl w-full"
>
	<div slot="content" class="flex flex-col gap-6 p-4 text-[#E0E0E0] max-h-[70vh] overflow-y-auto custom-scrollbar">
		<!-- Header -->
		<div class="text-center">
			<p class="text-lg text-[#B0B0B0]">Your intelligent guide to Horizon Europe funding opportunities and research projects.</p>
		</div>

		<!-- Getting Started -->
		<section>
			<h3 class="text-xl font-semibold text-blue-400 mb-3">Getting Started</h3>
			<p class="mb-2 text-sm text-[#B0B0B0]"><strong>New to Horizon Europe?</strong> Just ask! The AI can explain:</p>
			<ul class="list-disc list-inside text-sm text-[#B0B0B0] space-y-1 ml-2">
				<li>What Horizon Europe is and how it works</li>
				<li>How to apply for funding</li>
				<li>Basic concepts and terminology</li>
				<li>Step-by-step guidance for newcomers</li>
			</ul>
			<div class="mt-3 p-3 bg-[#2A2A2A] rounded-lg border-l-4 border-blue-500 italic text-sm text-[#D0D0D0]">
				"Hi, I'm completely new to Horizon Europe. What even is it?"
			</div>
		</section>

		<!-- What Can I Ask? -->
		<section>
			<h3 class="text-xl font-semibold text-blue-400 mb-4">What Can I Ask?</h3>
			
			<div class="space-y-6">
				<!-- Eligibility & Rules -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Eligibility & Rules</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Get clear answers about funding requirements and regulations.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Consortium requirements</span>
							<span class="text-sm text-[#D0D0D0]">"What are the consortium requirements for RIA projects?"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Funding rates</span>
							<span class="text-sm text-[#D0D0D0]">"What is the funding rate for Innovation Actions?"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Country eligibility</span>
							<span class="text-sm text-[#D0D0D0]">"Can Switzerland participate in Horizon Europe?"</span>
						</div>
					</div>
				</div>

				<!-- Budget Planning -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Budget Planning</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Get data-driven budget recommendations based on real funded projects.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Budget benchmarks</span>
							<span class="text-sm text-[#D0D0D0]">"What's a typical budget for a 36-month RIA project in Cluster 5 with 8 partners?"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Budget calculations</span>
							<span class="text-sm text-[#D0D0D0]">"Calculate a budget for a 48-month IA project with 12 partners working on green hydrogen"</span>
						</div>
					</div>
				</div>

				<!-- Statistics & Performance -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Statistics & Performance</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Access real statistics from the Horizon Europe database.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Programme statistics</span>
							<span class="text-sm text-[#D0D0D0]">"What are the statistics for Cluster 5 (Climate, Energy, Mobility)?"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Country performance</span>
							<span class="text-sm text-[#D0D0D0]">"How does Germany perform in Horizon Europe?"</span>
						</div>
					</div>
				</div>
				
				<!-- Comparisons -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Comparisons</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Compare programmes, countries, or funding types side-by-side.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Funding programmes</span>
							<span class="text-sm text-[#D0D0D0]">"Compare EIC Accelerator with ERC Starting Grant"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Countries</span>
							<span class="text-sm text-[#D0D0D0]">"Compare Germany and France participation in Horizon Europe"</span>
						</div>
					</div>
				</div>

				<!-- Partner & Project Discovery -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Partner & Project Discovery</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Find potential partners and explore funded projects.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Experienced partners</span>
							<span class="text-sm text-[#D0D0D0]">"Find organizations with experience in battery technology research"</span>
						</div>
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Similar projects</span>
							<span class="text-sm text-[#D0D0D0]">"Find projects similar to HORIZON-MISS-2026-07-CROSS-02"</span>
						</div>
					</div>
				</div>
				
				<!-- Funding Trends & Analysis -->
				<div>
					<h4 class="text-md font-medium text-white mb-2">Funding Trends & Analysis</h4>
					<p class="text-xs text-[#B0B0B0] mb-2">Understand how funding has evolved over time.</p>
					<div class="grid grid-cols-1 gap-2">
						<div class="bg-[#252525] p-3 rounded-lg border border-[#3A3A3A]">
							<span class="text-xs font-semibold text-purple-400 block mb-1">Funding evolution</span>
							<span class="text-sm text-[#D0D0D0]">"How has funding for AI evolved over the past years in Horizon Europe?"</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Tips for Best Results -->
		<section class="bg-[#2A2A2A]/50 p-4 rounded-xl border border-[#3A3A3A]">
			<h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
				<Icon name="lightbulb" iconClass="text-yellow-400 w-5 h-5" />
				Tips for Best Results
			</h3>
			<ul class="space-y-2 text-sm text-[#B0B0B0]">
				<li class="flex gap-2">
					<span class="text-blue-400 font-bold">•</span>
					<span><strong>Be specific</strong> - Include details like cluster, action type (RIA/IA), duration, or number of partners</span>
				</li>
				<li class="flex gap-2">
					<span class="text-blue-400 font-bold">•</span>
					<span><strong>Ask follow-ups</strong> - The AI remembers your conversation context</span>
				</li>
				<li class="flex gap-2">
					<span class="text-blue-400 font-bold">•</span>
					<span><strong>Use call IDs</strong> - Reference specific calls by their ID (e.g., HORIZON-CL5-2024-D3-01)</span>
				</li>
				<li class="flex gap-2">
					<span class="text-blue-400 font-bold">•</span>
					<span><strong>Request more</strong> - If you need more results, just ask "show me more" or "any others?"</span>
				</li>
			</ul>
		</section>

		<!-- Data Sources -->
		<section class="border-t border-[#3A3A3A] pt-4">
			<h3 class="text-sm font-semibold text-gray-400 mb-2">Data Sources</h3>
			<ul class="text-xs text-gray-500 space-y-1">
				<li>• Official Horizon Europe regulations and work programmes</li>
				<li>• Real data from 13,800+ funded CORDIS projects</li>
				<li>• Live funding call information from the EU Funding & Tenders Portal</li>
				<li>• Pre-computed statistics from the Horizon Europe database</li>
			</ul>
		</section>
		
		<div class="text-center text-xs text-gray-600 italic mt-2">
			Powered by MAP-IT - Your Horizon Europe Research Assistant
		</div>
	</div>

	<div slot="footer" class="flex justify-end border-t border-[#4F4F4F]/50 p-4">
		<button
			onclick={() => (showCapabilities = false)}
			class="rounded-lg bg-[#3A3A3A] px-4 py-2.5 font-medium text-[#FFFFFF] transition-all duration-200 hover:bg-[#4F4F4F]"
		>
			Close
		</button>
	</div>
</Modal>

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
