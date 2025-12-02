<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from './icon.svelte';
	import type { EnhancedCitation } from '$lib/utils/citationConverter';
	import { 
		sortCitationsByRelevance, 
		filterCitationsByRelevance,
		groupCitationsByDocumentType 
	} from '$lib/utils/citationConverter';

	interface Props {
		citations: EnhancedCitation[];
		messageId: string;
	}

	let { citations, messageId }: Props = $props();

	const dispatch = createEventDispatcher();

	// UI state
	let showFilters = $state(false);
	let sortBy = $state<'relevance' | 'number' | 'documentType'>('relevance');
	let filterByRelevance = $state<number>(0);
	let groupByDocumentType = $state(false);
	let searchQuery = $state('');

	// Computed properties
	function getFilteredCitations(): EnhancedCitation[] {
		let filtered = [...citations];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(citation =>
				citation.title?.toLowerCase().includes(query) ||
				citation.snippet?.toLowerCase().includes(query) ||
				citation.documentTypeDisplay?.toLowerCase().includes(query) ||
				citation.sourceTypeDisplay?.toLowerCase().includes(query)
			);
		}

		// Apply relevance filter
		filtered = filterCitationsByRelevance(filtered, filterByRelevance / 100);

		// Apply sorting
		switch (sortBy) {
			case 'relevance':
				filtered = sortCitationsByRelevance(filtered);
				break;
			case 'number':
				filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));
				break;
			case 'documentType':
				filtered.sort((a, b) => {
					const typeA = a.documentTypeDisplay || '';
					const typeB = b.documentTypeDisplay || '';
					return typeA.localeCompare(typeB);
				});
				break;
		}

		return filtered;
	}

	let filteredCitations = $derived(getFilteredCitations());

	function getGroupedCitations(): Record<string, EnhancedCitation[]> {
		const citations = filteredCitations;
		if (!groupByDocumentType) {
			return { 'All Sources': citations };
		}
		return groupCitationsByDocumentType(citations);
	}

	let groupedCitations = $derived(getGroupedCitations());

	let totalCitations = $derived(citations.length);
	let visibleCitations = $derived(filteredCitations.length);

	function handleCitationClick(citation: EnhancedCitation, event: MouseEvent) {
		dispatch('citationClick', { citation, event });
	}

	function resetFilters() {
		sortBy = 'relevance';
		filterByRelevance = 0;
		groupByDocumentType = false;
		searchQuery = '';
	}

	function getRelevanceColor(relevance: number): string {
		if (relevance >= 0.15) return 'text-emerald-400';
		if (relevance >= 0.1) return 'text-blue-400';
		if (relevance >= 0.05) return 'text-yellow-400';
		return 'text-gray-400';
	}
</script>

<div class="w-full">
	<!-- Header with controls -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<h3 class="text-sm font-medium text-gray-300">
				Sources {visibleCitations < totalCitations ? `(${visibleCitations}/${totalCitations})` : `(${totalCitations})`}
			</h3>
			<button
				onclick={() => showFilters = !showFilters}
				class="text-xs text-gray-500 hover:text-gray-400 transition-colors"
				title="Toggle filters"
			>
				<Icon name={showFilters ? "filter_alt" : "filter_list"} className="text-sm" />
			</button>
		</div>
		
		{#if visibleCitations !== totalCitations}
			<button
				onclick={resetFilters}
				class="text-xs text-blue-500 hover:text-blue-400 transition-colors"
			>
				Reset filters
			</button>
		{/if}
	</div>

	<!-- Filters panel -->
	{#if showFilters}
		<div class="mb-4 p-3 bg-gray-900/50 border border-gray-800/30 rounded-lg space-y-3">
			<!-- Search -->
			<div>
				<label class="text-xs font-medium text-gray-400 block mb-1">Search</label>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search citations..."
					class="w-full px-2 py-1 text-sm bg-gray-800/50 border border-gray-700/50 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
				/>
			</div>

			<!-- Sort options -->
			<div>
				<label class="text-xs font-medium text-gray-400 block mb-1">Sort by</label>
				<select
					bind:value={sortBy}
					class="w-full px-2 py-1 text-sm bg-gray-800/50 border border-gray-700/50 rounded text-gray-200 focus:outline-none focus:border-blue-500/50"
				>
					<option value="relevance">Relevance (High to Low)</option>
					<option value="number">Citation Number</option>
					<option value="documentType">Document Type</option>
				</select>
			</div>

			<!-- Relevance filter -->
			<div>
				<label class="text-xs font-medium text-gray-400 block mb-1">
					Min Relevance: {filterByRelevance}%
				</label>
				<input
					type="range"
					min="0"
					max="20"
					bind:value={filterByRelevance}
					class="w-full"
				/>
			</div>

			<!-- Grouping option -->
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={groupByDocumentType}
					id="group-by-type-{messageId}"
					class="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50"
				/>
				<label for="group-by-type-{messageId}" class="text-xs text-gray-400">
					Group by document type
				</label>
			</div>
		</div>
	{/if}

	<!-- Citations display -->
	<div class="space-y-3">
		{#each Object.entries(groupedCitations) as [documentType, typeCitations]}
			{#if documentType !== 'All Sources'}
				<div class="flex items-center gap-2 mb-2">
					<h4 class="text-xs font-medium text-gray-400">{documentType}</h4>
					<div class="h-px flex-1 bg-gray-800/50"></div>
					<span class="text-xs text-gray-500">{typeCitations.length}</span>
				</div>
			{/if}

			<div class="space-y-2">
				{#each typeCitations as citation (citation.id || `citation-${Math.random()}`)}
					<div class="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-800/30 hover:bg-gray-900/70 transition-all duration-200 hover:border-gray-700/50">
						<!-- Citation number -->
						<div class="flex flex-col items-center gap-1 flex-shrink-0">
							<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full {
								citation.isHighRelevance
									? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
									: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
							}">
								{citation.id}
							</span>
						</div>
						
						<!-- Citation content -->
						<div class="flex-1 min-w-0">
							<!-- Title with relevance score -->
							<div class="flex items-start justify-between gap-2 mb-1">
								<h4 class="text-sm font-medium text-gray-200 leading-tight cursor-pointer hover:text-blue-400 transition-colors flex-1"
									onclick={(e) => handleCitationClick(citation, e)}>
									{citation.displayTitle || citation.title}
								</h4>
								
								<!-- Prominent relevance score -->
								{#if citation.relevancePercentage !== undefined}
									<div class="flex flex-col items-end gap-1 flex-shrink-0">
										<div class="text-sm font-bold {getRelevanceColor(citation.metadata?.relevanceScore || 0)}">
											{citation.relevancePercentage}%
										</div>
										<div class="text-xs text-gray-500">
											relevance
										</div>
									</div>
								{/if}
							</div>
							
							<!-- Snippet -->
							{#if citation.shortSnippet}
								<p class="text-xs text-gray-400 italic mb-2 line-clamp-2">
									"{citation.shortSnippet}"
								</p>
							{/if}
							
							<!-- Metadata badges -->
							<div class="flex flex-wrap items-center gap-2 mb-2">
								{#if citation.documentTypeDisplay}
									<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
										{citation.documentTypeDisplay}
									</span>
								{/if}
								
								<!-- Don't show sourceType if it's just "intelligent_retrieval" - it's not useful info -->
								{#if citation.sourceTypeDisplay && citation.sourceTypeDisplay.toLowerCase() !== 'intelligent retrieval'}
									<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
										{citation.sourceTypeDisplay}
									</span>
								{/if}
								
								<!-- Show chunk ID as more useful than source -->
								{#if citation.metadata?.chunkId && citation.metadata.chunkId !== '0'}
									<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-700/50 text-gray-300 rounded-full">
										Chunk {citation.metadata.chunkId}
									</span>
								{/if}
							</div>
							
							<!-- View source link -->
							{#if citation.url}
								<a
									href={citation.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
								>
									View Source
									<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
										<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
									</svg>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<!-- No results message -->
	{#if visibleCitations === 0}
		<div class="text-center py-4 text-gray-500 text-sm">
			{#if searchQuery || filterByRelevance > 0}
				No citations match your filters. <button class="text-blue-500 hover:text-blue-400" onclick={resetFilters}>Reset filters</button>
			{:else}
				No citations available.
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>