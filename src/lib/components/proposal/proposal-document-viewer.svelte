<script lang="ts">
  import { 
    proposalSessionStore, 
    activeSection 
  } from '$lib/stores/proposalSessionStore';
  import { PROPOSAL_SECTIONS } from '$lib/types/proposal';
  import type { SessionSection } from '$lib/types/proposal-session';
  import SectionNavItem from './section-nav-item.svelte';
  import Icon from '$lib/components/generic/icon.svelte';

  // Derived store values
  let storeState: any;
  let sections: Record<string, SessionSection> = {};
  let progress = { completion_percentage: 0, total_words: 0, completed_sections: 0, total_sections: 0, estimated_pages: 0 };
  let loading = false;
  let currentSectionData: SessionSection | null = null;
  let isEditing = false;
  let editContent = '';

  // Subscribe to the whole store to react to changes
  proposalSessionStore.subscribe(state => {
    storeState = state;
    sections = state.sections;
    progress = {
      completion_percentage: state.completionPercentage,
      total_words: state.totalWords,
      completed_sections: Object.values(state.sections).filter(s => s.status === 'complete').length,
      total_sections: Object.keys(state.sections).length,
      estimated_pages: Math.ceil(state.totalWords / 500) // Rough estimate
    };
    loading = state.loading;
  });

  activeSection.subscribe(value => {
    currentSectionData = value;
    if (value) {
        // Reset edit mode when section changes
        isEditing = false;
        editContent = value.content;
    }
  });

  function handleSectionClick(event: CustomEvent) {
    proposalSessionStore.setActiveSection(event.detail.sectionId);
  }

  function toggleEdit() {
    if (!currentSectionData) return;
    if (isEditing) {
      // Save
      proposalSessionStore.updateSectionContent(currentSectionData.section_id, editContent);
      isEditing = false;
    } else {
      // Start Editing
      editContent = currentSectionData.content;
      isEditing = true;
    }
  }

  function cancelEdit() {
    if (!currentSectionData) return;
    editContent = currentSectionData.content;
    isEditing = false;
  }

  async function handleEvaluate() {
    if (!currentSectionData) return;
    await proposalSessionStore.evaluateSection(currentSectionData.section_id);
  }

  // Calculate category completion
  function calculateCategoryProgress(categorySections: SessionSection[]): number {
    if (categorySections.length === 0) return 0;
    const completedSections = categorySections.filter(s => s.status === 'complete').length;
    return Math.round((completedSections / categorySections.length) * 100);
  }

  function getQualityScoreColor(score: number | null): string {
    if (!score) return 'text-gray-500';
    if (score >= 4.0) return 'text-green-500'; // Assuming 5-point scale now
    if (score >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  }

  function getQualityScoreLabel(score: number | null): string {
    if (!score) return 'Not rated';
    if (score >= 4.0) return 'High';
    if (score >= 2.5) return 'Medium';
    return 'Low';
  }
</script>

<div class="proposal-viewer h-full flex flex-col bg-gray-900 text-white">
  <!-- Header with title and progress -->
  <div class="border-b border-gray-800 p-4 bg-gray-800/50 backdrop-blur-sm">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-semibold text-white">
        {storeState?.title || 'Untitled Proposal'}
      </h2>
      <div class="flex items-center gap-4 text-sm">
        {#if loading}
             <div class="flex items-center gap-2 text-yellow-400">
                <div class="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
             </div>
        {/if}
      </div>
    </div>
    
    <!-- Progress bar -->
    <div class="space-y-2">
    <div class="flex justify-between text-sm">
        <span class="text-gray-400">Overall Progress</span>
        <span class="text-gray-300">{progress.completion_percentage.toFixed(0)}%</span>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-2">
        <div 
        class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
        style="width: {progress.completion_percentage}%"
        ></div>
    </div>
    <div class="flex justify-between text-xs text-gray-500">
        <span>{progress.completed_sections} of {progress.total_sections} sections</span>
        <span>{progress.total_words} words (~{progress.estimated_pages} pages)</span>
    </div>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Navigation Sidebar -->
    <div class="w-80 border-r border-gray-800 bg-gray-800/30 overflow-y-auto">
      <div class="p-4 space-y-6">
        {#each Object.entries(PROPOSAL_SECTIONS) as [categoryKey, categoryData]}
          {@const categorySections = Object.values(sections).filter(s => s.section_id.startsWith(`${categoryKey}.`))}
          {@const categoryProgress = calculateCategoryProgress(categorySections)}
          
          <div class="space-y-2">
            <div class="flex items-center justify-between px-3 py-1">
              <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {categoryData.name}
              </h3>
              <span class="text-xs text-gray-500">
                {categoryProgress}%
              </span>
            </div>
            
            <div class="w-full bg-gray-700 rounded-full h-1 mb-3">
              <div 
                class="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full transition-all duration-300"
                style="width: {categoryProgress}%"
              ></div>
            </div>
            
            <div class="space-y-1">
              {#each Object.entries(categoryData.subsections) as [subsectionKey, subsectionName]}
                {@const sectionId = `${categoryKey}.${subsectionKey}`}
                {@const section = sections[sectionId]}
                {#if section}
                  <SectionNavItem 
                    {section}
                    active={currentSectionData?.section_id === sectionId}
                    level={2}
                    on:click={handleSectionClick}
                  />
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Section Content -->
    <div class="flex-1 overflow-y-auto bg-gray-900">
      {#if loading && !currentSectionData}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-gray-400">Loading proposal...</p>
          </div>
        </div>
      {:else if currentSectionData}
        <div id="section-{currentSectionData.section_id}" class="p-6 max-w-4xl mx-auto">
          <!-- Section Header -->
          <div class="mb-6 pb-4 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold text-white mb-2">
                {currentSectionData.section_name}
              </h1>
              <div class="flex items-center gap-4 text-sm">
                <!-- Lock Status -->
                {#if currentSectionData.lock_status !== 'unlocked'}
                     <div class="flex items-center gap-2 text-yellow-500 animate-pulse">
                        <span class="text-xs font-bold uppercase">Locked by AI</span>
                     </div>
                {/if}

                <!-- Quality Score -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">Quality:</span>
                  <span class="{getQualityScoreColor(currentSectionData.quality_score)} font-medium">
                    {getQualityScoreLabel(currentSectionData.quality_score)}
                     {#if currentSectionData.quality_score}
                        ({currentSectionData.quality_score.toFixed(1)}/5)
                     {/if}
                  </span>
                </div>
                
                <!-- Word Count -->
                <div class="flex items-center gap-2 text-gray-400">
                  <Icon name="text_fields" />
                  <span>{currentSectionData.word_count} words</span>
                </div>
                
                <!-- Status -->
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 rounded-full text-xs font-medium 
                    {currentSectionData.status === 'complete' ? 'bg-green-900/50 text-green-400' : ''}
                    {currentSectionData.status === 'draft' ? 'bg-yellow-900/50 text-yellow-400' : ''}
                    {currentSectionData.status === 'empty' ? 'bg-gray-800 text-gray-500' : ''}
                  ">
                    {currentSectionData.status}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Action Bar -->
            <div class="flex items-center gap-3 mt-4">
                <button 
                    class="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors border border-gray-700"
                    onclick={toggleEdit}
                    disabled={currentSectionData.lock_status !== 'unlocked'}
                >
                    {isEditing ? 'Save Changes' : 'Edit Manually'}
                </button>
                {#if isEditing}
                    <button 
                        class="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-red-400 transition-colors border border-gray-700"
                        onclick={cancelEdit}
                    >
                        Cancel
                    </button>
                {/if}
                <button 
                    class="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-blue-400 transition-colors border border-gray-700"
                    onclick={handleEvaluate}
                    disabled={!currentSectionData.content || currentSectionData.lock_status !== 'unlocked'}
                >
                    Evaluate Section
                </button>
            </div>
          </div>

          <!-- Section Content -->
          <div class="prose prose-invert max-w-none">
            {#if isEditing}
                <textarea 
                    bind:value={editContent} 
                    class="w-full h-[600px] bg-gray-800 text-gray-200 p-4 rounded-lg font-mono text-sm border border-gray-700 focus:outline-none focus:border-purple-500"
                ></textarea>
            {:else if currentSectionData.content}
              <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 min-h-[200px]">
                {@html currentSectionData.content}
              </div>
            {:else}
              <div class="bg-gray-800/30 rounded-lg p-12 border-2 border-dashed border-gray-700 text-center">
                <Icon name="description" className="text-4xl text-gray-600 mb-4" />
                <h3 class="text-lg font-medium text-gray-400 mb-2">No content yet</h3>
                <p class="text-gray-500">Use the chat interface to start writing this section.</p>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full">
          <div class="text-center space-y-4">
            <Icon name="description" className="text-4xl text-gray-600" />
            <p class="text-gray-400">Select a section to view its content</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Custom prose styles for dark theme */
  :global(.prose-invert) {
    color: #e5e7eb;
  }
  
  :global(.prose-invert h1) {
    color: #f9fafb;
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert h2) {
    color: #f9fafb;
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert h3) {
    color: #f9fafb;
  }
  
  :global(.prose-invert p) {
    color: #d1d5db;
  }
  
  :global(.prose-invert strong) {
    color: #f9fafb;
  }
  
  :global(.prose-invert blockquote) {
    border-left-color: #8b5cf6;
    background-color: rgba(139, 92, 246, 0.1);
    color: #e5e7eb;
  }
  
  :global(.prose-invert code) {
    background-color: #374151;
    color: #f9fafb;
  }
  
  :global(.prose-invert pre) {
    background-color: #1f2937;
    color: #e5e7eb;
  }
  
  :global(.prose-invert a) {
    color: #8b5cf6;
  }
  
  :global(.prose-invert a:hover) {
    color: #a78bfa;
  }
  
  :global(.prose-invert ul > li::marker) {
    color: #9ca3af;
  }
  
  :global(.prose-invert ol > li::marker) {
    color: #9ca3af;
  }
  
  :global(.prose-invert table) {
    border-color: #374151;
  }
  
  :global(.prose-invert thead) {
    border-bottom-color: #374151;
  }
  
  :global(.prose-invert tbody tr) {
    border-bottom-color: #374151;
  }
</style>