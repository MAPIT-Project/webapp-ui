<script lang="ts">
	import Icon from '$lib/components/generic/icon.svelte';
	import Modal from '$lib/components/generic/modal.svelte';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;

	let activeTab: 'capabilities' | 'tools' | 'demo' = 'capabilities';

	const dispatch = createEventDispatcher();

	function handleQuestionClick(q: string) {
		const cleanQuestion = q.replace(/^"|"$/g, '');
		dispatch('questionSelect', cleanQuestion);
		
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('mapit:fillChatInput', { detail: cleanQuestion }));
		}
		
		isOpen = false;
	}
</script>

<Modal
	bind:isOpen
	title="MAP-IT AI Assistant Capabilities"
	on:cancel={() => (isOpen = false)}
	closeOnEscape={true}
	background="bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full min-w-[70%] max-h-[95vh]"
	fullWidth={true}
>
	<div slot="content" class="flex flex-col h-full text-[#E0E0E0] max-h-[80vh] overflow-hidden">
		<!-- Tabs Header -->
		<div class="flex border-b border-white/10 px-6 pt-4 gap-6 shrink-0 bg-[#1A1A24]">
			<button 
				class="pb-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'capabilities' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'capabilities'}
			>
				Capabilities Overview
			</button>
			<button 
				class="pb-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'tools' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'tools'}
			>
				Tool Ecosystem (42)
			</button>
			<button 
				class="pb-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'demo' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'demo'}
			>
				Demo Questions
			</button>
		</div>

		<!-- Scrollable Content -->
		<div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
			{#if activeTab === 'capabilities'}
				<div class="flex flex-col gap-8">
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
									<div class="-mt-1 rounded-full bg-blue-500/20 p-1.5 text-blue-400">
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
								class="max-w-sm rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10 size-80 object-contain"
							/>
						</div>
					</div>

					<!-- What Can I Ask? Grid -->
					<section class="mt-2">
						<h3 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
							<!-- <Icon name="search" iconClass="w-5 h-5 " /> -->
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
			{:else if activeTab === 'tools'}
				<div class="flex flex-col gap-6 animate-in fade-in duration-300 mt-2">
					<div>
						<h3 class="text-xl font-semibold text-white mb-2 flex items-center gap-2">
							<!-- <Icon name="build_circle" iconClass="w-5 h-5 text-indigo-400" /> -->
							Agent Tool Ecosystem
						</h3>
						<p class="text-[15px] leading-relaxed text-[#B0B0B0] mb-4">
							Our ReAct agent has autonomous access to 42 specialized tools to gather, verify, and synthesize information in real-time.
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
							<h4 class="text-md font-medium text-indigo-400 mb-3 flex items-center gap-2">
								<Icon name="schema" iconClass="w-4 h-4" />
								Graph Database Access (12 tools)
							</h4>
							<ul class="space-y-2 text-sm text-[#D0D0D0]">
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">get_node_by_id</code> <span>Fetch exact entities</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">traverse_consortium</code> <span>Map partner networks</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_related_calls</code> <span>Cross-reference calls</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_project_partners</code> <span>Retrieve consortium members</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">get_call_hierarchy</code> <span>View programme structure</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_coordinator</code> <span>Identify project lead</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_participant_history</code> <span>Track past involvement</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">get_topic_destinations</code> <span>Map policy destinations</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_similar_organizations</code> <span>Suggest alternate partners</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">get_funding_schemes</code> <span>Link action types</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">find_country_collaborations</code> <span>Network by country</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-indigo-300 font-mono">get_sme_participation</code> <span>Filter SME roles</span></li>
							</ul>
						</div>

						<div class="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
							<h4 class="text-md font-medium text-emerald-400 mb-3 flex items-center gap-2">
								<Icon name="troubleshoot" iconClass="w-4 h-4" />
								Semantic Vector Search (8 tools)
							</h4>
							<ul class="space-y-2 text-sm text-[#D0D0D0]">
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">similarity_search</code> <span>Match abstracts</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">find_work_programmes</code> <span>Search EU guidelines</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">cluster_topics</code> <span>Group similar research</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">search_project_deliverables</code> <span>Index past results</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">find_policy_documents</code> <span>Query EU strategies</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">semantic_call_matcher</code> <span>Align ideas to calls</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">search_faq_database</code> <span>Find known answers</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-mono">extract_key_innovations</code> <span>Identify novelties</span></li>
							</ul>
						</div>

						<div class="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
							<h4 class="text-md font-medium text-amber-400 mb-3 flex items-center gap-2">
								<Icon name="calculate" iconClass="w-4 h-4" />
								SQL & Analytics (10 tools)
							</h4>
							<ul class="space-y-2 text-sm text-[#D0D0D0]">
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">calc_budget_stats</code> <span>Aggregate funding data</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">success_rate_trends</code> <span>Analyze historical win rates</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">geographic_distribution</code> <span>Map country participation</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">get_average_funding</code> <span>Calculate avg grant size</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">count_projects_by_year</code> <span>Time series analysis</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">top_performing_orgs</code> <span>Rank institutions</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">budget_by_action_type</code> <span>RIA vs IA vs CSA splits</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">sme_funding_share</code> <span>Calculate SME allocations</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">coordinator_country_stats</code> <span>Lead distribution</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">project_duration_stats</code> <span>Average timelines</span></li>
							</ul>
						</div>

						<div class="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
							<h4 class="text-md font-medium text-rose-400 mb-3 flex items-center gap-2">
								<Icon name="document_scanner" iconClass="w-4 h-4" />
								Document Processing (12 tools)
							</h4>
							<ul class="space-y-2 text-sm text-[#D0D0D0]">
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">extract_eligibility</code> <span>Parse legal requirements</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">quality_score_draft</code> <span>AI proposal reviewer</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">fetch_templates</code> <span>Retrieve Word/PDF templates</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">parse_evaluation_criteria</code> <span>Read scoring rubrics</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">check_page_limits</code> <span>Validate formatting</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">extract_trls</code> <span>Find tech readiness levels</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">identify_mandatory_annexes</code> <span>Flag required docs</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">parse_financial_forms</code> <span>Read budget tables</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">check_gender_equality_plan</code> <span>Verify GEP compliance</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">extract_open_science</code> <span>Review data management</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">validate_ethics_issues</code> <span>Scan ethics tables</span></li>
								<li class="flex items-center gap-2"><code class="text-[11px] bg-black/40 px-1.5 py-0.5 rounded text-rose-300 font-mono">summarize_work_packages</code> <span>Condense WPs</span></li>
							</ul>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-6 animate-in fade-in duration-300 mt-2">
					<div>
						<h3 class="text-xl font-semibold text-white mb-2 flex items-center gap-2">
							<!-- <Icon name="play_circle" iconClass="w-5 h-5 text-green-400" /> -->
							Advanced Demo Questions
						</h3>
						<p class="text-[15px] leading-relaxed text-[#B0B0B0] mb-6">
							Click any of the complex questions below to instantly launch a live demonstration of the ReAct agent's capabilities.
						</p>
					</div>

					<div class="space-y-4">
						<button type="button" onclick={() => handleQuestionClick("Compare the EIC Accelerator and ERC Advanced Grant regarding success rates and average funding amounts over the last 3 years. Based on this data, which one is more suitable for a high-risk deep-tech startup looking to scale?")} class="group w-full text-left bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] cursor-pointer">
							<div class="flex gap-4">
								<div class="mt-1 rounded-full bg-blue-500/20 p-2 text-blue-400 shrink-0 h-fit">
									<Icon name="compare_arrows" iconClass="w-5 h-5" />
								</div>
								<div>
									<h4 class="text-md font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">Programme Comparison & Strategic Advice</h4>
									<p class="text-sm text-[#D0D0D0] leading-relaxed">"Compare the EIC Accelerator and ERC Advanced Grant regarding success rates and average funding amounts over the last 3 years. Based on this data, which one is more suitable for a high-risk deep-tech startup looking to scale?"</p>
								</div>
							</div>
						</button>

						<button type="button" onclick={() => handleQuestionClick("Find me experienced partners for a hydrogen energy project and tell me what makes them successful")} class="group w-full text-left bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] cursor-pointer">
							<div class="flex gap-4">
								<div class="mt-1 rounded-full bg-pink-500/20 p-2 text-pink-400 shrink-0 h-fit">
									<Icon name="group" iconClass="w-5 h-5" />
								</div>
								<div>
									<h4 class="text-md font-medium text-white mb-2 group-hover:text-pink-400 transition-colors">Advanced Partner Discovery</h4>
									<p class="text-sm text-[#D0D0D0] leading-relaxed">"Find me experienced partners for a hydrogen energy project and tell me what makes them successful"</p>
								</div>
							</div>
						</button>

						<button type="button" onclick={() => handleQuestionClick("Show me consortium patterns for successful digital health projects")} class="group w-full text-left bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] cursor-pointer">
							<div class="flex gap-4">
								<div class="mt-1 rounded-full bg-sky-500/20 p-2 text-sky-400 shrink-0 h-fit">
									<Icon name="hub" iconClass="w-5 h-5" />
								</div>
								<div>
									<h4 class="text-md font-medium text-white mb-2 group-hover:text-sky-400 transition-colors">Consortium Network Analysis</h4>
									<p class="text-sm text-[#D0D0D0] leading-relaxed">"Show me consortium patterns for successful digital health projects"</p>
								</div>
							</div>
						</button>
					</div>
				</div>
			{/if}
		</div>
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
