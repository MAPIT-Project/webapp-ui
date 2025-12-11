<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import ApiModeToggle from '../../../components/api-mode-toggle.svelte';
	import AIProviderSelector from '../../../components/ai-provider-selector.svelte';
	import ContextHeaderIndicator from '$lib/components/generic/context-header-indicator.svelte';
	import { contextSummary } from '$lib/stores/conversationContextStore';
	import { conversationContextStore } from '$lib/stores/conversationContextStore';
	import Modal from '$lib/components/generic/modal.svelte';

	let showCapabilities = $state(false);
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
				<!-- <span
					class="rounded-full bg-[#0d5997] px-2 py-0.5 text-[9px] font-semibold text-[#FFFFFF]"
				>
					BETA
				</span> -->
			</div>
		</div>

		<!-- Right side - Controls and context indicator -->
		<div class="flex items-center gap-3">
			<!-- Capabilities Info Button -->
			<button
				class="group rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
				title="AI Capabilities"
				onclick={() => (showCapabilities = true)}
			>
				<Icon name="info" iconClass="w-5 h-5 group-hover:text-blue-400 transition-colors" />
			</button>

			<!-- Context indicator -->
			<!-- <ContextHeaderIndicator
				projectCount={$contextSummary.projectCount}
				messageCount={$contextSummary.messageCount}
				isContextual={$contextSummary.isContextual}
				topics={$contextSummary.topics}
				onToggle={() => conversationContextStore.toggleContext()}
			/> -->
			
			<!-- Vertical divider -->
			<!-- <div class="h-6 w-px bg-[#4F4F4F]"></div> -->
			
			<!-- AI provider selector -->
			<!-- <AIProviderSelector /> -->
			
			<!-- Optional: API mode toggle (commented out) -->
			<!-- <div class="h-6 w-px bg-[#4F4F4F]"></div> -->
			<!-- <ApiModeToggle /> -->
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
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(64, 64, 64, 0.4);
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgba(80, 80, 80, 0.7);
	}
</style>
