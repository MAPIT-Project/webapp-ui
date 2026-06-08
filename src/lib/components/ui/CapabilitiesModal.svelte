<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Modal from '$lib/components/generic/modal.svelte';

	export let isOpen: boolean;
</script>

<Modal
	bind:isOpen
	title="MAP-IT AI Assistant Capabilities"
	on:cancel={() => (isOpen = false)}
	closeOnEscape={true}
	background="bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full min-w-[60%] max-h-[95vh]"

	fullWidth={true}
>
	<div slot="content" class="flex flex-col gap-8 p-6 text-[#E0E0E0] max-h-[80vh] overflow-y-auto custom-scrollbar">
		<!-- Header & Diagram Section -->
		<div class="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
			<div class="flex-1 space-y-4">
				<h2 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
					Intelligent ReAct Agent
				</h2>
				<p class="text-[15px] leading-relaxed text-[#B0B0B0]">
					MAP-IT isn't just a search engine—it's an autonomous agent. When you ask a question, it uses the 
					<strong class="text-white">Reasoning and Acting (ReAct)</strong> loop.
				</p>
				<ul class="space-y-3 text-sm text-[#A0A0A0]">
					<li class="flex items-start gap-3">
						<div class="mt-0.5 rounded-full bg-blue-500/20 p-1.5 text-blue-400">
							<Icon name="lightbulb" iconClass="w-4 h-4" />
						</div>
						<span><strong>Think:</strong> Analyzes your request to build a data retrieval plan.</span>
					</li>
					<li class="flex items-start gap-3">
						<div class="mt-0.5 rounded-full bg-purple-500/20 p-1.5 text-purple-400">
							<Icon name="settings" iconClass="w-4 h-4" />
						</div>
						<span><strong>Act:</strong> Executes parallel searches across our Graph, Vectors, and SQL databases.</span>
					</li>
					<li class="flex items-start gap-3">
						<div class="mt-0.5 rounded-full bg-teal-500/20 p-1.5 text-teal-400">
							<Icon name="visibility" iconClass="w-4 h-4" />
						</div>
						<span><strong>Observe & Conclude:</strong> Reviews the raw data and synthesizes a highly accurate, structured answer.</span>
					</li>
				</ul>
			</div>
			<div class="flex-1 flex justify-center items-center">
				<img 
					src="/images/react_pattern_diagram.png" 
					alt="ReAct Pattern Diagram" 
					class="w-full max-w-sm rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10"
				/>
			</div>
		</div>

		<!-- What Can I Ask? Grid -->
		<section>
			<h3 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
				<Icon name="search" iconClass="w-5 h-5 text-purple-400" />
				What Can I Ask?
			</h3>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				<!-- Eligibility -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
					<h4 class="text-md font-medium text-blue-400 mb-3 flex items-center gap-2">
						<Icon name="gpp_good" iconClass="w-4 h-4" />
						Eligibility & Rules
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("What are the consortium requirements for RIA projects?")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"What are the consortium requirements for RIA projects?"</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Can Switzerland participate in Horizon Europe?")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Can Switzerland participate in Horizon Europe?"</span>
						</button>
					</div>
				</div>

				<!-- Call Search -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]">
					<h4 class="text-md font-medium text-yellow-400 mb-3 flex items-center gap-2">
						<Icon name="manage_search" iconClass="w-4 h-4" />
						Funding Call Search
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("Find open Horizon calls for AI and Healthcare.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Find open Horizon calls for AI and Healthcare."</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Search all programmes for digital skills funding.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Search all programmes for digital skills funding."</span>
						</button>
					</div>
				</div>

				<!-- Budget -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]">
					<h4 class="text-md font-medium text-teal-400 mb-3 flex items-center gap-2">
						<Icon name="attach_money" iconClass="w-4 h-4" />
						Budget & Timelines
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("What's a typical budget for a 36-month RIA project?")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"What's a typical budget for a 36-month RIA project?"</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Generate a timeline for a 48-month AI project.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Generate a timeline for a 48-month AI project."</span>
						</button>
					</div>
				</div>

				<!-- Statistics -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]">
					<h4 class="text-md font-medium text-purple-400 mb-3 flex items-center gap-2">
						<Icon name="bar_chart" iconClass="w-4 h-4" />
						Stats & Comparisons
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("Compare EIC Accelerator with ERC Starting Grant.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Compare EIC Accelerator with ERC Starting Grant."</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("How does Germany perform in Horizon Cluster 5?")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"How does Germany perform in Horizon Cluster 5?"</span>
						</button>
					</div>
				</div>

				<!-- Discovery -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]">
					<h4 class="text-md font-medium text-pink-400 mb-3 flex items-center gap-2">
						<Icon name="group" iconClass="w-4 h-4" />
						Partner Discovery
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("Find SMEs in France with experience in green hydrogen.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Find SMEs in France with experience in green hydrogen."</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Find projects similar to HORIZON-MISS-2026-07.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Find projects similar to HORIZON-MISS-2026-07."</span>
						</button>
					</div>
				</div>

				<!-- Quality Review -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(248,113,113,0.1)]">
					<h4 class="text-md font-medium text-red-400 mb-3 flex items-center gap-2">
						<Icon name="fact_check" iconClass="w-4 h-4" />
						Proposal Quality Review
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("Review my Excellence section against Horizon guidelines.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Review my Excellence section against Horizon guidelines."</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Score this proposal draft for the EIC Accelerator.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Score this proposal draft for the EIC Accelerator."</span>
						</button>
					</div>
				</div>

				<!-- Docs & Templates -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(132,204,22,0.1)]">
					<h4 class="text-md font-medium text-lime-400 mb-3 flex items-center gap-2">
						<Icon name="library_books" iconClass="w-4 h-4" />
						Docs & Templates Search
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("Find the official work programme for Cluster 4.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Find the official work programme for Cluster 4."</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Search for Erasmus+ application templates.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Search for Erasmus+ application templates."</span>
						</button>
					</div>
				</div>

				<!-- Consortium Analysis -->
				<div class="group bg-white/[0.03] hover:bg-white/[0.06] p-5 rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]">
					<h4 class="text-md font-medium text-sky-400 mb-3 flex items-center gap-2">
						<Icon name="hub" iconClass="w-4 h-4" />
						Consortium Analysis
					</h4>
					<div class="space-y-3">
						<button type="button" onclick={() => handleQuestionClick("What are the common consortium patterns for successful RIA projects?")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"What are the common consortium patterns for successful RIA projects?"</span>
						</button>
						<button type="button" onclick={() => handleQuestionClick("Analyze the geographic diversification of MSCA networks.")} class="w-full text-left bg-black/30 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
							<span class="text-xs text-[#D0D0D0]">"Analyze the geographic diversification of MSCA networks."</span>
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Data Sources Footer -->
		<section class="mt-4 flex items-center justify-between border-t border-white/10 pt-6">
			<div class="flex items-center gap-4 text-xs text-gray-500">
				<div class="flex items-center gap-1">
					<Icon name="database" iconClass="w-3 h-3" />
					<span>13,800+ Projects</span>
				</div>
				<div class="flex items-center gap-1">
					<Icon name="description" iconClass="w-3 h-3" />
					<span>Official EU Documents</span>
				</div>
				<div class="flex items-center gap-1">
					<Icon name="public" iconClass="w-3 h-3" />
					<span>Live EU Portal Data</span>
				</div>
			</div>
			<div class="text-xs font-semibold text-gray-600">
				Powered by MAP-IT Assistant
			</div>
		</section>
	</div>

	<div slot="footer" class="flex justify-end border-t border-white/10 p-4 bg-black/20">
		<button
			onclick={() => (isOpen = false)}
			class="rounded-xl bg-white/10 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
		>
			Awesome, let's go!
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
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
</style>
